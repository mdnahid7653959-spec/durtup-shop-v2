import { memo, lazy, Suspense, useEffect, useState, useRef, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroBanner } from "@/components/home/HeroBanner";
import { TrustBadges } from "@/components/home/TrustBadges";
import { FlashSaleSection } from "@/components/home/FlashSaleSection";
import { DealOfTheDaySection } from "@/components/home/DealOfTheDaySection";
import { PopularCategoriesSection } from "@/components/home/PopularCategoriesSection";
import { PromoBanners } from "@/components/home/PromoBanners";
import { useHomeProducts } from "@/hooks/useHomeProducts";
import { useCJSettings } from "@/hooks/useCJSettings";
import { useLayoutConfig, useCustomSections, defaultSections, SectionConfig } from "@/hooks/useLayoutConfig";
import { ProductSection } from "@/components/home/ProductSection";
import { PersonalizedFeed } from "@/components/home/PersonalizedFeed";
import { Flame, Sparkles, TrendingUp, ThumbsUp, Clock } from "lucide-react";
import { InfiniteProductFeed } from "@/components/home/InfiniteProductFeed";
import { HomeMidBanner } from "@/components/home/HomeMidBanner";
import { SEOHead } from "@/components/SEOHead";


const CJTrendingProducts = lazy(() => import("@/components/home/CJTrendingProducts").then(m => ({ default: m.CJTrendingProducts })));
const RecentlyViewedSection = lazy(() => import("@/components/home/RecentlyViewedSection"));

const MemoizedHeroBanner = memo(HeroBanner);
const MemoizedPromoBanners = memo(PromoBanners);

const SectionSkeleton = () => (
  <div className="py-3 sm:py-5">
    <div className="bg-card border rounded-2xl p-3 sm:p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-muted skeleton-shimmer" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-muted rounded-lg w-32 skeleton-shimmer" />
          <div className="h-3 bg-muted rounded-lg w-24 skeleton-shimmer" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i}>
            <div className="aspect-square bg-muted rounded-xl mb-2 skeleton-shimmer" />
            <div className="h-3 bg-muted rounded w-full mb-1.5 skeleton-shimmer" />
            <div className="h-3 bg-muted rounded w-2/3 skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

function useInView(ref: React.RefObject<Element>, options?: IntersectionObserverInit) {
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setIsInView(true); observer.disconnect(); }
      },
      { rootMargin: "200px", ...options }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, options]);
  return isInView;
}

// Build inline style from section style config
function getSectionStyle(section: SectionConfig): React.CSSProperties {
  const s = section.style;
  if (!s) return {};
  const style: React.CSSProperties = {};
  if (s.padding) style.padding = s.padding;
  if (s.margin) style.margin = s.margin;
  if (s.backgroundColor) style.backgroundColor = s.backgroundColor;
  if (s.textColor) style.color = s.textColor;
  if (s.borderRadius) style.borderRadius = s.borderRadius;
  if (s.shadow) style.boxShadow = s.shadow;
  return style;
}

// Custom section renderer for admin-created blocks
function CustomSectionBlock({ config, type }: { config: Record<string, unknown>; type: string }) {
  if (type === "banner" || type === "image_cta") {
    return (
      <div className="relative rounded-xl overflow-hidden" style={{ minHeight: 120 }}>
        {config.imageUrl && (
          <img src={config.imageUrl as string} alt={config.title as string || ""} className="w-full h-auto object-cover" />
        )}
        {(config.title || config.buttonText) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 text-white p-4">
            {config.title && <h3 className="text-lg font-bold">{config.title as string}</h3>}
            {config.subtitle && <p className="text-sm mt-1">{config.subtitle as string}</p>}
            {config.buttonText && config.buttonLink && (
              <a href={config.buttonLink as string} className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                {config.buttonText as string}
              </a>
            )}
          </div>
        )}
      </div>
    );
  }
  if (type === "text" || type === "html") {
    return (
      <div className="bg-card border rounded-xl p-4" dangerouslySetInnerHTML={{ __html: (config.html as string) || (config.text as string) || "" }} />
    );
  }
  return null;
}

// Section renderer
function SectionRenderer({
  section,
  data,
  isLoading,
  showCJProducts,
  cjSectionRef,
  cjInView,
  customSectionsMap,
}: {
  section: SectionConfig;
  data: any;
  isLoading: boolean;
  showCJProducts: boolean;
  cjSectionRef: React.RefObject<HTMLElement>;
  cjInView: boolean;
  customSectionsMap: Record<string, { type: string; config: Record<string, unknown> }>;
}) {
  if (!section.visible) return null;

  const sectionStyle = getSectionStyle(section);

  // Custom section
  if (section.id.startsWith("custom_") && section.customSectionId) {
    const custom = customSectionsMap[section.customSectionId];
    if (!custom) return null;
    return (
      <section className="w-full px-3 sm:px-4" style={sectionStyle}>
        <div className="max-w-7xl mx-auto">
          <CustomSectionBlock config={custom.config} type={custom.type} />
        </div>
      </section>
    );
  }

  switch (section.id) {
    case "hero_banner":
      return (
        <section className="w-full px-3 sm:px-4 py-3 sm:py-5" style={sectionStyle}>
          <div className="max-w-7xl mx-auto">
            <HeroBento
              forYou={data?.recommended}
              flashSale={data?.flashSale}
              trending={data?.trending}
            />
          </div>
        </section>
      );

    case "recently_viewed":
      return null;


    case "latest_products":
      return (
        <section className="w-full px-3 sm:px-4" style={sectionStyle}>
          <div className="max-w-7xl mx-auto">
            {isLoading ? <SectionSkeleton /> : data?.latestProducts?.length > 0 ? (
              <ProductSection
                title="Just Added" subtitle="Fresh products"
                products={data.latestProducts} viewAllLink="/products?sort=newest"
                icon={Clock} iconBgColor="bg-gradient-to-br from-blue-500 to-cyan-500" iconColor="text-white"
              />
            ) : null}
          </div>
        </section>
      );

    case "flash_sale":
      return (
        <section className="w-full px-3 sm:px-4" style={sectionStyle}>
          <div className="max-w-7xl mx-auto">
            {isLoading ? <SectionSkeleton /> : data?.flashSale?.length > 0 ? (
              <FlashSaleSection products={data.flashSale} />
            ) : null}
          </div>
        </section>
      );

    case "featured":
      return (
        <section className="w-full px-3 sm:px-4" style={sectionStyle}>
          <div className="max-w-7xl mx-auto">
            {isLoading ? <SectionSkeleton /> : data?.featured?.length > 0 ? (
              <ProductSection
                title="Best Deals" subtitle="Amazing discounts"
                products={data.featured} viewAllLink="/products?filter=featured"
                icon={Flame} iconBgColor="bg-gradient-to-br from-orange-500 to-red-500" iconColor="text-white"
              />
            ) : null}
          </div>
        </section>
      );

    case "cj_trending":
      if (!showCJProducts) return null;
      return (
        <section ref={cjSectionRef} className="w-full px-3 sm:px-4" style={sectionStyle}>
          <div className="max-w-7xl mx-auto">
            {cjInView && (
              <Suspense fallback={<SectionSkeleton />}><CJTrendingProducts /></Suspense>
            )}
          </div>
        </section>
      );

    case "trending":
      return (
        <section className="w-full px-3 sm:px-4" style={sectionStyle}>
          <div className="max-w-7xl mx-auto">
            {isLoading ? <SectionSkeleton /> : data?.trending?.length > 0 ? (
              <ProductSection
                title="Trending" subtitle="Popular this week"
                products={data.trending} viewAllLink="/products?sort=trending"
                icon={TrendingUp} iconBgColor="bg-gradient-to-br from-amber-500 to-orange-500" iconColor="text-white"
              />
            ) : null}
          </div>
        </section>
      );

    case "new_arrivals":
      return (
        <section className="w-full px-3 sm:px-4" style={sectionStyle}>
          <div className="max-w-7xl mx-auto">
            {isLoading ? <SectionSkeleton /> : data?.newArrivals?.length > 0 ? (
              <ProductSection
                title="New Arrivals" subtitle="Fresh in store"
                products={data.newArrivals} viewAllLink="/products?filter=new"
                icon={Sparkles} iconBgColor="bg-gradient-to-br from-green-500 to-emerald-500" iconColor="text-white"
              />
            ) : null}
          </div>
        </section>
      );

    case "recommended":
      return (
        <section className="w-full px-3 sm:px-4 pb-4" style={sectionStyle}>
          <div className="max-w-7xl mx-auto">
            {isLoading ? <SectionSkeleton /> : data?.recommended?.length > 0 ? (
              <ProductSection
                title="For You" subtitle="Based on interests"
                products={data.recommended} viewAllLink="/products"
                icon={ThumbsUp} iconBgColor="bg-gradient-to-br from-violet-500 to-purple-500" iconColor="text-white"
              />
            ) : null}
          </div>
        </section>
      );

    case "promo_banners":
      return null;

    default:
      return null;
  }
}

const Index = () => {
  const { data, isLoading, isError } = useHomeProducts();

  // Combine products for Deal of the Day across full multi-supplier catalog (2,000+ items streaming)
  const dealProducts = useMemo(() => {
    if (data?.dealProducts && data.dealProducts.length > 0) {
      return data.dealProducts;
    }
    if (data?.allProducts && data.allProducts.length > 0) {
      return data.allProducts;
    }
    return [
      ...(data?.trending || []),
      ...(data?.featured || []),
      ...(data?.flashSale || []),
      ...(data?.latestProducts || []),
      ...(data?.recommended || []),
    ];
  }, [data]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Durtup.shop - পছন্দের পণ্য খুঁজে নিন | অনলাইন শপিং বাংলাদেশ"
        description="পছন্দের পণ্য খুঁজে নিন Durtup.shop-এ। গ্যাজেট, ইলেকট্রনিক্স, ফ্যাশন, হোম ও আরও অনেক পণ্য সাশ্রয়ী দামে—সহজ অর্ডার ও নিরাপদ শপিং।"
        url="https://durtup.shop"
        type="website"
      />
      
      {/* 1. Header with Top Notice, Logo, Search & Category Pills */}
      <Header />

      <main className="flex-1 pb-20 md:pb-8 space-y-2 sm:space-y-4">
        {isError && (
          <section className="w-full px-3 sm:px-4 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center py-8 bg-card border rounded-xl">
                <p className="text-muted-foreground">Unable to load products. Please refresh the page.</p>
              </div>
            </div>
          </section>
        )}

        {/* 2. Hero Banner (Sunset Gadget Showcase) */}
        <HeroBanner />

        {/* 3. Trust & Service Feature Strip */}
        <TrustBadges />

        {/* 4. Flash Sale Header + 8 Quick Category Shortcut Cards */}
        <FlashSaleSection />

        {/* 5. Deal of the Day Product Carousel */}
        {isLoading ? (
          <SectionSkeleton />
        ) : (
          <DealOfTheDaySection products={dealProducts} />
        )}

        {/* 6. Popular Categories Showcase (4 Pastel Banners) */}
        <PopularCategoriesSection />

        {/* 7. Just Added / Fresh Products Section */}
        {data?.latestProducts && data.latestProducts.length > 0 && (
          <section className="w-full px-3 sm:px-4">
            <div className="max-w-7xl mx-auto">
              <ProductSection
                title="Just Added"
                subtitle="Fresh products"
                products={data.latestProducts}
                viewAllLink="/products?sort=newest"
                icon={Clock}
                iconBgColor="bg-gradient-to-br from-blue-500 to-cyan-500"
                iconColor="text-white"
              />
            </div>
          </section>
        )}

        {/* Brand Promotional Banner */}
        <HomeMidBanner />

        {/* 8. Endless Automatic Product Feed */}
        <section className="w-full px-3 sm:px-4 pt-2">
          <div className="max-w-7xl mx-auto">
            <InfiniteProductFeed />
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default memo(Index);
