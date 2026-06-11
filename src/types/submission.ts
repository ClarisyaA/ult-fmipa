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
  pengantar?: string;
  ditujukan?: string;
  dasarSuratNo?: string;
  dasarSuratPerihal?: string;
  dasarSuratTgl?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  tanggalLulus?: string;
  ipk?: string;
  yudisium?: string;
  jumlahTranskrip?: number;
  jumlahIjazah?: number;
  jumlahTranslet?: number;
};

export type CreateServiceRequestResult = {
  id: string;
  serviceSlug: string;
  serviceTitle: string;
  status: "pending";
};
