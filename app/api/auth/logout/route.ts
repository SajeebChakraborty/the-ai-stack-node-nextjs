import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { demoSessionCookie } from "@/lib/auth/session";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(demoSessionCookie);
  return NextResponse.json({ ok: true });
}
