import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  createServiceRequest,
  ServiceRequestSubmitError,
} from "@/lib/legacy-request-submit";
import { authOptions } from "@/lib/auth";
import { createServiceRequestSchema } from "@/lib/service-request-validation";
import { getServerSession } from "next-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        {
          error: "Anda harus login sebagai mahasiswa untuk mengajukan layanan.",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "student") {
      return NextResponse.json(
        {
          error: "Hanya mahasiswa yang dapat mengajukan layanan.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const input = createServiceRequestSchema.parse({
      ...body,
      npm: session.user.npm || body?.npm,
      email: session.user.email || body?.email,
      phone: body?.phone || session.user.phone,
    });
    const result = await createServiceRequest(slug, input);

    return NextResponse.json({
      data: result,
      message: "Pengajuan layanan berhasil dikirim.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Input pengajuan tidak valid.",
          issues: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    if (error instanceof ServiceRequestSubmitError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        error: "Pengajuan layanan gagal dikirim.",
      },
      { status: 500 }
    );
  }
}
