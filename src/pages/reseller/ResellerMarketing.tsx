import React, { useState } from "react";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Share2, 
  Flame, 
  MessageSquare, 
  Megaphone, 
  HelpCircle,
  Download,
  BookOpen
} from "lucide-react";
import { ResellerLayout } from "@/components/reseller/ResellerLayout";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";

const MARKETING_TEMPLATES = [
  {
    id: "temp-1",
    title: "🔥 ট্রেন্ডিং স্মার্ট গ্যাজেট অফার (ফেসবুক পেজ পোস্ট)",
    category: "Facebook Post",
    content: `🔥 সীমিত সময়ের ধামাকা অফার! 🔥\n\n✨ প্রিমিয়াম কোয়ালিটির গ্যাজেট এখন পাচ্ছেন আকর্ষণীয় ডিসকাউন্টে!\n\n📌 পণ্যের মূল আকর্ষণ:\n✅ ১০০% জেনুইন ও প্রিমিয়াম কোয়ালিটি\n✅ সারা বাংলাদেশে ক্যাশ অন ডেলিভারি (পণ্য দেখে টাকা দিন)\n✅ ৭ দিনের রিপ্লেসমেন্ট সুবিধা\n\n💰 রেগুলার প্রাইস: ৯৯৯ টাকা\n🔥 বিশেষ অফার প্রাইস: মাত্র ৬৫০ টাকা!\n\n👉 অর্ডার করতে এখনই ইনবক্সে আপনার নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা পাঠান!`,
  },
  {
    id: "temp-2",
    title: "⚡ টিকটক ও রিলস ক্যাপশন (Viral TikTok Caption)",
    category: "TikTok & Reels",
    content: `🔥 এতো কম দামে এতো প্রিমিয়াম গ্যাজেট আগে কখনো দেখেছেন? 😱\n\nসারাদেশে ক্যাশ অন ডেলিভারিতে হোম ডেলিভারি পেতে ইনবক্স করুন এখনই! স্টক সীমিত! 🏃‍♂️💨\n\n#trending #gadgets #viral #bangladesh #shopping #gadgetshop #foryou`,
  },
  {
    id: "temp-3",
    title: "💬 কাস্টমার ইনবক্স ক্লোজিং মেসেজ (Customer Inbox Script)",
    category: "Inbox Reply",
    content: `ধন্যবাদ স্যার! ❤️\n\nপণ্যটির রেগুলার মূল্য ৯৫০ টাকা হলেও আজকের বিশেষ অফারে পাচ্ছেন মাত্র ৬৫০ টাকায়!\n\nঢাকার ভিতরে ডেলিভারি চার্জ ৭০ টাকা এবং ঢাকার বাইরে ১৩০ টাকা।\n\nঅর্ডারটি কনফার্ম করতে অনুগ্রহ করে আপনার:\n১. সম্পূর্ণ নাম:\n২. মোবাইল নম্বর:\n৩. বিস্তারিত ঠিকানা (জেলা/থানা সহ):\n\nলিখে পাঠিয়ে দিন, আমরা আজই পার্সেল পাঠিয়ে দেব! 🚚✨`,
  },
  {
    id: "temp-4",
    title: "📢 ফেসবুক গ্রুপ ও কমিউনিটি শেয়ারিং পোস্ট",
    category: "FB Groups",
    content: `আসসালামু আলাইকুম সবাইকে! 👋\nআমাদের পেজে চলছে এক্সক্লুসিভ গ্যাজেট মেগা ডিসকাউন্ট সেল। ১০০% অরিজিনাল পণ্য, সাথে ক্যাশ অন ডেলিভারি এবং দ্রুততম ডেলিভারি নিশ্চয়তা। যারা ভালো মানের পণ্য খুঁজছেন তারা ইনবক্স করে বিস্তারিত জানতে পারেন! ধন্যবাদ। 🙏`,
  },
];

export default function ResellerMarketing() {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: "টেমপ্লেট কপি হয়েছে!" });
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <ResellerLayout>
      <SEOHead title="মার্কেটিং কিট ও সেলস ক্যাপশন - Durtup Reseller" />

      <div className="space-y-6">
        
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-orange-600" />
            <span>মার্কেটিং কিট ও রেডিমেড ক্যাপশন</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            আপনার ফেসবুক পেজ, টিকটক এবং হোয়াটসঅ্যাপে কপি-পেস্ট করে দ্রুত অর্ডার পাওয়ার প্রস্তুতকৃত কনটেন্ট।
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MARKETING_TEMPLATES.map((temp) => (
            <div
              key={temp.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600">
                    {temp.category}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {temp.title}
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {temp.content}
                </div>
              </div>

              <Button
                onClick={() => handleCopy(temp.id, temp.content)}
                variant="outline"
                size="sm"
                className="w-full font-bold rounded-xl h-10 border-slate-200 dark:border-slate-700 text-xs"
              >
                {copiedId === temp.id ? (
                  <>
                    <Check className="h-4 w-4 mr-1.5 text-emerald-600" />
                    <span>কপি সফল হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1.5 text-slate-500" />
                    <span>ক্যাপশন কপি করুন</span>
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Pro Reselling Tips */}
        <div className="bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent p-6 rounded-2xl border border-orange-500/20 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-orange-600" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              ফেসবুকে বেশি অর্ডার পাওয়ার ৪টি গোপন টিপস:
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700 dark:text-slate-300">
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border">
              <span className="font-bold text-orange-600 block mb-1">১. দ্রুত ইনবক্স রিপ্লাই:</span>
              <p>কাস্টমার কমেন্ট বা মেসেজ দেওয়ার ৫ মিনিটের মধ্যে রিপ্লাই দিলে অর্ডারের সম্ভাবনা ৮০% বেড়ে যায়।</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border">
              <span className="font-bold text-orange-600 block mb-1">২. ক্লিয়ার ভিডিও ও ছবি:</span>
              <p>আমাদের ক্যাটালগ থেকে হাই-রেজুলেশন ছবি ব্যবহার করুন এবং টিকটকে ছোট আনবক্সিং রিল পোস্ট করুন।</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border">
              <span className="font-bold text-orange-600 block mb-1">৩. কাস্টমারকে আশ্বস্ত করুন:</span>
              <p>কাস্টমারকে বলুন পণ্যটি ক্যাশ অন ডেলিভারিতে চেক করে মূল্য পরিশোধের সুযোগ রয়েছে।</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border">
              <span className="font-bold text-orange-600 block mb-1">৪. কুরিয়ার ডেলিভারি ট্র্যাকিং:</span>
              <p>অর্ডার সাবমিটের পর ট্র্যাকিং কোড কাস্টমারকে এসএমএস বা মেসেঞ্জারে পাঠিয়ে দিন।</p>
            </div>
          </div>
        </div>

      </div>
    </ResellerLayout>
  );
}
