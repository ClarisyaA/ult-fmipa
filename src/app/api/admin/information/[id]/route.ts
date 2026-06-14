import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import {
  deleteInformationPost,
  getInformationPostById,
  InformationPostValidationError,
  InformationTableUnavailableError,
  updateInformationPost,
  type InformationPostInput,
} from "@/lib/information-posts";

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
    const body = (await request.json()) as InformationPostInput;
    const post = await updateInformationPost(id, {
      ...body,
      actor: getActorName(user),
    });

    if (!post) {
      return NextResponse.json(
        { error: "Informasi tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: post,
      message: "Informasi berhasil diperbarui.",
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
    await deleteInformationPost(id);

    return NextResponse.json({
      message: "Informasi berhasil dihapus.",
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
      { error: "Informasi gagal dihapus." },
      { status: 500 }
    );
  }
}
