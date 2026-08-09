import { handleProfileStructureSettingsUpdate } from "@/lib/profile-structure-cms-route-handlers";

export function PATCH(request: Request) {
  return handleProfileStructureSettingsUpdate(request, "staff");
}
