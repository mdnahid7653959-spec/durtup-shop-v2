import { memo } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid } from "lucide-react";

interface CategoryShortcut {
  name: string;
  bangla: string;
  href: string;
  image?: string;
  isAll?: boolean;
  borderRadius: string;
}

// 8 Real Categories with realistic 3D water droplet morphology & crystal-clear product visuals
const QUICK_CATEGORIES: CategoryShortcut[] = [
  {
    name: "Gadgets",
    bangla: "ইলেকট্রনিক্স",
    href: "/products?category=Gadgets%20%26%20Electronics",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=300&fit=crop",
    borderRadius: "46% 54% 63% 37% / 43% 49% 51% 57%",
  },
  {
    name: "Smart Watch",
    bangla: "স্মার্ট ওয়াচ",
    href: "/products?category=Watch",
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=240&h=240&fit=crop",
    borderRadius: "55% 45% 42% 58% / 51% 57% 43% 49%",
  },
  {
    name: "Men's Wear",
    bangla: "পুরুষদের পোশাক",
    href: "/products?category=Men's%20Fashion",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=240&h=240&fit=crop",
    borderRadius: "43% 57% 52% 48% / 56% 44% 56% 44%",
  },
  {
    name: "Women's Wear",
    bangla: "শাড়ি ও ড্রেস",
    href: "/products?category=Women's%20Fashion",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=240&h=240&fit=crop",
    borderRadius: "51% 49% 42% 58% / 46% 54% 46% 54%",
  },
  {
    name: "Home Living",
    bangla: "হোম অ্যাপ্লায়েন্স",
    href: "/products?category=Home%20%26%20Lifestyle",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=240&h=240&fit=crop",
    borderRadius: "49% 51% 59% 41% / 45% 49% 51% 55%",
  },
  {
    name: "Pure Foods",
    bangla: "খাবার ও মধু",
    href: "/products?category=Foods",
    image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=300&h=300&fit=crop",
    borderRadius: "57% 43% 49% 51% / 53% 59% 41% 47%",
  },
  {
    name: "Kids Zone",
    bangla: "বাচ্চাদের খেলনা",
    href: "/products?category=Kids%20Zone",
    image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=240&h=240&fit=crop",
    borderRadius: "45% 55% 53% 47% / 49% 45% 55% 51%",
  },
  {
    name: "All Categories",
    bangla: "সব ক্যাটাগরি",
    href: "/categories",
    isAll: true,
    borderRadius: "50% 50% 50% 50% / 50% 50% 50% 50%",
  },
];

function FlashSaleSectionComponent() {
  return (
    <section className="w-full px-2 sm:px-4 py-2 sm:py-3">
      <div className="max-w-7xl mx-auto space-y-2.5 sm:space-y-3">
        
        {/* Categories Header */}
        <div className="flex items-center justify-between px-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 sm:h-5 bg-orange-500 rounded-full inline-block" />
              <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Shop by Category
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 pl-3.5 mt-0.5 font-medium">
              Explore all product categories
            </p>
          </div>

          {/* View All Link */}
          <Link
            to="/categories"
            className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 transition-colors shrink-0"
          >
            View All →
          </Link>
        </div>

        {/* 8 Quick Category Shortcut Cards styled as 3D Water Droplets */}
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3">
          {QUICK_CATEGORIES.map((cat) => {
            return (
              <Link
                key={cat.name}
                to={cat.href}
                className="flex flex-col items-center group cursor-pointer"
              >
                {/* 3D Liquid Water Droplet Container */}
                <div
                  className="w-full aspect-square max-w-[76px] sm:max-w-[88px] relative flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1 active:scale-95"
                  style={{
                    borderRadius: cat.borderRadius,
                    boxShadow: `
                      4px 8px 16px -2px rgba(0, 35, 70, 0.22),
                      2px 4px 6px -1px rgba(0, 35, 70, 0.12),
                      inset 2px 2px 4px rgba(255, 255, 255, 0.95),
                      inset -2px -2px 5px rgba(0, 0, 0, 0.18)
                    `,
                    border: "1.5px solid rgba(255, 255, 255, 0.9)",
                    background: "rgba(255, 255, 255, 0.7)",
                    overflow: "hidden",
                  }}
                >
                  {/* Inside Content */}
                  {cat.isAll ? (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white flex flex-col items-center justify-center p-2">
                      <LayoutGrid className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                      <span className="text-[8px] font-black tracking-widest text-orange-400 mt-0.5">ALL</span>
                    </div>
                  ) : (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-115"
                      loading="lazy"
                      decoding="async"
                    />
                  )}

                  {/* Water Droplet Specular Glass Dome Highlights */}
                  <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: "inherit" }}>
                    {/* Primary Oval Sunlight Glare */}
                    <span
                      className="absolute top-1.5 left-2 w-4 h-2 bg-white rounded-full opacity-90 -rotate-40 blur-[0.3px]"
                      style={{ filter: "drop-shadow(0 0 1px white)" }}
                    />
                    
                    {/* Secondary Pin Point Glare */}
                    <span
                      className="absolute top-3.5 left-1.5 w-1 h-1 bg-white rounded-full opacity-80"
                    />

                    {/* Bottom-Right Caustic Liquid Rim */}
                    <span
                      className="absolute bottom-1 right-1.5 w-3.5 h-1.5 bg-white/50 rounded-full rotate-45 blur-[0.6px]"
                    />
                  </div>
                </div>

                {/* English Category Label */}
                <span className="text-[11px] sm:text-xs font-black text-slate-800 dark:text-slate-200 text-center line-clamp-1 group-hover:text-orange-600 transition-colors mt-1.5 leading-tight">
                  {cat.name}
                </span>

                {/* Bangla Category Label */}
                <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 dark:text-slate-400 text-center line-clamp-1 leading-none mt-0.5">
                  {cat.bangla}
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
