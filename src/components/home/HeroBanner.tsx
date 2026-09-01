import { memo, useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { prefetchRoute } from "@/components/RoutePrefetcher";
import { cn } from "@/lib/utils";

interface BannerSlide {
  id: string;
  tagline: string;
  headline: string;
  headlineHighlight: string;
  subtitle: string;
  badge: string;
  trustPoints: string[];
  ctaText: string;
  ctaLink: string;
  image: string;
  alt: string;
  gradientClass: string;
  fadeGradient: string;
  badgeColorClass: string;
  ctaButtonClass: string;
}

const BANNER_SLIDES: BannerSlide[] = [
  {
    id: "tech-gadgets",
    tagline: "everything you need",
    headline: "Durtup.shop",
    headlineHighlight: "Mega Tech Deals",
    subtitle: "Top Deals. Best Prices. Trusted by Millions across Bangladesh.",
    badge: "🔥 UP TO 60% OFF",
    trustPoints: ["100% Genuine Warranty", "Fast Delivery in 64 Districts", "Best Price Guarantee"],
    ctaText: "Shop Tech Deals",
    ctaLink: "/category/gadgets-electronics",
    image: "/hero-gadgets.jpg",
    alt: "Durtup.shop Tech & Gadget Deals",
    gradientClass: "from-[#d84315] via-[#ef6c00] to-[#f57c00]",
    fadeGradient: "from-[#ef6c00] via-[#ef6c00]/60 to-transparent",
    badgeColorClass: "bg-white/20 text-white border-white/30",
    ctaButtonClass: "bg-white text-slate-900 hover:bg-slate-100",
  },
  {
    id: "trust-delivery",
    tagline: "peace of mind guaranteed",
    headline: "100% Authentic",
    headlineHighlight: "Cash On Delivery",
    subtitle: "Open & Check Your Parcel Before Payment. 7-Day Easy Replacement.",
    badge: "🛡️ 100% BUYER PROTECTION",
    trustPoints: ["Cash On Delivery Across BD", "Check Before Paying", "Verified Authentic Sellers"],
    ctaText: "Shop with Trust",
    ctaLink: "/products",
    image: "/banner-trust-delivery.jpg",
    alt: "100% Authentic & Cash on Delivery Guarantee",
    gradientClass: "from-[#004d40] via-[#00695c] to-[#00897b]",
    fadeGradient: "from-[#00695c] via-[#00695c]/60 to-transparent",
    badgeColorClass: "bg-emerald-300/20 text-emerald-100 border-emerald-300/30",
    ctaButtonClass: "bg-white text-emerald-950 hover:bg-emerald-50",
  },
  {
    id: "fashion-lifestyle",
    tagline: "new season arrival 2026",
    headline: "Fashion & Lifestyle",
    headlineHighlight: "Flat 40% OFF",
    subtitle: "Trendy Casuals, Traditional & Designer Outfits for Men & Women.",
    badge: "✨ NEW STYLES IN STOCK",
    trustPoints: ["Premium Quality Fabrics", "Hassle-Free Size Exchange", "Express Home Delivery"],
    ctaText: "Explore Fashion",
    ctaLink: "/category/mens-fashion",
    image: "/banner-fashion.jpg",
    alt: "Durtup Trendy Fashion Collection",
    gradientClass: "from-[#280659] via-[#4a148c] to-[#6a1b9a]",
    fadeGradient: "from-[#4a148c] via-[#4a148c]/60 to-transparent",
    badgeColorClass: "bg-purple-300/20 text-purple-100 border-purple-300/30",
    ctaButtonClass: "bg-white text-purple-950 hover:bg-purple-50",
  },
  {
    id: "mega-flash-sale",
    tagline: "limited time deals",
    headline: "Mega Flash Deals",
    headlineHighlight: "Deals from ৳99",
    subtitle: "Unbeatable discounts on top-selling items. Grab yours before stock ends!",
    badge: "⚡ CRAZY FLASH DISCOUNTS",
    trustPoints: ["Same-Day Fast Dispatch", "Limited Hourly Stock", "Extra Bkash/Nagad Discounts"],
    ctaText: "Grab Flash Deals",
    ctaLink: "/products",
    image: "/banner-flash-deals.jpg",
    alt: "Mega Flash Sale Deals",
    gradientClass: "from-[#b71c1c] via-[#c2185b] to-[#d81b60]",
    fadeGradient: "from-[#c2185b] via-[#c2185b]/60 to-transparent",
    badgeColorClass: "bg-rose-300/20 text-rose-100 border-rose-300/30",
    ctaButtonClass: "bg-white text-rose-950 hover:bg-rose-50",
  },
  {
    id: "mobile-app-launch",
    tagline: "exclusive app bonus",
    headline: "Durtup Mobile App",
    headlineHighlight: "Get ৳150 Voucher",
    subtitle: "Install the app for instant 1-click ordering, price drop alerts & live tracking.",
    badge: "📱 1-CLICK APP INSTALL",
    trustPoints: ["Live Order Tracking", "Instant Price Alerts", "Exclusive Secret Coupons"],
    ctaText: "Claim Free Voucher",
    ctaLink: "/account",
    image: "/hero-gadgets.jpg",
    alt: "Durtup Mobile App Benefits",
    gradientClass: "from-[#0a192f] via-[#112240] to-[#0f4c81]",
    fadeGradient: "from-[#112240] via-[#112240]/60 to-transparent",
    badgeColorClass: "bg-cyan-300/20 text-cyan-100 border-cyan-300/30",
    ctaButtonClass: "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
  },
];

export function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length);
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current !== null && touchEndXRef.current !== null) {
      const diff = touchStartXRef.current - touchEndXRef.current;
      if (diff > 45) {
        nextSlide();
      } else if (diff < -45) {
        prevSlide();
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
    setIsPaused(false);
  };

  const slide = BANNER_SLIDES[currentSlide];

  return (
    <section className="w-full px-2.5 sm:px-4 pt-1 sm:pt-3 pb-1">
      <div className="max-w-7xl mx-auto">
        <div
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg select-none group/banner"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Main Slide Track */}
          <div
            className={cn(
              "relative bg-gradient-to-r transition-all duration-700 min-h-[220px] sm:min-h-[280px] md:min-h-[320px] lg:min-h-[360px] flex items-center justify-between overflow-hidden",
              slide.gradientClass
            )}
          >
            {/* Left Content Area */}
            <div className="z-10 relative max-w-[62%] sm:max-w-[55%] md:max-w-[50%] p-3.5 sm:p-7 md:p-9 space-y-1.5 sm:space-y-2.5">
              
              {/* Badge & Tagline Row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "text-[9px] sm:text-xs font-black tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border backdrop-blur-sm shadow-xs",
                    slide.badgeColorClass
                  )}
                >
                  {slide.badge}
                </span>

                <p
                  className="text-white/90 text-xs sm:text-sm md:text-base font-serif italic tracking-wide hidden xs:inline-block"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {slide.tagline}
                </p>
              </div>

              {/* Main Headline */}
              <div className="space-y-0.5">
                <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                  {slide.headline}
                </h2>
                {slide.headlineHighlight && (
                  <p className="text-xs sm:text-lg md:text-xl font-extrabold text-amber-200 drop-shadow-sm tracking-tight">
                    {slide.headlineHighlight}
                  </p>
                )}
              </div>

              {/* Subtitle */}
              <p className="text-white/90 text-[10px] sm:text-xs md:text-sm font-medium tracking-normal line-clamp-2 leading-snug">
                {slide.subtitle}
              </p>

              {/* Trust Points */}
              <div className="hidden sm:flex items-center gap-3 pt-0.5 text-white/95 text-[11px] md:text-xs font-semibold">
                {slide.trustPoints.slice(0, 2).map((point, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              {/* CTA Action Button */}
              <div className="pt-1.5 sm:pt-2">
                <Link
                  to={slide.ctaLink}
                  onMouseEnter={() => prefetchRoute(slide.ctaLink)}
                  onTouchStart={() => prefetchRoute(slide.ctaLink)}
                  className={cn(
                    "inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-full font-extrabold text-xs sm:text-sm shadow-md hover:scale-105 active:scale-95 transition-all group/btn",
                    slide.ctaButtonClass
                  )}
                >
                  <span>{slide.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>

            </div>

            {/* Right Visual Image */}
            <div className="z-10 relative w-[38%] sm:w-[45%] md:w-[50%] h-full flex items-center justify-end overflow-hidden self-stretch">
              <div className="relative w-full h-[220px] sm:h-[280px] md:h-[320px] lg:h-[360px] flex items-center justify-end">
                <img
                  key={slide.image}
                  src={slide.image}
                  alt={slide.alt}
                  className="w-full h-full object-cover object-center filter drop-shadow-xl animate-in fade-in zoom-in-95 duration-500"
                  loading="eager"
                  decoding="async"
                />
                
                {/* Left Fade Gradient for seamless blending */}
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 w-12 sm:w-24 md:w-32 bg-gradient-to-r pointer-events-none",
                    slide.fadeGradient
                  )}
                />
              </div>
            </div>

            {/* Left & Right Slide Navigation Arrows (Hover visible on desktop) */}
            <button
              onClick={(e) => {
                e.preventDefault();
                prevSlide();
              }}
              aria-label="Previous Slide"
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md items-center justify-center border border-white/20 opacity-0 group-hover/banner:opacity-100 transition-all duration-200 active:scale-90"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                nextSlide();
              }}
              aria-label="Next Slide"
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md items-center justify-center border border-white/20 opacity-0 group-hover/banner:opacity-100 transition-all duration-200 active:scale-90"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(HeroBanner);
