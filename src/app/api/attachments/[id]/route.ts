import { Readable } from "stream";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { authorizeAttachmentAccess } from "@/lib/attachment-authorization";
import { getObjectStream, isObjectNotFoundError } from "@/lib/minio-storage";
import { resolveObjectKey } from "@/lib/storage-paths";

export const runtime = "nodejs";

type AttachmentRouteProps = {
  params: Promise<{ id: string }>;
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

function safeContentDisposition(filename: string, mimeType: string) {
  const asciiSafeName = filename
    .replace(/[\r\n"']/g, "_")
    .replace(/[^\x20-\x7E]/g, "_");
  const encodedName = encodeURIComponent(filename);
  const isInlineAllowed =
    mimeType === "application/pdf" || mimeType.startsWith("image/");
  const dispositionType = isInlineAllowed ? "inline" : "attachment";

  return `${dispositionType}; filename="${asciiSafeName}"; filename*=UTF-8''${encodedName}`;
}

export async function GET(
  _request: Request,
  { params }: AttachmentRouteProps
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: SECURITY_HEADERS }
    );
  }

  const { id } = await params;
  const decision = await authorizeAttachmentAccess(session.user, id);

  if (!decision.allowed) {
    if (decision.reason === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: SECURITY_HEADERS }
      );
    }

    if (decision.reason === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: SECURITY_HEADERS }
      );
    }

    return NextResponse.json(
      { error: "Lampiran tidak ditemukan." },
      { status: 404, headers: SECURITY_HEADERS }
    );
  }

  const { attachment } = decision;
  const objectKey = resolveObjectKey("uploads", attachment.STORED_NAME);

  if (!objectKey) {
    return NextResponse.json(
      { error: "Lampiran tidak ditemukan." },
      { status: 404, headers: SECURITY_HEADERS }
    );
  }

  try {
    const nodeStream = await getObjectStream(objectKey);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return new Response(webStream, {
      headers: {
        ...SECURITY_HEADERS,
        "Content-Type": attachment.MIME_TYPE,
        "Content-Length": String(attachment.SIZE_BYTES),
        "Content-Disposition": safeContentDisposition(
          attachment.ORIGINAL_NAME,
          attachment.MIME_TYPE
        ),
      },
    });
  } catch (error) {
    if (isObjectNotFoundError(error)) {
      return NextResponse.json(
        { error: "Lampiran tidak ditemukan." },
        { status: 404, headers: SECURITY_HEADERS }
      );
    }

    return NextResponse.json(
      { error: "Gagal mengambil lampiran dari storage." },
      { status: 503, headers: SECURITY_HEADERS }
    );
  }
}
