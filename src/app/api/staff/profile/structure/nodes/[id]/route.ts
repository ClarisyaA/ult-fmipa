import {
  handleProfileStructureNodeDelete,
  handleProfileStructureNodeUpdate,
} from "@/lib/profile-structure-cms-route-handlers";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteProps) {
  const { id } = await params;
  return handleProfileStructureNodeUpdate(request, "staff", id);
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const { id } = await params;
  return handleProfileStructureNodeDelete(request, "staff", id);
}
