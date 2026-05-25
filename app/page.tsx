import { HomePageView } from "@/components/home/home-page-view";
import { getStaticHomePageData } from "@/lib/content/home-static";

// Avoid baking the homepage into a long-lived Full Route Cache (s-maxage=31536000).
// Without this, an old build can keep serving "trust before they buy" until cache is cleared.
export const dynamic = "force-dynamic";

export default function HomePage() {
  return <HomePageView data={getStaticHomePageData()} />;
}
