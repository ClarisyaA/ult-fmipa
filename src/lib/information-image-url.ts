type InformationImageUrlSource = {
  id: string;
  storedName?: string | null;
  createdAt?: string | null;
};

export function getInformationImageSrc(image: InformationImageUrlSource) {
  const version = image.storedName ?? image.createdAt ?? null;
  const baseUrl = `/api/information/images/${image.id}`;

  return version ? `${baseUrl}?v=${encodeURIComponent(version)}` : baseUrl;
}
