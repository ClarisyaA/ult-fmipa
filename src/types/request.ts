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
  maskedNpm: string;
  purpose: string | null;
  requestDate: string | null;
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
