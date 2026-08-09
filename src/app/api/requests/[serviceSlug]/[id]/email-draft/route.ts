import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { jsonApiError } from "@/lib/error-utils";
import { buildRequestEmailDraft } from "@/lib/requests/request-email-helper";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type EmailDraftRouteProps = {
  params: Promise<{ serviceSlug: string; id: string }>;
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: status === 404 ? "NOT_FOUND" : "BAD_REQUEST",
        message,
      },
    },
    { status },
  );
}

export async function GET(request: Request, { params }: EmailDraftRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        },
      },
      { status: 401 },
    );
  }

  if (!["ADMIN", "STAFF"].includes(user.role)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Forbidden",
        },
      },
      { status: 403 },
    );
  }

  try {
    const { serviceSlug, id } = await params;

    if (!/^\d+$/.test(id)) {
      return jsonError("ID pengajuan tidak valid.", 400);
    }

    const draft = await buildRequestEmailDraft(serviceSlug, id);

    if (!draft) {
      return jsonError("Pengajuan tidak ditemukan.", 404);
    }

    await writeAuditLog({
      actor: user,
      request,
      action: `Menyiapkan email pengiriman ${serviceSlug} #${id}`,
    });

    return NextResponse.json({
      success: true,
      data: draft,
    });
  } catch (error) {
    return jsonApiError(
      error,
      "api:requests:email-draft:get",
      "Data email belum dapat disiapkan.",
    );
  }
}
