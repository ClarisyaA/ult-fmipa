export type RequestStatus =
  | "pending"
  | "inProgress"
  | "completed"
  | "delivered";

export type ServiceRequestListItem = {
  id: string;
  serviceTitle: string;
  serviceSlug: string;
  sourceTable: string;
  maskedNpm: string;
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
