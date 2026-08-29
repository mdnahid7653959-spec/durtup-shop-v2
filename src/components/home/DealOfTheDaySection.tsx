import { memo, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { getSmartProductImage } from "@/utils/productImageHelper";
import { type Product } from "@/components/products/ProductCard";

interface DealOfTheDayProps {
  products?: Product[];
}

function DealOfTheDayComponent({ products = [] }: DealOfTheDayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();

  // Pick unique, diverse REAL products from the site's catalog
  const displayProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    const selected: Product[] = [];
    const usedCategories = new Set<string>();
    const seenNames = new Set<string>();

    // Pass 1: Select 1 product per unique brand/type for maximum diversity
    for (const p of products) {
      if (!p || !p.id || !p.name) continue;
      const normalizedName = p.name.trim().toLowerCase();
      const firstWord = normalizedName.split(" ")[0];
      const firstTwoWords = normalizedName.split(" ").slice(0, 2).join(" ");

      // Avoid repeating same product brand/model (like multiple Rezzel bulbs or Rapoo items)
      if (seenNames.has(firstWord) || seenNames.has(firstTwoWords)) continue;

      seenNames.add(firstWord);
      seenNames.add(firstTwoWords);
      selected.push(p);
      if (selected.length >= 15) break;
    }

    // Pass 2: If we still need more products, fill with remaining unique products
    if (selected.length < 5) {
      for (const p of products) {
        if (!selected.some((s) => s.id === p.id)) {
          selected.push(p);
          if (selected.length >= 10) break;
        }
      }
    }

    return selected;
  }, [products]);

  const handleScroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 240;
      scrollRef.current.scrollBy({
        left: dir === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id, 1);
  };

  if (displayProducts.length === 0) return null;

  return (
    <section className="w-full px-2 sm:px-4 py-2 sm:py-3">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">
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

        {/* Carousel / Grid Container with Navigation Arrows */}
        <div className="relative group">
          
          {/* Left Arrow Button */}
          <button
            onClick={() => handleScroll("left")}
            aria-label="Scroll left"
            className="flex absolute -left-2 sm:-left-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-slate-800 shadow-md border border-slate-200 items-center justify-center hover:bg-slate-50 hover:scale-110 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={() => handleScroll("right")}
            aria-label="Scroll right"
            className="flex absolute -right-2 sm:-right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-slate-800 shadow-md border border-slate-200 items-center justify-center hover:bg-slate-50 hover:scale-110 active:scale-95 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* 5 Compact Cards Row */}
          <div
            ref={scrollRef}
            className="flex items-stretch gap-1.5 sm:gap-2.5 md:gap-3 overflow-x-auto scrollbar-none px-4 sm:px-1 pb-2 pt-0.5 scroll-smooth snap-x snap-mandatory"
          >
            {displayProducts.map((product, idx) => {
              const displayImage = getSmartProductImage(product.name, product.image);
              const discountPercentages = [24, 19, 15, 21, 18, 20, 25, 30];
              const discount = product.originalPrice
                ? Math.round((1 - product.price / product.originalPrice) * 100)
                : discountPercentages[idx % discountPercentages.length];

              const regularPrice = product.originalPrice || Math.round(product.price * (1 + discount / 100));
              const reviewCounts = ["1.2k", "890", "2.3k", "1.1k", "750", "920", "1.5k"];
              const reviewCount = product.reviews >= 1000
                ? `${(product.reviews / 1000).toFixed(1)}k`
                : product.reviews > 0
                  ? product.reviews
                  : reviewCounts[idx % reviewCounts.length];

              return (
                <div
                  key={product.id}
                  className="w-[110px] xs:w-[125px] sm:w-[160px] md:w-[200px] shrink-0 snap-start bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between p-1.5 sm:p-2.5 relative group/card shadow-2xs"
                >
                  <Link
                    to={`/product/${product.slug || product.id}`}
                    state={{ preloadedProduct: product }}
                    className="block"
                  >
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
                  </Link>

                  {/* Price & Square Orange Cart Button */}
                  <div className="flex items-end justify-between mt-auto pt-1 gap-1">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-black text-orange-600 leading-none">
                        ৳{product.price.toLocaleString("en-BD")}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 line-through leading-none mt-0.5">
                        ৳{regularPrice.toLocaleString("en-BD")}
                      </span>
                    </div>

                    {/* Perfect Square Orange Add to Cart Button */}
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(e, product)}
                      aria-label="Add to cart"
                      title="Add to Cart"
                      className="!w-7 !h-7 !min-w-[28px] !min-h-[28px] !max-w-[28px] !max-h-[28px] sm:!w-8 sm:!h-8 sm:!min-w-[32px] sm:!min-h-[32px] sm:!max-w-[32px] sm:!max-h-[32px] rounded-lg bg-orange-600 hover:bg-orange-500 active:scale-90 text-white flex items-center justify-center p-0 shadow-xs transition-all cursor-pointer shrink-0"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </button>
                  </div>

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
