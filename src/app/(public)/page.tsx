import { HomeHero } from "@/components/home/home-hero";
import { HomeLandingSections } from "@/components/home/home-landing-sections";

export default function HomePage() {
  return (
    <main data-testid="home-page" className="bg-[#fffaf2] text-[#171412]">
      <HomeHero />
      <HomeLandingSections />
    </main>
  );
}
