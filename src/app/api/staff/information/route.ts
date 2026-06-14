import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import {
  createInformationPost,
  getAdminInformationPosts,
  InformationPostValidationError,
  InformationTableUnavailableError,
  type InformationPostInput,
} from "@/lib/information-posts";

function getActorName(user: { name?: string | null; email?: string | null }) {
  return user.name ?? user.email ?? "Staff ULT";
}

export async function GET() {
  const user = await requireRole(["staff"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const posts = await getAdminInformationPosts();

  return NextResponse.json({ data: posts });
}

export async function POST(request: Request) {
  const user = await requireRole(["staff"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as InformationPostInput;
    const post = await createInformationPost({
      ...body,
      actor: getActorName(user),
    });

    return NextResponse.json({
      data: post,
      message: "Informasi berhasil dibuat.",
    });
  } catch (error) {
    if (
      error instanceof InformationPostValidationError ||
      error instanceof InformationTableUnavailableError
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Informasi gagal dibuat." },
      { status: 500 }
    );
  }
}
