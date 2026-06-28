import { HomeClientWrapper } from "@/components/home/home-client-wrapper";

export default function HomePage() {
  return (
    <main data-testid="home-page" className="relative min-h-screen bg-[#fffaf2] text-[#171412]">
      <HomeClientWrapper />
    </main>
  );
}
