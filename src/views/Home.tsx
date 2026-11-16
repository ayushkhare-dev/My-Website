import { useMemo } from "react";
import { createStore } from "../lib/store";
import type { Product } from "../lib/types";
import { Hero } from "../components/Hero";
import { OfferStrip } from "../components/OfferStrip";
import { Marquee } from "../components/Marquee";
import { CategoryShowcase } from "../components/CategoryShowcase";
import { FlashSale } from "../components/FlashSale";
import { DiscoverReveal } from "../components/DiscoverReveal";
import { FirstProduct } from "../components/FirstProduct";
import { StickyReveal } from "../components/StickyReveal";
import { HorizontalShowcase } from "../components/HorizontalShowcase";
import { WhyNova } from "../components/WhyNova";
import { StatsCounters } from "../components/StatsCounters";
import { Testimonials } from "../components/Testimonials";
import { BrandStory } from "../components/BrandStory";
import { Journal } from "../components/Journal";
import { NewsletterSignup } from "../components/NewsletterSignup";
import { CTASection } from "../components/CTASection";

const useProducts = createStore<Product>("products");

export function Home() {
  const { items: products, loading } = useProducts();
  const arrivals = useMemo(() => products.filter((p) => p.isNew).slice(0, 8), [products]);
  const trending = useMemo(() => products.filter((p) => p.featured || p.isBestSeller).slice(0, 8), [products]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-2xl bg-(--color-accent-soft) animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-20 sm:space-y-24">
      <Hero />

      <OfferStrip />

      <DiscoverReveal products={arrivals.length ? arrivals : products.slice(0, 8)} />

      <FirstProduct product={(trending[0] || products[0])!} />

      <HorizontalShowcase products={arrivals.length ? arrivals : products.slice(0, 8)} />

      <CategoryShowcase products={products} />

      <StickyReveal products={trending.length ? trending : products} />

      <FlashSale products={products} />

      <div className="-mx-4 sm:-mx-6 lg:-mx-8 border-y border-(--color-border) flex flex-col">
        <Marquee text="nextgenify © free shipping © new drop ©" />
        <Marquee text="nextgenify © 30 day returns © secure checkout ©" reverse />
      </div>

      <WhyNova />

      <StatsCounters />

      <BrandStory />

      <Testimonials />

      <Journal />

      <NewsletterSignup />

      <CTASection />
    </div>
  );
}
