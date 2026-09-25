import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  Wallet, 
  Clock, 
  ShoppingBag, 
  PlusCircle, 
  ChevronRight, 
  ArrowUpRight, 
  Sparkles, 
  CheckCircle2, 
  Truck, 
  AlertCircle,
  Copy,
  ExternalLink,
  Store,
  Share2,
  Download,
  Flame,
  Check,
  Zap
} from "lucide-react";
import { ResellerLayout } from "@/components/reseller/ResellerLayout";
import { ResellerService, ResellerProfile, ResellerProduct, ResellerOrder } from "@/services/resellerService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";

export default function ResellerDashboard() {
  const { user, profile: authProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ResellerProfile | null>(null);
  const [products, setProducts] = useState<ResellerProduct[]>([]);
  const [orders, setOrders] = useState<ResellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const uid = user?.id || "guest_reseller_" + (localStorage.getItem("durtup_guest_id") || "1");
    const loadData = async () => {
      try {
        const [profData, prodsData, ordersData] = await Promise.all([
          ResellerService.getProfile(uid, user?.email || "", authProfile?.full_name || "New Partner"),
          ResellerService.getProducts(),
          ResellerService.getOrders(uid)
        ]);
        setProfile(profData);
        setProducts(prodsData.slice(0, 6));
        setOrders(ordersData.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, authProfile]);

  const handleCopyCaption = (product: ResellerProduct) => {
    navigator.clipboard.writeText(product.banglaDescription);
    setCopiedId(product.id);
    toast({
      title: "ক্যাপশন কপি হয়েছে!",
      description: "ফেসবুক পেজে পোস্ট করার জন্য বাংলা ক্যাপশন কপি করা হয়েছে।",
    });
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <ResellerLayout>
      <SEOHead title="রিসেলার ড্যাশবোর্ড - Durtup.shop" />

      <div className="space-y-6">
        {/* Top Welcome Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white p-6 sm:p-8 shadow-xl shadow-orange-600/15">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                <span>স্বাগতম রিসেলার পার্টনার!</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {profile?.shopName || "আপনার রিসেলার ড্যাশবোর্ড"}
              </h1>
              <p className="text-sm sm:text-base text-white/90 leading-relaxed font-medium">
                কোনো ইনভেস্টমেন্ট ছাড়াই Durtup-এর পাইকারি পণ্য ফেসবুকে সেল করুন এবং প্রতিটি অর্ডারে ২০০-৬০০ টাকা পর্যন্ত লাভ নিন।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-white text-orange-700 hover:bg-white/90 font-extrabold rounded-2xl shadow-lg shadow-black/10 text-sm"
              >
                <Link to="/reseller/orders/new" className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5" />
                  <span>কাস্টমার অর্ডার করুন</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-bold rounded-2xl backdrop-blur-xs text-sm"
              >
                <Link to="/reseller/products" className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  <span>হোলসেল ক্যাটালগ</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Background Abstract Glow */}
          <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -top-16 w-64 h-64 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />
        </div>

        {/* 4 Stat Overview Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Available Wallet Balance */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">উইথড্রল ব্যালেন্স</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
                ৳
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                ৳{profile?.walletBalance?.toLocaleString("en-IN") || 0}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 font-semibold">টুলার জন্য প্রস্তুত</span>
                <Link to="/reseller/wallet" className="text-xs font-bold text-orange-600 hover:underline flex items-center">
                  উইথড্র করুন <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* 2. Pending Profit Margin */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">পেন্ডিং প্রফিট</span>
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                ৳{profile?.pendingBalance?.toLocaleString("en-IN") || 0}
              </p>
              <div className="mt-2">
                <span className="text-[11px] text-slate-500 font-medium">ডেলিভারির পর ওয়ালেটে জমা হবে</span>
              </div>
            </div>
          </div>

          {/* 3. Total Customer Orders */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">মোট অর্ডার সংখ্যা</span>
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black">
                <Truck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {profile?.totalOrders || 0}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">ডেলিভারি সম্পন্ন: {profile?.deliveredOrders || 0}</span>
                <Link to="/reseller/orders" className="text-xs font-bold text-blue-600 hover:underline">
                  লিস্ট দেখুন
                </Link>
              </div>
            </div>
          </div>

          {/* 4. Lifetime Earnings */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">লাইফটাইম আর্নিং</span>
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-black">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                ৳{((profile?.walletBalance || 0) + (profile?.pendingBalance || 0))?.toLocaleString("en-IN") || 0}
              </p>
              <div className="mt-2">
                <span className="text-[11px] text-purple-600 font-bold">লেভেল: {profile?.level || "Bronze"} Partner</span>
              </div>
            </div>
          </div>

        </div>

        {/* 4 Quick Reseller Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 p-5 rounded-2xl border border-orange-500/20 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-orange-600 text-white flex items-center justify-center mb-3 shadow-md shadow-orange-600/20">
                <PlusCircle className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">১. কাস্টমার অর্ডার দিন</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                ফেসবুকে কাস্টমার পেলে তাদের নাম-ঠিকানা ও নির্ধারিত লাভে সরাসরি ড্রপশিপ অর্ডার প্লেস করুন।
              </p>
            </div>
            <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl mt-4 w-full text-xs">
              <Link to="/reseller/orders/new">অর্ডার ফর্ম খুলুন</Link>
            </Button>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 p-5 rounded-2xl border border-blue-500/20 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-md shadow-blue-600/20">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">২. হোলসেল ক্যাটালগ</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                গ্যাজেট ও ফ্যাশন আইটেমগুলোর হোলসেল প্রাইস ও লাভ মার্জিন দেখে ট্রেন্ডিং পণ্য বাছাই করুন।
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-bold rounded-xl mt-4 w-full text-xs">
              <Link to="/reseller/products">ক্যাটালগ দেখুন</Link>
            </Button>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 p-5 rounded-2xl border border-purple-500/20 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-3 shadow-md shadow-purple-600/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">৩. ছবি ও ক্যাপশন কপি</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                রেডিমেড প্রমোশনাল পোস্ট ও হাই-রেজুলেশন ছবি দিয়ে ফেসবুক ও টিকটকে পোস্ট করুন।
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 font-bold rounded-xl mt-4 w-full text-xs">
              <Link to="/reseller/marketing">মার্কেটিং কিট</Link>
            </Button>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-5 rounded-2xl border border-emerald-500/20 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-md shadow-emerald-600/20">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">৪. API ও অটোমেশন</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                আপনার WooCommerce বা নিজস্ব ওয়েবসাইট ইন্টিগ্রেশন করে অটোমেটিক অর্ডার সেল করুন।
              </p>
            </div>
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl mt-4 w-full text-xs shadow-xs">
              <Link to="/reseller/api">API সেটিংস ও কোড</Link>
            </Button>
          </div>

        </div>

        {/* Hot Reselling Trending Products for Resellers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-600 fill-orange-600" />
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                রিসেলারদের জন্য সর্বোচ্চ প্রফিটের ট্রেন্ডিং প্রোডাক্টসমূহ
              </h2>
            </div>
            <Link to="/reseller/products" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1">
              <span>সব প্রোডাক্ট দেখুন</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div 
                key={product.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                <div className="relative aspect-video sm:aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md">
                    ৳{product.suggestedProfit} নিশ্চিত লাভ
                  </div>
                  <Badge className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-xs text-white text-[10px]">
                    স্টক: {product.stock}+
                  </Badge>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {product.banglaName || product.name}
                    </h3>

                    {/* Price comparison box */}
                    <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-medium">পাইকারি রেট:</span>
                        <span className="font-black text-slate-900 dark:text-white text-sm">৳{product.wholesalePrice}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block font-medium">বিক্রয় মূল্য (MRP):</span>
                        <span className="font-bold text-orange-600 text-sm">৳{product.mrp}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <Button
                      onClick={() => handleCopyCaption(product)}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs font-bold rounded-xl h-9 border-slate-200 dark:border-slate-700"
                    >
                      {copiedId === product.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                          <span>কপি হয়েছে!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 mr-1 text-slate-500" />
                          <span>ক্যাপশন কপি</span>
                        </>
                      )}
                    </Button>

                    <Button
                      asChild
                      size="sm"
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl h-9 text-xs shadow-xs"
                    >
                      <Link to={`/reseller/orders/new?product=${product.id}`}>
                        অর্ডার করুন
                      </Link>
                    </Button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Customer Orders Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              আমার সাম্প্রতিক কাস্টমার অর্ডারসমূহ
            </h2>
            <Link to="/reseller/orders" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1">
              <span>সব অর্ডার দেখুন</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
              <Truck className="h-10 w-10 mx-auto text-slate-400" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                এখনো কোনো কাস্টমার অর্ডার দেওয়া হয়নি
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                ফেসবুক পেজ বা সোশ্যাল মিডিয়া থেকে কাস্টমার অর্ডার নিয়ে আমাদের ফর্মে সাবমিট করুন। আমরাই ক্যাশ অন ডেলিভারিতে পৌঁছে দেব!
              </p>
              <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl">
                <Link to="/reseller/orders/new">প্রথম অর্ডার করুন</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-bold">অর্ডার আইডি</th>
                    <th className="pb-3 font-bold">কাস্টমার নাম ও শহর</th>
                    <th className="pb-3 font-bold">প্রোডাক্ট</th>
                    <th className="pb-3 font-bold">কাস্টমার বিল</th>
                    <th className="pb-3 font-bold">আপনার প্রফিট</th>
                    <th className="pb-3 font-bold">কুরিয়ার স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-bold text-slate-900 dark:text-white">
                        {order.orderNumber}
                      </td>
                      <td className="py-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{order.customerName}</p>
                        <p className="text-[11px] text-slate-500">{order.customerCity}</p>
                      </td>
                      <td className="py-3">
                        <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[180px]">
                          {order.productName}
                        </p>
                      </td>
                      <td className="py-3 font-bold text-slate-900 dark:text-white">
                        ৳{order.totalCustomerBill}
                      </td>
                      <td className="py-3 font-extrabold text-emerald-600">
                        +৳{order.netProfit}
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="capitalize text-[10px] bg-orange-500/10 text-orange-600 border-orange-500/20">
                          {order.orderStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reseller Learning & Fast Profit Guide */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 sm:p-7 rounded-2xl space-y-4 shadow-md">
          <div className="flex items-center gap-2 text-orange-400">
            <Sparkles className="h-5 w-5" />
            <h3 className="font-bold text-base">কীভাবে বেশি বেশি রিসেলিং করে মাসে ২৫,০০০+ টাকা ইনকাম করবেন?</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
              <span className="text-orange-400 font-black text-sm block mb-1">ধাপ ১: ট্রেন্ডিং প্রোডাক্ট খুঁজুন</span>
              <p>হোলসেল ক্যাটালগ থেকে ট্রেন্ডিং গ্যাজেট বা স্মার্ট ওয়াচের ছবি ও বাংলা ক্যাপশন কপি করুন।</p>
            </div>
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
              <span className="text-orange-400 font-black text-sm block mb-1">ধাপ ২: ফেসবুকে পোস্ট বা রিল তৈরি করুন</span>
              <p>আপনার পেজে আকর্ষণীয় ছবি পোস্ট করুন এবং কাস্টমারের মেসেজের দ্রুত রিপ্লাই দিয়ে অর্ডার কনফার্ম করুন।</p>
            </div>
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
              <span className="text-orange-400 font-black text-sm block mb-1">ধাপ ৩: কাস্টমারের নামে অর্ডার সাবমিট</span>
              <p>কাস্টমারের তথ্য দিয়ে ড্রপশিপ অর্ডার দিন। ডেলিভারি শেষেই লাভ সরাসরি bKash-এ ক্যাশ আউট করুন!</p>
            </div>
          </div>
        </div>

      </div>
    </ResellerLayout>
  );
}
