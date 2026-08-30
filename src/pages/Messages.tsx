import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { 
  Send, 
  Bot, 
  Sparkles, 
  RotateCcw, 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  HelpCircle, 
  ChevronRight,
  User as UserIcon,
  ImagePlus,
  X,
  Mic,
  MicOff,
  Lock,
  MessageSquare,
  MoreVertical,
  Info,
  PackageCheck
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getCachedMohasagorProducts } from "@/utils/mohasagorCache";
import { 
  askSigmaAIAgent, 
  confirmSigmaOrder, 
  initSpeechRecognition, 
  type AIMessage,
  type SigmaProductCardData 
} from "@/lib/durtupAIAgent";
import { SigmaProductCard } from "@/components/ai/SigmaProductCard";
import { SigmaComparisonCard } from "@/components/ai/SigmaComparisonCard";
import { SigmaCartCard } from "@/components/ai/SigmaCartCard";
import { SigmaOrderConfirmationCard } from "@/components/ai/SigmaOrderConfirmationCard";
import { SigmaOrderTrackingCard } from "@/components/ai/SigmaOrderTrackingCard";
import { SigmaSupportTicketCard } from "@/components/ai/SigmaSupportTicketCard";
import { SigmaToolActivityIndicator } from "@/components/ai/SigmaToolActivityIndicator";
import type { Product } from "@/components/products/ProductCard";
import { toast } from "sonner";
import { db } from "@/integrations/firebase/client";
import { doc, setDoc } from "firebase/firestore";
import { sendTelegramOrderNotification } from "@/utils/telegramNotifier";
import { sendOrderSuccessPushNotification } from "@/services/notificationService";

function renderFormattedSpan(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-extrabold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function FormattedMessageText({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed text-slate-800">
      {lines.map((line, lineIdx) => {
        if (!line.trim()) {
          return <div key={lineIdx} className="h-1" />;
        }

        if (line.startsWith("### ")) {
          return (
            <h4 key={lineIdx} className="font-extrabold text-sm sm:text-base text-orange-600 mt-2 mb-1 flex items-center gap-1.5">
              {renderFormattedSpan(line.replace("### ", ""))}
            </h4>
          );
        }

        if (line.startsWith("- ")) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-orange-500 font-bold">•</span>
              <div className="flex-1">{renderFormattedSpan(line.replace(/^- \s*/, ""))}</div>
            </div>
          );
        }

        return <p key={lineIdx}>{renderFormattedSpan(line)}</p>;
      })}
    </div>
  );
}

export default function BuyerMessages() {
  const { user, profile } = useAuth();
  const { items: cartItems, addToCart, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [attachedImage, setAttachedImage] = useState<{ base64: string; mimeType: string; previewUrl: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognizerRef = useRef<any>(null);

  // Extract clean personal first name
  const rawName = profile?.full_name || user?.user_metadata?.full_name || profile?.name || "";
  const cleanName = rawName
    ? rawName.replace(/^(md\.?|mohammad|mohammed|mrs\.?|mr\.?|mst\.?)\s+/i, "").split(" ")[0] || rawName.split(" ")[0]
    : "";

  // Preload catalog
  useEffect(() => {
    getCachedMohasagorProducts().then((res) => {
      if (res && res.length > 0) setCatalog(res);
    }).catch(() => {});
  }, []);

  // Voice Input Setup
  useEffect(() => {
    const recognizer = initSpeechRecognition(
      (transcript) => {
        setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
      },
      (error) => {
        console.warn("Speech recognition error:", error);
        setIsListening(false);
      }
    );
    speechRecognizerRef.current = recognizer;
  }, []);

  const toggleVoiceInput = () => {
    if (!speechRecognizerRef.current?.isSupported) {
      toast.error("আপনার ব্রাউজারে ভয়েস রিকগনিশন সুবিধা উপলব্ধ নেই। অনুগ্রহ করে টাইপ করুন।");
      return;
    }

    if (isListening) {
      speechRecognizerRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      speechRecognizerRef.current.start();
      toast.info("ভয়েসে বলুন, আমি শুনছি... 🎙️");
    }
  };

  // Welcome Initial Message
  const initialGreeting: AIMessage = {
    id: "welcome-1",
    sender: "ai",
    text: cleanName 
      ? `আসসালামু আলাইকুম **${cleanName}**! 👋 আমি **Sigma** — Durtup.shop-এর অফিসিয়াল Personal Shopping Manager।\n\nProduct খোঁজা, comparison, cart manage করা, order তৈরি করা বা tracking—সবকিছুতেই আমি আপনাকে সাহায্য করতে পারি। আজ কী খুঁজছেন?`
      : `হাই! আমি **Sigma** — Durtup.shop-এর অফিসিয়াল Personal Shopping Manager (Powered by Durtup.shop)।\n\nআমাদের স্টোরের প্রোডাক্ট খোঁজা, পণ্যের স্পেক্স তুলনা করা, কার্টে যোগ বা যেকোনো অর্ডারে সহায়তা পেতে আমাকে লিখুন অথবা ছবি আপলোড করুন:`,
    timestamp: "Just now",
    quickActions: [
      { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
      { label: "🔥 সেরা গ্যাজেট দেখাও", action: "best_gadgets" },
      { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
      { label: "💵 ক্যাশ অন ডেলিভারি ও পেমেন্ট", action: "payment_info" },
      { label: "🔄 ৭ দিনের রিটার্ন ও রিফান্ড", action: "return_policy" },
      { label: "📦 অর্ডার ট্র্যাক করার নিয়ম", action: "track_order" },
    ],
  };

  const [messages, setMessages] = useState<AIMessage[]>([initialGreeting]);

  // Update greeting when user profile loads
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === "welcome-1") {
      setMessages([initialGreeting]);
    }
  }, [cleanName]);

  // Auto scroll to bottom of messages container only (NEVER scrolling the window document)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping, attachedImage, toolStatus]);

  // Image Upload Handler
  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("অনুগ্রহ করে একটি ছবি ফাইল নির্বাচন করুন");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("ছবির সাইজ সর্বোচ্চ 8MB হতে পারবে");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(",")[1];
      setAttachedImage({
        base64: base64Data,
        mimeType: file.type,
        previewUrl: result,
      });
      toast.success("প্রোডাক্টের ছবি যুক্ত হয়েছে! এবার মেসেজ পাঠান।");
    };
    reader.readAsDataURL(file);
  };

  // Send Message Logic
  const handleSendMessage = async (customQuery?: string) => {
    const query = (customQuery || inputValue).trim();
    if (!query && !attachedImage) return;

    const userMessageId = `user-${Date.now()}`;
    const newMsg: AIMessage = {
      id: userMessageId,
      sender: "user",
      text: query || "প্রোডাক্টের ছবি অনুযায়ী অপশন দেখাও",
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      userImage: attachedImage?.previewUrl,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputValue("");
    const sentImage = attachedImage;
    setAttachedImage(null);
    setIsTyping(true);
    setToolStatus("🔎 Sigma তথ্য বিশ্লেষণ করছে...");

    try {
      const conversationHistory = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await askSigmaAIAgent(query, {
        userName: cleanName,
        userId: user?.id || `guest_${Date.now()}`,
        catalog,
        cartState: cartItems,
        imageAttachment: sentImage ? { base64: sentImage.base64, mimeType: sentImage.mimeType } : undefined,
        history: conversationHistory,
        pageContext: {
          currentPath: "/messages",
        },
      });

      // Handle Real-Time Actions
      if (res.actions && res.actions.length > 0) {
        for (const action of res.actions) {
          if (action.type === "ADD_TO_CART" && action.data?.productId) {
            await addToCart(String(action.data.productId), action.data.quantity || 1);
            toast.success(`🛒 "${action.data.name || "Product"}" কার্টে যোগ করা হয়েছে!`);
          } else if (action.type === "REMOVE_FROM_CART" && action.data?.productId) {
            await removeItem(String(action.data.productId));
            toast.info("কার্ট থেকে পণ্য রিমুভ করা হয়েছে।");
          } else if (action.type === "CLEAR_CART") {
            await clearCart();
            toast.info("কার্ট খালি করা হয়েছে।");
          }
        }
      }

      const aiMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: res.text,
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
        products: res.products,
        comparison: res.comparison,
        orderDraft: res.orderDraft,
        tracking: res.tracking,
        ticket: res.ticket,
        quickActions: res.quickActions,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("[Sigma Messages Page Error]:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: "দুঃখিত, এই মুহূর্তে তথ্যটি আনতে সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন।",
          timestamp: "Just now",
        },
      ]);
    } finally {
      setIsTyping(false);
      setToolStatus(null);
    }
  };

  // Order Confirmation Callback from OrderConfirmationCard
  const handleConfirmOrder = async (draftId: string, token: string, paymentMethod: string) => {
    const res = await confirmSigmaOrder(draftId, token, paymentMethod);
    if (res.success) {
      await clearCart().catch(() => {});

      const orderNumber = res.orderNumber || `ORD-${Date.now().toString().slice(-6)}`;
      const orderId = res.orderId || `ord_${Date.now()}`;

      try {
        const firestoreDoc = {
          id: orderId,
          order_id: orderId,
          order_number: orderNumber,
          orderNumber,
          user_id: user?.id || `guest_${Date.now()}`,
          total: 760,
          status: "pending",
          payment_method: paymentMethod,
          payment_status: "pending",
          source: "sigma_ai_agent",
          created_at: new Date().toISOString()
        };
        await setDoc(doc(db, "orders", orderId), firestoreDoc, { merge: true }).catch(() => {});

        sendOrderSuccessPushNotification({
          orderNumber,
          customerName: cleanName || "সম্মানিত গ্রাহক",
          productName: "Sigma Verified Order",
          totalAmount: 760,
          paymentMethod,
          orderId
        }).catch(() => {});

        sendTelegramOrderNotification({
          orderNumber,
          customerName: cleanName || "Sigma Customer",
          phone: "017XXXXXXXX",
          address: "Dhaka, Bangladesh",
          city: "Dhaka",
          paymentMethod,
          total: 760,
          items: [{ name: "Sigma Assisted Order Item", quantity: 1, price: 760 }]
        }).catch(() => {});
      } catch (err) {
        console.warn("Sync order error:", err);
      }

      toast.success(`🎉 অর্ডার সফল! Order ID: #${orderNumber}`);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-ord-succ-${Date.now()}`,
          sender: "ai",
          text: `🎉 আলহামদুলিল্লাহ! আপনার অর্ডারটি নিশ্চিত করা হয়েছে।\n\n📦 **অর্ডার আইডি:** \`#${orderNumber}\`\n\nআমাদের প্রতিনিধি খুব শীঘ্রই অর্ডারটি প্রসেস করে আপনার ঠিকানায় পাঠিয়ে দেবেন। যেকোনো প্রয়োজনে আমাকে ট্র্যাকিং সম্পর্কে জিজ্ঞাসা করতে পারেন!`,
          timestamp: "Just now"
        }
      ]);
    } else {
      toast.error(res.message || "অর্ডার কনফার্ম করতে সমস্যা হয়েছে");
    }
  };

  // Add to cart from Product Card
  const handleProductCardAddToCart = async (p: SigmaProductCardData) => {
    await addToCart(String(p.id), 1);
    toast.success(`🛒 "${p.name}" কার্টে যোগ করা হয়েছে!`);
    setMessages((prev) => [
      ...prev,
      {
        id: `ai-cart-note-${Date.now()}`,
        sender: "ai",
        text: `**${p.name}** সফলভাবে আপনার কার্টে যোগ করা হয়েছে! 🛍️✨\n\nআপনি চাইলে এখনই অর্ডার ড্রাফট তৈরি করতে পারেন বা আরও প্রোডাক্ট দেখতে পারেন।`,
        timestamp: "Just now"
      }
    ]);
  };

  // Order now direct draft flow
  const handleProductCardOrderNow = async (p: SigmaProductCardData) => {
    await addToCart(String(p.id), 1);
    handleSendMessage(`আমি "${p.name}" অর্ডার করতে চাই। অর্ডার সামারি ড্রাফট তৈরি করো।`);
  };
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Prevent mobile document window scrolling so header & greeting NEVER move
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyPosition = document.body.style.position;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.width = "";
      document.body.style.height = "";
    };
  }, []);

  // Dynamic mobile viewport and keyboard tracking
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      setViewportHeight(vh);
      const isKb = (window.innerHeight - vh) > 100;
      setIsKeyboardOpen(isKb);

      // Lock window scroll so header stays at 0px
      window.scrollTo(0, 0);
    };

    handleResize();

    window.visualViewport?.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("scroll", handleResize);
    window.addEventListener("resize", handleResize);

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Determine current active quick action suggestions (from latest AI message or default)
  const lastAiMessageWithQuickActions = [...messages].reverse().find(
    (m) => m.sender === "ai" && m.quickActions && m.quickActions.length > 0
  );
  const activeQuickActions = lastAiMessageWithQuickActions?.quickActions || [
    { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
    { label: "🔥 সেরা গ্যাজেট দেখাও", action: "best_gadgets" },
    { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
    { label: "💵 ক্যাশ অন ডেলিভারি", action: "payment_info" },
    { label: "🔄 ৭ দিনের রিটার্ন পলিসি", action: "return_policy" },
    { label: "📦 অর্ডার ট্র্যাক করার নিয়ম", action: "track_order" }
  ];

  return (
    <div 
      style={{ 
        height: viewportHeight ? `${viewportHeight}px` : "100dvh",
        maxHeight: viewportHeight ? `${viewportHeight}px` : "100dvh"
      }}
      className="fixed inset-x-0 top-0 w-full flex flex-col bg-gradient-to-br from-sky-100/90 via-cyan-50/80 to-blue-100/90 text-slate-900 overflow-hidden font-sans select-none selection:bg-cyan-500 selection:text-white"
    >
      {/* Liquid Water Ambient Glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 bg-cyan-300/30 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-32 w-80 h-80 bg-sky-300/30 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 w-80 h-80 bg-blue-300/25 rounded-full blur-3xl" />

      {/* Top Header - Liquid Water Droplet Crystal Bar (Firmly at the top) */}
      <header className="shrink-0 z-30 bg-gradient-to-r from-sky-500/95 via-cyan-500/90 to-blue-600/95 backdrop-blur-2xl text-white px-4 py-2.5 shadow-[0_4px_20px_rgba(2,132,199,0.22)] border-b border-white/40 flex items-center justify-between">
        {/* Clean Title & Subtitle */}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 border border-white shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
              <h1 className="text-base sm:text-lg font-black tracking-wide leading-none text-white drop-shadow-sm">Sigma</h1>
              <Badge className="bg-white/25 hover:bg-white/30 text-white text-[9px] font-black uppercase px-2 py-0.5 border border-white/40 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] backdrop-blur-md">
                AI Shopping Manager
              </Badge>
            </div>
            <p className="text-[11px] text-white/95 font-medium mt-1 drop-shadow-xs">
              Powered by Durtup.shop
            </p>
          </div>
        </div>

        {/* Right Actions & 3-Dot Menu */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMessages([initialGreeting])}
            className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 border border-white/40 active:scale-95 text-white transition-all flex items-center gap-1.5 text-xs font-bold shadow-[inset_0_1px_2px_rgba(255,255,255,0.7)] backdrop-blur-md"
            title="Reset Conversation"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">নতুন চ্যাট</span>
          </button>

          {/* 3-Dot Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 border border-white/40 active:scale-95 text-white transition-all flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.7)] backdrop-blur-md"
                title="Options"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white/90 backdrop-blur-2xl border border-sky-100/90 text-slate-800 shadow-[0_12px_40px_rgba(14,165,233,0.18)] rounded-3xl p-1.5 z-50">
              <DropdownMenuLabel className="text-xs font-bold text-sky-900/70 px-3 py-1.5">
                Sigma AI অপশনসমূহ
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-sky-100 my-1" />

              <DropdownMenuItem
                onClick={() => setMessages([initialGreeting])}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-cyan-600 hover:bg-cyan-50/80 rounded-2xl cursor-pointer transition-colors"
              >
                <RotateCcw className="h-4 w-4 text-cyan-500" />
                <span>নতুন চ্যাট শুরু করুন</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate("/products")}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-cyan-600 hover:bg-cyan-50/80 rounded-2xl cursor-pointer transition-colors"
              >
                <ShoppingBag className="h-4 w-4 text-blue-500" />
                <span>সকল প্রোডাক্ট ক্যাটালগ</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate("/track")}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-cyan-600 hover:bg-cyan-50/80 rounded-2xl cursor-pointer transition-colors"
              >
                <Truck className="h-4 w-4 text-emerald-500" />
                <span>অর্ডার ট্র্যাক করুন</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate("/cart")}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-cyan-600 hover:bg-cyan-50/80 rounded-2xl cursor-pointer transition-colors"
              >
                <PackageCheck className="h-4 w-4 text-amber-500" />
                <span>আমার কার্ট ({cartItems.length})</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate("/help")}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-cyan-600 hover:bg-cyan-50/80 rounded-2xl cursor-pointer transition-colors"
              >
                <HelpCircle className="h-4 w-4 text-purple-500" />
                <span>কাস্টমার সাপোর্ট ও হেল্প</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-sky-100 my-1" />

              <DropdownMenuItem
                onClick={() => {
                  handleSendMessage("Durtup.shop এবং Sigma AI সম্পর্কে বিস্তারিত বলো");
                }}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-cyan-600 hover:bg-cyan-50/80 rounded-2xl cursor-pointer transition-colors"
              >
                <Info className="h-4 w-4 text-slate-400" />
                <span>Sigma AI সম্পর্কে</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Messages Scroll Area - Flex-1 takes remaining height */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3.5 max-w-3xl w-full mx-auto relative z-10 overscroll-contain"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col",
              msg.sender === "user" ? "items-end" : "items-start"
            )}
          >
            {/* Sender identity for AI */}
            {msg.sender === "ai" && (
              <div className="flex items-center gap-1.5 mb-1 px-2 text-[11px] font-extrabold text-cyan-700">
                <span className="text-sm">💧</span>
                <span>Sigma</span>
                <span className="text-[10px] text-sky-900/50 font-normal">• Powered by Durtup.shop</span>
              </div>
            )}

            {/* Message Bubble - Liquid Water Droplet Glass */}
            <div
              className={cn(
                "max-w-[92%] sm:max-w-[82%] p-4 sm:p-5 transition-all",
                msg.sender === "user"
                  ? "bg-gradient-to-tr from-cyan-600 via-sky-600 to-blue-600 text-white rounded-3xl rounded-tr-md font-medium shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),_0_8px_25px_rgba(2,132,199,0.3)] border border-sky-300/40"
                  : "bg-white/80 backdrop-blur-2xl border border-white/90 text-slate-800 rounded-3xl rounded-tl-md shadow-[inset_0_2px_4px_rgba(255,255,255,1),_0_10px_30px_rgba(14,165,233,0.12),_0_2px_8px_rgba(0,0,0,0.03)]"
              )}
            >
              {msg.userImage && (
                <img
                  src={msg.userImage}
                  alt="Attachment"
                  className="max-h-56 rounded-2xl mb-2.5 object-cover border border-white/40 shadow-sm"
                />
              )}
              {msg.sender === "user" ? (
                <p className="text-xs sm:text-sm leading-relaxed">{msg.text}</p>
              ) : (
                <FormattedMessageText text={msg.text} />
              )}
            </div>

            {/* Rich Product Cards */}
            {msg.products && msg.products.length > 0 && (
              <div className="w-full mt-3 flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none">
                {msg.products.map((p) => (
                  <SigmaProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={handleProductCardAddToCart}
                    onOrderNow={handleProductCardOrderNow}
                  />
                ))}
              </div>
            )}

            {/* Comparison Card */}
            {msg.comparison && (
              <SigmaComparisonCard
                data={msg.comparison}
                onAddToCart={(id, name) => addToCart(String(id), 1)}
              />
            )}

            {/* Order Draft Card */}
            {msg.orderDraft && (
              <SigmaOrderConfirmationCard
                draft={msg.orderDraft}
                onConfirmOrder={handleConfirmOrder}
              />
            )}

            {/* Order Tracking Card */}
            {msg.tracking && (
              <SigmaOrderTrackingCard data={msg.tracking} />
            )}

            {/* Support Ticket Card */}
            {msg.ticket && (
              <SigmaSupportTicketCard ticket={msg.ticket} />
            )}

            <span className="text-[10px] text-sky-900/50 mt-1 px-2">{msg.timestamp}</span>
          </div>
        ))}

        {/* Live Tool Execution Status */}
        {toolStatus && (
          <div className="flex items-center">
            <SigmaToolActivityIndicator activityText={toolStatus} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attached Image Thumbnail Bar */}
      {attachedImage && (
        <div className="px-4 py-2 bg-white/85 backdrop-blur-xl border-t border-white/60 flex items-center justify-between max-w-3xl w-full mx-auto shadow-sm">
          <div className="flex items-center gap-2.5">
            <img
              src={attachedImage.previewUrl}
              alt="Preview"
              className="h-10 w-10 rounded-xl object-cover border-2 border-cyan-500 shadow-sm"
            />
            <span className="text-xs text-sky-950 font-semibold">প্রোডাক্টের ছবি স্ক্যান করার জন্য প্রস্তুত</span>
          </div>
          <button
            type="button"
            onClick={() => setAttachedImage(null)}
            className="h-7 w-7 rounded-full bg-sky-100 hover:bg-rose-100 text-sky-700 hover:text-rose-600 flex items-center justify-center transition-colors shadow-xs"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Bottom Dock: Dynamic Keyboard-Aware + Clean Gap above Mobile Task Bar */}
      <div 
        className={cn(
          "shrink-0 z-30 pointer-events-auto transition-all duration-150 ease-out px-3 sm:px-4 pt-1.5",
          isKeyboardOpen 
            ? "pb-2.5 bg-white/70 backdrop-blur-2xl border-t border-white/60 shadow-lg" 
            : "pb-[78px] md:pb-3 bg-gradient-to-t from-sky-100/95 via-sky-100/80 to-transparent"
        )}
      >
        <div className="max-w-3xl mx-auto space-y-1.5">
          {/* Horizontally Scrollable Floating Quick Action Chips */}
          {activeQuickActions.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-0.5 scrollbar-none">
              {activeQuickActions.map((qa, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (qa.link) {
                      navigate(qa.link);
                    } else {
                      handleSendMessage(qa.label);
                    }
                  }}
                  className="whitespace-nowrap shrink-0 text-xs font-bold px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white backdrop-blur-xl border border-sky-200/90 text-sky-950 hover:text-cyan-700 shadow-[inset_0_1px_2px_rgba(255,255,255,1),_0_4px_12px_rgba(14,165,233,0.12)] hover:shadow-[0_6px_18px_rgba(14,165,233,0.2)] hover:border-cyan-400 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                >
                  <span>{qa.label}</span>
                  <ChevronRight className="h-3 w-3 opacity-60 text-cyan-600" />
                </button>
              ))}
            </div>
          )}

          {/* Integrated Water Droplet Glass Input Field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-white/95 backdrop-blur-2xl p-1 rounded-full border border-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),_0_6px_20px_rgba(14,165,233,0.18)]"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onFocus={() => {
                window.scrollTo(0, 0);
                setTimeout(() => {
                  window.scrollTo(0, 0);
                }, 50);
              }}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="প্রোডাক্টের নাম লিখুন বা প্রশ্ন করুন (বাংলা / Banglish)..."
              disabled={isTyping}
              className="flex-1 h-10 sm:h-11 bg-transparent px-4 text-xs sm:text-sm text-slate-900 placeholder:text-sky-900/40 focus:outline-none"
            />

            <Button
              type="submit"
              disabled={(!inputValue.trim() && !attachedImage) || isTyping}
              className="h-10 w-10 sm:h-11 sm:w-11 p-0 rounded-full bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shrink-0 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),_0_4px_16px_rgba(6,182,212,0.35)] active:scale-95 transition-all flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
