import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { SikRequestError, updateSikApproval } from "@/lib/sik-requests";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireRole(["staff"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as {
      action?: "approve" | "reject";
      reason?: string;
    };
    const staffName = user.name ?? user.email ?? "Staff ULT";

    if (body.action === "approve") {
      const data = await updateSikApproval(id, {
        action: "approve",
        staffName,
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
      const data = await updateSikApproval(id, {
        action: "reject",
        reason: body.reason ?? "",
        staffName,
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
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Approval SIK gagal diperbarui." },
      { status: 500 }
    );
  }
}
