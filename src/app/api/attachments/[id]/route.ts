import { readFile, stat } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import { getAttachmentRecordById } from "@/lib/request-attachments";
import { getStudentRequestDetail } from "@/lib/student-request-history";

type AttachmentRouteProps = {
  params: Promise<{ id: string }>;
};

function resolveStoragePath(storedName: string) {
  const uploadRoot = path.resolve(process.cwd(), "storage", "uploads");
  const safeStoredName = path.basename(storedName);
  const absolutePath = path.resolve(uploadRoot, safeStoredName);

  if (
    absolutePath !== uploadRoot &&
    !absolutePath.startsWith(`${uploadRoot}${path.sep}`)
  ) {
    return null;
  }

  return absolutePath;
}

function contentDisposition(filename: string) {
  return `inline; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(
  _request: Request,
  { params }: AttachmentRouteProps
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let attachment;

  try {
    attachment = await getAttachmentRecordById(id);
  } catch (error) {
    return jsonApiError(
      error,
      "api:attachments:get",
      "Lampiran gagal dimuat."
    );
  }

  if (!attachment) {
    return NextResponse.json({ error: "Lampiran tidak ditemukan." }, { status: 404 });
  }

  if (session.user.role === "student") {
    if (!session.user.npm) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let detail;

    try {
      detail = await getStudentRequestDetail(
        session.user.npm,
        attachment.SERVICE_SLUG,
        String(attachment.REQUEST_ID)
      );
    } catch (error) {
      return jsonApiError(
        error,
        "api:attachments:student-detail:get",
        "Lampiran gagal dimuat."
      );
    }

    if (!detail || detail.sourceTable !== attachment.SOURCE_TABLE) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (!["admin", "staff"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const absolutePath = resolveStoragePath(attachment.STORED_NAME);

  if (!absolutePath) {
    return NextResponse.json({ error: "Lampiran tidak ditemukan." }, { status: 404 });
  }

  try {
    const fileStat = await stat(absolutePath);
    const file = await readFile(absolutePath);

    return new Response(file, {
      headers: {
        "Content-Type": attachment.MIME_TYPE,
        "Content-Length": String(fileStat.size),
        "Content-Disposition": contentDisposition(attachment.ORIGINAL_NAME),
      },
    });
  } catch {
    return NextResponse.json({ error: "Lampiran tidak ditemukan." }, { status: 404 });
  }
}
