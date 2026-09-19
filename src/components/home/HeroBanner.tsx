import { memo, useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prefetchRoute } from "@/components/RoutePrefetcher";
import { cn } from "@/lib/utils";

interface HeroSlide {
  id: string;
  title: string;
  link: string;
  imageWebp: string;
  imageJpg: string;
  alt: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "gaming-electronics",
    title: "Durtup-এ সেরা গেমিং এবং ইলেকট্রনিক্স অ্যাক্সেসরিজ",
    link: "/category/gadgets-electronics",
    imageWebp: "/banners/hero-banner-1.webp",
    imageJpg: "/banners/hero-banner-1.jpg",
    alt: "Durtup - সেরা গেমিং এবং ইলেকট্রনিক্স অ্যাক্সেসরিজ | এখনই কিনুন",
  },
  {
    id: "all-products-offer",
    title: "আপনার পছন্দের সব পণ্য এক ঠিকানায়",
    link: "/products",
    imageWebp: "/banners/hero-banner-2.webp",
    imageJpg: "/banners/hero-banner-2.jpg",
    alt: "Durtup.shop - আপনার পছন্দের সব পণ্য এক ঠিকানায় | কেনাকাটা করুন নিশ্চিন্তে",
  },
];

export function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
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
      if (diff > 40) {
        nextSlide();
      } else if (diff < -40) {
        prevSlide();
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
    setIsPaused(false);
  };

  return (
    <section 
      id="hero-banner-section" 
      aria-label="Promotional Hero Banners"
      className="w-full px-2 sm:px-4 pt-1 sm:pt-2 pb-1"
    >
      <div className="max-w-7xl mx-auto">
        <div
          className="relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl shadow-md sm:shadow-lg bg-slate-950 select-none group/banner border border-border/40 aspect-[1024/400] max-h-[440px]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Slide Track */}
          <div 
            className="w-full h-full flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {HERO_SLIDES.map((slide, index) => (
              <div 
                key={slide.id} 
                className="w-full h-full shrink-0 relative"
              >
                <Link
                  to={slide.link}
                  onMouseEnter={() => prefetchRoute(slide.link)}
                  onTouchStart={() => prefetchRoute(slide.link)}
                  aria-label={slide.title}
                  className="block w-full h-full relative cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <picture className="w-full h-full block">
                    <source srcSet={slide.imageWebp} type="image/webp" />
                    <img
                      src={slide.imageJpg}
                      alt={slide.alt}
                      width={1024}
                      height={400}
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover/banner:scale-[1.01]"
                      loading={index === 0 ? "eager" : "lazy"}
                      // @ts-expect-error fetchPriority attribute is supported in modern browsers
                      fetchPriority={index === 0 ? "high" : "low"}
                      decoding="async"
                    />
                  </picture>
                </Link>
              </div>
            ))}
          </div>

          {/* Left Arrow Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prevSlide();
            }}
            aria-label="Previous Slide"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center border border-white/20 opacity-0 group-hover/banner:opacity-100 transition-all duration-200 active:scale-90 shadow-md hover:scale-105"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              nextSlide();
            }}
            aria-label="Next Slide"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center border border-white/20 opacity-0 group-hover/banner:opacity-100 transition-all duration-200 active:scale-90 shadow-md hover:scale-105"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Slide Indicator Dots */}
          <div className="absolute bottom-2 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/10">
            {HERO_SLIDES.map((slide, index) => (
              <button
                key={slide.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goToSlide(index);
                }}
                aria-label={`Go to slide ${index + 1}: ${slide.title}`}
                className={cn(
                  "h-1.5 sm:h-2 rounded-full transition-all duration-300",
                  currentSlide === index
                    ? "w-6 sm:w-8 bg-white shadow-sm"
                    : "w-1.5 sm:w-2 bg-white/50 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(HeroBanner);
