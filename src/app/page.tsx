import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Audiences } from "@/components/home/Audiences";
import { Categories } from "@/components/home/Categories";
import { Faq } from "@/components/home/Faq";
import { Hero } from "@/components/home/Hero";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HowItWorks } from "@/components/home/HowItWorks";
import { NavChips } from "@/components/home/NavChips";

/** Public home page: explains the club to residents, house committees and businesses. */
export default function Home() {
  return (
    <>
      <div className="sticky top-0 z-20">
        <AppHeader>
          <div className="flex items-center gap-1">
            <Link href="/start" className="flex min-h-11 items-center px-3 font-bold text-cream">כניסה</Link>
            <Link href="/join" className="flex min-h-11 items-center rounded-xl bg-amber px-4 font-bold text-navy">
              הצטרפות עסקים
            </Link>
          </div>
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
