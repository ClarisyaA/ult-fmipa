import {
  handleHomeActivityImagesCreate,
  handleHomeActivityImagesGet,
} from "@/lib/home-activity-images-route-handlers";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  return handleHomeActivityImagesGet("staff", id);
}

export async function POST(request: Request, { params }: RouteProps) {
  const { id } = await params;
  return handleHomeActivityImagesCreate(request, "staff", id);
}
