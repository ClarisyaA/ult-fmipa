import { NextResponse } from "next/server";

import { getPublicServiceBySlug } from "@/lib/legacy-services";
import { getPublicServiceTemplateLinks } from "@/lib/service-links";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const service = getPublicServiceBySlug(slug);

  if (!service) {
    return NextResponse.json(
      {
        success: false,
        error: "Service not found",
      },
      { status: 404 }
    );
  }

  const templateLinks = await getPublicServiceTemplateLinks(service.slug);

  return NextResponse.json({
    success: true,
    data: {
      links: Object.values(templateLinks),
      templateLinks,
    },
  });
}
