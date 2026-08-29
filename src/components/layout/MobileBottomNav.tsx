import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  LayoutGrid, 
  ShoppingBag, 
  ShoppingCart, 
  Package, 
  User, 
  Heart, 
  Search, 
  Bell, 
  Store, 
  MessageCircle, 
  LucideIcon 
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { useSiteConfig } from "@/hooks/useSiteConfig";

const iconMap: Record<string, LucideIcon> = {
  home: Home,
  category: LayoutGrid,
  categories: LayoutGrid,
  grid: LayoutGrid,
  "layout-grid": LayoutGrid,
  shapes: LayoutGrid,
  "shopping-cart": ShoppingCart,
  cart: ShoppingBag,
  bag: ShoppingBag,
  package: Package,
  orders: Package,
  user: User,
  account: User,
  profile: User,
  heart: Heart,
  wishlist: Heart,
  search: Search,
  bell: Bell,
  store: Store,
  "live-chat": MessageCircle,
  chat: MessageCircle,
  messages: MessageCircle,
  message: MessageCircle,
};

interface NavTab {
  label: string;
  icon: string;
  href: string;
  badge?: string;
}

const defaultTabs: NavTab[] = [
  { label: "Home", icon: "home", href: "/" },
  { label: "Category", icon: "category", href: "/categories" },
  { label: "Cart", icon: "cart", href: "/cart", badge: "cart" },
  { label: "Orders", icon: "orders", href: "/orders" },
  { label: "Account", icon: "account", href: "/account" },
];

interface MobileNavConfig {
  tabs: NavTab[];
}

export function MobileBottomNav() {
  const location = useLocation();
  const { itemCount: cartCount } = useCart();
  const { config } = useSiteConfig<MobileNavConfig>("mobile_nav", { tabs: defaultTabs });

  const tabs = config.tabs?.length ? config.tabs : defaultTabs;

  const getBadgeCount = (badge?: string) => {
    if (badge === "cart") return cartCount;
    return 0;
  };

  // Find active tab index for the sliding water droplet
  const activeIndex = tabs.findIndex((tab) => {
    const p = location.pathname.toLowerCase();
    const href = (tab.href || "").toLowerCase();
    
    if (href === "/" || href === "") {
      return p === "/" || p === "";
    }
    if (href.includes("cat")) {
      return p.includes("cat");
    }
    if (href.includes("order")) {
      return p.includes("order");
    }
    if (href.includes("cart") || href.includes("bag")) {
      return p.includes("cart") || p.includes("bag");
    }
    if (
      href.includes("account") || 
      href.includes("profile") || 
      href.includes("user") || 
      href.includes("auth") || 
      href.includes("login")
    ) {
      return (
        p.includes("account") || 
        p.includes("profile") || 
        p.includes("auth") || 
        p.includes("login") || 
        p.includes("user")
      );
    }
    return p === href || (href !== "/" && p.startsWith(href));
  });

  const effectiveActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  return (
    <div 
      className="md:hidden fixed bottom-3 left-0 right-0 z-50 pointer-events-none px-3.5 flex justify-center transition-all duration-300"
      style={{ bottom: "max(env(safe-area-inset-bottom, 0px) + 8px, 12px)" }}
    >
      <nav 
        aria-label="Mobile Navigation"
        className={cn(
          "pointer-events-auto relative w-full max-w-[390px]",
          "rounded-[26px] p-1.5",
          // Premium solid-glass with high opacity for crystal readability
          "bg-white/95 dark:bg-slate-900/95",
          "backdrop-blur-xl backdrop-saturate-150",
          // Subtle high-definition border & elevation shadow
          "border border-slate-200/90 dark:border-slate-800",
          "shadow-[0_12px_32px_-4px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.04)]",
          "dark:shadow-[0_14px_36px_-4px_rgba(0,0,0,0.6)]"
        )}
      >
        {/* Specular gloss top reflection beam */}
        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white dark:via-white/30 to-transparent pointer-events-none opacity-90" />

        {/* ── Realistic Liquid Water Droplet Sliding Indicator (পানির ফোঁটা) ── */}
        {activeIndex !== -1 && (
          <div
            className="absolute top-1.5 bottom-1.5 pointer-events-none transition-all duration-350 ease-[cubic-bezier(0.34,1.4,0.64,1)] z-0"
            style={{
              width: `calc((100% - 12px) / ${tabs.length})`,
              left: "6px",
              transform: `translateX(${effectiveActiveIndex * 100}%)`,
            }}
          >
            <div className="w-full h-full p-0.5">
              <div 
                className={cn(
                  "w-full h-full rounded-[20px] relative overflow-hidden",
                  // Fluid water gradient
                  "bg-gradient-to-b from-orange-500/20 via-orange-500/10 to-amber-500/25",
                  "dark:from-orange-500/30 dark:via-orange-500/15 dark:to-amber-500/30",
                  // Water droplet meniscus edge
                  "border border-orange-500/40 dark:border-orange-400/50",
                  // Specular liquid highlights and refraction
                  "shadow-[0_4px_14px_rgba(249,115,22,0.22),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(249,115,22,0.2)]",
                  "dark:shadow-[0_4px_16px_rgba(249,115,22,0.35),inset_0_2px_4px_rgba(255,255,255,0.35),inset_0_-2px_4px_rgba(249,115,22,0.3)]"
                )}
              >
                {/* Top specular curved glare (পানির ফোঁটার চকচকে রিফ্লেকশন) */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-[3.5px] bg-white/90 dark:bg-white/80 rounded-full blur-[0.2px] shadow-[0_0_3px_rgba(255,255,255,0.95)]" />
                
                {/* Subtle side sparkle */}
                <div className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-white/80 rounded-full blur-[0.2px]" />

                {/* Bottom caustic refraction */}
                <div className="absolute bottom-0.5 inset-x-2 h-[2px] bg-gradient-to-r from-transparent via-orange-400/40 to-transparent" />
              </div>
            </div>
          </div>
        )}

        <div 
          className="relative z-10 grid h-[52px] items-center gap-1" 
          style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
        >
          {tabs.map((tab, idx) => {
            const isActive = idx === activeIndex;
            const badgeCount = getBadgeCount(tab.badge);
            const IconComp = iconMap[tab.icon] || Home;

            return (
              <Link
                key={tab.label}
                to={tab.href}
                aria-label={tab.label}
                className={cn(
                  "flex flex-col items-center justify-center relative touch-manipulation h-full py-1.5 px-1 rounded-[18px] transition-all duration-200 active:scale-90 select-none group",
                  isActive 
                    ? "text-orange-600 dark:text-orange-500 font-semibold" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <div className="relative flex items-center justify-center">
                  <IconComp 
                    className={cn(
                      "h-[21px] w-[21px] transition-all duration-300",
                      isActive 
                        ? "stroke-[2.3] text-orange-600 dark:text-orange-500 scale-105 drop-shadow-[0_2px_8px_rgba(249,115,22,0.3)]" 
                        : "stroke-[1.85] text-slate-500 dark:text-slate-400 group-hover:scale-105"
                    )} 
                  />
                  
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-3 min-w-[18px] h-[18px] rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-white dark:border-slate-900 shadow-sm animate-in zoom-in-50 duration-150">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </div>

                <span className={cn(
                  "text-[10.5px] leading-tight tracking-tight transition-all duration-200 mt-1",
                  isActive 
                    ? "text-orange-600 dark:text-orange-500 font-bold drop-shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 font-medium"
                )}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

