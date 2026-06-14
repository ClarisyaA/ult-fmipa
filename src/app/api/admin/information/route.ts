import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import {
  getInformationApiErrorStatus,
  parseInformationPostRequest,
  saveInformationImagesForPost,
} from "@/lib/information-api";
import {
  createInformationPost,
  getAdminInformationPosts,
} from "@/lib/information-posts";

function getActorName(user: { name?: string | null; email?: string | null }) {
  return user.name ?? user.email ?? "Admin ULT";
}

export async function GET() {
  const user = await requireRole(["admin"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const posts = await getAdminInformationPosts();

  return NextResponse.json({ data: posts });
}

export async function POST(request: Request) {
  const user = await requireRole(["admin"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { input, files } = await parseInformationPostRequest(
      request,
      getActorName(user)
    );
    const post = await createInformationPost(input);

    if (post) {
      await saveInformationImagesForPost(post.id, files);
    }

    return NextResponse.json({
      data: post,
      message: "Informasi berhasil dibuat.",
    });
  } catch (error) {
    const apiError = getInformationApiErrorStatus(error);

    if (apiError) {
      return NextResponse.json(
        { error: apiError.message },
        { status: apiError.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Informasi gagal dibuat." },
      { status: 500 }
    );
  }
}
