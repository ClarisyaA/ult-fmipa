import {
  handleProfileOrganizationCreate,
  handleProfileOrganizationListGet,
} from "@/lib/profile-cms-route-handlers";

export function GET() {
  return handleProfileOrganizationListGet("staff");
}

export function POST(request: Request) {
  return handleProfileOrganizationCreate(request, "staff");
}
