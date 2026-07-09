import type { RequestStatus } from "@/types/request";

export type ServiceRequestDetail = {
  id: string;
  serviceTitle: string;
  serviceSlug: string;
  sourceTable: string;
  npm: string | null;
  requesterName?: string | null;
  requesterEmail?: string | null;
  requesterPhone?: string | null;
  requesterProgram?: string | null;
  requesterLevel?: string | null;
  requesterClassYear?: number | null;
  requestDate: string | null;
  status: RequestStatus;
  statusLabel: string;
  keperluan?: string | null;
  keterangan?: string | null;
  requestEntry?: string | null;
  processDate?: string | null;
  processStaff?: string | null;
  completedDate?: string | null;
  completedStaff?: string | null;
  deliveredDate?: string | null;
  deliveredBy?: string | null;
  workflow: Array<{
    label: string;
    date: string | null;
    staff?: string | null;
    done: boolean;
  }>;
  jumlahIjazah?: number | null;
  jumlahTranskrip?: number | null;
  jumlahTranslate?: number | null;
  beasiswa?: string | null;
  pengantar?: string | null;
  ditujukan?: string | null;
};
