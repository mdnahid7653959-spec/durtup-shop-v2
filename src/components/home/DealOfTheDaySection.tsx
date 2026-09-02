import { memo, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star, Pause, Play } from "lucide-react";
import { getSmartProductImage } from "@/utils/productImageHelper";
import { type Product } from "@/components/products/ProductCard";

interface DealOfTheDayProps {
  products?: Product[];
}

function ProductDealCard({ product, idx }: { product: Product; idx: number }) {
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
    <div className="w-[125px] xs:w-[140px] sm:w-[165px] md:w-[195px] shrink-0 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 hover:border-orange-300 dark:hover:border-orange-500/40 transition-all duration-300 flex flex-col justify-between p-1.5 sm:p-2.5 relative group/card shadow-2xs cursor-pointer select-none">
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
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 mb-1 flex items-center justify-center p-1">
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-full object-contain filter drop-shadow-xs group-hover/card:scale-108 transition-transform duration-300"
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
}

function DealOfTheDayComponent({ products = [] }: DealOfTheDayProps) {
  const [isPaused, setIsPaused] = useState(false);

  // Split and format all incoming API products into 2 distinct continuous rows
  const { row1, row2 } = useMemo(() => {
    if (!products || products.length === 0) return { row1: [], row2: [] };

    // Deduplicate unique products
    const unique: Product[] = [];
    const seen = new Set<string>();

    for (const p of products) {
      if (!p || !p.id || !p.name) continue;
      const key = (p.slug || p.id).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(p);
      }
    }

    const items = unique.length > 0 ? unique : products;

    // Split into 2 alternating rows for optimal diversity
    const r1: Product[] = [];
    const r2: Product[] = [];

    items.forEach((item, i) => {
      if (i % 2 === 0) {
        r1.push(item);
      } else {
        r2.push(item);
      }
    });

    // Ensure adequate buffer length for ultra-smooth 60fps infinite marquee loop
    const ensureBuffer = (arr: Product[]) => {
      if (arr.length === 0) return [];
      let result = [...arr];
      while (result.length < 8) {
        result = [...result, ...arr];
      }
      return result;
    };

    const finalR1 = ensureBuffer(r1);
    const finalR2 = ensureBuffer(r2.length > 0 ? r2 : r1);

    // Quadruple for continuous seamless wrap
    return {
      row1: [...finalR1, ...finalR1],
      row2: [...finalR2, ...finalR2],
    };
  }, [products]);

  if (row1.length === 0 && row2.length === 0) return null;

  return (
    <section className="w-full px-2 sm:px-4 py-2 sm:py-3 overflow-hidden">
      <style>{`
        @keyframes dealMarqueeLeft {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes dealMarqueeRight {
          0% { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .deal-track-1 {
          display: flex;
          width: max-content;
          animation: dealMarqueeLeft 40s linear infinite;
          will-change: transform;
        }
        .deal-track-2 {
          display: flex;
          width: max-content;
          animation: dealMarqueeRight 40s linear infinite;
          will-change: transform;
        }
        .deal-marquee-wrapper:hover .deal-track-1,
        .deal-marquee-wrapper:hover .deal-track-2,
        .deal-track-paused {
          animation-play-state: paused !important;
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header with Title, Pause/Play Toggle & View All */}
        <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 sm:h-5 bg-red-500 rounded-full inline-block" />
              <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Deal of the Day
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 pl-3.5 mt-0.5 font-medium">
              Exclusive daily discounts & special offers • Auto-streaming
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Pause / Resume Button */}
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              className="px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1 hover:bg-slate-100 transition-colors shadow-2xs"
              title={isPaused ? "Resume Auto Scroll" : "Pause Auto Scroll"}
            >
              {isPaused ? <Play className="w-3 h-3 text-emerald-600 fill-current" /> : <Pause className="w-3 h-3 text-amber-600" />}
              <span className="hidden xs:inline">{isPaused ? "Play" : "Pause"}</span>
            </button>

            {/* View All Link */}
            <Link
              to="/products?filter=deals"
              className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 transition-colors shrink-0"
            >
              View All →
            </Link>
          </div>
        </div>

        {/* 2 Continuous Dual-Direction Auto-Running Rows Container */}
        <div className="deal-marquee-wrapper relative overflow-hidden py-1 space-y-2 sm:space-y-3 rounded-2xl bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-900/40 p-1 sm:p-2 border border-slate-100 dark:border-slate-800/80">
          
          {/* Row 1: Smooth Auto-Scroll to the Left ← */}
          <div className="relative overflow-hidden w-full">
            <div className={`deal-track-1 gap-1.5 sm:gap-2.5 md:gap-3 ${isPaused ? "deal-track-paused" : ""}`}>
              {row1.map((product, idx) => (
                <ProductDealCard key={`row1-${product.id}-${idx}`} product={product} idx={idx} />
              ))}
            </div>
          </div>

          {/* Row 2: Smooth Auto-Scroll to the Right → (Opposite Direction) */}
          <div className="relative overflow-hidden w-full">
            <div className={`deal-track-2 gap-1.5 sm:gap-2.5 md:gap-3 ${isPaused ? "deal-track-paused" : ""}`}>
              {row2.map((product, idx) => (
                <ProductDealCard key={`row2-${product.id}-${idx}`} product={product} idx={idx} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export const DealOfTheDaySection = memo(DealOfTheDayComponent);
