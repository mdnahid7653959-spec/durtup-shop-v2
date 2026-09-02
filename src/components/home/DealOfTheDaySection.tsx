import { memo, useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { getSmartProductImage } from "@/utils/productImageHelper";
import { type Product } from "@/components/products/ProductCard";

interface DealOfTheDayProps {
  products?: Product[];
}

function ProductDealCard({
  product,
  idx,
  isDraggingRef,
}: {
  product: Product;
  idx: number;
  isDraggingRef: React.MutableRefObject<boolean>;
}) {
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

  const handleClick = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="w-[130px] xs:w-[145px] sm:w-[170px] md:w-[200px] shrink-0 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-0.5 hover:border-orange-300 dark:hover:border-orange-500/40 transition-all duration-200 flex flex-col justify-between p-1.5 sm:p-2.5 relative group/card shadow-2xs select-none">
      <Link
        to={`/product/${product.slug || product.id}`}
        state={{ preloadedProduct: product }}
        onClick={handleClick}
        draggable={false}
        className="block h-full flex flex-col justify-between"
      >
        <div>
          {/* Discount Badge */}
          <div className="absolute top-1.5 left-1.5 z-10 pointer-events-none">
            <span className="bg-[#ff3b30] text-white text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs">
              -{discount}%
            </span>
          </div>

          {/* Product Image Container */}
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 mb-1 flex items-center justify-center p-1 pointer-events-none">
            <img
              src={displayImage}
              alt={product.name}
              draggable={false}
              className="w-full h-full object-contain filter drop-shadow-xs group-hover/card:scale-108 transition-transform duration-300 pointer-events-none select-none"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                (e.target as HTMLImageElement).src = getSmartProductImage(product.name, "", "");
              }}
            />
          </div>

          {/* Product Title */}
          <h3 className="font-bold text-[10px] sm:text-xs md:text-sm text-slate-900 dark:text-slate-100 line-clamp-1 mb-0.5 group-hover/card:text-orange-600 transition-colors pointer-events-none">
            {product.name}
          </h3>

          {/* 5-Star Rating & Reviews */}
          <div className="flex items-center gap-0.5 sm:gap-1 mb-1 pointer-events-none">
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
        <div className="flex items-baseline gap-1.5 mt-auto pt-1 pointer-events-none">
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

interface DealRowProps {
  items: Product[];
  direction: "left" | "right";
  speed?: number; // pixels per second
  onInteract: (active: boolean) => void;
  isPaused: boolean;
  rowId: string;
}

function DealRow({
  items,
  direction,
  speed = 40,
  onInteract,
  isPaused,
  rowId,
}: DealRowProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const isMouseDownRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startScrollLeftRef = useRef<number>(0);
  const dragDistRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const scrollPosRef = useRef<number>(0);

  // Set initial scroll position for right-moving track so it can scroll backwards seamlessly
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const setInitialPos = () => {
      const singleSetWidth = el.scrollWidth / 3;
      if (singleSetWidth > 10) {
        if (direction === "right" && el.scrollLeft < 5) {
          el.scrollLeft = singleSetWidth;
          scrollPosRef.current = singleSetWidth;
        } else if (direction === "left" && el.scrollLeft === 0) {
          scrollPosRef.current = el.scrollLeft;
        }
      }
    };

    setInitialPos();
    const timer = setTimeout(setInitialPos, 150);
    return () => clearTimeout(timer);
  }, [direction, items]);

  // RequestAnimationFrame Infinite Auto-Scroll Loop
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    lastTimeRef.current = performance.now();
    scrollPosRef.current = el.scrollLeft;

    const step = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      if (!isPaused && el) {
        const singleSetWidth = el.scrollWidth / 3;
        if (singleSetWidth > 20) {
          const delta = speed * dt;

          if (direction === "left") {
            scrollPosRef.current += delta;
            if (scrollPosRef.current >= singleSetWidth * 2) {
              scrollPosRef.current -= singleSetWidth;
            }
          } else {
            scrollPosRef.current -= delta;
            if (scrollPosRef.current <= singleSetWidth * 0.1) {
              scrollPosRef.current += singleSetWidth;
            }
          }

          el.scrollLeft = scrollPosRef.current;
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [direction, speed, isPaused]);

  // Infinite Wrap handling for manual scroll / touch swipe
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const singleSetWidth = el.scrollWidth / 3;
    if (singleSetWidth <= 20) return;

    if (el.scrollLeft >= singleSetWidth * 2) {
      el.scrollLeft -= singleSetWidth;
      scrollPosRef.current = el.scrollLeft;
      if (isMouseDownRef.current) {
        startScrollLeftRef.current -= singleSetWidth;
      }
    } else if (el.scrollLeft <= singleSetWidth * 0.1) {
      el.scrollLeft += singleSetWidth;
      scrollPosRef.current = el.scrollLeft;
      if (isMouseDownRef.current) {
        startScrollLeftRef.current += singleSetWidth;
      }
    } else {
      scrollPosRef.current = el.scrollLeft;
    }
  }, []);

  // Mouse Drag Events (Desktop)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    isMouseDownRef.current = true;
    startXRef.current = e.clientX;
    const el = containerRef.current;
    startScrollLeftRef.current = el ? el.scrollLeft : 0;
    dragDistRef.current = 0;
    isDraggingRef.current = false;
    onInteract(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current || !containerRef.current) return;
    const dx = e.clientX - startXRef.current;
    dragDistRef.current = Math.abs(dx);
    if (dragDistRef.current > 6) {
      isDraggingRef.current = true;
    }
    const targetScroll = startScrollLeftRef.current - dx;
    containerRef.current.scrollLeft = targetScroll;
    scrollPosRef.current = targetScroll;
  };

  const handleMouseUp = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 50);
      onInteract(false);
    }
  };

  const handleMouseLeave = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 50);
    }
    onInteract(false);
  };

  // Touch Events (Mobile)
  const handleTouchStart = () => {
    onInteract(true);
    isDraggingRef.current = false;
  };

  const handleTouchMove = () => {
    isDraggingRef.current = true;
  };

  const handleTouchEnd = () => {
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
    onInteract(false);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseEnter={(e) => {
        // Only pause on real mouse hover (not on touch simulation)
        if (e.currentTarget.matches(":hover")) {
          onInteract(true);
        }
      }}
      className="relative overflow-x-auto overflow-y-hidden w-full cursor-grab active:cursor-grabbing select-none no-scrollbar touch-pan-x"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div className="flex w-max gap-1.5 sm:gap-2.5 md:gap-3 py-1">
        {items.map((product, idx) => (
          <ProductDealCard
            key={`${rowId}-${product.id}-${idx}`}
            product={product}
            idx={idx}
            isDraggingRef={isDraggingRef}
          />
        ))}
      </div>
    </div>
  );
}

function DealOfTheDayComponent({ products = [] }: DealOfTheDayProps) {
  const [isInteracting, setIsInteracting] = useState(false);
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInteract = useCallback((active: boolean) => {
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current);
    }

    if (active) {
      setIsInteracting(true);
    } else {
      // Immediately resume auto-scrolling when finger/mouse is lifted
      interactionTimerRef.current = setTimeout(() => {
        setIsInteracting(false);
      }, 30);
    }
  }, []);

  // Split and format products into 2 distinct continuous rows with triple-buffer
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

    // Split into 2 alternating rows for diversity
    const r1: Product[] = [];
    const r2: Product[] = [];

    items.forEach((item, i) => {
      if (i % 2 === 0) {
        r1.push(item);
      } else {
        r2.push(item);
      }
    });

    const ensureBuffer = (arr: Product[]) => {
      if (arr.length === 0) return [];
      let result = [...arr];
      while (result.length < 8) {
        result = [...result, ...arr];
      }
      return result;
    };

    const baseR1 = ensureBuffer(r1);
    const baseR2 = ensureBuffer(r2.length > 0 ? r2 : r1);

    // Tripled buffer ensures seamless infinite scroll in both left & right directions
    return {
      row1: [...baseR1, ...baseR1, ...baseR1],
      row2: [...baseR2, ...baseR2, ...baseR2],
    };
  }, [products]);

  if (row1.length === 0 && row2.length === 0) return null;

  return (
    <section className="w-full px-2 sm:px-4 py-2 sm:py-3 overflow-hidden">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header with Title and View All (Play/Pause button removed) */}
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

          <div>
            {/* View All Link */}
            <Link
              to="/products?filter=deals"
              className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 transition-colors shrink-0"
            >
              View All →
            </Link>
          </div>
        </div>

        {/* 2 Continuous Dual-Direction Auto-Running & Interactive Rows Container */}
        <div className="deal-marquee-wrapper relative overflow-hidden py-1 space-y-2 sm:space-y-3 rounded-2xl bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-900/40 p-1 sm:p-2 border border-slate-100 dark:border-slate-800/80">
          {/* Row 1: Auto-Scroll to the Left ← & Interactive Swipe */}
          <DealRow
            rowId="row1"
            items={row1}
            direction="left"
            speed={40}
            isPaused={isInteracting}
            onInteract={handleInteract}
          />

          {/* Row 2: Auto-Scroll to the Right → & Interactive Swipe */}
          <DealRow
            rowId="row2"
            items={row2}
            direction="right"
            speed={40}
            isPaused={isInteracting}
            onInteract={handleInteract}
          />
        </div>
      </div>
    </section>
  );
}

export const DealOfTheDaySection = memo(DealOfTheDayComponent);
