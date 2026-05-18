import Link from "next/link";
import { footerGroups } from "@/lib/constants/navigation";
import { siteSettings } from "@/data/catalog";
import { Logo } from "@/components/layout/logo";

type SiteFooterProps = {
  categories?: Array<{ name: string; slug: string }>;
};

export function SiteFooter({ categories = [] }: SiteFooterProps) {
  return (
    <footer className="border-t bg-secondary/30">
      <div className="container grid gap-8 py-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4 md:col-span-2 lg:col-span-1">
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
        {categories.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Categories</h3>
            <div className="grid gap-2 text-sm text-muted-foreground">
              {categories.map((category) => (
                <Link key={category.slug} href={`/categories/${category.slug}`} className="hover:text-foreground">
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </footer>
  );
}
