import {
  handleHomeActivityImageDelete,
  handleHomeActivityImageUpdate,
} from "@/lib/home-activity-images-route-handlers";

type RouteProps = {
  params: Promise<{ id: string; imageId: string }>;
};

export async function PATCH(request: Request, { params }: RouteProps) {
  const { id, imageId } = await params;
  return handleHomeActivityImageUpdate(request, "staff", id, imageId);
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const { id, imageId } = await params;
  return handleHomeActivityImageDelete(request, "staff", id, imageId);
}
