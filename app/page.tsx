import Header from "@/components/layout/Header";
import Hero from "@/components/hero/Hero";
import FeaturedCompounds from "@/components/products/FeaturedCompounds";
import WhyAscend from "@/components/home/WhyAscend";

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <FeaturedCompounds />
      <WhyAscend />
    </>
  );
}