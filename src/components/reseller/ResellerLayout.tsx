import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  PlusCircle, 
  PackageCheck, 
  Wallet, 
  Sparkles, 
  Settings, 
  ArrowLeft, 
  Store, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight, 
  Share2, 
  TrendingUp, 
  Bell,
  HelpCircle,
  ExternalLink,
  Zap
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ResellerService, ResellerProfile } from "@/services/resellerService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ResellerLayoutProps {
  children: React.ReactNode;
}

export function ResellerLayout({ children }: ResellerLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile: authProfile, signOut } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resellerProfile, setResellerProfile] = useState<ResellerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If not logged in, redirect to login with reseller redirect
    if (!user) {
      // Auto allow guest preview or redirect to login
      const guestUid = "guest_reseller_" + (localStorage.getItem("durtup_guest_id") || "1");
      ResellerService.getProfile(guestUid, "reseller@durtup.shop", "New Reseller").then((prof) => {
        setResellerProfile(prof);
        setLoading(false);
      });
      return;
    }

    ResellerService.getProfile(user.id, user.email || "", authProfile?.full_name || "Reseller Partner")
      .then((prof) => {
        setResellerProfile(prof);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [user, authProfile]);

  const navItems = [
    {
      title: "ড্যাশবোর্ড",
      icon: LayoutDashboard,
      path: "/reseller/dashboard",
      badge: null,
    },
    {
      title: "হোলসেল ক্যাটালগ",
      icon: ShoppingBag,
      path: "/reseller/products",
      badge: "নতুন রেট",
    },
    {
      title: "কাস্টমার অর্ডার করুন",
      icon: PlusCircle,
      path: "/reseller/orders/new",
      badge: "ইনস্ট্যান্ট",
      highlight: true,
    },
    {
      title: "আমার অর্ডারসমূহ",
      icon: PackageCheck,
      path: "/reseller/orders",
      badge: resellerProfile?.totalOrders ? `${resellerProfile.totalOrders}` : null,
    },
    {
      title: "ওয়ালেট ও উইথড্রয়াল",
      icon: Wallet,
      path: "/reseller/wallet",
      badge: resellerProfile?.walletBalance ? `৳${resellerProfile.walletBalance}` : null,
    },
    {
      title: "মার্কেটিং ক্যাপশন ও ছবি",
      icon: Sparkles,
      path: "/reseller/marketing",
      badge: "রেডিমেড",
    },
    {
      title: "API ও অটোমেশন",
      icon: Zap,
      path: "/reseller/api",
      badge: "REST API",
    },
    {
      title: "শপ সেটিংস",
      icon: Settings,
      path: "/reseller/settings",
      badge: null,
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: "লগআউট সম্পন্ন হয়েছে" });
      navigate("/");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col font-sans">
      {/* Top Banner with Reseller Perks */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-2 mx-auto">
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            Reseller Partner Hub
          </span>
          <span className="hidden sm:inline">
            🚀 জিরো ইনভেস্টমেন্টে কাস্টমারের কাছে প্রোডাক্ট বিক্রি করুন এবং নিশ্চিত প্রফিট নিন!
          </span>
          <span className="sm:hidden">
            🚀 ঘরে বসেই নিশ্চিত প্রফিট আর্নিং করুন!
          </span>
        </div>
        <Link 
          to="/" 
          className="hidden md:flex items-center gap-1 text-white/90 hover:text-white underline text-[11px] shrink-0"
        >
          <span>মেইন শপে ফিরে যান</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Main Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <Link to="/reseller/dashboard" className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black shadow-md shadow-orange-500/20">
                <Store className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Durtup<span className="text-orange-600">.Reseller</span>
                  </span>
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[10px] px-1.5 py-0">
                    {resellerProfile?.level || "Partner"}
                  </Badge>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {resellerProfile?.shopName || "আমার রিসেলার শপ"}
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Stats in Header (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-3.5 py-1.5 rounded-xl flex items-center gap-2.5 shadow-xs">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm">
                ৳
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                  উইথড্রল ব্যালেন্স
                </span>
                <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300 leading-none">
                  ৳{resellerProfile?.walletBalance?.toLocaleString("en-IN") || 0}
                </span>
              </div>
            </div>

            <Button
              asChild
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-600/20"
            >
              <Link to="/reseller/orders/new" className="flex items-center gap-1.5">
                <PlusCircle className="h-4 w-4" />
                <span>নতুন কাস্টমার অর্ডার</span>
              </Link>
            </Button>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            <Link 
              to="/" 
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all"
            >
              <Store className="h-3.5 w-3.5 text-orange-600" />
              <span>শপ ভিজিট</span>
            </Link>

            <Link
              to="/reseller/wallet"
              className="md:hidden flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-xl text-xs font-bold border border-emerald-500/20"
            >
              <span>৳{resellerProfile?.walletBalance || 0}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
              title="লগআউট"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex gap-6">
        
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-6">
            
            {/* Reseller Shop Card */}
            <div className="bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent p-4 rounded-xl border border-orange-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">রিসেলার স্ট্যাটাস</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="font-extrabold text-slate-900 dark:text-white truncate">
                {resellerProfile?.shopName || "Reseller Shop"}
              </p>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {user?.email || "Partner Account"}
              </p>
              <div className="mt-3 pt-3 border-t border-orange-500/10 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">লেভেল:</span>
                <span className="font-bold text-orange-600">{resellerProfile?.level || "Bronze"} Partner</span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group",
                      isActive
                        ? "bg-orange-600 text-white shadow-md shadow-orange-600/25"
                        : item.highlight
                        ? "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-500 group-hover:text-orange-600")} />
                      <span>{item.title}</span>
                    </div>
                    {item.badge && (
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Support / Quick Help */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <HelpCircle className="h-4 w-4 text-orange-600" />
                  <span>সাহায্য প্রয়োজন?</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  রিসেলিং বা কুরিয়ার ডেলিভারি সংক্রান্ত যে কোনো সমস্যায় আমাদের হেল্পলাইনে মেসেজ দিন।
                </p>
                <a
                  href="https://wa.me/8801700000000"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline"
                >
                  <span>WhatsApp সাপোর্ট হেল্পলাইন</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-xs" 
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 h-full p-5 flex flex-col shadow-2xl z-10 overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-black">
                    <Store className="h-4 w-4" />
                  </div>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    Durtup Reseller
                  </span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile Profile Card */}
              <div className="bg-orange-50 dark:bg-orange-950/40 p-3.5 rounded-xl border border-orange-500/20 mb-4">
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  {resellerProfile?.shopName || "আমার শপ"}
                </p>
                <p className="text-xs text-slate-500">{user?.email || "Partner"}</p>
                <div className="mt-2 pt-2 border-t border-orange-500/10 flex justify-between text-xs font-semibold">
                  <span className="text-slate-500">ব্যালেন্স:</span>
                  <span className="text-emerald-600 font-extrabold">৳{resellerProfile?.walletBalance || 0}</span>
                </div>
              </div>

              {/* Mobile Nav Links */}
              <nav className="space-y-1.5 flex-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all",
                        isActive
                          ? "bg-orange-600 text-white font-bold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-500")} />
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Return to shop & logout */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 mt-auto">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  <Store className="h-4 w-4 text-orange-600" />
                  <span>মূল ওয়েবসাইটে যান</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-4 w-4" />
                  <span>লগআউট</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 min-w-0 pb-16 lg:pb-8">
          {children}
        </main>

      </div>

      {/* Floating Bottom Quick Action for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-around shadow-lg">
        <Link
          to="/reseller/dashboard"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs font-medium",
            location.pathname === "/reseller/dashboard" ? "text-orange-600 font-bold" : "text-slate-500"
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px]">ড্যাশবোর্ড</span>
        </Link>
        <Link
          to="/reseller/products"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs font-medium",
            location.pathname === "/reseller/products" ? "text-orange-600 font-bold" : "text-slate-500"
          )}
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="text-[10px]">ক্যাটালগ</span>
        </Link>
        <Link
          to="/reseller/orders/new"
          className="flex flex-col items-center justify-center -mt-5 bg-gradient-to-tr from-orange-600 to-amber-500 text-white h-12 w-12 rounded-full shadow-lg shadow-orange-600/40"
        >
          <PlusCircle className="h-6 w-6" />
        </Link>
        <Link
          to="/reseller/orders"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs font-medium",
            location.pathname === "/reseller/orders" ? "text-orange-600 font-bold" : "text-slate-500"
          )}
        >
          <PackageCheck className="h-5 w-5" />
          <span className="text-[10px]">অর্ডারসমূহ</span>
        </Link>
        <Link
          to="/reseller/wallet"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs font-medium",
            location.pathname === "/reseller/wallet" ? "text-orange-600 font-bold" : "text-slate-500"
          )}
        >
          <Wallet className="h-5 w-5" />
          <span className="text-[10px]">ওয়ালেট</span>
        </Link>
      </div>

    </div>
  );
}
