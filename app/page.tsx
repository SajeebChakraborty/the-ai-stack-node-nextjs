import { Hero } from "@/components/home/hero";
import { HomeSections } from "@/components/home/home-sections";

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">
      <Hero />
      <HomeSections />
    </div>
  );
}
