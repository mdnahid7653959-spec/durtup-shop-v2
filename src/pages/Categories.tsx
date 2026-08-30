import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCachedMohasagorProducts, filterProductsByCategory } from "@/utils/mohasagorCache";
import { Header } from "@/components/layout/Header";
import { ProductCard, type Product } from "@/components/products/ProductCard";
import { supabase } from "@/lib/firebaseAdapter";
import { 
  ChevronRight, Loader2, Package, 
  Smartphone, Shirt, Home, Dumbbell, Gamepad2, 
  Sparkles, Car, Gem, Baby, Watch, Headphones, 
  Wrench, ShoppingBag, Gift, Tag, LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES_DATA, type MainCategoryItem } from "@/data/categoriesData";
import { optimizeImageUrl } from "@/utils/productImageHelper";

const categoryIcons: Record<string, LucideIcon> = {
  "gadgets-electronics": Smartphone,
  "mens-fashion": Shirt,
  "womens-fashion": Sparkles,
  "home-lifestyle": Home,
  "kids-zone": Baby,
  "foods": ShoppingBag,
  "winter": Shirt,
  "watch": Watch,
  "customize-gift": Gift,
  "offer": Tag,
  "others": Package,
  "electronics": Smartphone,
  "fashion": Shirt,
  "home": Home,
  "beauty": Sparkles,
  "watches": Watch,
  "kids": Baby,
};

const getCategoryIcon = (slug: string): LucideIcon => {
  return categoryIcons[slug] || ShoppingBag;
};

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<MainCategoryItem[]>(CATEGORIES_DATA);
  const [selectedCategory, setSelectedCategory] = useState<MainCategoryItem | null>(CATEGORIES_DATA[0]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [productsLoading, setProductsLoading] = useState(false);

  // Fetch products when category or subcategory changes
  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      if (!selectedCategory) return;
      setProductsLoading(true);

      try {
        const allMohasagor = await getCachedMohasagorProducts();
        let instantFiltered: Product[] = [];
        if (allMohasagor && allMohasagor.length > 0) {
          const filterKey = selectedSubcategory || selectedCategory.slug;
          instantFiltered = filterProductsByCategory(allMohasagor, filterKey, selectedCategory.name);
          if (isMounted && instantFiltered.length > 0) {
            setProducts(instantFiltered);
            setProductsLoading(false);
          }
        }

        // 2. Query DB products if available
        let mappedDbProducts: Product[] = [];
        try {
          const { data: prodData } = await supabase
            .from("products")
            .select(`
              *,
              product_images(image_url, is_primary)
            `)
            .or(`category_id.eq.${selectedCategory.id},category.ilike.%${selectedCategory.slug}%`)
            .limit(30);

          if (prodData && prodData.length > 0) {
            mappedDbProducts = prodData.map((p: any) => ({
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
          }
        } catch {}

        const merged = [...mappedDbProducts, ...instantFiltered];
        const unique = new Map<string, Product>();
        merged.forEach(p => {
          if (!unique.has(p.id)) unique.set(p.id, p);
        });

        if (isMounted) {
          setProducts(Array.from(unique.values()));
        }
      } catch (err) {
        console.warn("Categories fetchProducts error:", err);
      } finally {
        if (isMounted) setProductsLoading(false);
      }
    };

    fetchProducts();
    return () => { isMounted = false; };
  }, [selectedCategory, selectedSubcategory]);

  const handleCategoryClick = (category: MainCategoryItem) => {
    navigate(`/category/${category.slug}`);
  };

  const handleParentClick = (category: MainCategoryItem) => {
    setSelectedCategory(category);
    setSelectedSubcategory("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pb-20 md:pb-0">
        {/* Mobile: Split sidebar + subcategories + products */}
        <div className="md:hidden flex h-[calc(100vh-60px-60px)]">
          {/* Left sidebar - All 11 Categories */}
          <div className="w-24 bg-muted/40 border-r border-slate-200 dark:border-slate-800 overflow-y-auto shrink-0 scrollbar-none">
            {categories.map((category) => {
              const isSelected = selectedCategory?.id === category.id;
              const IconComponent = getCategoryIcon(category.slug);

              return (
                <button
                  key={category.id}
                  onClick={() => handleParentClick(category)}
                  className={cn(
                    "w-full p-2.5 flex flex-col items-center gap-1 text-center transition-colors border-l-3 relative",
                    isSelected
                      ? "bg-background border-l-orange-600 text-orange-600 font-bold shadow-2xs"
                      : "border-l-transparent text-muted-foreground hover:bg-background/50 font-medium"
                  )}
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    {category.image ? (
                      <img
                        src={optimizeImageUrl(category.image, 100)}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <IconComponent className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                    )}
                  </div>
                  <span className="text-[10px] line-clamp-2 leading-tight">
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right content - Subcategories chips & Products */}
          <div className="flex-1 overflow-y-auto p-2.5">
            {selectedCategory && (
              <>
                {/* Header Banner */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <div>
                    <h2 className="text-sm font-extrabold text-foreground">
                      {selectedCategory.name}
                    </h2>
                  </div>
                  <Link
                    to={`/category/${selectedCategory.slug}`}
                    className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Subcategory Pills Row */}
                {selectedCategory.subcategories.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 mb-2.5">
                    <button
                      onClick={() => setSelectedSubcategory("")}
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 transition-colors",
                        !selectedSubcategory
                          ? "bg-orange-600 text-white shadow-2xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      All
                    </button>
                    {selectedCategory.subcategories.map((sub) => {
                      const isSubActive = selectedSubcategory === sub.slug;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => setSelectedSubcategory(sub.slug)}
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 transition-colors whitespace-nowrap",
                            isSubActive
                              ? "bg-orange-600 text-white font-bold shadow-2xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-orange-50"
                          )}
                        >
                          {sub.name}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Products Grid */}
                {productsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                  </div>
                ) : products.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-card rounded-xl border p-4">
                    <Package className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground text-xs font-semibold">No products found</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Desktop: Rich Categories Grid with Subcategory Flyouts */}
        <div className="hidden md:block max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
                All Product Categories
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Explore our full catalog categorized across 11 major departments with subcategory filters
              </p>
            </div>
            <span className="text-xs font-bold text-orange-600 bg-orange-100 dark:bg-orange-950/60 px-3 py-1 rounded-full">
              {categories.length} Major Categories
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((category) => {
              const IconComponent = getCategoryIcon(category.slug);

              return (
                <div 
                  key={category.id} 
                  className="bg-card rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md transition-all hover:border-orange-500/40 flex flex-col justify-between group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform duration-200 flex items-center justify-center">
                        {category.image ? (
                          <img
                            src={optimizeImageUrl(category.image, 200)}
                            alt={category.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <IconComponent className="w-7 h-7 text-orange-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/category/${category.slug}`}
                          className="font-extrabold text-base sm:text-lg text-foreground group-hover:text-orange-600 transition-colors block truncate"
                        >
                          {category.name}
                        </Link>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {category.subcategories.length} subcategories
                        </p>
                      </div>
                    </div>

                    {/* Subcategories list */}
                    <div className="grid grid-cols-2 gap-1.5 mb-4">
                      {category.subcategories.map((sub) => (
                        <Link
                          key={sub.id}
                          to={`/category/${category.slug}?subcategory=${sub.slug}`}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 transition-colors text-xs font-semibold text-slate-700 dark:text-slate-300 truncate"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* View Category Button */}
                  <Link
                    to={`/category/${category.slug}`}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-600 hover:text-white font-bold text-xs flex items-center justify-between text-slate-800 dark:text-slate-200 transition-all"
                  >
                    <span>Browse All {category.name}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
};

export default Categories;
