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
      className="md:hidden fixed bottom-3.5 left-3.5 right-3.5 z-50 pointer-events-none transition-all duration-300"
      style={{ bottom: "max(env(safe-area-inset-bottom, 0px), 14px)" }}
    >
      <nav 
        aria-label="Mobile Navigation"
        className="pointer-events-auto max-w-md mx-auto bg-white/95 dark:bg-card/95 backdrop-blur-xl border-2 border-primary/90 dark:border-primary/80 rounded-full shadow-[0_12px_32px_-4px_rgba(0,0,0,0.18),0_4px_12px_-2px_rgba(0,0,0,0.08)] px-2 py-1 transition-all"
      >
        <div 
          className="grid h-[54px] items-center" 
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
                  "flex flex-col items-center justify-center gap-0.5 relative touch-manipulation py-1 rounded-full transition-all duration-200 active:scale-95",
                  isActive 
                    ? "text-primary font-semibold" 
                    : "text-slate-600 dark:text-slate-300 hover:text-foreground font-medium"
                )}
              >
                <div className="relative flex items-center justify-center">
                  <IconComp 
                    className={cn(
                      "h-5 w-5 transition-all duration-200",
                      isActive 
                        ? "stroke-[2.2] scale-105" 
                        : "stroke-[1.8] opacity-85 hover:opacity-100"
                    )} 
                  />
                  
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1 shadow-sm animate-in zoom-in-50 duration-200">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[11px] leading-tight tracking-tight select-none transition-colors",
                  isActive ? "text-primary font-semibold" : "text-slate-600 dark:text-slate-300"
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

