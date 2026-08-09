import { handleProfileStructureItemCreate } from "@/lib/profile-structure-cms-route-handlers";

export function POST(request: Request) {
  return handleProfileStructureItemCreate(request, "staff");
}
