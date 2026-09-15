import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Heart, 
  User, 
  Menu, 
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
import { CategoryPillsNav } from "@/components/layout/CategoryPillsNav";
import { cn } from "@/lib/utils";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const isHomePage = location.pathname === "/";
  const isCheckoutPage = location.pathname.toLowerCase() === "/checkout" || location.pathname.toLowerCase().startsWith("/checkout");
  const isMessagesPage = location.pathname.toLowerCase() === "/messages" || location.pathname.toLowerCase().startsWith("/messages");
  const hideSearch = isCheckoutPage || isMessagesPage;

  const { user, profile, signOut } = useAuth();
  const { itemCount: cartCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { toast } = useToast();
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

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
    <>
      {/* Main Header (Scrolls naturally with page content) */}
      <header className="relative w-full max-w-[100vw] bg-white dark:bg-slate-900 shadow-xs border-b border-slate-100 dark:border-slate-800">

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

            {/* Messages / Sigma AI Assistant */}
            <Link to="/messages" className="flex flex-col items-center justify-center p-1 sm:px-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-orange-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all relative group" title="Sigma AI Assistant">
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

            {/* Wishlist (Desktop) */}
            <Link to="/wishlist" className="hidden md:flex flex-col items-center justify-center p-1 sm:px-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-orange-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all relative group" title="Wishlist">
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
        {!hideSearch && (
          <div className="mt-2 md:hidden">
            <SmartSearchBar variant="mobile" />
          </div>
        )}
      </div>

      {/* 2. Fluid Slidable Category Pills Navigation (Visible ONLY on Home Page) */}
      {isHomePage && (
        <CategoryPillsNav />
      )}

    </header>
    </>
  );
}

export default Header;
