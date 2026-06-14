import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import {
  getInformationApiErrorStatus,
  parseInformationPostRequest,
  saveInformationImagesForPost,
} from "@/lib/information-api";
import {
  deleteInformationPost,
  getInformationPostById,
  updateInformationPost,
} from "@/lib/information-posts";
import { deleteInformationPostImagesForPost } from "@/lib/information-post-images";

type InformationRouteProps = {
  params: Promise<{ id: string }>;
};

function getActorName(user: { name?: string | null; email?: string | null }) {
  return user.name ?? user.email ?? "Admin ULT";
}

export async function GET(_request: Request, { params }: InformationRouteProps) {
  const user = await requireRole(["admin"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const post = await getInformationPostById(id);

    if (!post) {
      return NextResponse.json(
        { error: "Informasi tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: post });
  } catch (error) {
    const apiError = getInformationApiErrorStatus(error);

    if (apiError) {
      return NextResponse.json(
        { error: apiError.message },
        { status: apiError.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Informasi gagal dimuat." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: InformationRouteProps) {
  const user = await requireRole(["admin"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { input, files } = await parseInformationPostRequest(
      request,
      getActorName(user)
    );
    const post = await updateInformationPost(id, input);

    if (!post) {
      return NextResponse.json(
        { error: "Informasi tidak ditemukan." },
        { status: 404 }
      );
    }

    await saveInformationImagesForPost(post.id, files);

    return NextResponse.json({
      data: post,
      message: "Informasi berhasil diperbarui.",
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
      { error: "Informasi gagal diperbarui." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: InformationRouteProps
) {
  const user = await requireRole(["admin"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await deleteInformationPostImagesForPost(id);
    await deleteInformationPost(id);

    return NextResponse.json({
      message: "Informasi berhasil dihapus.",
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
      { error: "Informasi gagal dihapus." },
      { status: 500 }
    );
  }
}
