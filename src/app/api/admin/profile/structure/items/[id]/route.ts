import {
  handleProfileStructureItemDelete,
  handleProfileStructureItemUpdate,
} from "@/lib/profile-structure-cms-route-handlers";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteProps) {
  const { id } = await params;
  return handleProfileStructureItemUpdate(request, "admin", id);
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const { id } = await params;
  return handleProfileStructureItemDelete(request, "admin", id);
}
