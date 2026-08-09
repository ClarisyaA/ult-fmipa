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

export type PendingDashboardRequestRow = {
  id: string;
  serviceTitle: string;
  serviceSlug: string;
  serviceCategory: string;
  requesterName: string;
  programStudy: string;
  requestDate: string | null;
};

export type PriorityLevel = "high" | "medium" | "new";

export type PriorityDashboardRequestRow = PendingDashboardRequestRow & {
  waitingHours: number;
  waitingDays: number;
  priorityLevel: PriorityLevel;
};

export type RequestNotificationSnapshot = {
  latestKey: string | null;
  totalPending: number;
  highPriorityCount: number;
  requests: PendingDashboardRequestRow[];
  generatedAt: string;
};
