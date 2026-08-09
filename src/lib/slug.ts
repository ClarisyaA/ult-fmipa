export function normalizeInformationTitle(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function slugifyInformationTitle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 220);
}
