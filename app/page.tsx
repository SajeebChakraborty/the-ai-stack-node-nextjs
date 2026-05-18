import { HomePageView } from "@/components/home/home-page-view";
import { getHomePageData } from "@/lib/queries/home";

export default async function HomePage() {
  const data = await getHomePageData();
  return <HomePageView data={data} />;
}
