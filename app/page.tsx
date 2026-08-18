import Header from "@/components/layout/Header";
import Hero from "@/components/hero/Hero";
import WhyAscend from "@/components/home/WhyAscend";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <Header />

      <main className="bg-white text-neutral-900">
        <Hero />
        <WhyAscend />
      </main>

      <Footer />
    </>
  );
}
