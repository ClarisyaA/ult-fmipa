export type CreateServiceRequestInput = {
  npm: string;
  email?: string;
  phone?: string;
  description?: string;
  scholarshipName?: string;
  semester?: string;
  tahunAkademik?: string;
  namaOrangTua?: string;
  nipNrp?: string;
  pangkatGolongan?: string;
  instansi?: string;
};

export type CreateServiceRequestResult = {
  id: string;
  serviceSlug: string;
  serviceTitle: string;
  status: "pending";
};
