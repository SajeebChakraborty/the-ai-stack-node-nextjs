import { NextResponse } from "next/server";
import { clearCurrentUserSession } from "@/lib/auth/session";

export async function POST() {
  await clearCurrentUserSession();
  return NextResponse.json({ ok: true });
}
