import { getCurrentUser } from "@/lib/auth/session";
import { SiteHeader } from "@/components/layout/site-header";

export async function AuthAwareHeader() {
  const user = await getCurrentUser();

  return (
    <SiteHeader
      user={
        user
          ? {
              name: user.name,
              email: user.email,
              role: user.role
            }
          : null
      }
    />
  );
}
