import { memo, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star, Flame } from "lucide-react";
import { getSmartProductImage } from "@/utils/productImageHelper";
import { type Product } from "@/components/products/ProductCard";

interface DealOfTheDayProps {
  products?: Product[];
}

function DealOfTheDayComponent({ products = [] }: DealOfTheDayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Combine and pick diverse, unique trending products for the 2-row unified grid
  const displayProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    const selected: Product[] = [];
    const seenNames = new Set<string>();

    // Collect unique products by distinct keywords/models
    for (const p of products) {
      if (!p || !p.id || !p.name) continue;
      const normalized = p.name.trim().toLowerCase();
      const firstTwoWords = normalized.split(" ").slice(0, 2).join(" ");
      if (seenNames.has(firstTwoWords)) continue;
      seenNames.add(firstTwoWords);
      selected.push(p);
      if (selected.length >= 24) break;
    }

    // Fill with remaining products to ensure rich 2-row volume
    if (selected.length < 12) {
      for (const p of products) {
        if (!selected.some((s) => s.id === p.id)) {
          selected.push(p);
          if (selected.length >= 20) break;
        }
      }
    }

    return selected;
  }, [products]);

  const handleScroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: dir === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (displayProducts.length === 0) return null;

  return (
    <section className="w-full px-2 sm:px-4 py-2 sm:py-3">
      <div className="max-w-7xl mx-auto">
        {/* Unified Main Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-2.5 px-0.5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Deal of the Day
            </h2>
          </div>
          <Link
            to="/products?filter=deals"
            className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 transition-colors"
          >
            View All →
          </Link>
        </div>

        {/* Unified 2-Row Carousel Container with Left/Right Arrows */}
        <div className="relative group">
          {/* Left Arrow Button */}
          <button
            onClick={() => handleScroll("left")}
            aria-label="Scroll left"
            className="flex absolute -left-1.5 sm:-left-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-slate-800 shadow-md border border-slate-200 items-center justify-center hover:bg-slate-50 hover:scale-110 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={() => handleScroll("right")}
            aria-label="Scroll right"
            className="flex absolute -right-1.5 sm:-right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-slate-800 shadow-md border border-slate-200 items-center justify-center hover:bg-slate-50 hover:scale-110 active:scale-95 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Unified 2-Row Horizontal Swipeable Grid */}
          <div
            ref={scrollRef}
            className="grid grid-rows-2 grid-flow-col auto-cols-[115px] xs:auto-cols-[130px] sm:auto-cols-[165px] md:auto-cols-[200px] gap-1.5 sm:gap-2.5 md:gap-3 overflow-x-auto scrollbar-none px-1 pb-1.5 pt-0.5 scroll-smooth snap-x snap-mandatory"
          >
            {displayProducts.map((product, idx) => {
              const displayImage = getSmartProductImage(product.name, product.image);
              const discountPercentages = [24, 19, 15, 21, 18, 20, 25, 30, 22, 17];
              const discount = product.originalPrice
                ? Math.round((1 - product.price / product.originalPrice) * 100)
                : discountPercentages[idx % discountPercentages.length];

              const regularPrice = product.originalPrice || Math.round(product.price * (1 + discount / 100));
              const reviewCounts = ["1.2k", "890", "2.3k", "1.1k", "750", "920", "1.5k", "640", "1.8k"];
              const reviewCount =
                product.reviews >= 1000
                  ? `${(product.reviews / 1000).toFixed(1)}k`
                  : product.reviews > 0
                    ? product.reviews
                    : reviewCounts[idx % reviewCounts.length];

              return (
                <div
                  key={`${product.id}-${idx}`}
                  className="w-full snap-start bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between p-1.5 sm:p-2.5 relative group/card shadow-2xs"
                >
                  <Link
                    to={`/product/${product.slug || product.id}`}
                    state={{ preloadedProduct: product }}
                    className="block h-full flex flex-col justify-between"
                  >
                    <div>
                      {/* Discount Badge */}
                      <div className="absolute top-1.5 left-1.5 z-10">
                        <span className="bg-[#ff3b30] text-white text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs">
                          -{discount}%
                        </span>
                      </div>

                      {/* Product Image Container */}
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white dark:bg-slate-950 mb-1 flex items-center justify-center p-1">
                        <img
                          src={displayImage}
                          alt={product.name}
                          className="w-full h-full object-contain filter drop-shadow-xs group-hover/card:scale-105 transition-transform duration-300"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getSmartProductImage(product.name, "", "");
                          }}
                        />
                      </div>

                      {/* Product Title */}
                      <h3 className="font-bold text-[10px] sm:text-xs md:text-sm text-slate-900 dark:text-slate-100 line-clamp-1 mb-0.5 group-hover/card:text-orange-600 transition-colors">
                        {product.name}
                      </h3>

                      {/* 5-Star Rating & Reviews */}
                      <div className="flex items-center gap-0.5 sm:gap-1 mb-1">
                        <div className="flex items-center text-amber-400">
                          <Star className="w-2 h-2 sm:w-3 sm:h-3 fill-current" />
                          <Star className="w-2 h-2 sm:w-3 sm:h-3 fill-current" />
                          <Star className="w-2 h-2 sm:w-3 sm:h-3 fill-current" />
                          <Star className="w-2 h-2 sm:w-3 sm:h-3 fill-current" />
                          <Star className="w-2 h-2 sm:w-3 sm:h-3 fill-current" />
                        </div>
                        <span className="text-[8px] sm:text-[10px] text-slate-500 font-medium">
                          ({reviewCount})
                        </span>
                      </div>
                    </div>

                    {/* Price Section */}
                    <div className="flex items-baseline gap-1.5 mt-auto pt-1">
                      <span className="text-xs sm:text-sm font-black text-orange-600 leading-none">
                        ৳{product.price.toLocaleString("en-BD")}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 line-through leading-none">
                        ৳{regularPrice.toLocaleString("en-BD")}
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export const DealOfTheDaySection = memo(DealOfTheDayComponent);
