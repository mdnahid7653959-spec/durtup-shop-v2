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
  const payload = {
    query: query.trim(),
    userName: options?.userName || "",
    userId: options?.userId || "guest",
    history: options?.history || [],
    cartState: options?.cartState || [],
    imageAttachment: options?.imageAttachment ? {
      base64: options.imageAttachment.base64,
      mimeType: options.imageAttachment.mimeType
    } : undefined,
    pageContext: options?.pageContext
  };

  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data: SigmaChatResponse = await response.json();
      return data;
    }
  } catch (err) {
    console.warn("[Sigma Client] Server endpoint unreachable, using client engine fallback:", err);
  }

  // Pure Client Fallback in case of server connection failure
  let catalog = options?.catalog;
  if (!catalog || catalog.length === 0) {
    try {
      const cached = await getCachedMohasagorProducts();
      catalog = cached && cached.length > 0 ? cached : FAST_SEED_PRODUCTS;
    } catch {
      catalog = FAST_SEED_PRODUCTS;
    }
  }

  const q = query.toLowerCase().trim();
  const matched = catalog.filter(p => 
    p.name.toLowerCase().includes(q) || 
    (p.category && p.category.toLowerCase().includes(q))
  ).slice(0, 4);

  const fallbackProducts: SigmaProductCardData[] = (matched.length > 0 ? matched : catalog.slice(0, 4)).map(p => ({
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
    text: `আমি **Sigma — Powered by Durtup.shop**। আপনার পছন্দ অনুযায়ী সেরা পণ্যগুলো নিচে দেওয়া হলো:`,
    products: fallbackProducts,
    quickActions: [
      { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
      { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
      { label: "💵 ক্যাশ অন ডেলিভারি", action: "payment_info" },
      { label: "⚡ সব প্রোডাক্ট দেখুন", action: "view_products", link: "/products" }
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
