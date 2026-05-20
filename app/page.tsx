import { HomePageView } from "@/components/home/home-page-view";
import { getStaticHomePageData } from "@/lib/content/home-static";

export default function HomePage() {
  return <HomePageView data={getStaticHomePageData()} />;
}
