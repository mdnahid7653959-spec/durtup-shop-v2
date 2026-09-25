import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { 
  PlusCircle, 
  ShoppingBag, 
  User, 
  Phone, 
  MapPin, 
  Truck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Sparkles,
  Calculator,
  ChevronRight,
  Store
} from "lucide-react";
import { ResellerLayout } from "@/components/reseller/ResellerLayout";
import { ResellerService, ResellerProduct, ResellerProfile } from "@/services/resellerService";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";

const BD_DISTRICTS = [
  "Dhaka", "Chattogram", "Gazipur", "Narayanganj", "Cumilla", "Sylhet", 
  "Rajshahi", "Khulna", "Bogura", "Mymensingh", "Barishal", "Rangpur",
  "Noakhali", "Feni", "Brahmanbaria", "Tangail", "Faridpur", "Cox's Bazar",
  "Jashore", "Kushtia", "Pabna", "Sirajganj", "Dinajpur", "Jamalpur"
];

export default function ResellerNewOrder() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile: authProfile } = useAuth();
  const { toast } = useToast();

  const queryParams = new URLSearchParams(location.search);
  const preselectedProductId = queryParams.get("product");
  const preselectedPrice = queryParams.get("price");

  const [products, setProducts] = useState<ResellerProduct[]>([]);
  const [profile, setProfile] = useState<ResellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState<string>(preselectedProductId || "");
  const [quantity, setQuantity] = useState<number>(1);
  const [customerSellingPrice, setCustomerSellingPrice] = useState<number>(0);
  const [deliveryArea, setDeliveryArea] = useState<"inside_dhaka" | "outside_dhaka">("inside_dhaka");
  const [deliveryFee, setDeliveryFee] = useState<number>(70);

  // Customer Information
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAltPhone, setCustomerAltPhone] = useState("");
  const [customerCity, setCustomerCity] = useState("Dhaka");
  const [customerAddress, setCustomerAddress] = useState("");

  // Sender / Reseller Branding
  const [resellerShopName, setResellerShopName] = useState("");
  const [resellerPhone, setResellerPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const uid = user?.id || "guest_reseller_" + (localStorage.getItem("durtup_guest_id") || "1");

    Promise.all([
      ResellerService.getProfile(uid, user?.email || "", authProfile?.full_name || "Partner"),
      ResellerService.getProducts()
    ]).then(([prof, prods]) => {
      setProfile(prof);
      setProducts(prods);
      setResellerShopName(prof.shopName || "My Online Shop");
      setResellerPhone(prof.phone || "");

      // Select preselected product or default to first
      const defaultProd = prods.find((p) => p.id === preselectedProductId) || prods[0];
      if (defaultProd) {
        setSelectedProductId(defaultProd.id);
        setCustomerSellingPrice(preselectedPrice ? Number(preselectedPrice) : defaultProd.mrp);
      }
      setLoading(false);
    });
  }, [user, authProfile, preselectedProductId, preselectedPrice]);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setCustomerSellingPrice(prod.mrp);
    }
  };

  const handleDeliveryAreaChange = (area: "inside_dhaka" | "outside_dhaka") => {
    setDeliveryArea(area);
    setDeliveryFee(area === "inside_dhaka" ? 70 : 130);
    if (area === "inside_dhaka" && customerCity !== "Dhaka") {
      setCustomerCity("Dhaka");
    }
  };

  // Calculations
  const wholesaleTotal = (selectedProduct?.wholesalePrice || 0) * quantity;
  const customerGoodsTotal = customerSellingPrice * quantity;
  const totalCustomerBill = customerGoodsTotal + deliveryFee;
  const netProfit = customerGoodsTotal - wholesaleTotal;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      toast({ variant: "destructive", title: "প্রোডাক্ট নির্বাচন করুন" });
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      toast({
        variant: "destructive",
        title: "তথ্য পূরণ করুন",
        description: "কাস্টমারের নাম, মোবাইল নাম্বার এবং সম্পূর্ণ ঠিকানা আবশ্যক।"
      });
      return;
    }

    if (customerPhone.replace(/\D/g, "").length < 11) {
      toast({
        variant: "destructive",
        title: "সঠিক মোবাইল নাম্বার দিন",
        description: "মোবাইল নম্বরটি কমপক্ষে ১১ ডিজিটের হতে হবে (যেমন: 017XXXXXXXX)।"
      });
      return;
    }

    if (customerSellingPrice < selectedProduct.wholesalePrice) {
      toast({
        variant: "destructive",
        title: "বিক্রয় মূল্য খুব কম",
        description: `বিক্রয় মূল্য কমপক্ষে পাইকারি রেট ৳${selectedProduct.wholesalePrice} বা তার বেশি হতে হবে।`
      });
      return;
    }

    setSubmitting(true);
    try {
      const uid = user?.id || "guest_reseller_" + (localStorage.getItem("durtup_guest_id") || "1");
      const order = await ResellerService.createOrder(uid, {
        product: selectedProduct,
        quantity: quantity,
        customerSellingPrice: customerSellingPrice,
        deliveryFee: deliveryFee,
        customerName: customerName,
        customerPhone: customerPhone,
        customerAltPhone: customerAltPhone,
        customerAddress: customerAddress,
        customerCity: customerCity,
        resellerShopName: resellerShopName,
        resellerPhone: resellerPhone,
        notes: notes,
      });

      toast({
        title: "🎉 অর্ডার সফলভাবে গ্রহণ করা হয়েছে!",
        description: `অর্ডার আইডি: ${order.orderNumber}। কাস্টমার ডেলিভারি নেওয়ার পর আপনার ওয়ালেটে ৳${netProfit} যুক্ত হবে।`,
      });

      navigate("/reseller/orders");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "অর্ডার সাবমিট ব্যর্থ হয়েছে",
        description: err.message || "কিছু সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResellerLayout>
      <SEOHead title="নতুন কাস্টমার ড্রপশিপ অর্ডার - Durtup Reseller" />

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/reseller/dashboard" className="hover:text-orange-600">ড্যাশবোর্ড</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/reseller/products" className="hover:text-orange-600">ক্যাটালগ</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-900 dark:text-white">নতুন কাস্টমার ড্রপশিপ অর্ডার</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <PlusCircle className="h-6 w-6 text-orange-600" />
              <span>কাস্টমারের নামে ড্রপশিপ অর্ডার তৈরি করুন</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              কাস্টমারের ডেলিভারি ঠিকানা দিন। পার্সেল ডেলিভারি শেষে আপনার প্রফিট স্বয়ংক্রিয়ভাবে জমা হবে।
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Form Inputs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Product Selection Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                <ShoppingBag className="h-4 w-4 text-orange-600" />
                <span>১. পণ্য ও বিক্রয় মূল্য নির্ধারণ</span>
              </div>

              {/* Product Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  প্রোডাক্ট বেছে নিন *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.banglaName || p.name} — (হোলসেল: ৳{p.wholesalePrice} | MRP: ৳{p.mrp})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Product Highlight Card */}
              {selectedProduct && (
                <div className="flex items-center gap-3 p-3.5 bg-orange-50/60 dark:bg-orange-950/30 rounded-xl border border-orange-500/20">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="h-16 w-16 rounded-xl object-cover border bg-white"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                      {selectedProduct.banglaName || selectedProduct.name}
                    </h4>
                    <div className="mt-1 flex items-center gap-3 text-[11px]">
                      <span className="text-slate-500">
                        হোলসেল রেট: <b className="text-slate-800 dark:text-slate-200">৳{selectedProduct.wholesalePrice}</b>
                      </span>
                      <span className="text-slate-500">
                        সাজেস্টেড MRP: <b className="text-orange-600">৳{selectedProduct.mrp}</b>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity & Selling Price Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    অর্ডার পরিমাণ (Quantity)
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-l-xl border border-slate-200 dark:border-slate-700 font-black text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                    >
                      -
                    </button>
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-10 rounded-none text-center font-black text-sm border-x-0"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-r-xl border border-slate-200 dark:border-slate-700 font-black text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    আপনার কাস্টমার বিক্রয় মূল্য (প্রতি পিস) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                    <Input
                      type="number"
                      required
                      value={customerSellingPrice}
                      onChange={(e) => setCustomerSellingPrice(Number(e.target.value))}
                      className="pl-7 rounded-xl font-black text-base text-orange-600 h-10"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* 2. Customer Delivery Address Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                <MapPin className="h-4 w-4 text-orange-600" />
                <span>২. কাস্টমারের ডেলিভারি ঠিকানা (COD পার্সেল)</span>
              </div>

              {/* Delivery Fee Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ডেলিভারি এরিয়া বেছে নিন *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleDeliveryAreaChange("inside_dhaka")}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      deliveryArea === "inside_dhaka"
                        ? "border-orange-600 bg-orange-50 dark:bg-orange-950/30 text-orange-600 ring-2 ring-orange-500/20"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <div>
                      <p className="font-extrabold text-xs">ঢাকার ভিতরে</p>
                      <p className="text-[10px] opacity-80">হোম ডেলিভারি (২৪-৪৮ ঘণ্টা)</p>
                    </div>
                    <span className="font-black text-sm">৳৭০</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeliveryAreaChange("outside_dhaka")}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      deliveryArea === "outside_dhaka"
                        ? "border-orange-600 bg-orange-50 dark:bg-orange-950/30 text-orange-600 ring-2 ring-orange-500/20"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <div>
                      <p className="font-extrabold text-xs">ঢাকার বাইরে</p>
                      <p className="text-[10px] opacity-80">সারা বাংলাদেশ (২-৪ দিন)</p>
                    </div>
                    <span className="font-black text-sm">৳১৩০</span>
                  </button>
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    কাস্টমারের পুরো নাম *
                  </label>
                  <Input
                    required
                    placeholder="যেমন: তানভীর আহমেদ"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="rounded-xl text-xs h-10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    কাস্টমারের মোবাইল নম্বর *
                  </label>
                  <Input
                    required
                    type="tel"
                    placeholder="017XXXXXXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="rounded-xl text-xs h-10"
                  />
                </div>
              </div>

              {/* Alternate phone & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    বিকল্প মোবাইল নম্বর (যদি থাকে)
                  </label>
                  <Input
                    type="tel"
                    placeholder="018XXXXXXXX"
                    value={customerAltPhone}
                    onChange={(e) => setCustomerAltPhone(e.target.value)}
                    className="rounded-xl text-xs h-10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    জেলা (District) *
                  </label>
                  <select
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    {BD_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Full Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  কাস্টমারের পূর্ণ ঠিকানা (রোড, বাড়ি, থানা/উপজেলা) *
                </label>
                <Textarea
                  required
                  placeholder="যেমন: বাড়ি #১২, রোড #৪, সেক্টর #৩, উত্তরা, ঢাকা"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  rows={3}
                  className="rounded-xl text-xs"
                />
              </div>

            </div>

            {/* 3. Parcel Branding (Sender Information) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                <Store className="h-4 w-4 text-orange-600" />
                <span>৩. পার্সেল প্রেরক তথ্য (আপনার ব্র্যান্ড নেইম)</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                ডেলিভারি চালানের প্যাকেটে আপনার এই দোকানের নাম ও নম্বর প্রেরক হিসেবে থাকবে যাতে কাস্টমার বোঝে পণ্যটি আপনার পেজ থেকেই গেছে।
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    আপনার শপ / পেজের নাম
                  </label>
                  <Input
                    value={resellerShopName}
                    onChange={(e) => setResellerShopName(e.target.value)}
                    placeholder="যেমন: Smart Gadget BD"
                    className="rounded-xl text-xs h-10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    আপনার কাস্টমার কেয়ার নম্বর
                  </label>
                  <Input
                    value={resellerPhone}
                    onChange={(e) => setResellerPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="rounded-xl text-xs h-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  কুরিয়ার ডেলিভারি নোট (ঐচ্ছিক)
                </label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="যেমন: ডেলিভারির আগে কল দিয়ে নিবেন..."
                  className="rounded-xl text-xs h-10"
                />
              </div>
            </div>

          </div>

          {/* Right 1 Col: Live Invoice & Profit Breakdown Sticky Summary */}
          <div className="space-y-4">
            <div className="sticky top-24 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
              
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calculator className="h-4 w-4 text-orange-600" />
                  <span>অর্ডার সারসংক্ষেপ ও লাইভ প্রফিট</span>
                </h3>
              </div>

              {/* Item breakdown */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>কাস্টমার সেলিং মূল্য ({quantity}x ৳{customerSellingPrice}):</span>
                  <span className="font-bold">৳{customerGoodsTotal}</span>
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>ডেলিভারি চার্জ:</span>
                  <span className="font-bold">৳{deliveryFee}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-slate-900 dark:text-white font-extrabold text-sm">
                  <span>কাস্টমার ক্যাশ অন ডেলিভারি বিল:</span>
                  <span className="text-orange-600 font-black">৳{totalCustomerBill}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-slate-500">
                  <span>পাইকারি বেস রেট ({quantity}x ৳{selectedProduct?.wholesalePrice || 0}):</span>
                  <span className="font-bold">-৳{wholesaleTotal}</span>
                </div>
              </div>

              {/* Profit Highlight Banner */}
              <div className="bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-emerald-500/5 p-4 rounded-xl border border-emerald-500/30 text-center space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  আপনার নিশ্চিত প্রফিট মার্জিন
                </span>
                <p className="text-2xl font-black text-emerald-600">
                  +৳{Math.max(0, netProfit)}
                </p>
                <p className="text-[10px] text-slate-500">
                  কাস্টমার ডেলিভারি নেওয়ার সাথে সাথে এই লাভ আপনার ওয়ালেটে ক্রেডিট হবে।
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-xl h-12 shadow-lg shadow-orange-600/30 text-sm"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    অর্ডার সাবমিট হচ্ছে...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    অর্ডার কনফার্ম করুন
                  </span>
                )}
              </Button>

              <div className="text-[10px] text-center text-slate-400">
                🔒 ১০০% নিরাপদ ডেলিভারি ও জেনুইন পণ্য নিশ্চয়তা।
              </div>

            </div>
          </div>

        </form>

      </div>
    </ResellerLayout>
  );
}
