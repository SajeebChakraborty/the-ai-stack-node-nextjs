import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { demoSessionCookie, encodeDemoSession, type CurrentUser } from "@/lib/auth/session";

export async function POST() {
  const user: CurrentUser = {
    id: "local-google-admin",
    email: "google.user@theaistack.local",
    name: "Google Demo User",
    role: "admin",
    provider: "google"
  };

  const cookieStore = await cookies();
  cookieStore.set(demoSessionCookie, encodeDemoSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  return NextResponse.json({ user });
}

