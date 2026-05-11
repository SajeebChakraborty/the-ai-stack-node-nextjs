import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/types/domain";
import { createClient } from "@/lib/supabase/server";

export const demoSessionCookie = "theaistack_demo_session";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  provider: "google" | "supabase";
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const demoSession = cookieStore.get(demoSessionCookie)?.value;

  if (demoSession) {
    try {
      return JSON.parse(Buffer.from(demoSession, "base64url").toString("utf8")) as CurrentUser;
    } catch {
      return null;
    }
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user?.email) return null;

    return {
      id: data.user.id,
      email: data.user.email,
      name: (data.user.user_metadata?.full_name as string | undefined) ?? data.user.email.split("@")[0],
      role: "user",
      provider: "supabase"
    };
  } catch {
    return null;
  }
}

export async function requireUser(nextPath: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

export function encodeDemoSession(user: CurrentUser) {
  return Buffer.from(JSON.stringify(user)).toString("base64url");
}
