import { handleHomeActivityImageSetCover } from "@/lib/home-activity-images-route-handlers";

type RouteProps = {
  params: Promise<{ id: string; imageId: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  const { id, imageId } = await params;
  return handleHomeActivityImageSetCover(request, "admin", id, imageId);
}
