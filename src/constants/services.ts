import { getPublicServices } from "@/lib/legacy-services";

export const serviceCategories = [
  "Layanan Mahasiswa",
  "Layanan Alumni",
  "Layanan Perpustakaan",
] as const;

export type ServiceCategory = (typeof serviceCategories)[number];

export type ServiceItem = ReturnType<typeof getPublicServices>[number];

export const services = getPublicServices();
