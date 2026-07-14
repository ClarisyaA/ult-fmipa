import {
  handleProfileLocationGet,
  handleProfileLocationUpdate,
} from "@/lib/profile-cms-route-handlers";

export function GET() {
  return handleProfileLocationGet("staff");
}

export function PATCH(request: Request) {
  return handleProfileLocationUpdate(request, "staff");
}
