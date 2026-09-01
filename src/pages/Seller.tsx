import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/firebaseAdapter";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Store, TrendingUp, MapPin, Package, ShieldCheck, Headphones, ChevronRight, Loader2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  { icon: MapPin, title: "64-District Coverage", desc: "Sell to customers across every district and upazila in Bangladesh" },
  { icon: TrendingUp, title: "Growth & Reseller Tools", desc: "Live order tracking, analytics, and marketing tools to boost revenue" },
  { icon: Package, title: "Automated Logistics", desc: "Doorstep parcel pickup and fast Cash on Delivery fulfillment" },
  { icon: ShieldCheck, title: "Zero Fraud Risk", desc: "Verified buyer delivery and guaranteed weekly disbursement" },
  { icon: DollarSign, title: "0% Setup Fee", desc: "Free registration with transparent seller commission" },
  { icon: Headphones, title: "Dedicated Support", desc: "Direct phone and WhatsApp support for merchant partners" },
];

const steps = [
  { step: 1, title: "Register Account", desc: "Sign up with your shop details and phone number" },
  { step: 2, title: "Upload Products", desc: "List your catalog with photos, specs, and prices" },
  { step: 3, title: "Start Selling", desc: "Receive orders with automatic rider pickup and weekly payouts" },
];

export default function Seller() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSellerStatus = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const { data: seller } = await supabase
          .from("sellers")
          .select("status")
          .eq("user_id", user.id)
          .single();

        if (seller) {
          if (seller.status === "approved") {
            navigate("/seller/dashboard", { replace: true });
            return;
          } else if (seller.status === "pending") {
            navigate("/seller/pending", { replace: true });
            return;
          }
        }
      } catch {
        // No seller record found - show marketing page
      }
      setChecking(false);
    };

    checkSellerStatus();
  }, [user, navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Sell on Durtup.shop - Bangladesh E-Commerce Seller Hub"
        description="Become a verified seller on Durtup.shop Bangladesh. 0% setup fee, reach millions of online shoppers across all 64 districts with automated courier fulfillment & weekly payouts."
        url="https://durtup.shop/seller"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Seller Hub", url: "/seller" },
        ]}
      />
      <Header />
      <main className="flex-1 pb-24 md:pb-0">
        <div className="bg-gradient-to-r from-primary to-orange-500 text-white py-10 sm:py-16 md:py-20">
          <div className="container px-4">
            <div className="max-w-2xl">
              <Store className="h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16 mb-3 sm:mb-4" />
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4 leading-tight">Sell on Durtup.shop</h1>
              <p className="text-sm sm:text-lg md:text-xl opacity-90 mb-5 sm:mb-8 leading-relaxed">
                Join hundreds of verified merchants and reach millions of online shoppers across Bangladesh
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4">
                <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 h-11 sm:h-11 font-bold" asChild>
                  <Link to={user ? "/seller/register" : "/register"}>
                    Start Selling Today
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10 h-11 sm:h-11" asChild>
                  <Link to="/contact">Contact Seller Team</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="container -mt-6 sm:-mt-10 relative z-10 px-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="bg-card border rounded-xl p-3 sm:p-6 text-center shadow-lg">
              <p className="text-lg sm:text-3xl font-bold text-primary">64/64</p>
              <p className="text-[11px] sm:text-base text-muted-foreground leading-tight">BD Districts</p>
            </div>
            <div className="bg-card border rounded-xl p-3 sm:p-6 text-center shadow-lg">
              <p className="text-lg sm:text-3xl font-bold text-primary">৳0</p>
              <p className="text-[11px] sm:text-base text-muted-foreground leading-tight">Setup Fee</p>
            </div>
            <div className="bg-card border rounded-xl p-3 sm:p-6 text-center shadow-lg">
              <p className="text-lg sm:text-3xl font-bold text-primary">100%</p>
              <p className="text-[11px] sm:text-base text-muted-foreground leading-tight">COD Guaranteed</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="container py-10 sm:py-16 px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">Why Sell on Durtup.shop?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="p-4 sm:p-6 bg-card border rounded-xl">
                <b.icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary mb-3 sm:mb-4" />
                <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">{b.title}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How to start */}
        <div className="bg-muted py-10 sm:py-16">
          <div className="container px-4">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">Get Started in 3 Easy Steps</h2>
            <div className="flex flex-col md:flex-row gap-3 sm:gap-6 max-w-4xl mx-auto">
              {steps.map((s) => (
                <div key={s.step} className="flex-1 p-4 sm:p-6 bg-card border rounded-xl text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 sm:mb-4 text-lg sm:text-xl font-bold">
                    {s.step}
                  </div>
                  <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="container py-10 sm:py-16 text-center px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">Ready to grow your e-commerce business in Bangladesh?</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-5 sm:mb-6">Join hundreds of successful merchants on Durtup.shop</p>
          <Button size="lg" className="w-full sm:w-auto h-11 font-bold" asChild>
            <Link to={user ? "/seller/register" : "/register"}>
              Create Seller Account <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
