import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { 
  Heart, 
  User, 
  Menu, 
  ChevronLeft,
  ChevronRight,
  ShoppingCart, 
  MessageCircle, 
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/firebaseAdapter";
import { SmartSearchBar } from "@/components/search/SmartSearchBar";
import { cn } from "@/lib/utils";
import { CATEGORIES_DATA, findCategoryOrSubcategory } from "@/data/categoriesData";

export function Header() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const rawCatParam = searchParams.get("category");
  const rawSubParam = searchParams.get("subcategory");
  const currentCategory = (rawCatParam || "").toLowerCase().trim();
  const currentSubcategory = (rawSubParam || "").toLowerCase().trim();

  // Active category detection
  const isHomeActive = location.pathname === "/" && !currentCategory && !currentSubcategory;
  const isCheckoutPage = location.pathname.toLowerCase() === "/checkout" || location.pathname.toLowerCase().startsWith("/checkout");
  const isMessagesPage = location.pathname.toLowerCase() === "/messages" || location.pathname.toLowerCase().startsWith("/messages");
  const hideSearchAndCategories = isCheckoutPage || isMessagesPage;

  const pathCategorySlug = location.pathname.startsWith("/category/") ? location.pathname.replace("/category/", "").split("/")[0].split("?")[0] : "";
  const activeCategoryInfo = findCategoryOrSubcategory(
    currentCategory || currentSubcategory || pathCategorySlug
  );
  const activeMainCategory = activeCategoryInfo.category || null;

  const { user, profile, signOut } = useAuth();
  const { itemCount: cartCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { toast } = useToast();
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  // High-performance Drag & Scroll State
  const scrollContainerRef = useRef<HTMLUListElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const [isGrabbing, setIsGrabbing] = useState(false);

  // Liquid Water Droplet Sliding State (পানির ফোঁটা ফাস্ট মুভমেন্ট ও ইলাস্টিক স্প্রিং ফিজিক্স)
  const [dropletStyle, setDropletStyle] = useState<{ left: number; top: number; width: number; height: number; opacity: number }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });
  const [isDropletSliding, setIsDropletSliding] = useState(false);
  const [dropletSlideDir, setDropletSlideDir] = useState<"left" | "right" | "none">("none");
  const prevPillLeftRef = useRef<number | null>(null);

  // Dropdown hover state for desktop pills
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  // Precise Physical Water Droplet Calculation (Calculates exact position relative to UL)
  const updateDroplet = useCallback((instant = false) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const activeEl = container.querySelector<HTMLElement>("[data-active='true']");
    if (!activeEl) {
      setDropletStyle(prev => ({ ...prev, opacity: 0 }));
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();

    // Absolute position inside the scrollable UL
    const elLeft = activeRect.left - containerRect.left + container.scrollLeft;
    const elTop = activeRect.top - containerRect.top + container.scrollTop;
    const elWidth = activeRect.width;
    const elHeight = activeRect.height;

    if (prevPillLeftRef.current !== null && Math.abs(prevPillLeftRef.current - elLeft) > 2 && !instant) {
      const dir = elLeft > prevPillLeftRef.current ? "right" : "left";
      setDropletSlideDir(dir);
      setIsDropletSliding(true);
      setTimeout(() => {
        setIsDropletSliding(false);
        setDropletSlideDir("none");
      }, 350);
    }
    prevPillLeftRef.current = elLeft;

    setDropletStyle({
      left: elLeft,
      top: elTop,
      width: elWidth,
      height: elHeight,
      opacity: 1,
    });
  }, []);

  useLayoutEffect(() => {
    updateDroplet(true);
    const frame = requestAnimationFrame(() => {
      updateDroplet(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, currentCategory, activeMainCategory, updateDroplet]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScrollability();
    updateDroplet(true);

    const onScroll = () => {
      checkScrollability();
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => {
      checkScrollability();
      updateDroplet(true);
    });

    // Native non-passive horizontal wheel scrolling
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 1.5;
        checkScrollability();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", checkScrollability);
    };
  }, [checkScrollability, updateDroplet]);

  // Auto-scroll active pill into view
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const activeEl = el.querySelector<HTMLElement>("[data-active='true']");
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [location.pathname, currentCategory]);

  // Global mousemove and mouseup listeners for seamless drag anywhere
  useEffect(() => {
    const onGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !scrollContainerRef.current) return;
      e.preventDefault();
      const el = scrollContainerRef.current;
      const x = e.pageX - el.getBoundingClientRect().left;
      const walk = (x - startXRef.current) * 1.8;
      if (Math.abs(walk) > 4) {
        hasDraggedRef.current = true;
      }
      el.scrollLeft = scrollLeftRef.current - walk;
      checkScrollability();
    };

    const onGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsGrabbing(false);
        setTimeout(() => {
          hasDraggedRef.current = false;
        }, 50);
      }
    };

    window.addEventListener("mousemove", onGlobalMouseMove, { passive: false });
    window.addEventListener("mouseup", onGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", onGlobalMouseMove);
      window.removeEventListener("mouseup", onGlobalMouseUp);
    };
  }, [checkScrollability]);

  const scrollByAmount = (amount: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: amount, behavior: "smooth" });
      setTimeout(checkScrollability, 350);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    setIsGrabbing(true);
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - el.getBoundingClientRect().left;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handlePillClick = (e: React.MouseEvent, href: string) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Instantly animate water droplet to clicked element
    const clickedEl = e.currentTarget as HTMLElement;
    const container = scrollContainerRef.current;
    if (clickedEl && container) {
      const containerRect = container.getBoundingClientRect();
      const activeRect = clickedEl.getBoundingClientRect();
      const elLeft = activeRect.left - containerRect.left + container.scrollLeft;
      const elTop = activeRect.top - containerRect.top + container.scrollTop;

      if (prevPillLeftRef.current !== null && Math.abs(prevPillLeftRef.current - elLeft) > 2) {
        const dir = elLeft > prevPillLeftRef.current ? "right" : "left";
        setDropletSlideDir(dir);
        setIsDropletSliding(true);
        setTimeout(() => {
          setIsDropletSliding(false);
          setDropletSlideDir("none");
        }, 350);
      }
      prevPillLeftRef.current = elLeft;

      setDropletStyle({
        left: elLeft,
        top: elTop,
        width: activeRect.width,
        height: activeRect.height,
        opacity: 1,
      });
    }

    navigate(href);
  };

  const handleMouseEnter = (catId: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredCategory(catId);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 150);
  };

  useEffect(() => {
    if (!user) { setHasUnreadMessages(false); return; }

    const checkUnread = async () => {
      const { data: buyerConvs } = await supabase
        .from("conversations").select("buyer_unread_count")
        .eq("buyer_id", user.id).gt("buyer_unread_count", 0).limit(1);

      if (buyerConvs && buyerConvs.length > 0) { setHasUnreadMessages(true); return; }

      const { data: sellerData } = await supabase
        .from("sellers").select("id")
        .eq("user_id", user.id).eq("status", "approved").limit(1);

      if (sellerData && sellerData.length > 0) {
        const { data: sellerConvs } = await supabase
          .from("conversations").select("seller_unread_count")
          .eq("seller_id", sellerData[0].id).gt("seller_unread_count", 0).limit(1);
        if (sellerConvs && sellerConvs.length > 0) { setHasUnreadMessages(true); return; }
      }
      setHasUnreadMessages(false);
    };

    checkUnread();
    const channel = supabase
      .channel("unread-messages-indicator")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => checkUnread())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversations" }, () => checkUnread())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: "Logged out", description: "You've been successfully logged out." });
      navigate("/");
    } catch (error) { 
      console.error("Logout error:", error); 
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full max-w-[100vw] bg-white dark:bg-slate-900 shadow-xs border-b border-slate-100 dark:border-slate-800" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      
      {/* 1. Main Header Row (Logo, Search, Actions) */}
      <div className="px-3 sm:px-4 py-2 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Left: Hamburger & Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link 
              to="/categories" 
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 rounded-xl transition-all flex items-center justify-center text-slate-800 dark:text-slate-100"
              aria-label="Categories Menu"
            >
              <Menu className="h-6 w-6" />
            </Link>

            <Link to="/" className="flex flex-col items-start justify-center group select-none py-0.5">
              <div className="flex items-baseline tracking-tight font-black leading-none">
                <span className="text-xl sm:text-2xl md:text-[26px] text-orange-600 font-extrabold tracking-tight">Durtup</span>
                <span className="text-xs sm:text-sm md:text-base font-bold text-slate-800 dark:text-slate-200">.shop</span>
              </div>
              {/* Signature Orange Smile Curve */}
              <svg viewBox="0 0 100 20" className="w-16 sm:w-20 md:w-24 h-2 -mt-0.5 text-orange-600 fill-none stroke-current stroke-[3]">
                <path d="M 5,5 Q 50,18 95,5" strokeLinecap="round" />
                <path d="M 85,2 L 95,5 L 90,11" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" />
              </svg>
            </Link>
          </div>

          {/* Center: Search Bar (Desktop) */}
          {isCheckoutPage ? (
            <div className="flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm bg-slate-100/80 dark:bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>100% Secure Checkout</span>
            </div>
          ) : (
            <div className="flex-1 max-w-2xl mx-2 hidden md:block">
              <SmartSearchBar variant="desktop" />
            </div>
          )}

          {/* Right Action Icons (Wishlist, Messages, Cart, Account) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* Wishlist */}
            <Link to="/wishlist" className="flex flex-col items-center justify-center p-1 sm:px-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-orange-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all relative group">
              <div className="relative">
                <Heart className="h-5 w-5 group-hover:scale-110 transition-transform" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-orange-600 text-white text-[9px] font-bold flex items-center justify-center px-1 shadow-xs">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none mt-1">Wishlist</span>
            </Link>

            {/* Messages */}
            <Link to="/messages" className="flex flex-col items-center justify-center p-1 sm:px-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-orange-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all relative group">
              <div className="relative">
                <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                {hasUnreadMessages && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-orange-600 text-white text-[9px] font-bold flex items-center justify-center px-1 shadow-xs">
                    1
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none mt-1">Messages</span>
            </Link>

            {/* Account / User Menu (Desktop) */}
            <div className="hidden lg:block ml-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex flex-col items-center justify-center p-1 sm:px-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-orange-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    <User className="h-5 w-5" />
                    <span className="text-[10px] font-medium leading-none mt-1 truncate max-w-[60px]">
                      {user ? profile?.full_name?.split(' ')[0] || 'Account' : 'Account'}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover">
                  {user ? (
                    <>
                      <div className="p-3 border-b">
                        <p className="text-sm font-bold text-foreground">{profile?.full_name || 'Welcome!'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <DropdownMenuItem asChild><Link to="/orders" className="cursor-pointer">My Orders</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/wishlist" className="cursor-pointer">Wishlist</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/account" className="cursor-pointer">Account Settings</Link></DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <div className="p-3 border-b">
                        <p className="text-sm font-bold text-foreground">Welcome to Durtup.shop!</p>
                        <div className="flex gap-2 mt-2">
                          <Button asChild size="sm" className="flex-1"><Link to="/login">Sign In</Link></Button>
                          <Button asChild variant="outline" size="sm" className="flex-1"><Link to="/register">Register</Link></Button>
                        </div>
                      </div>
                      <DropdownMenuItem asChild><Link to="/orders" className="cursor-pointer">My Orders</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/wishlist" className="cursor-pointer">Wishlist</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/account" className="cursor-pointer">Account Settings</Link></DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

          </div>

        </div>

        {/* Search Bar (Mobile View) */}
        {!hideSearchAndCategories && (
          <div className="mt-2 md:hidden">
            <SmartSearchBar variant="mobile" />
          </div>
        )}
      </div>

      {/* 2. Fluid Slidable Category Pills Navigation with Pure Liquid Water Droplet (আসল চলমান পানির ফোঁটা) */}
      {!hideSearchAndCategories && (
        <div className="relative bg-transparent select-none py-1 sm:py-1.5 px-2 sm:px-4">
          <div className="max-w-7xl mx-auto relative flex items-center">
            
            {/* Dock Container with Crystal Styling */}
            <div className={cn(
              "w-full relative flex items-center rounded-[26px] p-1",
              "bg-white/95 dark:bg-slate-900/95",
              "backdrop-blur-xl backdrop-saturate-150",
              "border border-slate-200/90 dark:border-slate-800",
              "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08),0_2px_6px_-2px_rgba(0,0,0,0.03)]",
              "dark:shadow-[0_6px_24px_-4px_rgba(0,0,0,0.5)]"
            )}>
              {/* Specular gloss top reflection beam on the dock */}
              <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white dark:via-white/30 to-transparent pointer-events-none opacity-90" />

              {/* Left Slide Arrow Button */}
              {canScrollLeft && (
                <div className="hidden md:flex absolute left-1 z-30 h-full items-center">
                  <button
                    type="button"
                    onClick={() => scrollByAmount(-320)}
                    className="w-7 h-7 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-md border border-white/80 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all active:scale-95"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Scrollable / Draggable Pills List */}
              <nav className="w-full overflow-hidden px-1 py-0.5 relative">
                <ul
                  ref={scrollContainerRef}
                  onMouseDown={handleMouseDown}
                  className={cn(
                    "flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none select-none py-0.5 touch-pan-x relative",
                    isGrabbing ? "cursor-grabbing" : "cursor-grab"
                  )}
                  style={{ 
                    WebkitOverflowScrolling: "touch",
                    userSelect: "none"
                  }}
                >
                  
                  {/* ── Single Hyper-Realistic 3D Sliding Water Droplet (আসল ভাসমান পানির ফোঁটা যা স্মুথলি এক পিল থেকে অন্য পিলে স্লাইড করে) ── */}
                  {dropletStyle.opacity > 0 && (
                    <div
                      className={cn(
                        "absolute pointer-events-none z-0",
                        // Ultra-smooth liquid spring glide
                        "transition-all duration-350 ease-[cubic-bezier(0.34,1.45,0.64,1)]"
                      )}
                      style={{
                        left: `${dropletStyle.left}px`,
                        top: `${dropletStyle.top}px`,
                        width: `${dropletStyle.width}px`,
                        height: `${dropletStyle.height}px`,
                      }}
                    >
                      <div 
                        className={cn(
                          "w-full h-full p-0.5 transition-transform duration-250",
                          // Elastic fluid deformation when moving
                          isDropletSliding && dropletSlideDir === "right" && "scale-x-[1.12] scale-y-[0.90] origin-left",
                          isDropletSliding && dropletSlideDir === "left" && "scale-x-[1.12] scale-y-[0.90] origin-right",
                          !isDropletSliding && "scale-100"
                        )}
                      >
                        <div 
                          className={cn(
                            "w-full h-full rounded-full relative overflow-hidden",
                            // Pure crystal water transparency / 3D liquid lens
                            "bg-gradient-to-b from-white/95 via-white/45 to-white/75",
                            "dark:from-white/35 dark:via-white/12 dark:to-white/30",
                            "backdrop-blur-md",
                            // Surface tension meniscus border
                            "border border-white/95 dark:border-white/60",
                            // 3D Liquid refraction caustics, inner specular gloss, and drop shadow
                            "shadow-[0_6px_20px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.05),inset_0_3.5px_6px_rgba(255,255,255,1),inset_0_-2.5px_5px_rgba(0,0,0,0.06),inset_0_0_15px_rgba(255,255,255,0.9)]",
                            "dark:shadow-[0_6px_22px_rgba(0,0,0,0.55),inset_0_3.5px_6px_rgba(255,255,255,0.5),inset_0_-2.5px_5px_rgba(0,0,0,0.3),inset_0_0_15px_rgba(255,255,255,0.25)]"
                          )}
                        >
                          {/* 1. Main Curved Top-Left Specular Glare */}
                          <div className="absolute top-0.5 left-2.5 w-6 h-[2px] bg-gradient-to-r from-white via-white to-white/70 rounded-full blur-[0.15px] shadow-[0_0_4px_rgba(255,255,255,1)]" />

                          {/* 2. Primary Micro Sparkle Dot */}
                          <div className="absolute top-1 right-2.5 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_#ffffff,0_0_2px_#ffffff]" />

                          {/* 3. Bottom Caustic Light Arc */}
                          <div className="absolute bottom-0.5 inset-x-2 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent rounded-full blur-[0.3px] shadow-[0_0_4px_rgba(255,255,255,0.95)]" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* "All" Pill */}
                  <li className="shrink-0 z-10">
                    <Link
                      to="/"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      onClick={(e) => handlePillClick(e, "/")}
                      data-active={isHomeActive}
                      className={cn(
                        "relative px-4 sm:px-5 py-1.5 text-xs sm:text-sm rounded-full transition-colors duration-200 flex items-center justify-center gap-1 whitespace-nowrap select-none",
                        isHomeActive
                          ? "text-slate-950 dark:text-white font-extrabold"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                      )}
                    >
                      <span>All</span>
                    </Link>
                  </li>

                  {/* Categories */}
                  {CATEGORIES_DATA.map((cat) => {
                    const isActive = activeMainCategory?.id === cat.id;
                    const isHovered = hoveredCategory === cat.id;

                    return (
                      <li
                        key={cat.id}
                        className="shrink-0 z-10"
                        onMouseEnter={() => handleMouseEnter(cat.id)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <Link
                          to={`/category/${cat.slug}`}
                          draggable={false}
                          onDragStart={(e) => e.preventDefault()}
                          onClick={(e) => handlePillClick(e, `/category/${cat.slug}`)}
                          data-active={isActive}
                          className={cn(
                            "relative px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm rounded-full transition-colors duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap select-none",
                            isActive
                              ? "text-slate-950 dark:text-white font-extrabold"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                          )}
                        >
                          <span>{cat.name}</span>
                        </Link>

                        {/* Desktop Hover Subcategories Dropdown */}
                        {isHovered && cat.subcategories.length > 0 && !isGrabbing && (
                          <div
                            className="hidden md:block absolute top-full left-0 z-50 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700 shadow-2xl rounded-2xl py-2 mt-2 animate-in fade-in slide-in-from-top-1 duration-150"
                            onMouseEnter={() => handleMouseEnter(cat.id)}
                            onMouseLeave={handleMouseLeave}
                          >
                            <div className="px-3.5 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <span className="text-xs font-extrabold text-orange-600">
                                {cat.name}
                              </span>
                            </div>

                            <div className="py-1">
                              {cat.subcategories.map((sub) => (
                                <Link
                                  key={sub.id}
                                  to={`/category/${cat.slug}?subcategory=${sub.slug}`}
                                  draggable={false}
                                  onDragStart={(e) => e.preventDefault()}
                                  className="flex items-center justify-between px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 transition-colors"
                                >
                                  <span>{sub.name}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}

                  {/* More Categories Button */}
                  <li className="shrink-0 z-10">
                    <Link
                      to="/categories"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      onClick={(e) => handlePillClick(e, "/categories")}
                      className="px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap select-none"
                    >
                      <span>More</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </li>

                </ul>
              </nav>

              {/* Right Slide Arrow Button */}
              {canScrollRight && (
                <div className="hidden md:flex absolute right-1 z-30 h-full items-center">
                  <button
                    type="button"
                    onClick={() => scrollByAmount(320)}
                    className="w-7 h-7 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-md border border-white/80 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all active:scale-95"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </header>
  );
}

export default Header;
