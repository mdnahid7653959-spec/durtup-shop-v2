import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Wallet as WalletIcon, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Loader2, 
  Clock,
  Sparkles,
  Share2,
  AlertCircle,
  CheckCircle2,
  Smartphone,
  Info
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { db } from "@/integrations/firebase/client";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getReferralSettings, ReferralSettings, requestWithdrawal } from "@/services/referralService";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  direction?: string;
  category: string;
  description: string | null;
  status?: string;
  balance_after?: number;
  created_at: string;
}

export default function Wallet() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);

  // Withdraw Modal State
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("500");
  const [withdrawMethod, setWithdrawMethod] = useState<string>("bkash");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  // Top Up Dialog
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);

  const fetchWalletData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);

      // 1. Settings
      const s = await getReferralSettings();
      setSettings(s);

      // 2. Profile balance
      const pSnap = await getDoc(doc(db, "profiles", user.id));
      if (pSnap.exists()) {
        const d = pSnap.data();
        setWalletBalance(Number(d.wallet_balance || d.walletBalance || 0));
        setTotalEarned(Number(d.total_earned || d.totalEarned || 0));
      }

      // 3. Transactions
      const txQuery = query(
        collection(db, "wallet_transactions"),
        where("userId", "==", user.id)
      );
      const txSnap = await getDocs(txQuery);
      const txList: Transaction[] = [];

      txSnap.forEach((d) => {
        const data = d.data();
        txList.push({
          id: d.id,
          amount: Number(data.amount || 0),
          type: data.type || data.direction || "credit",
          direction: data.direction || data.type || "credit",
          category: data.category || "adjustment",
          description: data.description || null,
          status: data.status || "completed",
          balance_after: data.balance_after,
          created_at: data.created_at || data.createdAt || new Date().toISOString(),
        });
      });

      // Also query legacy user_id
      if (txList.length === 0) {
        const txLegacyQuery = query(
          collection(db, "wallet_transactions"),
          where("user_id", "==", user.id)
        );
        const legacySnap = await getDocs(txLegacyQuery);
        legacySnap.forEach((d) => {
          const data = d.data();
          if (!txList.some(x => x.id === d.id)) {
            txList.push({
              id: d.id,
              amount: Number(data.amount || 0),
              type: data.type || data.direction || "credit",
              direction: data.direction || data.type || "credit",
              category: data.category || "adjustment",
              description: data.description || null,
              status: data.status || "completed",
              balance_after: data.balance_after,
              created_at: data.created_at || data.createdAt || new Date().toISOString(),
            });
          }
        });
      }

      txList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(txList);
    } catch (error) {
      console.error("Error fetching wallet transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [user]);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amountNum = Number(withdrawAmount);
    const minAmount = settings?.minimumWithdrawAmount || 500;

    if (!amountNum || amountNum < minAmount) {
      toast({
        variant: "destructive",
        title: "ভুল উত্তোলন পরিমাণ",
        description: `সর্বনিম্ন উত্তোলনের পরিমাণ ৳${minAmount}`,
      });
      return;
    }

    if (amountNum > walletBalance) {
      toast({
        variant: "destructive",
        title: "অপর্যাপ্ত ব্যালেন্স",
        description: `আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। বর্তমান ব্যালেন্স: ৳${walletBalance}`,
      });
      return;
    }

    const cleanAcc = accountNumber.replace(/\D/g, "");
    if (cleanAcc.length < 11) {
      toast({
        variant: "destructive",
        title: "ভুল একাউন্ট নম্বর",
        description: "১১ ডিজিটের সঠিক মোবাইল ব্যাংকিং নম্বর প্রদান করুন।",
      });
      return;
    }

    try {
      setSubmittingWithdraw(true);
      const res = await requestWithdrawal(user.id, amountNum, withdrawMethod, cleanAcc);

      if (res?.success) {
        setWalletBalance(res.newBalance !== undefined ? res.newBalance : Math.max(0, walletBalance - amountNum));
        setWithdrawModalOpen(false);
        setAccountNumber("");
        toast({
          title: "উত্তোলন অনুরোধ সফল হয়েছে! 🎉",
          description: `৳${amountNum} উত্তোলনের অনুরোধ জমা হয়েছে। এডমিন দ্রুত আপনার ${withdrawMethod.toUpperCase()} (${cleanAcc})-এ টাকা পাঠিয়ে দেবেন।`,
        });
        fetchWalletData();
      } else {
        throw new Error(res?.error || "Withdrawal failed");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "উত্তোলন ত্রুটি",
        description: err.message || "Failed to process withdrawal request",
      });
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SEOHead title="My Wallet - Durtup.shop" description="Durtup customer wallet" />
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-4 max-w-sm px-4">
            <WalletIcon className="h-16 w-16 mx-auto text-muted-foreground/60" />
            <h2 className="text-xl font-bold">লগইন আবশ্যক</h2>
            <p className="text-sm text-muted-foreground">আপনার ওয়ালেট ব্যালেন্স দেখতে অনুগ্রহ করে লগইন করুন।</p>
            <Button onClick={() => navigate("/login?redirect=/wallet")} className="w-full font-bold">
              লগইন করুন
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <SEOHead title="My Wallet | Durtup.shop" description="Manage your Durtup wallet and referral earnings" />
      <Header />
      
      <main className="flex-1 pb-24 md:pb-12 pt-4">
        <div className="container max-w-3xl px-4 sm:px-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-black">My Wallet</h1>
            </div>
            <Link to="/referrals">
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
                <Share2 className="h-3.5 w-3.5" />
                Refer & Earn
              </Button>
            </Link>
          </div>

          {/* Balance Cards Grid */}
          <div className="grid sm:grid-cols-3 gap-4">
            {/* Primary Balance Card */}
            <Card className="sm:col-span-2 relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-amber-700 text-primary-foreground border-0 shadow-lg rounded-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <WalletIcon className="h-32 w-32" />
              </div>
              <CardContent className="p-6 relative z-10 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-primary-foreground/80 uppercase tracking-wider">
                    Available Balance
                  </p>
                  <p className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
                    ৳{walletBalance.toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-2">
                  <Button 
                    variant="secondary" 
                    onClick={() => setWithdrawModalOpen(true)}
                    className="flex-1 min-w-[120px] rounded-xl font-bold gap-2 shadow-sm"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Withdraw
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setTopUpModalOpen(true)}
                    className="rounded-xl font-bold bg-white/10 hover:bg-white/20 border-white/20 text-white gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Top Up
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Total Earned Card */}
            <Card className="rounded-2xl border shadow-sm bg-card flex flex-col justify-between">
              <CardContent className="p-6 space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Earned</span>
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-2xl font-black text-foreground">
                  ৳{totalEarned.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground leading-tight pt-1">
                  রেফারেল প্রোগ্রাম ও রিওয়ার্ড থেকে অর্জিত মোট আয়।
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Action Promo */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-primary/5 to-transparent border border-amber-500/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm">প্রতি রেফারেলে ৳৫০ বোনাস!</p>
                <p className="text-xs text-muted-foreground">বন্ধুদের ইনভাইট করে আরো বেশি ওয়ালেট ব্যালেন্স অর্জন করুন।</p>
              </div>
            </div>
            <Button asChild size="sm" className="rounded-xl font-bold shrink-0">
              <Link to="/referrals">Invite Now</Link>
            </Button>
          </div>

          {/* Transaction History */}
          <Card className="rounded-2xl border shadow-sm overflow-hidden bg-card">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Transaction History
                </CardTitle>
                <span className="text-xs text-muted-foreground font-semibold">
                  {transactions.length} Transactions
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <WalletIcon className="h-12 w-12 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="font-semibold text-muted-foreground text-sm">এখনো কোনো লেনদেন হয়নি</p>
                  <p className="text-xs text-muted-foreground">আপনার ওয়ালেট লেনদেনের হিসাব এখানে প্রদর্শিত হবে।</p>
                </div>
              ) : (
                <div className="divide-y">
                  {transactions.map((transaction) => {
                    const isCredit = transaction.type === "credit" || transaction.direction === "credit";
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                              isCredit
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-red-500/10 text-red-600"
                            )}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="h-5 w-5" />
                            ) : (
                              <ArrowUpRight className="h-5 w-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-sm text-foreground capitalize">
                                {transaction.category.replace(/_/g, " ")}
                              </p>
                              {transaction.status === "pending" && (
                                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-500/30">
                                  Pending
                                </Badge>
                              )}
                              {transaction.status === "cancelled" && (
                                <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                                  Cancelled
                                </Badge>
                              )}
                            </div>
                            {transaction.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {transaction.description}
                              </p>
                            )}
                            <p className="text-[11px] text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleDateString("en-BD", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p
                            className={cn(
                              "font-black text-sm sm:text-base",
                              isCredit ? "text-emerald-600" : "text-red-600"
                            )}
                          >
                            {isCredit ? "+" : "-"}৳{transaction.amount.toLocaleString()}
                          </p>
                          {transaction.balance_after !== undefined && (
                            <p className="text-[11px] text-muted-foreground">
                              Bal: ৳{transaction.balance_after.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Withdraw Modal */}
      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-primary" />
              ব্যালেন্স উত্তোলন (Withdraw)
            </DialogTitle>
            <DialogDescription className="text-xs">
              আপনার ওয়ালেটে বর্তমান ব্যালেন্স: <strong>৳{walletBalance.toLocaleString()}</strong>। 
              সর্বনিম্ন উত্তোলন: <strong>৳{settings?.minimumWithdrawAmount || 500}</strong>।
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleWithdrawSubmit} className="space-y-4 pt-2">
            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">উত্তোলনের পরিমাণ (টাকা)</Label>
              <Input
                type="number"
                min={settings?.minimumWithdrawAmount || 500}
                max={walletBalance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="500"
                className="rounded-xl h-11 text-base font-bold"
                required
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">পেমেন্ট মেথড নির্বাচন করুন</Label>
              <RadioGroup 
                value={withdrawMethod} 
                onValueChange={setWithdrawMethod}
                className="grid grid-cols-3 gap-2"
              >
                <div>
                  <RadioGroupItem value="bkash" id="w_bkash" className="peer sr-only" />
                  <Label 
                    htmlFor="w_bkash"
                    className="flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50 font-bold text-xs"
                  >
                    <Smartphone className="h-4 w-4 mb-1 text-pink-600" />
                    bKash
                  </Label>
                </div>

                <div>
                  <RadioGroupItem value="nagad" id="w_nagad" className="peer sr-only" />
                  <Label 
                    htmlFor="w_nagad"
                    className="flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50 font-bold text-xs"
                  >
                    <Smartphone className="h-4 w-4 mb-1 text-orange-600" />
                    Nagad
                  </Label>
                </div>

                <div>
                  <RadioGroupItem value="rocket" id="w_rocket" className="peer sr-only" />
                  <Label 
                    htmlFor="w_rocket"
                    className="flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50 font-bold text-xs"
                  >
                    <Smartphone className="h-4 w-4 mb-1 text-purple-600" />
                    Rocket
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Account Number */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{withdrawMethod.toUpperCase()} পার্সোনাল নম্বর</Label>
              <Input
                type="tel"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="017XXXXXXXX"
                className="rounded-xl h-11"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                টাকা পৌঁছানোর জন্য সঠিক পার্সোনাল একাউন্ট নম্বর দিন।
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setWithdrawModalOpen(false)}
                className="rounded-xl"
              >
                বাতিল
              </Button>
              <Button 
                type="submit" 
                disabled={submittingWithdraw || walletBalance < (settings?.minimumWithdrawAmount || 500)}
                className="rounded-xl font-bold"
              >
                {submittingWithdraw ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    প্রক্রিয়াধীন...
                  </>
                ) : (
                  "অনুরোধ জমা দিন"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Top Up Dialog */}
      <Dialog open={topUpModalOpen} onOpenChange={setTopUpModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              ওয়ালেট টপ-আপ
            </DialogTitle>
            <DialogDescription className="text-xs">
              Durtup ওয়ালেটে টাকা যোগ করুন
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm text-muted-foreground">
            <p className="leading-relaxed">
              আপনার ওয়ালেটে টাকা যোগ করতে অথবা রেফারেল প্রোগ্রাম ছাড়া সরাসরি টপ-আপ করতে আমাদের হটলাইনে যোগাযোগ করুন অথবা bKash মার্চেন্ট নাম্বারে পেমেন্ট করুন।
            </p>
            <div className="p-3 bg-muted rounded-xl text-xs space-y-1 text-foreground">
              <p className="font-bold">হেল্পলাইন / হোয়াটসঅ্যাপ সাপোর্টে যোগাযোগ করুন:</p>
              <p className="font-mono text-primary font-bold">+880 1806-487557</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setTopUpModalOpen(false)} className="rounded-xl font-bold">
              ঠিক আছে
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
