import {
  handleProfileLocationHourDelete,
  handleProfileLocationHourUpdate,
} from "@/lib/profile-cms-route-handlers";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteProps) {
  const { id } = await params;
  return handleProfileLocationHourUpdate(request, "admin", id);
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const { id } = await params;
  return handleProfileLocationHourDelete(request, "admin", id);
}
