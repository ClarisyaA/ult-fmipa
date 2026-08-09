export type RequestStatusAction =
  | "process"
  | "complete"
  | "deliver"
  | "cancelProcess"
  | "cancelComplete"
  | "cancelDeliver";

export type UpdateRequestStatusInput = {
  action: RequestStatusAction;
  staffName: string;
};
