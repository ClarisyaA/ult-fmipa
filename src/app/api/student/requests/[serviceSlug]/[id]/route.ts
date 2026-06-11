import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getStudentRequestDetail } from "@/lib/student-request-history";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ serviceSlug: string; id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!session.user.npm) {
    return NextResponse.json(
      { error: "NPM mahasiswa tidak tersedia di session." },
      { status: 400 }
    );
  }

  const { serviceSlug, id } = await params;
  const detail = await getStudentRequestDetail(
    session.user.npm,
    serviceSlug,
    id
  );

  if (!detail) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  return NextResponse.json({ data: detail });
}
