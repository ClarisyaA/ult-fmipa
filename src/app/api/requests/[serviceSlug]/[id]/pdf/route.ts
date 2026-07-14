import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import type { Readable } from "node:stream";

import { OfficialLetterDocument } from "@/components/letters/pdf/official-letter-document";
import { KeteranganLulusDocument } from "@/components/letters/pdf/keterangan-lulus-document";
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
import { getOfficialLetterData } from "@/lib/letters/official-letter-data";
import type { BaseOfficialLetterData, KeteranganLulusLetterData } from "@/lib/letters/letter-types";

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

function errorResponse(request: Request, message: string, status: number) {
  const accept = request.headers.get("accept") ?? "";

  if (accept.includes("application/json")) {
    return NextResponse.json({ success: false, error: message }, { status });
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
  data: KeteranganLulusLetterData | BaseOfficialLetterData,
) {
  if (template === "keterangan-lulus") {
    return {
      document: React.createElement(KeteranganLulusDocument, {
        data: data as KeteranganLulusLetterData,
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
      }),
      filename: officialLetterFilename("skkb", data.npm),
      auditAction: `Mencetak surat kelakuan baik #${data.requestId}`,
    };
  }

  return null;
}

export async function GET(request: Request, { params }: PdfRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse(request, "Unauthorized", 401);
  }

  if (!["admin", "staff"].includes(user.role)) {
    return errorResponse(request, "Forbidden", 403);
  }

  try {
    const { serviceSlug, id } = await params;
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
        : await getOfficialLetterData(service.template, id);

    if (!letterData) {
      return errorResponse(request, "Pengajuan tidak ditemukan.", 404);
    }

    const result = getRouteResult(service.template, letterData);

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
    if (error instanceof LetterDataError) {
      return errorResponse(request, error.message, error.statusCode);
    }

    return jsonApiError(
      error,
      "api:requests:pdf",
      "Surat PDF gagal dibuat.",
    );
  }
}
