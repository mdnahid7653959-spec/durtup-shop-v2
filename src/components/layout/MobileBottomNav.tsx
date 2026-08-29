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
        <div 
          className="grid h-[52px] items-center gap-1" 
          style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
        >
          {tabs.map((tab) => {
            const isActive = 
              location.pathname === tab.href || 
              (tab.href !== "/" && location.pathname.startsWith(tab.href));
            const badgeCount = getBadgeCount(tab.badge);
            const IconComp = iconMap[tab.icon] || Home;

            return (
              <Link
                key={tab.label}
                to={tab.href}
                aria-label={tab.label}
                className={cn(
                  "flex flex-col items-center justify-center relative touch-manipulation h-full py-1.5 px-1 rounded-[18px] transition-all duration-200 active:scale-95 select-none group",
                  isActive 
                    ? "text-orange-600 dark:text-orange-500 font-semibold" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {/* Active Pill Highlight */}
                {isActive && (
                  <span className="absolute inset-0.5 rounded-[18px] bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/15 dark:border-orange-500/30 animate-in fade-in zoom-in-95 duration-150" />
                )}

                <div className="relative z-10 flex items-center justify-center">
                  <IconComp 
                    className={cn(
                      "h-[21px] w-[21px] transition-all duration-200",
                      isActive 
                        ? "stroke-[2.3] text-orange-600 dark:text-orange-500 scale-105" 
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
                  "text-[10.5px] leading-tight tracking-tight transition-all duration-200 z-10 mt-1",
                  isActive 
                    ? "text-orange-600 dark:text-orange-500 font-bold" 
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

