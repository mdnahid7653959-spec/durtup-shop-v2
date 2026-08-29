import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Shapes, 
  LayoutGrid, 
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
  category: Shapes,
  categories: Shapes,
  grid: LayoutGrid,
  "layout-grid": LayoutGrid,
  shapes: Shapes,
  "shopping-cart": ShoppingCart,
  cart: ShoppingCart,
  package: Package,
  orders: Package,
  user: User,
  account: User,
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
      className="md:hidden fixed bottom-2.5 left-0 right-0 z-50 pointer-events-none px-4 transition-all duration-300"
      style={{ bottom: "max(env(safe-area-inset-bottom, 0px) + 6px, 10px)" }}
    >
      <nav 
        aria-label="Mobile Navigation"
        className="pointer-events-auto max-w-[330px] sm:max-w-[350px] mx-auto bg-white/92 dark:bg-slate-950/92 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-full shadow-[0_8px_28px_-6px_rgba(0,0,0,0.15),0_2px_8px_-2px_rgba(0,0,0,0.06)] px-1.5 py-0.5 ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
      >
        <div 
          className="grid h-[42px] items-center" 
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
                  "flex flex-col items-center justify-center relative touch-manipulation py-0.5 px-1 rounded-full transition-all duration-200 active:scale-90 select-none group",
                  isActive 
                    ? "text-orange-600 font-bold" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {/* Micro active background indicator pill */}
                {isActive && (
                  <span className="absolute inset-0.5 bg-orange-500/[0.09] dark:bg-orange-500/20 rounded-full -z-0 animate-in fade-in zoom-in-95 duration-150" />
                )}

                <div className="relative z-10 flex items-center justify-center">
                  <IconComp 
                    className={cn(
                      "h-[17px] w-[17px] transition-all duration-200",
                      isActive 
                        ? "stroke-[2.3] text-orange-600 scale-105" 
                        : "stroke-[1.7] opacity-80 group-hover:opacity-100"
                    )} 
                  />
                  
                  {badgeCount > 0 && (
                    <span className="absolute -top-1 -right-2.5 min-w-[13px] h-[13px] rounded-full bg-orange-600 text-white text-[8.5px] font-black flex items-center justify-center px-0.5 shadow-sm shadow-orange-600/30 animate-in zoom-in-50 duration-150">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </div>

                <span className={cn(
                  "text-[9px] leading-tight tracking-tight transition-colors z-10 mt-0.5",
                  isActive 
                    ? "text-orange-600 font-bold" 
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

