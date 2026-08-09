import { handleProfileStructureStateGet } from "@/lib/profile-structure-cms-route-handlers";

export function GET() {
  return handleProfileStructureStateGet("admin");
}
