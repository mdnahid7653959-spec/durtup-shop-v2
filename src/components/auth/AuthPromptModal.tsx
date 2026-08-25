import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShoppingBag, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck,
  Gift
} from "lucide-react";

export interface AuthModalProductPayload {
  id: string;
  name: string;
  image?: string;
  price: number;
  quantity?: number;
  selectedVariants?: Record<string, string>;
  isCJ?: boolean;
  cjProductId?: string;
}

export interface AuthModalOptions {
  redirectUrl?: string;
  product?: AuthModalProductPayload;
  title?: string;
  message?: string;
  isWelcome?: boolean;
}

export function openAuthModal(options?: AuthModalOptions) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open_auth_modal", { detail: options || {} }));
  }
}

export const AuthPromptModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<AuthModalOptions>({});
  const [tab, setTab] = useState<"register" | "login">("register");

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { user, signIn, signUp } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Listen to open_auth_modal events
  useEffect(() => {
    const handleOpen = (e: any) => {
      const opts: AuthModalOptions = e.detail || {};
      setOptions(opts);
      setTab(opts.isWelcome ? "register" : "register");
      setOpen(true);
    };

    window.addEventListener("open_auth_modal", handleOpen as EventListener);
    return () => {
      window.removeEventListener("open_auth_modal", handleOpen as EventListener);
    };
  }, []);

  // Show welcome modal for new guest visitors after 3.5 seconds
  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = setTimeout(() => {
      if (!user) {
        try {
          const shown = sessionStorage.getItem("durtup_welcome_auth_shown");
          if (!shown) {
            sessionStorage.setItem("durtup_welcome_auth_shown", "true");
            setOptions({
              isWelcome: true,
              title: "🎉 Welcome to Durtup.shop!",
              message: "একটি অ্যাকাউন্ট তৈরি করুন এবং পেয়ে যান ২০% স্পেশাল ওয়েলকাম ডিসকাউন্ট ও দ্রুততম চেকআউট সুবিধা!"
            });
            setTab("register");
            setOpen(true);
          }
        } catch {}
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [user]);

  // Handle post-auth success action
  const handleAuthSuccess = async () => {
    setOpen(false);

    // If a product was queued for purchase
    if (options.product) {
      const p = options.product;
      const qty = p.quantity || 1;

      if (p.isCJ) {
        try {
          const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
          const idx = existingCart.findIndex((item: any) => item.id === p.id);
          if (idx >= 0) {
            existingCart[idx].quantity += qty;
          } else {
            existingCart.push({
              id: p.id,
              name: p.name,
              price: p.price,
              image: p.image || "/durtup-logo.png",
              quantity: qty,
              source: "cj",
              cjProductId: p.cjProductId || p.id,
            });
          }
          localStorage.setItem("cart", JSON.stringify(existingCart));
          window.dispatchEvent(new Event("cart-updated"));
        } catch {}
      } else {
        await addToCart(p.id, qty, p.selectedVariants);
      }

      toast({
        title: "অ্যাকাউন্ট ভেরিফাইড! 🎉",
        description: `"${p.name}" চেকআউটে যোগ করা হয়েছে। অর্ডার সম্পন্ন করুন।`
      });

      navigate(options.redirectUrl || "/checkout");
      return;
    }

    if (options.redirectUrl) {
      navigate(options.redirectUrl);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      toast({ variant: "destructive", title: "তথ্য পূরণ করুন", description: "নাম, ইমেইল এবং পাসওয়ার্ড আবশ্যক।" });
      return;
    }
    if (password.length < 6) {
      toast({ variant: "destructive", title: "পাসওয়ার্ড ছোট", description: "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।" });
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, fullName.trim());
      toast({
        title: "অ্যাকাউন্ট তৈরি সফল হয়েছে! 🎉",
        description: "Welcome to Durtup.shop! ২০% ডিসকাউন্ট কোড: DURTUP2026"
      });
      await handleAuthSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "রেজিস্ট্রেশন ব্যর্থ", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast({ variant: "destructive", title: "তথ্য পূরণ করুন", description: "ইমেইল এবং পাসওয়ার্ড আবশ্যক।" });
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      toast({
        title: "লগইন সফল হয়েছে! 🛍️",
        description: "স্বাগতম! আপনার অ্যাকাউন্টে লগইন হয়েছে।"
      });
      await handleAuthSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "লগইন ব্যর্থ", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      const { signInWithGoogle } = await import("@/integrations/firebase/client");
      await signInWithGoogle();
      toast({
        title: "Google দিয়ে সফলভাবে সাইন ইন হয়েছে! 🎉",
        description: "Welcome to Durtup.shop!"
      });
      await handleAuthSuccess();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Google সাইন ইন ব্যর্থ",
        description: err.message || "Google Authentication failed"
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[94vw] max-w-md p-0 overflow-hidden bg-card border-2 border-primary/20 shadow-2xl rounded-2xl sm:rounded-3xl">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white p-5 sm:p-6 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 shadow-inner border border-white/30">
              {options.product ? (
                <ShoppingBag className="h-6 w-6 text-white" />
              ) : (
                <Gift className="h-6 w-6 text-amber-300 animate-bounce" />
              )}
            </div>

            <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {options.title || (options.product ? "অর্ডার করতে অ্যাকাউন্ট তৈরি করুন" : "Welcome to Durtup.shop!")}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-orange-100 mt-1 max-w-xs font-medium">
              {options.message || (options.product 
                ? "প্রোডাক্টটি কিনতে ও লাইভ অর্ডার ট্র্যাক করতে ১-ক্লিকে অ্যাকাউন্ট তৈরি করুন।" 
                : "অ্যাকাউন্ট তৈরি করলেই পাচ্ছেন ২০% ওয়েলকাম ডিসকাউন্ট ও দ্রুত অর্ডার সুবিধা!")}
            </DialogDescription>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Target Product Preview Card (if user clicked Buy Now) */}
          {options.product && (
            <div className="p-3 bg-muted/60 border border-primary/20 rounded-xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-background overflow-hidden border shrink-0">
                <img
                  src={options.product.image || "/durtup-logo.png"}
                  alt="Product"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">
                  {options.product.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-black text-primary">
                    ৳{options.product.price.toLocaleString()}
                  </span>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-emerald-500/10 text-emerald-600 font-bold border-0">
                    Express Buy
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* 1-Click Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleGoogleAuth}
            disabled={googleLoading || loading}
            className="w-full h-11 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold shadow-sm flex items-center justify-center gap-2.5 rounded-xl transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? "Connecting..." : "Google দিয়ে ১-ক্লিকে সাইন ইন"}</span>
          </Button>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-border" />
            <span className="flex-shrink mx-3 text-[11px] text-muted-foreground font-semibold uppercase">
              অথবা ইমেইল দিয়ে
            </span>
            <div className="flex-grow border-t border-border" />
          </div>

          {/* Tabs: Create Account vs Log In */}
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-2 w-full h-10 p-1 bg-muted rounded-xl mb-3">
              <TabsTrigger value="register" className="text-xs font-bold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                নতুন অ্যাকাউন্ট (Sign Up)
              </TabsTrigger>
              <TabsTrigger value="login" className="text-xs font-bold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                লগইন (Sign In)
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: REGISTRATION */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">আপনার নাম</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="e.g. Md Nahid"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-9 h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">ইমেইল অ্যাড্রেস</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="yourname@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9 h-10 text-xs rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md mt-2"
                >
                  {loading ? "অ্যাকাউন্ট তৈরি হচ্ছে..." : "অ্যাকাউন্ট তৈরি করুন ও চেকআউট এ যান 🚀"}
                </Button>
              </form>
            </TabsContent>

            {/* TAB 2: LOGIN */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">ইমেইল অ্যাড্রেস</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="yourname@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">পাসওয়ার্ড</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9 h-10 text-xs rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md mt-2"
                >
                  {loading ? "লগইন হচ্ছে..." : "লগইন করুন ও চেকআউট এ যান 🛍️"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center pt-1 border-t">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>১০০% নিরাপদ ও সুরক্ষিত বাংলাদেশ ইকমার্স প্ল্যাটফর্ম</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthPromptModal;
