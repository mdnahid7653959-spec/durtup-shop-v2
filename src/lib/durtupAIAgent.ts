/**
 * SIGMA — Powered by Durtup.shop
 * Client-Side AI Personal Shopping Manager & Action Integration Layer
 */

import { FAST_SEED_PRODUCTS } from "@/data/fastSeedCatalog";
import type { Product } from "@/components/products/ProductCard";
import { getCachedMohasagorProducts } from "@/utils/mohasagorCache";
import type {
  SigmaChatResponse,
  SigmaProductCardData,
  SigmaComparisonData,
  SigmaOrderDraft,
  SigmaTrackingData,
  SigmaSupportTicketData,
  SigmaActionPayload
} from "@/server/sigmaServerEngine";

export type {
  SigmaChatResponse,
  SigmaProductCardData,
  SigmaComparisonData,
  SigmaOrderDraft,
  SigmaTrackingData,
  SigmaSupportTicketData,
  SigmaActionPayload
};

export interface ChatHistoryItem {
  sender: "user" | "ai";
  text: string;
  userImage?: string;
}

export interface AIMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
  userImage?: string;
  products?: SigmaProductCardData[];
  comparison?: SigmaComparisonData;
  orderDraft?: SigmaOrderDraft;
  tracking?: SigmaTrackingData;
  ticket?: SigmaSupportTicketData;
  toolActivity?: string;
  quickActions?: Array<{ label: string; action: string; link?: string }>;
}

/**
 * Call the Secure Server-Side Endpoint /api/ai/chat
 */
export async function askSigmaAIAgent(
  query: string,
  options?: {
    userName?: string;
    userId?: string;
    catalog?: Product[];
    cartState?: any[];
    imageAttachment?: { base64: string; mimeType: string; previewUrl?: string };
    history?: ChatHistoryItem[];
    pageContext?: {
      currentPath?: string;
      productId?: string;
      categorySlug?: string;
    };
  }
): Promise<SigmaChatResponse> {
  const trimmed = query.trim();
  const q = trimmed.toLowerCase();
  const userName = options?.userName || "";

  // 1. Try server-side API endpoint if reachable
  try {
    const payload = {
      query: trimmed,
      userName,
      userId: options?.userId || "guest",
      history: options?.history || [],
      cartState: options?.cartState || [],
      imageAttachment: options?.imageAttachment ? {
        base64: options.imageAttachment.base64,
        mimeType: options.imageAttachment.mimeType
      } : undefined,
      pageContext: options?.pageContext
    };

    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data: SigmaChatResponse = await response.json();
      if (data && data.text && !data.text.includes("error")) {
        return data;
      }
    }
  } catch (err) {
    // Fallthrough to built-in conversational NLU engine
  }

  // 2. Built-in High Precision Conversational & Shopping NLU Engine

  // A. Greetings & Well-being (কেমন আছো / Hello / Hi / Salam)
  const isGreeting = 
    /^(hlw|hello|hi|helo|hey|hola|salam|assalamu|as-salamu|asalam|kemon|kmn|valoi|valo|ki obostha|ki obstha|kemon achen|kemon acho)/i.test(q) ||
    q.includes("kemon acho") ||
    q.includes("kemon achen") ||
    q.includes("kmn aso") ||
    q.includes("kmn acho") ||
    q.includes("valo acho") ||
    q.includes("ki khobor") ||
    q.includes("ki obstha") ||
    q.includes("ki obostha") ||
    q === "hi" ||
    q === "hlw" ||
    q === "hello" ||
    q === "hey";

  if (isGreeting) {
    const greetingName = userName ? ` **${userName}**` : "";
    return {
      text: `আলহামদুলিল্লাহ, আমি খুব ভালো আছি! 😊${greetingName ? `\n\nস্বাগতম${greetingName}!` : ""}\n\nআমি **Sigma** — Durtup.shop-এর অফিসিয়াল Personal Shopping Manager। আপনি কেমন আছেন? আজ আপনাকে কী ধরনের প্রোডাক্ট খুঁজতে বা কেনাকাটায় সাহায্য করতে পারি?`,
      quickActions: [
        { label: "🔥 সেরা গ্যাজেট দেখাও", action: "best_gadgets" },
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
        { label: "💵 ক্যাশ অন ডেলিভারি", action: "payment_info" }
      ]
    };
  }

  // B. Identity / Who are you (তুমি কে / তোমার নাম কী)
  if (
    q.includes("tumi ke") ||
    q.includes("tomar nam") ||
    q.includes("who are you") ||
    q.includes("what is your name") ||
    q.includes("about you") ||
    q.includes("sigma ke") ||
    q.includes("sigma ki")
  ) {
    return {
      text: `আমি **Sigma**, Durtup.shop-এর অফিশিয়াল AI পার্সোনাল শপিং ম্যানেজার! 🛍️✨\n\nআমি আপনাকে সেরা ও জেনুইন প্রোডাক্ট খুঁজে পেতে, দাম ও স্পেসিফিকেশন তুলনা করতে, কার্ট ম্যানেজ করতে এবং সরাসরি অর্ডার করতে সাহায্য করি। আজ কী খুঁজতে চান বলুন?`,
      quickActions: [
        { label: "🔥 সেরা গ্যাজেট দেখাও", action: "best_gadgets" },
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "⚡ সব প্রোডাক্ট দেখুন", action: "view_products", link: "/products" }
      ]
    };
  }

  // C. Gratitude & Appreciation (ধন্যবাদ / Thanks / Good / Valo)
  if (
    /^(thanks|thank you|thx|dhonnobad|dhonnobaad|shukriya|valo|bhalo|onek valo|great|nice|super|osadharon|ok|thik ache|accha|acha|hmm)$/i.test(q) ||
    q.includes("dhonnobad") ||
    q.includes("thank you") ||
    q.includes("thanks")
  ) {
    return {
      text: `আপনাকে অনেক অনেক ধন্যবাদ! ❤️\n\nযেকোনো প্রোডাক্টের তথ্য, ওয়ারেন্টি বা অর্ডার সংক্রান্ত প্রয়োজনে আমি সবসময় আছি। আর কিছু কি জানতে চান?`,
      quickActions: [
        { label: "🔥 সেরা অফারগুলো দেখাও", action: "best_offers" },
        { label: "📦 অর্ডার ট্র্যাক করুন", action: "track_order" },
        { label: "⚡ শপ ঘুরে দেখুন", action: "view_products", link: "/products" }
      ]
    };
  }

  // D. How to Order / Ordering Guide (কীভাবে অর্ডার করব)
  if (
    q.includes("order") && (
      q.includes("kivabe") ||
      q.includes("kibhabe") ||
      q.includes("niom") ||
      q.includes("how to") ||
      q.includes("system") ||
      q.includes("korbo") ||
      q.includes("korar")
    )
  ) {
    return {
      text: `**Durtup.shop-এ অর্ডার করার খুব সহজ ৩টি ধাপ:** 🛍️\n\n১. **পণ্য নির্বাচন করুন**: আপনার পছন্দের প্রোডাক্টটি সিলেক্ট করুন অথবা আমাকে নাম বলুন।\n২. **'অর্ডার করুন' বাটনে চাপুন**: সরাসরি 'Buy Now' বা 'কার্ট'-এ যোগ করুন।\n৩. **ঠিকানা ও ফোন নম্বর দিন**: আপনার নাম, ফোন নম্বর ও ডেলিভারি ঠিকানা দিয়ে অর্ডার কনফার্ম করুন।\n\n🚚 **ক্যাশ অন ডেলিভারি** রয়েছে — পণ্য হাতে পেয়ে চেক করে টাকা দিন!`,
      quickActions: [
        { label: "🔥 সেরা গ্যাজেট দেখুন", action: "best_gadgets" },
        { label: "🚚 ডেলিভারি চার্জ কত?", action: "delivery_info" },
        { label: "💵 পেমেন্ট নিয়ম", action: "payment_info" }
      ]
    };
  }

  // E. Delivery Charges & Shipping Timeline (ডেলিভারি চার্জ ও সময়)
  if (
    q.includes("delivery") ||
    q.includes("shipping") ||
    q.includes("koto din") ||
    q.includes("charge koto") ||
    q.includes("delivary") ||
    q.includes("home delivery")
  ) {
    return {
      text: `**Durtup.shop ডেলিভারি চার্জ ও সময়সূচী:** 🚚✨\n\n🏙️ **ঢাকার ভেতরে**: ডেলিভারি চার্জ মাত্র **৬০ টাকা** (২৪ থেকে ৪৮ ঘণ্টার মধ্যে ডেলিভারি)।\n🏡 **ঢাকার বাইরে (সারাদেশে)**: হোম ডেলিভারি চার্জ **১২০ টাকা** (২ থেকে ৩ কর্মদিবসের মধ্যে)।\n\n📦 প্রতিটি পার্সেল দ্রুত এবং সতর্কতার সাথে আপনার ঠিকানায় পৌঁছে দেওয়া হয়।`,
      quickActions: [
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "💵 ক্যাশ অন ডেলিভারি", action: "payment_info" },
        { label: "🔄 ৭ দিনের রিটার্ন পলিসি", action: "return_policy" }
      ]
    };
  }

  // F. Payment Methods & COD (পেমেন্ট পদ্ধতি)
  if (
    q.includes("payment") ||
    q.includes("pement") ||
    q.includes("cod") ||
    q.includes("cash on") ||
    q.includes("bkash") ||
    q.includes("nagad") ||
    q.includes("taka kivabe") ||
    q.includes("advance")
  ) {
    return {
      text: `**আমাদের সহজ ও নিরাপদ পেমেন্ট মেথড:** 💵💳\n\n১. **ক্যাশ অন ডেলিভারি (COD)**: কোনো অগ্রিম পেমেন্ট ছাড়াই পণ্য হাতে পেয়ে টাকা পরিশোধ করার সুবিধা।\n২. **বিকাশ ও নগদ (bKash / Nagad)**: সরাসরি অনলাইন বা মার্চেন্ট পেমেন্ট।\n৩. **কার্ড পেমেন্ট**: ভিসা, মাস্টারকার্ড ও অন্যান্য যেকোনো ব্যাংক কার্ড সাপোর্ট করে।`,
      quickActions: [
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "🚚 ডেলিভারি চার্জ", action: "delivery_info" },
        { label: "🔥 ট্রেন্ডিং গ্যাজেট", action: "best_gadgets" }
      ]
    };
  }

  // G. Return & Warranty Policy (রিটার্ন ও ওয়ারেন্টি)
  if (
    q.includes("return") ||
    q.includes("refund") ||
    q.includes("warranty") ||
    q.includes("guarantee") ||
    q.includes("ferot") ||
    q.includes("nosto") ||
    q.includes("problem")
  ) {
    return {
      text: `**৭ দিনের সহজ রিটার্ন ও রিপ্লেসমেন্ট গ্যারান্টি:** 🔄🛡️\n\n✅ প্রোডাক্টে কোনো ক্রটি থাকলে বা অর্ডারের সাথে না মিললে **৭ দিনের মধ্যে সম্পূর্ণ ফ্রি রিটার্ন বা এক্সচেঞ্জ** করতে পারবেন।\n✅ আপনি চাইলে ১০০% ক্যাশ রিফান্ডও গ্রহণ করতে পারেন।\n💡 আনবক্সিং করার সময় একটি ছোট ভিডিও রাখলে দ্রুত সমাধান নিশ্চিত করা যায়।`,
      quickActions: [
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "📞 কাস্টমার সাপোর্ট", action: "customer_support" },
        { label: "📦 অর্ডার ট্র্যাক করুন", action: "track_order" }
      ]
    };
  }

  // H. Customer Support / Contact (কাস্টমার কেয়ার)
  if (
    q.includes("support") ||
    q.includes("helpline") ||
    q.includes("customer care") ||
    q.includes("agent") ||
    q.includes("call") ||
    q.includes("number") ||
    q.includes("manush")
  ) {
    return {
      text: `**Durtup.shop কাস্টমার কেয়ার ও হেল্পলাইন:** 📞\n\n📱 **হটলাইন / হোয়াটসঅ্যাপ**: +880 1700-000000 (সকাল ৯টা - রাত ১০টা)\n✉️ **ইমেইল**: support@durtup.shop\n💬 **ফেসবুক পেজ**: fb.com/durtupshop\n\nআমাদের সাপোর্ট টিম সবসময় আপনাকে সর্বোচ্চ সেবা দিতে প্রস্তুত!`,
      quickActions: [
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "📦 অর্ডার ট্র্যাক করুন", action: "track_order" }
      ]
    };
  }

  // I. Product Search & Catalog Matcher
  let catalog = options?.catalog;
  if (!catalog || catalog.length === 0) {
    try {
      const cached = await getCachedMohasagorProducts();
      catalog = cached && cached.length > 0 ? cached : FAST_SEED_PRODUCTS;
    } catch {
      catalog = FAST_SEED_PRODUCTS;
    }
  }

  // Clean search terms
  const searchTerms = q
    .replace(/[^\w\s\u0980-\u09FF]/gi, " ")
    .split(/\s+/)
    .filter(w => w.length > 1 && !["the", "and", "dekhao", "chai", "lagbe", "koto", "dam", "price"].includes(w));

  const matched = catalog.filter(p => {
    const nameLower = p.name.toLowerCase();
    const catLower = (p.category || "").toLowerCase();
    const descLower = (p.description || "").toLowerCase();
    return searchTerms.some(term => 
      nameLower.includes(term) || 
      catLower.includes(term) || 
      descLower.includes(term)
    );
  }).slice(0, 6);

  if (matched.length > 0) {
    const productCards: SigmaProductCardData[] = matched.map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.price || (p as any).sale_price || 0),
      originalPrice: (p as any).sale_price ? Number(p.price) : undefined,
      image: p.image || "/placeholder.svg",
      category: p.category,
      slug: p.slug || String(p.id),
      rating: p.rating || 4.8,
      reviews: p.reviews || 18,
      freeShipping: p.freeShipping ?? true,
      isBestSeller: p.isBestSeller ?? false,
      stockStatus: "in_stock",
      keySpecs: ["১০০% জেনুইন", "ক্যাশ অন ডেলিভারি", "৭ দিনের রিটার্ন"]
    }));

    return {
      text: `আপনার খোঁজা অনুযায়ী **'${trimmed}'**-এর সেরা পণ্যগুলো নিচে দেওয়া হলো:`,
      products: productCards,
      quickActions: [
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
        { label: "💵 ক্যাশ অন ডেলিভারি", action: "payment_info" }
      ]
    };
  }

  // J. Fallback for generic/unrecognized queries
  const popularSample = catalog.slice(0, 4).map(p => ({
    id: p.id,
    name: p.name,
    price: Number(p.price || (p as any).sale_price || 0),
    originalPrice: (p as any).sale_price ? Number(p.price) : undefined,
    image: p.image || "/placeholder.svg",
    category: p.category,
    slug: p.slug || String(p.id),
    rating: p.rating || 4.8,
    reviews: p.reviews || 22,
    freeShipping: true,
    isBestSeller: true,
    stockStatus: "in_stock" as const,
    keySpecs: ["১০০% জেনুইন", "ক্যাশ অন ডেলিভারি", "৭ দিনের রিটার্ন"]
  }));

  return {
    text: `আমি বুঝতে পেরেছি! আপনি কি নির্দিষ্ট কোনো গ্যাজেট, ঘড়ি, হেডফোন বা পোশাক খুঁজছেন? নিচে আমাদের স্টোরের জনপ্রিয় কিছু ট্রেন্ডিং আইটেম দেখতে পারেন:`,
    products: popularSample,
    quickActions: [
      { label: "🔥 সেরা গ্যাজেট দেখাও", action: "best_gadgets" },
      { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
      { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
      { label: "⚡ সব ক্যাটাগরি দেখুন", action: "view_categories", link: "/categories" }
    ]
  };
}

/**
 * Confirm Order with Secure Server-Side Token
 */
export async function confirmSigmaOrder(
  draftId: string,
  confirmationToken: string,
  paymentMethod: string = "cod"
): Promise<{ success: boolean; orderId?: string; orderNumber?: string; message?: string }> {
  try {
    const res = await fetch("/api/ai/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId, confirmationToken, paymentMethod })
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Order confirmation error:", e);
  }

  return {
    success: false,
    message: "অর্ডার যাচাই করতে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট কানেকশন চেক করুন।"
  };
}

/**
 * Web Speech API - Voice Input Recognition Helper
 */
export function initSpeechRecognition(
  onResult: (text: string) => void,
  onError?: (err: any) => void
): { start: () => void; stop: () => void; isSupported: boolean } {
  if (typeof window === "undefined") {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "bn-BD"; // Bengali language support with English fallback

  recognition.onresult = (event: any) => {
    const transcript = event.results?.[0]?.[0]?.transcript;
    if (transcript) {
      onResult(transcript);
    }
  };

  recognition.onerror = (event: any) => {
    onError?.(event);
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch {}
    },
    stop: () => {
      try {
        recognition.stop();
      } catch {}
    },
    isSupported: true
  };
}
