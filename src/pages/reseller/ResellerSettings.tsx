import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Store, 
  Phone, 
  CreditCard, 
  CheckCircle2, 
  User, 
  ShieldCheck 
} from "lucide-react";
import { ResellerLayout } from "@/components/reseller/ResellerLayout";
import { ResellerService, ResellerProfile } from "@/services/resellerService";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";

export default function ResellerSettings() {
  const { user, profile: authProfile } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ResellerProfile | null>(null);
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"bkash" | "nagad" | "rocket" | "bank">("bkash");
  const [paymentAccount, setPaymentAccount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const uid = user?.id || "guest_reseller_" + (localStorage.getItem("durtup_guest_id") || "1");
    ResellerService.getProfile(uid, user?.email || "", authProfile?.full_name || "Partner")
      .then((p) => {
        setProfile(p);
        setShopName(p.shopName || "");
        setPhone(p.phone || "");
        setWhatsapp(p.whatsapp || "");
        setPaymentMethod(p.defaultPaymentMethod || "bkash");
        setPaymentAccount(p.defaultPaymentAccount || "");
      });
  }, [user, authProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      toast({ variant: "destructive", title: "শপের নাম আবশ্যক" });
      return;
    }

    setSaving(true);
    try {
      const uid = user?.id || "guest_reseller_" + (localStorage.getItem("durtup_guest_id") || "1");
      const updated = await ResellerService.updateProfile(uid, {
        shopName,
        phone,
        whatsapp,
        defaultPaymentMethod: paymentMethod,
        defaultPaymentAccount: paymentAccount,
      });
      setProfile(updated);
      toast({
        title: "✅ সেটিংস সেভ হয়েছে!",
        description: "আপনার রিসেলার প্রোফাইল ও পার্সেল ব্র্যান্ডিং আপডেট হয়েছে।",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "সেভ করা যায়নি",
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResellerLayout>
      <SEOHead title="শপ সেটিংস - Durtup Reseller" />

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-orange-600" />
            <span>রিসেলার শপ সেটিংস ও প্রোফাইল</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            আপনার ফেসবুক পেজের নাম এবং ডিফল্ট পেমেন্ট তথ্য সংরক্ষণ করুন।
          </p>
        </div>

        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 text-xs">
          
          {/* Shop Branding */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white border-b pb-2">
              <Store className="h-4 w-4 text-orange-600" />
              <span>শপ ও ব্র্যান্ড তথ্য (পার্সেলের প্যাকেটে যাবে)</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                আপনার শপ / পেজের নাম *
              </label>
              <Input
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="যেমন: BD Smart Mart"
                className="rounded-xl text-xs h-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  কাস্টমার হেল্পলাইন ফোন
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="rounded-xl text-xs h-10"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp নম্বর
                </label>
                <Input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="rounded-xl text-xs h-10"
                />
              </div>
            </div>
          </div>

          {/* Default Payout */}
          <div className="space-y-4 pt-3 border-t">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white border-b pb-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <span>ডিফল্ট পে-আউট মেথড (টাকা তোলার জন্য)</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                পেমেন্ট মেথড
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "bkash", label: "bKash" },
                  { id: "nagad", label: "Nagad" },
                  { id: "rocket", label: "Rocket" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-2 rounded-xl border font-bold text-center transition-all ${
                      paymentMethod === m.id
                        ? "border-orange-600 bg-orange-50 dark:bg-orange-950/40 text-orange-600 font-extrabold"
                        : "border-slate-200 dark:border-slate-700 text-slate-600"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {paymentMethod.toUpperCase()} পার্সোনাল একাউন্ট নম্বর
              </label>
              <Input
                type="tel"
                value={paymentAccount}
                onChange={(e) => setPaymentAccount(e.target.value)}
                placeholder="017XXXXXXXX"
                className="rounded-xl text-xs h-10"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl h-11 text-xs shadow-md shadow-orange-600/20"
          >
            {saving ? "সেভ হচ্ছে..." : "সেটিংস সংরক্ষণ করুন"}
          </Button>

        </form>
      </div>
    </ResellerLayout>
  );
}
