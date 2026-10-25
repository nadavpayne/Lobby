import { AppHeader } from "@/components/AppHeader";
import { Audiences } from "@/components/home/Audiences";
import { Categories } from "@/components/home/Categories";
import { Faq } from "@/components/home/Faq";
import { Hero } from "@/components/home/Hero";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeMenu } from "@/components/home/HomeMenu";
import { HowItWorks } from "@/components/home/HowItWorks";
import { NavChips } from "@/components/home/NavChips";

/** Public home page: explains the club to residents, house committees and businesses. */
export default function Home() {
  return (
    <>
      <div className="sticky top-0 z-20">
        <AppHeader>
          <HomeMenu />
        </AppHeader>
        <NavChips />
      </div>
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Categories />
        <Audiences />
        <Faq />
      </main>
      <HomeFooter />
    </>
  );
}
