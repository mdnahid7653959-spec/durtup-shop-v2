import { memo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap, MoreHorizontal } from "lucide-react";

interface CategoryShortcut {
  name: string;
  href: string;
  image: string;
  bgGradient: string;
  border: string;
}

// 8 Real Categories matching the actual database & supplier catalog of Durtup.shop
const QUICK_CATEGORIES: CategoryShortcut[] = [
  {
    name: "Gadgets",
    href: "/products?category=Gadgets%20%26%20Electronics",
    image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=200&h=200&fit=crop",
    bgGradient: "from-blue-50 to-indigo-50/60",
    border: "border-blue-100 dark:border-blue-900/30",
  },
  {
    name: "Smart Watch",
    href: "/products?category=Watch",
    image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=200&h=200&fit=crop",
    bgGradient: "from-amber-50 to-orange-50/60",
    border: "border-amber-100 dark:border-amber-900/30",
  },
  {
    name: "Men's Wear",
    href: "/products?category=Men's%20Fashion",
    image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=200&h=200&fit=crop",
    bgGradient: "from-sky-50 to-blue-50/60",
    border: "border-sky-100 dark:border-sky-900/30",
  },
  {
    name: "Women's Wear",
    href: "/products?category=Women's%20Fashion",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200&h=200&fit=crop",
    bgGradient: "from-rose-50 to-pink-50/60",
    border: "border-rose-100 dark:border-rose-900/30",
  },
  {
    name: "Home Living",
    href: "/products?category=Home%20%26%20Lifestyle",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=200&fit=crop",
    bgGradient: "from-emerald-50 to-teal-50/50",
    border: "border-emerald-100 dark:border-emerald-900/30",
  },
  {
    name: "Pure Foods",
    href: "/products?category=Foods",
    image: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=200&h=200&fit=crop",
    bgGradient: "from-amber-50 to-yellow-50/60",
    border: "border-amber-100 dark:border-amber-900/30",
  },
  {
    name: "Kids Zone",
    href: "/products?category=Kids%20Zone",
    image: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=200&h=200&fit=crop",
    bgGradient: "from-purple-50 to-indigo-50/60",
    border: "border-purple-100 dark:border-purple-900/30",
  },
  {
    name: "More",
    href: "/categories",
    image: "",
    bgGradient: "from-slate-50 to-zinc-50",
    border: "border-slate-200/80 dark:border-slate-800/50",
  },
];

function FlashSaleSectionComponent() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 45,
    seconds: 18,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          return { hours: 2, minutes: 45, seconds: 18 };
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNum = (n: number) => n.toString().padStart(2, "0");

  return (
    <section className="w-full px-3 sm:px-4 py-2 sm:py-3">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4">
        
        {/* Flash Sale Banner Strip */}
        <div className="w-full bg-[#fff4ee] dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-900/40 rounded-2xl px-3 sm:px-4 py-2.5 flex items-center justify-between shadow-2xs">
          
          {/* Flash Sale Title */}
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-600 fill-orange-600 animate-pulse" />
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
              Flash Sale
            </h3>
          </div>

          {/* Live Countdown Timer */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
              Ends in
            </span>
            <div className="flex items-center gap-1">
              <span className="min-w-[22px] h-[22px] rounded-md bg-orange-600 text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                {formatNum(timeLeft.hours)}
              </span>
              <span className="text-orange-600 font-black">:</span>
              <span className="min-w-[22px] h-[22px] rounded-md bg-orange-600 text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                {formatNum(timeLeft.minutes)}
              </span>
              <span className="text-orange-600 font-black">:</span>
              <span className="min-w-[22px] h-[22px] rounded-md bg-orange-600 text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                {formatNum(timeLeft.seconds)}
              </span>
            </div>
          </div>

          {/* View All Link */}
          <Link
            to="/products?filter=flash-sale"
            className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 transition-colors"
          >
            View All →
          </Link>
        </div>

        {/* 8 Quick Category Shortcut Cards (2 rows of 4 on mobile, 8 in a row on desktop) */}
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3">
          {QUICK_CATEGORIES.map((cat) => {
            const isMore = cat.name === "More";
            return (
              <Link
                key={cat.name}
                to={cat.href}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                {/* Rounded Square Category Box */}
                <div
                  className={`w-full aspect-square max-w-[76px] sm:max-w-[88px] rounded-2xl bg-gradient-to-b ${cat.bgGradient} dark:bg-slate-800/80 border ${cat.border} p-1.5 sm:p-2 flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:scale-105 group-hover:shadow-md active:scale-95 shadow-2xs`}
                >
                  {isMore ? (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-200/70 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      <MoreHorizontal className="w-5 h-5" />
                    </div>
                  ) : (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </div>

                {/* Category Label */}
                <span className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 text-center line-clamp-1 group-hover:text-orange-600 transition-colors leading-tight">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export const FlashSaleSection = memo(FlashSaleSectionComponent);
