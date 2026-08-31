import { useEffect, useLayoutEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/firebaseAdapter";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard, type Product } from "@/components/products/ProductCard";
import { CombinedProductCard, type CombinedProduct } from "@/components/products/CombinedProductCard";
import { Loader2 } from "lucide-react";
import { getCachedMohasagorProducts, filterProductsByCategory } from "@/utils/mohasagorCache";
import { SEOHead } from "@/components/SEOHead";
import { generateCategorySEOTitle, generateCategorySEODescription, DEFAULT_BANGLADESH_PRODUCT_FAQS } from "@/utils/seoHelper";
import { useCJSettings, useCJCategoryMappings } from "@/hooks/useCJSettings";
import { findCategoryOrSubcategory, CATEGORIES_DATA } from "@/data/categoriesData";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  bangla?: string;
}

export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const subcategoryParam = (searchParams.get("subcategory") || "").toLowerCase().trim();

  const categoryLookup = findCategoryOrSubcategory(slug || "");
  const mainCat = categoryLookup.category || null;

  const [category, setCategory] = useState<Category | null>(() => {
    if (!slug) return null;
    if (mainCat) {
      return {
        id: mainCat.id,
        name: mainCat.name,
        slug: mainCat.slug,
        description: `Explore premium ${mainCat.name} products with best prices & fast delivery in Bangladesh`,
      };
    }
    const formattedName = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return {
      id: `cat-${slug}`,
      name: formattedName,
      slug,
      description: `Explore top quality products in ${formattedName}`,
    };
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const cachedAllProductsRef = useRef<Product[]>([]);

  // Subcategory Water Droplet Sliding State (সাব-ক্যাটাগরি পানির ফোঁটা মুভমেন্ট)
  const subScrollRef = useRef<HTMLDivElement | null>(null);
  const [subDropletStyle, setSubDropletStyle] = useState<{ left: number; top: number; width: number; height: number; opacity: number }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });
  const [isSubDropletSliding, setIsSubDropletSliding] = useState(false);
  const [subDropletSlideDir, setSubDropletSlideDir] = useState<"left" | "right" | "none">("none");
  const prevSubLeftRef = useRef<number | null>(null);

  // Exact Subcategory Droplet Calculation
  const updateSubDroplet = useCallback((instant = false) => {
    const container = subScrollRef.current;
    if (!container) return;
    const activeBtn = container.querySelector<HTMLElement>("[data-subactive='true']");
    if (!activeBtn) {
      setSubDropletStyle(prev => ({ ...prev, opacity: 0 }));
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeBtn.getBoundingClientRect();

    const elLeft = activeRect.left - containerRect.left + container.scrollLeft;
    const elTop = activeRect.top - containerRect.top + container.scrollTop;
    const elWidth = activeRect.width;
    const elHeight = activeRect.height;

    if (prevSubLeftRef.current !== null && Math.abs(prevSubLeftRef.current - elLeft) > 2 && !instant) {
      const dir = elLeft > prevSubLeftRef.current ? "right" : "left";
      setSubDropletSlideDir(dir);
      setIsSubDropletSliding(true);
      setTimeout(() => {
        setIsSubDropletSliding(false);
        setSubDropletSlideDir("none");
      }, 350);
    }
    prevSubLeftRef.current = elLeft;

    setSubDropletStyle({
      left: elLeft,
      top: elTop,
      width: elWidth,
      height: elHeight,
      opacity: 1,
    });
  }, []);

  useLayoutEffect(() => {
    updateSubDroplet(true);
    const frame = requestAnimationFrame(() => {
      updateSubDroplet(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [slug, subcategoryParam, updateSubDroplet]);

  useEffect(() => {
    const el = subScrollRef.current;
    if (!el) return;

    const handleResize = () => {
      updateSubDroplet(true);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateSubDroplet]);

  // Auto-scroll active subcategory into view
  useEffect(() => {
    const el = subScrollRef.current;
    if (!el) return;
    const activeEl = el.querySelector<HTMLElement>("[data-subactive='true']");
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [subcategoryParam]);

  // High-Speed Instant Product Filtering (০ মিলিসেকেন্ড ইনস্ট্যান্ট লোড)
  useEffect(() => {
    let isMounted = true;

    async function loadInstantCategoryProducts() {
      if (!slug) return;

      const formattedName = mainCat ? mainCat.name : slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      const filterKey = subcategoryParam || slug;

      // 1. Instant Synchronous / In-Memory Filter (0ms delay)
      try {
        const cachedCatalog = await getCachedMohasagorProducts();
        cachedAllProductsRef.current = cachedCatalog;
        
        if (cachedCatalog && cachedCatalog.length > 0) {
          const instantFiltered = filterProductsByCategory(cachedCatalog, filterKey, formattedName);
          if (isMounted && instantFiltered.length > 0) {
            setProducts(instantFiltered);
          }
        }
      } catch (err) {
        console.warn("Instant filter note:", err);
      }

      // 2. Background Asynchronous Database Products (non-blocking)
      try {
        const { data: prodData } = await supabase
          .from("products")
          .select(`
            id, name, slug, regular_price, discount_price, rating_average, rating_count, sold_count, free_shipping, is_new_arrival, is_best_seller,
            product_images(image_url, is_primary)
          `)
          .limit(40);

        if (prodData && prodData.length > 0 && isMounted) {
          const mappedDb: Product[] = prodData.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            image: p.product_images?.find((img: any) => img.is_primary)?.image_url || p.product_images?.[0]?.image_url || "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop",
            price: p.discount_price || p.regular_price || 0,
            originalPrice: p.discount_price ? p.regular_price : undefined,
            rating: Number(p.rating_average) || 4.8,
            reviews: p.rating_count || 18,
            sold: p.sold_count || 40,
            freeShipping: p.free_shipping ?? true,
            isNew: p.is_new_arrival ?? true,
            isBestSeller: p.is_best_seller ?? false,
          }));

          const allCached = cachedAllProductsRef.current;
          const apiFiltered = filterProductsByCategory(allCached, filterKey, formattedName);
          const combined = [...apiFiltered, ...mappedDb];
          const unique = new Map<string, Product>();
          combined.forEach(p => {
            if (!unique.has(p.id)) unique.set(p.id, p);
          });
          setProducts(Array.from(unique.values()));
        }
      } catch {}
    }

    loadInstantCategoryProducts();

    return () => {
      isMounted = false;
    };
  }, [slug, subcategoryParam, mainCat]);

  // Instant subcategory switch with zero lag and instant water droplet glide
  const handleSubcategorySelect = (subSlug: string, event?: React.MouseEvent) => {
    // 1. Instant local filter in memory
    const formattedName = mainCat ? mainCat.name : slug || "";
    const filterKey = subSlug || slug || "";
    const allCached = cachedAllProductsRef.current;
    if (allCached && allCached.length > 0) {
      const instantList = filterProductsByCategory(allCached, filterKey, formattedName);
      if (instantList.length > 0) {
        setProducts(instantList);
      }
    }

    // 2. Instant droplet position calculation
    if (event && subScrollRef.current) {
      const clickedBtn = event.currentTarget as HTMLElement;
      const containerRect = subScrollRef.current.getBoundingClientRect();
      const activeRect = clickedBtn.getBoundingClientRect();
      const elLeft = activeRect.left - containerRect.left + subScrollRef.current.scrollLeft;
      const elTop = activeRect.top - containerRect.top + subScrollRef.current.scrollTop;

      if (prevSubLeftRef.current !== null && Math.abs(prevSubLeftRef.current - elLeft) > 2) {
        const dir = elLeft > prevSubLeftRef.current ? "right" : "left";
        setSubDropletSlideDir(dir);
        setIsSubDropletSliding(true);
        setTimeout(() => {
          setIsSubDropletSliding(false);
          setSubDropletSlideDir("none");
        }, 350);
      }
      prevSubLeftRef.current = elLeft;

      setSubDropletStyle({
        left: elLeft,
        top: elTop,
        width: activeRect.width,
        height: activeRect.height,
        opacity: 1,
      });
    }

    // 3. Update URL search params
    if (!subSlug) {
      searchParams.delete("subcategory");
    } else {
      searchParams.set("subcategory", subSlug);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const categoryName = category?.name || (slug ? slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Products");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title={generateCategorySEOTitle({ name: categoryName, slug: slug || "" })}
        description={generateCategorySEODescription({ name: categoryName, slug: slug || "" })}
        url={`https://durtup.shop/category/${slug || ""}`}
        category={{ name: categoryName, slug: slug || "" }}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Categories", url: "/categories" },
          { name: categoryName, url: `/category/${slug || ""}` }
        ]}
        itemList={products.slice(0, 10).map(p => ({
          name: p.name,
          url: `/product/${p.slug || p.id}`,
          image: p.image,
          price: p.price,
        }))}
        faqs={DEFAULT_BANGLADESH_PRODUCT_FAQS}
      />
      
      <Header />
      
      <main className="flex-1 pb-20 md:pb-0">
        <div className="px-3 sm:container py-2.5 sm:py-4">
          
          {/* Subcategory Pills Row with Water Droplet Theme (পানির ফোঁটা থিম ও সুপার ফাস্ট স্লাইড) */}
          {mainCat && mainCat.subcategories.length > 0 && (
            <div className="mb-3 sm:mb-4 select-none">
              <div 
                ref={subScrollRef}
                className={cn(
                  "relative flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-1 px-1.5 rounded-[24px]",
                  "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl backdrop-saturate-150",
                  "border border-slate-200/90 dark:border-slate-800",
                  "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08),0_2px_6px_-2px_rgba(0,0,0,0.03)]",
                  "dark:shadow-[0_6px_24px_-4px_rgba(0,0,0,0.5)]"
                )}
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {/* Specular gloss top reflection beam */}
                <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white dark:via-white/30 to-transparent pointer-events-none opacity-90" />

                {/* ── Single Hyper-Realistic 3D Sliding Water Droplet (সাব-ক্যাটাগরির আসল ভাসমান পানির ফোঁটা) ── */}
                {subDropletStyle.opacity > 0 && (
                  <div
                    className={cn(
                      "absolute pointer-events-none z-0",
                      "transition-all duration-350 ease-[cubic-bezier(0.34,1.45,0.64,1)]"
                    )}
                    style={{
                      left: `${subDropletStyle.left}px`,
                      top: `${subDropletStyle.top}px`,
                      width: `${subDropletStyle.width}px`,
                      height: `${subDropletStyle.height}px`,
                    }}
                  >
                    <div 
                      className={cn(
                        "w-full h-full p-0.5 transition-transform duration-250",
                        isSubDropletSliding && subDropletSlideDir === "right" && "scale-x-[1.12] scale-y-[0.90] origin-left",
                        isSubDropletSliding && subDropletSlideDir === "left" && "scale-x-[1.12] scale-y-[0.90] origin-right",
                        !isSubDropletSliding && "scale-100"
                      )}
                    >
                      <div 
                        className={cn(
                          "w-full h-full rounded-full relative overflow-hidden",
                          "bg-gradient-to-b from-white/95 via-white/45 to-white/75",
                          "dark:from-white/35 dark:via-white/12 dark:to-white/30",
                          "backdrop-blur-md",
                          "border border-white/95 dark:border-white/60",
                          "shadow-[0_6px_20px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.05),inset_0_3.5px_6px_rgba(255,255,255,1),inset_0_-2.5px_5px_rgba(0,0,0,0.06),inset_0_0_15px_rgba(255,255,255,0.9)]",
                          "dark:shadow-[0_6px_22px_rgba(0,0,0,0.55),inset_0_3.5px_6px_rgba(255,255,255,0.5),inset_0_-2.5px_5px_rgba(0,0,0,0.3),inset_0_0_15px_rgba(255,255,255,0.25)]"
                        )}
                      >
                        {/* Glare & sparkle */}
                        <div className="absolute top-0.5 left-2.5 w-6 h-[2px] bg-gradient-to-r from-white via-white to-white/70 rounded-full blur-[0.15px] shadow-[0_0_4px_rgba(255,255,255,1)]" />
                        <div className="absolute top-1 right-2.5 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_#ffffff,0_0_2px_#ffffff]" />
                        <div className="absolute bottom-0.5 inset-x-2 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent rounded-full blur-[0.3px] shadow-[0_0_4px_rgba(255,255,255,0.95)]" />
                      </div>
                    </div>
                  </div>
                )}

                {/* "All [Category]" Button */}
                <button
                  onClick={(e) => handleSubcategorySelect("", e)}
                  data-subactive={!subcategoryParam}
                  className={cn(
                    "relative z-10 px-4 sm:px-5 py-1.5 text-xs sm:text-sm rounded-full transition-colors duration-200 shrink-0 whitespace-nowrap select-none",
                    !subcategoryParam
                      ? "text-slate-950 dark:text-white font-extrabold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                  )}
                >
                  <span>All {mainCat.name}</span>
                </button>

                {/* Subcategories Buttons */}
                {mainCat.subcategories.map((sub) => {
                  const isSelected = subcategoryParam === sub.slug.toLowerCase();
                  return (
                    <button
                      key={sub.id}
                      onClick={(e) => handleSubcategorySelect(sub.slug, e)}
                      data-subactive={isSelected}
                      className={cn(
                        "relative z-10 px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm rounded-full transition-colors duration-200 shrink-0 whitespace-nowrap select-none",
                        isSelected
                          ? "text-slate-950 dark:text-white font-extrabold"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                      )}
                    >
                      <span>{sub.name}</span>
                    </button>
                  );
                })}

              </div>
            </div>
          )}

          {/* Product Grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16 bg-card rounded-2xl border border-dashed p-8">
              <p className="text-muted-foreground text-sm sm:text-base font-semibold">
                No products found in this subcategory right now.
              </p>
              <button 
                onClick={() => handleSubcategorySelect("")} 
                className="text-orange-600 font-bold text-sm mt-3 inline-block hover:underline"
              >
                View All {mainCat?.name || "Category"} Products →
              </button>
            </div>
          )}

        </div>
      </main>
      
      <Footer />
    </div>
  );
}
