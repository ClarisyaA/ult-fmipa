import type { Session } from "next-auth";
import { getAttachmentRecordById } from "@/lib/request-attachments";
import { getRequestDetail } from "@/lib/legacy-request-detail";
import { getStudentRequestDetail } from "@/lib/student-request-history";
import type { ServiceRequestDetail } from "@/types/request-detail";

type AttachmentRecord = NonNullable<
  Awaited<ReturnType<typeof getAttachmentRecordById>>
>;

export type AppUser = Session["user"];

export type AttachmentAccessDecision =
  | { allowed: true; attachment: AttachmentRecord; requestDetail: ServiceRequestDetail }
  | { allowed: false; reason: "NOT_FOUND" | "UNAUTHORIZED" | "FORBIDDEN" };

/**
 * Extension point for fine-grained staff unit or service scope policy.
 *
 * NOTE FOR UNPAD TEAM:
 * In the current legacy database schema, staff users query all student request tables
 * (`masih_kuliah`, `permohonan_magang`, `surat_izin_kegiatan`, etc.) globally on `/staff/requests`.
 * If granular unit or assignment rules are provided by Unpad in the future, implement the filtering
 * inside this extension function without changing the callers.
 */
export function evaluateStaffUnitOrAssignmentScope(
  _user: AppUser,
  _attachment: AttachmentRecord,
  _requestDetail: ServiceRequestDetail
): boolean {
  void _user;
  void _attachment;
  void _requestDetail;

  // Currently, all staff users have access to active student requests in /staff/requests.
  return true;
}

export async function authorizeAttachmentAccess(
  user: AppUser | null | undefined,
  attachmentId: string
): Promise<AttachmentAccessDecision> {
  if (!user) {
    return { allowed: false, reason: "UNAUTHORIZED" };
  }

  const attachment = await getAttachmentRecordById(attachmentId);

  if (!attachment) {
    return { allowed: false, reason: "NOT_FOUND" };
  }

  const requestDetail = await getRequestDetail(
    attachment.SERVICE_SLUG,
    String(attachment.REQUEST_ID)
  );

  if (!requestDetail || requestDetail.sourceTable !== attachment.SOURCE_TABLE) {
    return { allowed: false, reason: "NOT_FOUND" };
  }

  if (user.role === "MAHASISWA") {
    if (!user.npm) {
      return { allowed: false, reason: "FORBIDDEN" };
    }

    const studentDetail = await getStudentRequestDetail(
      user.npm,
      attachment.SERVICE_SLUG,
      String(attachment.REQUEST_ID)
    );

    if (!studentDetail || studentDetail.sourceTable !== attachment.SOURCE_TABLE) {
      return { allowed: false, reason: "FORBIDDEN" };
    }

    return { allowed: true, attachment, requestDetail };
  }

  if (user.role === "ADMIN") {
    return { allowed: true, attachment, requestDetail };
  }

  if (user.role === "STAFF") {
    const isWithinStaffScope = evaluateStaffUnitOrAssignmentScope(
      user,
      attachment,
      requestDetail
    );

    if (!isWithinStaffScope) {
      return { allowed: false, reason: "FORBIDDEN" };
    }

    return { allowed: true, attachment, requestDetail };
  }

  return { allowed: false, reason: "FORBIDDEN" };
}
