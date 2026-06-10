import { NextResponse } from "next/server";

import { getPublicServiceBySlug } from "@/lib/legacy-services";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const service = getPublicServiceBySlug(slug);

  if (!service) {
    return NextResponse.json(
      {
        error: "Service not found",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    data: service,
  });
}
