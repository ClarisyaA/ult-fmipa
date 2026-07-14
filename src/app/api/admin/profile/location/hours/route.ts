import { handleProfileLocationHourCreate } from "@/lib/profile-cms-route-handlers";

export function POST(request: Request) {
  return handleProfileLocationHourCreate(request, "admin");
}
