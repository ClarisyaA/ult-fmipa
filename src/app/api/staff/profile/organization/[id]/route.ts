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
  return handleProfileOrganizationDetailGet("staff", id);
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const { id } = await params;
  return handleProfileOrganizationUpdate(request, "staff", id);
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const { id } = await params;
  return handleProfileOrganizationDelete(request, "staff", id);
}
