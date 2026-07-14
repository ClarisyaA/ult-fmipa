import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { jsonApiError } from "@/lib/error-utils";
import {
  assertValidScholarshipTemplateInput,
  ensureServiceLinksTableAvailable,
  updateScholarshipTemplateServiceLink,
} from "@/lib/service-links";
import {
  getServiceLinkApiErrorStatus,
  parseScholarshipTemplateLinkRequest,
} from "@/lib/service-links-api";

function getActorName(user: { name?: string | null; email?: string | null }) {
  return user.name ?? user.email ?? "Staff ULT";
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["admin", "staff"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const input = await parseScholarshipTemplateLinkRequest(
      request,
      getActorName(user)
    );
    assertValidScholarshipTemplateInput(input);
    await ensureServiceLinksTableAvailable();
    const link = await updateScholarshipTemplateServiceLink(input);

    await writeAuditLog({
      actor: user,
      request,
      action: "Memperbarui link template Rekomendasi Beasiswa",
    });

    return NextResponse.json({
      data: link,
      message: "Link template Rekomendasi Beasiswa berhasil diperbarui.",
    });
  } catch (error) {
    const apiError = getServiceLinkApiErrorStatus(error);

    if (apiError) {
      return NextResponse.json(
        { error: apiError.message },
        { status: apiError.statusCode }
      );
    }

    return jsonApiError(
      error,
      "api:staff:service-links:scholarship-template:patch",
      "Link template Rekomendasi Beasiswa gagal diperbarui."
    );
  }
}
