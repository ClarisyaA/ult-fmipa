import { handleProfileStructureNodeCreate } from "@/lib/profile-structure-cms-route-handlers";

export function POST(request: Request) {
  return handleProfileStructureNodeCreate(request, "staff");
}
