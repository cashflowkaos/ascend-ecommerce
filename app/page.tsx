import Header from "@/components/layout/Header";
import { hasStorefrontMemberAccess } from "@/lib/auth";
import Hero from "@/components/hero/Hero";
import WhyAscend from "@/components/home/WhyAscend";
import Footer from "@/components/layout/Footer";

export default async function Home() {
  const memberMode =
    await hasStorefrontMemberAccess();
  return (
    <>
      <Header memberMode={memberMode} />

      <main className="bg-white text-neutral-900">
        <Hero />
        <WhyAscend />
      </main>

      <Footer />
    </>
  );
}
