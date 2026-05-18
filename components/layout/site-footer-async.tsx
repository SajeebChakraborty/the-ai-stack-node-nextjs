import { prisma } from "@/lib/db/prisma";
import { SiteFooter } from "@/components/layout/site-footer";

export async function SiteFooterAsync() {
  const categories = await prisma.category
    .findMany({
      orderBy: { name: "asc" },
      take: 6,
      select: { name: true, slug: true }
    })
    .catch(() => []);

  return <SiteFooter categories={categories} />;
}
