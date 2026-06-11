export type CreateServiceRequestInput = {
  npm: string;
  email?: string;
  phone?: string;
  description?: string;
  scholarshipName?: string;
};

export type CreateServiceRequestResult = {
  id: string;
  serviceSlug: string;
  serviceTitle: string;
  status: "pending";
};
