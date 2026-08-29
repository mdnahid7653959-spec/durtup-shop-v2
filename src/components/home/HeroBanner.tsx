import { memo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function HeroBanner() {
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % 5);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="w-full px-3 sm:px-4 pt-1 sm:pt-3 pb-1">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#e64a19] via-[#f57c00] to-[#ff9800] shadow-md min-h-[190px] sm:min-h-[260px] md:min-h-[300px] lg:min-h-[340px] flex items-center justify-between">
          
          {/* Left Text & CTA Content */}
          <div className="z-10 relative max-w-[55%] sm:max-w-[50%] p-4 sm:p-7 md:p-9 space-y-1.5 sm:space-y-3">
            
            {/* Script Tagline */}
            <p 
              className="text-white/95 text-xs sm:text-base md:text-xl font-serif italic tracking-wide drop-shadow-sm"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              everything you need
            </p>

            {/* Huge Brand Headline */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow-md">
              Durtup.shop
            </h1>

            {/* Subtitle */}
            <p className="text-white/90 text-[10px] sm:text-xs md:text-sm font-medium tracking-normal line-clamp-2">
              Top Deals. Best Prices. Trusted by Millions.
            </p>

            {/* Shop Now CTA Pill Button */}
            <div className="pt-1 sm:pt-2">
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-full bg-white text-slate-900 font-extrabold text-xs sm:text-sm shadow-md hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all group"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

          </div>

          {/* Right 3D Gadgets Composition (Smartphone, Smartwatch, Headphones on Orange Podium) */}
          <div className="z-10 relative w-[45%] sm:w-[50%] h-full flex items-center justify-end overflow-hidden">
            <div className="relative w-full h-[190px] sm:h-[260px] md:h-[300px] lg:h-[340px] flex items-center justify-end">
              <img
                src="/hero-gadgets.jpg"
                alt="Durtup.shop Tech Deals"
                className="w-full h-full object-cover object-center filter drop-shadow-lg"
                loading="eager"
              />
              {/* Soft Left Fade Gradient to Seamlessly Blend Image */}
              <div className="absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-[#f57c00] via-[#f57c00]/50 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Carousel Pagination Indicator Dots */}
          <div className="absolute bottom-2 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {[0, 1, 2, 3, 4].map((dot) => (
              <span
                key={dot}
                onClick={() => setActiveDot(dot)}
                className={`cursor-pointer transition-all duration-300 block ${
                  activeDot === dot
                    ? "w-6 h-1.5 rounded-full bg-white shadow-xs"
                    : "w-1.5 h-1.5 rounded-full bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

export default memo(HeroBanner);
