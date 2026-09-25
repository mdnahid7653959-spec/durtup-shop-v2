import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  ShoppingBag, 
  Copy, 
  Check, 
  Download, 
  Calculator, 
  Filter, 
  PlusCircle, 
  ExternalLink,
  Sparkles,
  Info,
  X
} from "lucide-react";
import { ResellerLayout } from "@/components/reseller/ResellerLayout";
import { ResellerService, ResellerProduct } from "@/services/resellerService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ResellerProducts() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ResellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"margin" | "price_asc" | "price_desc">("margin");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Profit Calculator Modal State
  const [calcProduct, setCalcProduct] = useState<ResellerProduct | null>(null);
  const [calcCustomPrice, setCalcCustomPrice] = useState<number>(0);
  const [calcDeliveryFee, setCalcDeliveryFee] = useState<number>(70);

  // Image Preview Modal
  const [imageModalProduct, setImageModalProduct] = useState<ResellerProduct | null>(null);

  useEffect(() => {
    ResellerService.getProducts()
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch = 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.banglaName && p.banglaName.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCat = selectedCategory === "all" || p.category === selectedCategory;
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        if (sortBy === "margin") return b.suggestedProfit - a.suggestedProfit;
        if (sortBy === "price_asc") return a.wholesalePrice - b.wholesalePrice;
        if (sortBy === "price_desc") return b.wholesalePrice - a.wholesalePrice;
        return 0;
      });
  }, [products, searchTerm, selectedCategory, sortBy]);

  const handleCopyCaption = (product: ResellerProduct) => {
    navigator.clipboard.writeText(product.banglaDescription);
    setCopiedId(product.id);
    toast({
      title: "ক্যাপশন কপি হয়েছে!",
      description: "ফেসবুকে পোস্ট করার জন্য রেডিমেড বাংলা ডেসক্রিপশন কপি হয়েছে।",
    });
    setTimeout(() => setCopiedId(null), 2500);
  };

  const openCalculator = (product: ResellerProduct) => {
    setCalcProduct(product);
    setCalcCustomPrice(product.mrp);
  };

  return (
    <ResellerLayout>
      <SEOHead title="হোলসেল প্রোডাক্ট হাব - Durtup Reseller" />

      <div className="space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-orange-600" />
              <span>রিসেলিং হোলসেল ক্যাটালগ</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              পাইকারি মূল্যে পণ্য বেছে নিন, আপনার কাঙ্ক্ষিত মূল্যে ফেসবুকে বিক্রি করুন এবং প্রতি অর্ডারে নিশ্চিত লাভ রাখুন।
            </p>
          </div>

          <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-600/20 text-xs">
            <Link to="/reseller/orders/new" className="flex items-center gap-1.5">
              <PlusCircle className="h-4 w-4" />
              <span>সরাসরি কাস্টমার অর্ডার দিন</span>
            </Link>
          </Button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="প্রোডাক্টের নাম দিয়ে খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-xl border-slate-200 dark:border-slate-800 text-xs h-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">সর্ট:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="margin">🔥 সর্বোচ্চ লাভ (Max Profit)</option>
                <option value="price_asc">কম হোলসেল রেট</option>
                <option value="price_desc">বেশি হোলসেল রেট</option>
              </select>
            </div>

          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-orange-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {cat === "all" ? "সকল ক্যাটাগরি" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              {/* Product Image Header */}
              <div>
                <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  
                  {/* Profit Badge */}
                  <div className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>৳{product.suggestedProfit} লাভ</span>
                  </div>

                  {/* Stock Badge */}
                  <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    স্টক: {product.stock}+
                  </div>

                  {/* Quick Action Overlay Icons */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                    <button
                      onClick={() => setImageModalProduct(product)}
                      className="h-8 w-8 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-slate-700 dark:text-slate-200 hover:text-orange-600 shadow-md flex items-center justify-center transition-all"
                      title="ছবি দেখুন ও ডাউনলোড করুন"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openCalculator(product)}
                      className="h-8 w-8 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-slate-700 dark:text-slate-200 hover:text-orange-600 shadow-md flex items-center justify-center transition-all"
                      title="প্রফিট ক্যালকুলেটর"
                    >
                      <Calculator className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                      {product.category}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug mt-0.5">
                      {product.banglaName || product.name}
                    </h3>
                  </div>

                  {/* Wholesale Pricing Table */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">পাইকারি রেট:</span>
                      <span className="font-black text-slate-900 dark:text-white text-sm">৳{product.wholesalePrice}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">সাজেস্টেড MRP:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">৳{product.mrp}</span>
                    </div>
                    <div className="pt-1 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-emerald-600 font-extrabold">
                      <span>আপনার সম্ভাব্য প্রফিট:</span>
                      <span>+৳{product.suggestedProfit}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleCopyCaption(product)}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs font-bold rounded-xl h-9 border-slate-200 dark:border-slate-700"
                  >
                    {copiedId === product.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                        <span>কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1 text-slate-500" />
                        <span>ক্যাপশন কপি</span>
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => openCalculator(product)}
                    variant="outline"
                    size="sm"
                    className="px-2.5 h-9 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600"
                    title="ক্যালকুলেটর"
                  >
                    <Calculator className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  asChild
                  size="sm"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl h-9 text-xs shadow-xs"
                >
                  <Link to={`/reseller/orders/new?product=${product.id}`}>
                    <PlusCircle className="h-4 w-4 mr-1.5" />
                    <span>কাস্টমার অর্ডার করুন</span>
                  </Link>
                </Button>
              </div>

            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <ShoppingBag className="h-12 w-12 mx-auto text-slate-400 mb-3" />
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
            <p className="text-xs text-slate-500 mt-1">অনুগ্রহ করে অন্য কি-ওয়ার্ড বা ক্যাটাগরি দিয়ে চেষ্টা করুন।</p>
          </div>
        )}

      </div>

      {/* 1. Live Profit Calculator Dialog */}
      <Dialog open={!!calcProduct} onOpenChange={(open) => !open && setCalcProduct(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Calculator className="h-5 w-5 text-orange-600" />
              <span>প্রফিট মার্জিন ক্যালকুলেটর</span>
            </DialogTitle>
          </DialogHeader>

          {calcProduct && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border">
                <img src={calcProduct.image} alt={calcProduct.name} className="h-12 w-12 rounded-lg object-cover" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{calcProduct.banglaName || calcProduct.name}</h4>
                  <p className="text-slate-500">হোলসেল রেট: ৳{calcProduct.wholesalePrice}</p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  আপনি কাস্টমারের কাছে কত টাকায় বিক্রি করবেন? (৳)
                </label>
                <Input
                  type="number"
                  value={calcCustomPrice}
                  onChange={(e) => setCalcCustomPrice(Number(e.target.value))}
                  className="rounded-xl font-black text-base text-orange-600 h-11"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ডেলিভারি এরিয়া
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCalcDeliveryFee(70)}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      calcDeliveryFee === 70 ? "border-orange-600 bg-orange-50 dark:bg-orange-950/40 text-orange-600" : "border-slate-200 text-slate-600"
                    }`}
                  >
                    ঢাকার ভিতরে (৳৭০)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcDeliveryFee(130)}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      calcDeliveryFee === 130 ? "border-orange-600 bg-orange-50 dark:bg-orange-950/40 text-orange-600" : "border-slate-200 text-slate-600"
                    }`}
                  >
                    ঢাকার বাইরে (৳১৩০)
                  </button>
                </div>
              </div>

              {/* Real-time breakdown */}
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4 rounded-xl border border-emerald-500/20 space-y-2">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>কাস্টমার ক্যাশ অন ডেলিভারি বিল:</span>
                  <span className="font-bold">৳{calcCustomPrice + calcDeliveryFee}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>পণ্যের পাইকারি রেট:</span>
                  <span className="font-bold">-৳{calcProduct.wholesalePrice}</span>
                </div>
                <div className="pt-2 border-t border-emerald-500/20 flex justify-between text-sm font-black text-emerald-600">
                  <span>আপনার নিশ্চিত নেট প্রফিট:</span>
                  <span className="text-base">৳{Math.max(0, calcCustomPrice - calcProduct.wholesalePrice)}</span>
                </div>
              </div>

              <Button
                asChild
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl h-11"
              >
                <Link to={`/reseller/orders/new?product=${calcProduct.id}&price=${calcCustomPrice}`}>
                  এই মূল্যে অর্ডার করুন
                </Link>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 2. Image Preview & Download Dialog */}
      <Dialog open={!!imageModalProduct} onOpenChange={(open) => !open && setImageModalProduct(null)}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black">
              প্রোডাক্ট ফটো কালেকশন
            </DialogTitle>
          </DialogHeader>

          {imageModalProduct && (
            <div className="space-y-4">
              <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 border">
                <img src={imageModalProduct.image} alt={imageModalProduct.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = imageModalProduct.image;
                    link.download = `${imageModalProduct.slug}.jpg`;
                    link.target = "_blank";
                    link.click();
                    toast({ title: "ছবি ডাউনলোড হচ্ছে..." });
                  }}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl"
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  <span>হাই-রেজুলেশন ছবি ডাউনলোড</span>
                </Button>
                <Button
                  onClick={() => handleCopyCaption(imageModalProduct)}
                  variant="outline"
                  className="rounded-xl font-bold"
                >
                  <Copy className="h-4 w-4 mr-1.5" />
                  <span>ক্যাপশন কপি</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </ResellerLayout>
  );
}
