import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { DATABASE_UNAVAILABLE_MESSAGE, jsonApiError } from "@/lib/error-utils";
import { SikRequestError, updateSikApproval } from "@/lib/sik-requests";

const MAX_REJECT_REASON_LENGTH = 500;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as {
      action?: "approve" | "reject";
      reason?: string;
    };
    const staffName = user.name ?? user.email ?? "Admin ULT";

    if (body.action === "approve") {
      const data = await updateSikApproval(id, {
        action: "approve",
        staffName,
      });

      await writeAuditLog({
        actor: user,
        request,
        action: `Menyetujui verifikasi SIK #${id}`,
      });

      return NextResponse.json({
        data: {
          id: String(data.ID),
          approvalStatus: data.APPROVAL_STATUS,
        },
        message: "Bukti ACC berhasil diverifikasi.",
      });
    }

    if (body.action === "reject") {
      if ((body.reason ?? "").length > MAX_REJECT_REASON_LENGTH) {
        return NextResponse.json(
          { error: "Alasan penolakan maksimal 500 karakter." },
          { status: 400 }
        );
      }

      const data = await updateSikApproval(id, {
        action: "reject",
        reason: body.reason ?? "",
        staffName,
      });

      await writeAuditLog({
        actor: user,
        request,
        action: `Menolak verifikasi SIK #${id}`,
      });

      return NextResponse.json({
        data: {
          id: String(data.ID),
          approvalStatus: data.APPROVAL_STATUS,
        },
        message: "Bukti ACC berhasil ditolak.",
      });
    }

    return NextResponse.json(
      { error: "Aksi approval tidak valid." },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof SikRequestError) {
      if (error.statusCode === 503) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "DATABASE_UNAVAILABLE",
              message: DATABASE_UNAVAILABLE_MESSAGE,
            },
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return jsonApiError(
      error,
      "api:admin:sik:approval:patch",
      "Approval SIK gagal diperbarui."
    );
  }
}
