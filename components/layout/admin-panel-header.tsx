import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { Logo } from "@/components/layout/logo";
import { PanelAccountMenu } from "@/components/layout/panel-account-menu";
import { Button } from "@/components/ui/button";

export async function AdminPanelHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex items-center gap-4">
          <Logo />
          <Button asChild size="sm" variant="ghost">
            <Link href="/admin/dashboard">Dashboard</Link>
          </Button>
        </div>
        {user ? <PanelAccountMenu user={user} /> : null}
      </div>
    </header>
  );
}
