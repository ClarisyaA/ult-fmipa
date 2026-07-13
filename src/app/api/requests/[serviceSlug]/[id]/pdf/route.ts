import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import type { Readable } from "node:stream";

import { KeteranganLulusDocument } from "@/components/letters/pdf/keterangan-lulus-document";
import { getCurrentUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { jsonApiError } from "@/lib/error-utils";
import {
  getPrintableLetterService,
  LetterDataError,
} from "@/lib/letters/letter-data";
import { keteranganLulusFilename } from "@/lib/letters/letter-format";
import { getKeteranganLulusLetterData } from "@/lib/letters/keterangan-lulus-data";

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

    if (service.template !== "keterangan-lulus") {
      return errorResponse(request, "Template surat tidak ditemukan.", 404);
    }

    const letterData = await getKeteranganLulusLetterData(id);

    if (!letterData) {
      return errorResponse(request, "Pengajuan tidak ditemukan.", 404);
    }

    const document = React.createElement(KeteranganLulusDocument, {
      data: letterData,
    }) as unknown as Parameters<typeof renderToStream>[0];
    const stream = (await renderToStream(document)) as Readable;
    const pdfBuffer = await streamToBuffer(stream);
    const filename = keteranganLulusFilename(letterData.npm);

    await writeAuditLog({
      actor: user,
      request,
      action: `Mencetak surat keterangan lulus #${letterData.requestId}`,
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
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
