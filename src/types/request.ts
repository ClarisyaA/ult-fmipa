export type RequestStatus =
  | "pending"
  | "inProgress"
  | "completed"
  | "delivered"
  | "sikApprovalPending"
  | "sikApprovalRejected"
  | "sikApprovalVerified"
  | "sikFinalSubmitted";

export type ServiceRequestListItem = {
  id: string;
  serviceTitle: string;
  serviceSlug: string;
  sourceTable: string;
  npm: string | null;
  maskedNpm: string;
  requesterName: string | null;
  requesterProgram: string | null;
  requesterEmail: string | null;
  requesterPhone: string | null;
  purpose: string | null;
  requestDate: string | null;
  processDate: string | null;
  completedDate: string | null;
  deliveredDate: string | null;
  mainField: string | null;
  jenisPermohonan: string | null;
  tempatPelaksanaan: string | null;
  tujuanSurat: string | null;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  namaHimpunan: string | null;
  namaKegiatan: string | null;
  tanggalKegiatan: string | null;
  approvalStatus: string | null;
  finalSubmittedDate: string | null;
  status: RequestStatus;
  statusLabel: string;
};

export type PaginatedServiceRequests = {
  data: ServiceRequestListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
