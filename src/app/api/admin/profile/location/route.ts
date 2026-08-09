import {
  handleProfileLocationGet,
  handleProfileLocationUpdate,
} from "@/lib/profile-cms-route-handlers";

export function GET() {
  return handleProfileLocationGet("admin");
}

export function PATCH(request: Request) {
  return handleProfileLocationUpdate(request, "admin");
}
