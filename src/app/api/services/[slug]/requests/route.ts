import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  createServiceRequest,
  ServiceRequestSubmitError,
} from "@/lib/legacy-request-submit";
import { authOptions } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import {
  FileUploadError,
  saveUploadedFile,
  validateUploadedFile,
} from "@/lib/file-upload";
import { getPublicServiceBySlug } from "@/lib/legacy-services";
import { saveRequestAttachmentMetadata } from "@/lib/request-attachments";
import { createServiceRequestSchema } from "@/lib/service-request-validation";
import { getServiceUploadRule } from "@/lib/service-upload-config";
import {
  createSikApprovalProofRequest,
  sikApprovalProofAttachmentType,
  sikServiceSlug,
  SikRequestError,
} from "@/lib/sik-requests";
import { getServerSession } from "next-auth";

function isMultipartRequest(request: Request) {
  return request.headers.get("content-type")?.includes("multipart/form-data");
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function getAttachmentFiles(formData: FormData) {
  return formData
    .getAll("attachments")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        {
          error: "Anda harus login sebagai mahasiswa untuk mengajukan layanan.",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "student") {
      return NextResponse.json(
        {
          error: "Hanya mahasiswa yang dapat mengajukan layanan.",
        },
        { status: 403 }
      );
    }

    const service = getPublicServiceBySlug(slug);

    if (!service) {
      return NextResponse.json(
        {
          error: "Layanan tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    const formData = isMultipartRequest(request)
      ? await request.formData()
      : null;
    const body = formData
      ? {
          npm: getFormString(formData, "npm"),
          email: getFormString(formData, "email"),
          phone: getFormString(formData, "phone"),
          description: getFormString(formData, "description"),
          scholarshipName: getFormString(formData, "scholarshipName"),
          semester: getFormString(formData, "semester"),
          tahunAkademik: getFormString(formData, "tahunAkademik"),
          namaOrangTua: getFormString(formData, "namaOrangTua"),
          nipNrp: getFormString(formData, "nipNrp"),
          pangkatGolongan: getFormString(formData, "pangkatGolongan"),
          instansi: getFormString(formData, "instansi"),
          pengantar: getFormString(formData, "pengantar"),
          ditujukan: getFormString(formData, "ditujukan"),
          dasarSuratNo: getFormString(formData, "dasarSuratNo"),
          dasarSuratPerihal: getFormString(formData, "dasarSuratPerihal"),
          dasarSuratTgl: getFormString(formData, "dasarSuratTgl"),
          tempatLahir: getFormString(formData, "tempatLahir"),
          tanggalLahir: getFormString(formData, "tanggalLahir"),
          tanggalLulus: getFormString(formData, "tanggalLulus"),
          tglLulus: getFormString(formData, "tglLulus"),
          ipk: getFormString(formData, "ipk"),
          yudisium: getFormString(formData, "yudisium"),
          jumlahTranskrip: getFormString(formData, "jumlahTranskrip"),
          jumlahIjazah: getFormString(formData, "jumlahIjazah"),
          jumlahTranslet: getFormString(formData, "jumlahTranslet"),
          programStudi: getFormString(formData, "programStudi"),
          jenisPermohonan: getFormString(formData, "jenisPermohonan"),
          kontakPerson: getFormString(formData, "kontakPerson"),
          tempatPelaksanaan: getFormString(formData, "tempatPelaksanaan"),
          tujuanSurat: getFormString(formData, "tujuanSurat"),
          alamatSurat: getFormString(formData, "alamatSurat"),
          kecamatanKabupaten: getFormString(formData, "kecamatanKabupaten"),
          kotaKabupaten: getFormString(formData, "kotaKabupaten"),
          provinsi: getFormString(formData, "provinsi"),
          tanggalMulai: getFormString(formData, "tanggalMulai"),
          tanggalSelesai: getFormString(formData, "tanggalSelesai"),
        }
      : await request.json();
    const files = formData ? getAttachmentFiles(formData) : [];
    const uploadRuleKey =
      service.slug === sikServiceSlug
        ? `${sikServiceSlug}:approval-proof`
        : service.slug;
    const uploadRule = getServiceUploadRule(uploadRuleKey);

    if (files.length > uploadRule.maxFiles) {
      return NextResponse.json(
        {
          error: `Maksimal ${uploadRule.maxFiles} file lampiran.`,
          issues: [
            {
              field: "attachments",
              message: `Maksimal ${uploadRule.maxFiles} file lampiran.`,
            },
          ],
        },
        { status: 400 }
      );
    }

    if (files.length < (uploadRule.minFiles ?? 0)) {
      return NextResponse.json(
        {
          error: "Lampiran wajib diunggah.",
          issues: [
            {
              field: "attachments",
              message: "Lampiran wajib diunggah.",
            },
          ],
        },
        { status: 400 }
      );
    }

    files.forEach((file) => validateUploadedFile(file, uploadRuleKey));

    if (service.slug === sikServiceSlug) {
      if (!session.user.npm) {
        return NextResponse.json(
          { error: "NPM mahasiswa tidak tersedia di session." },
          { status: 400 }
        );
      }

      const created = await createSikApprovalProofRequest({
        npm: session.user.npm,
        uploadedBy: session.user.email ?? session.user.npm ?? null,
      });
      let attachmentCount = 0;

      for (const file of files) {
        const savedFile = await saveUploadedFile(file, uploadRuleKey);

        await saveRequestAttachmentMetadata({
          serviceSlug: service.slug,
          sourceTable: service.sourceTable,
          requestId: String(created.ID),
          uploadedBy: session.user.email ?? session.user.npm ?? null,
          attachmentType: sikApprovalProofAttachmentType,
          file: savedFile,
        });
        attachmentCount += 1;
      }

      return NextResponse.json({
        data: {
          id: String(created.ID),
          requestId: String(created.ID),
          serviceSlug: service.slug,
          serviceTitle: service.title,
          status: "sikApprovalPending",
          attachmentCount,
        },
        message: "Bukti ACC berhasil dikirim dan menunggu verifikasi.",
      });
    }

    const input = createServiceRequestSchema.parse({
      ...body,
      serviceSlug: service.slug,
      npm: session.user.npm || body?.npm,
      email: session.user.email || body?.email,
      phone: body?.phone || session.user.phone,
    });
    const result = await createServiceRequest(slug, input);
    let attachmentCount = 0;

    for (const file of files) {
      const savedFile = await saveUploadedFile(file, service.slug);

      await saveRequestAttachmentMetadata({
        serviceSlug: result.serviceSlug,
        sourceTable: service.sourceTable,
        requestId: result.id,
        uploadedBy: session.user.email ?? session.user.npm ?? null,
        attachmentType: uploadRule.attachmentType,
        file: savedFile,
      });
      attachmentCount += 1;
    }

    return NextResponse.json({
      data: {
        ...result,
        requestId: result.id,
        attachmentCount,
      },
      message: "Pengajuan layanan berhasil dikirim.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Input pengajuan tidak valid.",
          issues: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    if (error instanceof ServiceRequestSubmitError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: error.statusCode }
      );
    }

    if (error instanceof SikRequestError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: error.statusCode }
      );
    }

    if (error instanceof FileUploadError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: error.statusCode }
      );
    }

    return jsonApiError(
      error,
      "api:services:requests:post",
      "Pengajuan layanan gagal dikirim.",
    );
  }
}
