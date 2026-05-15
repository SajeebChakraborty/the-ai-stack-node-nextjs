import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function requireAdminApi() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Authentication required." }, { status: 401 })
    };
  }

  if (user.role !== "admin") {
    return {
      user: null,
      error: NextResponse.json({ error: "Only admins can perform this action." }, { status: 403 })
    };
  }

  return { user, error: null };
}
