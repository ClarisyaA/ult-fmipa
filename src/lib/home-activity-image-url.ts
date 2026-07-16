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
