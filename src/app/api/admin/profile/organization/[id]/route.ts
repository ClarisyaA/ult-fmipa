import {
  handleProfileOrganizationDelete,
  handleProfileOrganizationDetailGet,
  handleProfileOrganizationUpdate,
} from "@/lib/profile-cms-route-handlers";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  return handleProfileOrganizationDetailGet("admin", id);
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const { id } = await params;
  return handleProfileOrganizationUpdate(request, "admin", id);
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const { id } = await params;
  return handleProfileOrganizationDelete(request, "admin", id);
}
