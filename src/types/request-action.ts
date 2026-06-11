export type RequestStatusAction = "process" | "complete" | "deliver";

export type UpdateRequestStatusInput = {
  action: RequestStatusAction;
  staffName: string;
};
