import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Share2, 
  Copy, 
  Check, 
  Gift, 
  Users, 
  CheckCircle2, 
  Clock, 
  Wallet, 
  ArrowRight, 
  ShoppingBag, 
  Sparkles,
  MessageSquare,
  Facebook,
  Send,
  Loader2,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";
import { getReferralSettings, ReferralSettings, ensureUserReferralProfile } from "@/services/referralService";

interface ReferralRecord {
  id: string;
  referredUserId?: string;
  orderId?: string;
  orderNumber?: string;
  orderAmount?: number;
  rewardAmount?: number;
  status: string;
  createdAt: string;
  rewardedAt?: string;
  friendName?: string;
}

export default function Referrals() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [userProfileData, setUserProfileData] = useState<any>(null);

  // Fetch Referral Code, Profile, Stats & Referral History
  useEffect(() => {
    if (!user && !authLoading) {
      navigate("/login?redirect=/referrals");
      return;
    }

    if (!user) return;

    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);

        // 1. Load Settings
        const s = await getReferralSettings();
        if (isMounted) setSettings(s);

        // 2. Ensure user has referral profile
        const { referralCode } = await ensureUserReferralProfile(user!.id, user!.email, user!.displayName);

        // 3. Load latest Profile doc for accurate balance
        const pSnap = await getDoc(doc(db, "profiles", user!.id));
        const pData = pSnap.exists() ? pSnap.data() : {};
        if (isMounted) {
          setUserProfileData({
            ...pData,
            referralCode: pData.referralCode || pData.referral_code || referralCode,
            walletBalance: Number(pData.wallet_balance || pData.walletBalance || 0),
            totalEarned: Number(pData.total_earned || pData.totalEarned || 0),
            successfulReferrals: Number(pData.successful_referrals || pData.successfulReferrals || 0),
          });
        }

        // 4. Fetch Referrals history where referrerId == user.id
        try {
          const refQuery = query(
            collection(db, "referrals"),
            where("referrerId", "==", user!.id)
          );
          const refSnap = await getDocs(refQuery);
          const list: ReferralRecord[] = [];

          for (const d of refSnap.docs) {
            const rData = d.data();
            list.push({
              id: d.id,
              referredUserId: rData.referredUserId,
              orderId: rData.orderId,
              orderNumber: rData.orderNumber || rData.orderId,
              orderAmount: Number(rData.orderAmount || 0),
              rewardAmount: Number(rData.rewardAmount || s.referrerReward || 50),
              status: rData.status || (rData.rewarded ? "rewarded" : "pending"),
              createdAt: rData.createdAt || new Date().toISOString(),
              rewardedAt: rData.rewardedAt,
              friendName: rData.referredUserId ? `Customer (${rData.referredUserId.slice(0, 6)}...)` : "Friend"
            });
          }

          // Sort descending by date
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          if (isMounted) setReferrals(list);
        } catch (e) {
          console.warn("Referrals history fetch notice:", e);
        }
      } catch (err) {
        console.error("Error loading referral data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, navigate]);

  const referralCode = userProfileData?.referralCode || (profile as any)?.referralCode || "DURTUP";
  const referralUrl = `https://durtup.shop/?ref=${referralCode}`;

  const shareText = `আমি Durtup.shop থেকে শপিং করছি! তুমি আমার রেফারেল লিংক ব্যবহার করে প্রথম অর্ডারে ৳${settings?.newCustomerDiscount || 30} ছাড় পাবে:\n${referralUrl}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(referralUrl);
      } else {
        const input = document.createElement("input");
        input.value = referralUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      toast({
        title: "লিংক কপি হয়েছে! 🎉",
        description: "রেফারেল লিংকটি বন্ধুদের সাথে শেয়ার করুন।",
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({
        title: "কপি করা সম্ভব হয়নি",
        description: "অনুগ্রহ করে লিংকটি ম্যানুয়ালি কপি করুন।",
        variant: "destructive"
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Durtup Refer & Earn",
          text: shareText,
          url: referralUrl,
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const shareViaWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  const shareViaFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`;
    window.open(url, "_blank");
  };

  const shareViaMessenger = () => {
    const url = `fb-messenger://share/?link=${encodeURIComponent(referralUrl)}`;
    window.open(url, "_blank");
  };

  const totalReferralsCount = referrals.length;
  const successfulCount = referrals.filter(r => r.status === "rewarded").length;
  const pendingCount = referrals.filter(r => r.status === "pending" || r.status === "qualified").length;
  const totalEarned = userProfileData?.totalEarned || (successfulCount * (settings?.referrerReward || 50));
  const availableBalance = userProfileData?.walletBalance || 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SEOHead 
          title="Refer & Earn - Durtup.shop" 
          description="Durtup-এ বন্ধুদের রেফার করুন এবং প্রতি সফল অর্ডারে ৳৫০ রিওয়ার্ড উপার্জন করুন।" 
        />
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground font-medium">রেফারেল ড্যাশবোর্ড লোড হচ্ছে...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <SEOHead 
        title="Refer & Earn | Durtup.shop" 
        description="বন্ধুকে Durtup-এ আনুন, দুজনেই লাভবান হন। প্রতি রেফারেলে ৳৫০ বোনাস ও নতুন গ্রাহকদের প্রথম অর্ডারে ৳৩০ ছাড়।" 
      />
      <Header />

      <main className="flex-1 pb-20 pt-4 sm:pt-6">
        <div className="container max-w-4xl px-4 sm:px-6 space-y-6">

          {/* Hero Banner Image */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl border border-primary/20 bg-gradient-to-r from-orange-500 to-amber-600">
            <img 
              src="/referral-banner.png" 
              alt="Durtup Refer & Earn" 
              className="w-full h-auto object-cover rounded-2xl sm:rounded-3xl select-none block"
              loading="eager"
            />
          </div>

          {/* Referral Link & Share Box */}
          <Card className="border shadow-md rounded-2xl overflow-hidden bg-card">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  আপনার ইউনিক রেফারেল লিংক
                </span>
                <Badge variant="outline" className="font-mono text-xs font-bold px-2.5 py-0.5 bg-primary/10 text-primary border-primary/30">
                  CODE: {referralCode}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* Copy URL bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 bg-muted/60 border rounded-xl px-3.5 py-2.5 text-sm font-mono text-foreground truncate select-all">
                  {referralUrl}
                </div>
                <Button 
                  onClick={handleCopyLink} 
                  className="h-11 px-5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                  variant={copied ? "default" : "default"}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? "কপি হয়েছে!" : "Copy Link"}</span>
                </Button>
              </div>

              {/* Share Buttons */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                  সরাসরি শেয়ার করুন:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <Button 
                    variant="outline" 
                    onClick={shareViaWhatsApp}
                    className="h-11 rounded-xl border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-600 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                    <span>WhatsApp</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={shareViaFacebook}
                    className="h-11 rounded-xl border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-600 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    <Facebook className="h-4 w-4 text-blue-600" />
                    <span>Facebook</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={shareViaMessenger}
                    className="h-11 rounded-xl border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-600 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4 text-sky-600" />
                    <span>Messenger</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={handleNativeShare}
                    className="h-11 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    <Share2 className="h-4 w-4 text-primary" />
                    <span>More Share</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card className="border shadow-sm rounded-2xl bg-card">
              <CardContent className="p-4 sm:p-5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-xs font-medium">Total Referrals</span>
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-foreground">{totalReferralsCount}</p>
                <p className="text-[11px] text-muted-foreground">মোট যুক্ত বন্ধু</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm rounded-2xl bg-card">
              <CardContent className="p-4 sm:p-5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-xs font-medium">Successful</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600">{successfulCount}</p>
                <p className="text-[11px] text-muted-foreground">ডেলিভার্ড ও রিওয়ার্ডেড</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm rounded-2xl bg-card">
              <CardContent className="p-4 sm:p-5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-xs font-medium">Total Earned</span>
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-foreground">৳{totalEarned.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground">মোট অর্জিত আয়</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-4 sm:p-5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Available Balance</span>
                  <Wallet className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600">৳{availableBalance.toLocaleString()}</p>
                <Link to="/wallet" className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline">
                  <span>উত্তোলন করুন</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <Card className="border shadow-sm rounded-2xl overflow-hidden bg-card">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                কীভাবে কাজ করে?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-muted/40 border flex flex-col items-center text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-base">
                    ১
                  </div>
                  <h4 className="font-bold text-sm">লিংক শেয়ার করুন</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    আপনার ইউনিক রেফারেল লিংক কপি করে সোশ্যাল মিডিয়ায় বা বন্ধুদের সাথে শেয়ার করুন।
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border flex flex-col items-center text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-base">
                    ২
                  </div>
                  <h4 className="font-bold text-sm">বন্ধু অর্ডার করবে</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    বন্ধু আপনার লিংকের মাধ্যমে একাউন্ট খুলে ন্যূনতম ৳{settings?.minimumOrderAmount || 500} টাকার প্রথম অর্ডারে ৳{settings?.newCustomerDiscount || 30} ছাড় পাবেন।
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border flex flex-col items-center text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 font-bold flex items-center justify-center text-base">
                    ৩
                  </div>
                  <h4 className="font-bold text-sm">৳{settings?.referrerReward || 50} রিওয়ার্ড গ্রহণ করুন</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    অর্ডারটি সফলভাবে ডেলিভারি হওয়ার সাথে সাথেই আপনার ওয়ালেটে ৳{settings?.referrerReward || 50} যোগ হবে, যা bKash/Nagad-এ ক্যাশআউট করতে পারবেন!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referral History Table */}
          <Card className="border shadow-sm rounded-2xl overflow-hidden bg-card">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  রেফারেল ইতিহাস (Referral History)
                </CardTitle>
                <span className="text-xs text-muted-foreground font-semibold">
                  {referrals.length} জন রেফার্ড
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {referrals.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <Users className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                  <p className="font-semibold text-muted-foreground text-sm">এখনো কোনো রেফারেল রেকর্ড নেই</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    আপনার রেফারেল লিংকটি বন্ধুদের সাথে শেয়ার করুন এবং প্রতি সফল অর্ডারে বোনাস উপভোগ করুন।
                  </p>
                  <Button onClick={handleCopyLink} variant="outline" size="sm" className="rounded-xl mt-2 font-semibold">
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    রেফারেল লিংক কপি করুন
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {referrals.map((r) => (
                    <div key={r.id} className="p-4 flex items-center justify-between flex-wrap gap-3 hover:bg-muted/20 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{r.friendName}</span>
                          <Badge 
                            variant="secondary"
                            className={
                              r.status === "rewarded" 
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 font-semibold text-[10px]"
                                : r.status === "pending" || r.status === "qualified"
                                ? "bg-amber-500/10 text-amber-700 border-amber-500/20 font-semibold text-[10px]"
                                : "bg-muted text-muted-foreground font-semibold text-[10px]"
                            }
                          >
                            {r.status === "rewarded" ? "Rewarded" : r.status === "pending" ? "Order Pending" : r.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Order #{r.orderNumber || r.orderId} • {new Date(r.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-600">
                          {r.status === "rewarded" ? `+৳${r.rewardAmount}` : `৳${r.rewardAmount} (Pending)`}
                        </p>
                        {r.orderAmount ? (
                          <p className="text-[11px] text-muted-foreground">Order: ৳{r.orderAmount}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>

      <Footer />
    </div>
  );
}
