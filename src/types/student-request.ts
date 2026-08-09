import type { RequestStatus } from "@/types/request";

export type StudentRequestListItem = {
  id: string;
  serviceTitle: string;
  serviceSlug: string;
  sourceTable: string;
  requestDate: string | null;
  status: RequestStatus;
  statusLabel: string;
  description?: string | null;
};

export type StudentRequestDetail = StudentRequestListItem & {
  requestEntry?: string | null;
  processDate?: string | null;
  processStaff?: string | null;
  completedDate?: string | null;
  completedStaff?: string | null;
  deliveredDate?: string | null;
  deliveredBy?: string | null;
  approvalStatus?: string | null;
  approvalVerificationDate?: string | null;
  approvalVerificationStaff?: string | null;
  approvalRejectReason?: string | null;
  finalSubmittedDate?: string | null;
  namaHimpunan?: string | null;
  namaKegiatan?: string | null;
  tanggalKegiatan?: string | null;
  emailPengiriman?: string | null;
  noHpWa?: string | null;
  workflow: Array<{
    label: string;
    date: string | null;
    staff?: string | null;
    done: boolean;
  }>;
};

export type PaginatedStudentRequests = {
  data: StudentRequestListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
