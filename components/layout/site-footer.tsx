import Link from "next/link";
import { footerGroups } from "@/lib/constants/navigation";
import { siteSettings } from "@/data/catalog";
import { Logo } from "@/components/layout/logo";

export function SiteFooter() {
  return (
    <footer className="border-t bg-secondary/30">
      <div className="container grid gap-8 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-md text-sm text-muted-foreground">{siteSettings.footer}</p>
          <p className="text-xs text-muted-foreground">© 2026 TheAiStack Inc. AI discovery with trust signals built in.</p>
        </div>
        {footerGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            <h3 className="text-sm font-semibold">{group.title}</h3>
            <div className="grid gap-2 text-sm text-muted-foreground">
              {group.links.map((link) => (
                <Link key={link.href + link.label} href={link.href} className="hover:text-foreground">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
