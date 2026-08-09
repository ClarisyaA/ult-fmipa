import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import {
  FileUploadError,
  saveUploadedFile,
  validateUploadedFile,
} from "@/lib/file-upload";
import { saveRequestAttachmentMetadata } from "@/lib/request-attachments";
import { getServiceUploadRule } from "@/lib/service-upload-config";
import {
  sikFinalSpikAttachmentType,
  sikServiceSlug,
  sikSourceTable,
  SikRequestError,
  submitSikFinalForm,
} from "@/lib/sik-requests";

import {
  defaultUploadRateLimitConfig,
  getClientIp,
  uploadRateLimiter,
} from "@/lib/rate-limit";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getAttachmentFiles(formData: FormData) {
  return formData
    .getAll("attachments")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "MAHASISWA") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!session.user.npm) {
    return NextResponse.json(
      { error: "NPM mahasiswa tidak tersedia di session." },
      { status: 400 }
    );
  }

  const ip = getClientIp(request);
  const userId = session.user.id || session.user.npm || session.user.email || ip;
  const rateLimitKey = `upload:${userId}:${ip}`;
  const rateLimitCheck = uploadRateLimiter.check(
    rateLimitKey,
    defaultUploadRateLimitConfig
  );

  if (!rateLimitCheck.success) {
    return NextResponse.json(
      {
        error:
          "Terlalu banyak permintaan unggah file. Silakan tunggu beberapa saat.",
      },
      { status: 429 }
    );
  }

  try {
    const { id } = await params;
    const formData = await request.formData();
    const uploadRuleKey = `${sikServiceSlug}:final-spik`;
    const uploadRule = getServiceUploadRule(uploadRuleKey);
    const files = getAttachmentFiles(formData);

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

    const updated = await submitSikFinalForm(id, session.user.npm, {
      namaHimpunan: getFormString(formData, "namaHimpunan"),
      namaKegiatan: getFormString(formData, "namaKegiatan"),
      tanggalKegiatan: getFormString(formData, "tanggalKegiatan"),
      emailPengiriman: getFormString(formData, "emailPengiriman"),
      noHpWa: getFormString(formData, "noHpWa"),
      bahasaSurat: getFormString(formData, "bahasaSurat"),
    });
    let attachmentCount = 0;

    for (const file of files) {
      const savedFile = await saveUploadedFile(file, uploadRuleKey);

      await saveRequestAttachmentMetadata({
        serviceSlug: sikServiceSlug,
        sourceTable: sikSourceTable,
        requestId: id,
        uploadedBy: session.user.email ?? session.user.npm ?? null,
        attachmentType: sikFinalSpikAttachmentType,
        file: savedFile,
      });
      attachmentCount += 1;
    }

    return NextResponse.json({
      data: {
        id: String(updated.ID),
        requestId: String(updated.ID),
        serviceSlug: sikServiceSlug,
        serviceTitle: "Surat Izin Kegiatan",
        status: "sikFinalSubmitted",
        attachmentCount,
      },
      message: "Form final SIK berhasil dikirim.",
    });
  } catch (error) {
    if (error instanceof SikRequestError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    if (error instanceof FileUploadError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return jsonApiError(
      error,
      "api:services:sik:final",
      "Form final SIK gagal dikirim.",
    );
  }
}
