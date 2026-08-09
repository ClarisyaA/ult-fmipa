type HomeActivityImageUrlSource = {
  id: string;
  imageStoredName?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
};

export function getHomeActivityImageSrc(activity: HomeActivityImageUrlSource) {
  const version =
    activity.imageStoredName ?? activity.updatedAt ?? activity.createdAt ?? null;
  const baseUrl = `/api/home/activities/images/${activity.id}`;

  return version ? `${baseUrl}?v=${encodeURIComponent(version)}` : baseUrl;
}

type HomeActivityImageFileUrlSource = {
  id: string;
  imageStoredName?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
};

export function getHomeActivityImageFileSrc(image: HomeActivityImageFileUrlSource) {
  const version = image.imageStoredName ?? image.updatedAt ?? image.createdAt ?? null;
  const baseUrl = `/api/home/activities/image/${image.id}`;

  return version ? `${baseUrl}?v=${encodeURIComponent(version)}` : baseUrl;
}
