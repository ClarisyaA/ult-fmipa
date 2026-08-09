import { NextResponse } from "next/server";

import { getPublicServices } from "@/lib/legacy-services";

export function GET() {
  return NextResponse.json({
    data: getPublicServices(),
  });
}
