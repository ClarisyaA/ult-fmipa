import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import type { Readable } from "node:stream";

import { OfficialLetterDocument } from "@/components/letters/pdf/official-letter-document";
import { KeteranganLulusDocument } from "@/components/letters/pdf/keterangan-lulus-document";
import { MagangLetterDocument } from "@/components/letters/pdf/magang-letter-document";
import { getCurrentUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { jsonApiError } from "@/lib/error-utils";
import {
  getPrintableLetterService,
  LetterDataError,
} from "@/lib/letters/letter-data";
import {
  keteranganLulusFilename,
  officialLetterFilename,
} from "@/lib/letters/letter-format";
import { getKeteranganLulusLetterData } from "@/lib/letters/keterangan-lulus-data";
import { getMagangLetterData } from "@/lib/letters/magang-letter-data";
import { getOfficialLetterData } from "@/lib/letters/official-letter-data";
import type {
  BaseOfficialLetterData,
  KeteranganLulusLetterData,
  LetterLanguage,
  MagangLetterData,
} from "@/lib/letters/letter-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type PdfRouteProps = {
  params: Promise<{ serviceSlug: string; id: string }>;
};

async function streamToBuffer(stream: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    stream.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on("end", resolve);
    stream.on("error", reject);
  });

  return Buffer.concat(chunks);
}

function errorResponse(
  request: Request,
  message: string,
  status: number,
  serviceSlug?: string,
  id?: string,
) {
  const accept = request.headers.get("accept") ?? "";

  if (accept.includes("application/json")) {
    return NextResponse.json({ success: false, error: message }, { status });
  }

  if (accept.includes("text/html") && serviceSlug && id) {
    const referer = request.headers.get("referer") ?? "";
    const rolePrefix = referer.includes("/staff/") ? "staff" : "admin";
    const editUrl = `/${rolePrefix}/requests/${serviceSlug}/${id}`;

    return new NextResponse(
      `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Data Surat Belum Lengkap - ULT FMIPA</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f4f2fb; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; box-sizing: border-box; }
    .card { background: white; border-radius: 12px; border: 1px solid #e8dfd0; padding: 2rem; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.06); }
    .icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
    h1 { color: #173d2d; font-size: 1.25rem; margin-top: 0; font-weight: 700; }
    p { color: #5f5a54; font-size: 0.925rem; line-height: 1.6; margin-bottom: 1.75rem; }
    a { display: inline-flex; align-items: center; justify-content: center; background: #00669b; color: white; padding: 0.65rem 1.4rem; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 0.875rem; transition: background 0.15s ease; }
    a:hover { background: #00547f; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Data Surat Belum Lengkap</h1>
    <p>${message}</p>
    <a href="${editUrl}">Lengkapi Data Surat Sekarang &rarr;</a>
  </div>
</body>
</html>`,
      {
        status,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  return new NextResponse(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function getRouteResult(
  template: string,
  data: KeteranganLulusLetterData | BaseOfficialLetterData | MagangLetterData,
  language: LetterLanguage,
) {
  if (template === "keterangan-lulus") {
    return {
      document: React.createElement(KeteranganLulusDocument, {
        data: data as KeteranganLulusLetterData,
        language,
      }),
      filename: keteranganLulusFilename(data.npm),
      auditAction: `Mencetak surat keterangan lulus #${data.requestId}`,
    };
  }

  if (template === "masih-kuliah") {
    return {
      document: React.createElement(OfficialLetterDocument, {
        data: data as BaseOfficialLetterData,
        template,
        language,
      }),
      filename: officialLetterFilename("skmk", data.npm),
      auditAction: `Mencetak surat masih kuliah #${data.requestId}`,
    };
  }

  if (template === "masih-kuliah-aktif") {
    return {
      document: React.createElement(OfficialLetterDocument, {
        data: data as BaseOfficialLetterData,
        template,
        language,
      }),
      filename: officialLetterFilename("skmka", data.npm),
      auditAction: `Mencetak surat masih aktif kuliah #${data.requestId}`,
    };
  }

  if (template === "kelakuan-baik") {
    return {
      document: React.createElement(OfficialLetterDocument, {
        data: data as BaseOfficialLetterData,
        template,
        language,
      }),
      filename: officialLetterFilename("skkb", data.npm),
      auditAction: `Mencetak surat kelakuan baik #${data.requestId}`,
    };
  }

  if (template === "magang") {
    return {
      document: React.createElement(MagangLetterDocument, {
        data: data as MagangLetterData,
        language,
      }),
      filename: officialLetterFilename("magang", data.npm),
      auditAction: `Mencetak surat permohonan magang #${data.requestId}`,
    };
  }

  return null;
}

function requestedLanguage(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang");

  if (lang === null || lang === "") {
    return null;
  }

  if (lang === "id" || lang === "en") {
    return lang;
  }

  throw new LetterDataError("Bahasa surat tidak valid.", 400);
}

function resolveLanguage(
  requested: LetterLanguage | null,
  data: KeteranganLulusLetterData | BaseOfficialLetterData | MagangLetterData,
): LetterLanguage {
  if (requested) {
    return requested;
  }

  return data.languagePreference === "en" ? "en" : "id";
}

export async function GET(request: Request, { params }: PdfRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse(request, "Unauthorized", 401);
  }

  if (!["ADMIN", "STAFF"].includes(user.role)) {
    return errorResponse(request, "Forbidden", 403);
  }

  try {
    const { serviceSlug, id } = await params;
    const languageParam = requestedLanguage(request);
    const service = getPrintableLetterService(serviceSlug);

    if (!service) {
      return errorResponse(request, "Template surat tidak ditemukan.", 404);
    }

    if (!/^\d+$/.test(id)) {
      return errorResponse(request, "ID pengajuan tidak valid.", 400);
    }

    const letterData =
      service.template === "keterangan-lulus"
        ? await getKeteranganLulusLetterData(id)
        : service.template === "magang"
          ? await getMagangLetterData(id)
        : await getOfficialLetterData(service.template, id);

    if (!letterData) {
      return errorResponse(request, "Pengajuan tidak ditemukan.", 404);
    }

    const language = resolveLanguage(languageParam, letterData);
    const result = getRouteResult(service.template, letterData, language);

    if (!result) {
      return errorResponse(request, "Template surat tidak ditemukan.", 404);
    }

    const document = result.document as unknown as Parameters<
      typeof renderToStream
    >[0];
    const stream = (await renderToStream(document)) as Readable;
    const pdfBuffer = await streamToBuffer(stream);

    await writeAuditLog({
      actor: user,
      request,
      action: result.auditAction,
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${result.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const { serviceSlug, id } = await params.catch(() => ({ serviceSlug: "", id: "" }));
    if (error instanceof LetterDataError) {
      return errorResponse(request, error.message, error.statusCode, serviceSlug, id);
    }

    return jsonApiError(
      error,
      "api:requests:pdf",
      "Surat PDF gagal dibuat.",
    );
  }
}
