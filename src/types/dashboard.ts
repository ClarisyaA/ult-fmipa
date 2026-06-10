export type ServiceRequestSummary = {
  title: string;
  slug: string;
  sourceTable: string;
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  delivered: number;
};

export type DashboardSummary = {
  totalServices: number;
  totalRequests: number;
  totalPending: number;
  totalInProgress: number;
  totalCompleted: number;
  totalDelivered: number;
  services: ServiceRequestSummary[];
};
