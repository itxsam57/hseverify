import { NextResponse } from "next/server";

import { writeStaffEnrollmentToken } from "@/lib/auth/staff-enrollment-cookie";
import {
  StaffProvisioningError,
  getStaffProvisioningService
} from "@/lib/auth/staff-provisioning-service";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const { token } = await context.params;
  try {
    const result = await (await getStaffProvisioningService()).beginEnrollment(token);
    await writeStaffEnrollmentToken(result.token);
    return NextResponse.redirect(new URL("/staff/invite/accept", request.url));
  } catch (error) {
    const reason =
      error instanceof StaffProvisioningError
        ? error.code
        : "invitation_unavailable";
    return NextResponse.redirect(
      new URL(`/staff/invite/accept?reason=${encodeURIComponent(reason)}`, request.url)
    );
  }
}
