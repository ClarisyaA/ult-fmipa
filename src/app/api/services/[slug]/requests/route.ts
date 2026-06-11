import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  createServiceRequest,
  ServiceRequestSubmitError,
} from "@/lib/legacy-request-submit";
import { authOptions } from "@/lib/auth";
import {
  FileUploadError,
  saveUploadedFile,
  validateUploadedFile,
} from "@/lib/file-upload";
import { getPublicServiceBySlug } from "@/lib/legacy-services";
import { saveRequestAttachmentMetadata } from "@/lib/request-attachments";
import { createServiceRequestSchema } from "@/lib/service-request-validation";
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
        }
      : await request.json();
    const files = formData ? getAttachmentFiles(formData) : [];

    if (files.length > 3) {
      return NextResponse.json(
        {
          error: "Maksimal 3 file lampiran.",
          issues: [
            {
              field: "attachments",
              message: "Maksimal 3 file lampiran.",
            },
          ],
        },
        { status: 400 }
      );
    }

    files.forEach(validateUploadedFile);

    const input = createServiceRequestSchema.parse({
      ...body,
      npm: session.user.npm || body?.npm,
      email: session.user.email || body?.email,
      phone: body?.phone || session.user.phone,
    });
    const result = await createServiceRequest(slug, input);
    let attachmentCount = 0;

    for (const file of files) {
      const savedFile = await saveUploadedFile(file);

      await saveRequestAttachmentMetadata({
        serviceSlug: result.serviceSlug,
        sourceTable: service.sourceTable,
        requestId: result.id,
        uploadedBy: session.user.email ?? session.user.npm ?? null,
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

    if (error instanceof FileUploadError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        error: "Pengajuan layanan gagal dikirim.",
      },
      { status: 500 }
    );
  }
}
