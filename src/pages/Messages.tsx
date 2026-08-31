import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { 
  RotateCcw, 
  ShoppingBag, 
  Truck, 
  HelpCircle, 
  ChevronRight,
  MoreVertical,
  PackageCheck,
  ArrowLeft,
  Search,
  Grid,
  Sparkles,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getCachedMohasagorProducts } from "@/utils/mohasagorCache";
import { 
  askSigmaAIAgent, 
  confirmSigmaOrder, 
  type AIMessage,
  type SigmaProductCardData 
} from "@/lib/durtupAIAgent";
import { 
  QUESTION_CATEGORIES, 
  RECOMMENDED_QUESTIONS, 
  type RecommendedQuestion 
} from "@/data/sigmaKnowledgeBase";
import { SigmaProductCard } from "@/components/ai/SigmaProductCard";
import { SigmaComparisonCard } from "@/components/ai/SigmaComparisonCard";
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

        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-orange-500 font-bold">•</span>
              <div className="flex-1">{renderFormattedSpan(line.replace(/^[-•]\s*/, ""))}</div>
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

  const [isTyping, setIsTyping] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("popular");
  const [isAllQuestionsOpen, setIsAllQuestionsOpen] = useState(false);
  const [searchQuestionTerm, setSearchQuestionTerm] = useState("");
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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

  // Welcome Initial Message
  const initialGreeting: AIMessage = {
    id: "welcome-1",
    sender: "ai",
    text: cleanName 
      ? `আসসালামু আলাইকুম **${cleanName}**! 👋 আমি **Sigma** — Durtup.shop-এর অফিসিয়াল Personal Shopping Manager।\n\nপ্রোডাক্ট নির্বাচন, অর্ডার নিয়ম, ডেলিভারি চার্জ বা রিটার্ন পলিসি সম্পর্কে জানতে নিচের **যেকোনো অপশনে ক্লিক করুন** — আমি সাথে সাথে সঠিক উত্তর ও প্রোডাক্টের তথ্য প্রদর্শন করব!`
      : `স্বাগতম! আমি **Sigma** — Durtup.shop-এর অফিসিয়াল Personal Shopping Manager (Powered by Durtup.shop)।\n\nপণ্য খোঁজা, স্পেসিফিকেশন ও দাম জানা, কার্টে যোগ বা অর্ডারে সহায়তা পেতে নিচের **রেকমেন্ডেড প্রশ্নসমূহে ক্লিক করুন**:`,
    timestamp: "Just now",
    quickActions: [
      { label: "🛍️ কীভাবে সহজে অর্ডার করবেন?", action: "pop-1" },
      { label: "🔥 সেরা ট্রেন্ডিং গ্যাজেট দেখাও", action: "pop-2" },
      { label: "🚚 ডেলিভারি চার্জ ও সময় কত?", action: "pop-3" },
      { label: "💵 ক্যাশ অন ডেলিভারি নিয়ম", action: "pop-4" },
      { label: "🔄 ৭ দিনের রিটার্ন পলিসি", action: "pop-5" },
      { label: "💰 কম বাজেটের সেরা প্রোডাক্ট", action: "pop-6" },
      { label: "📦 অর্ডার ট্র্যাকিং করার নিয়ম", action: "pop-7" },
    ],
  };

  const [messages, setMessages] = useState<AIMessage[]>([initialGreeting]);

  // Update greeting when user profile loads
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === "welcome-1") {
      setMessages([initialGreeting]);
    }
  }, [cleanName]);

  // Auto scroll to bottom of messages container
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping, toolStatus]);

  // Handle Question Click Execution
  const handleSelectQuestion = async (queryTextOrId: string, customDisplayLabel?: string) => {
    if (isTyping) return;

    const matchedKb = RECOMMENDED_QUESTIONS.find(
      (q) => q.id === queryTextOrId || q.question === queryTextOrId || q.shortLabel === queryTextOrId
    );

    const questionDisplayText = customDisplayLabel || matchedKb?.question || queryTextOrId;
    const userMessageId = `user-${Date.now()}`;

    const newMsg: AIMessage = {
      id: userMessageId,
      sender: "user",
      text: questionDisplayText,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsTyping(true);
    setActiveQuestionId(matchedKb?.id || queryTextOrId);
    setToolStatus("⚡ Sigma তথ্য প্রস্তুত করছে...");

    try {
      const conversationHistory = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await askSigmaAIAgent(matchedKb?.id || questionDisplayText, {
        userName: cleanName,
        userId: user?.id || `guest_${Date.now()}`,
        catalog,
        cartState: cartItems,
        history: conversationHistory,
        pageContext: {
          currentPath: "/messages",
        },
      });

      // Handle Real-Time Actions if any
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
      console.error("[Sigma Messages Question Error]:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: "দুঃখিত, এই মুহূর্তে তথ্যটি আনতে সমস্যা হচ্ছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
          timestamp: "Just now",
        },
      ]);
    } finally {
      setIsTyping(false);
      setActiveQuestionId(null);
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
        text: `**${p.name}** সফলভাবে আপনার কার্টে যোগ করা হয়েছে! 🛍️✨\n\nআপনি চাইলে এখনই চেকআউট করতে পারেন অথবা আরও প্রোডাক্ট দেখতে পারেন।`,
        timestamp: "Just now",
        quickActions: [
          { label: "🛒 কার্ট দেখুন ও চেকআউট করুন", action: "view_cart", link: "/cart" },
          { label: "🚚 ডেলিভারি চার্জ কত?", action: "pop-3" },
          { label: "🔥 আরও সেরা গ্যাজেট দেখাও", action: "pop-2" }
        ]
      }
    ]);
  };

  // Order now direct draft flow
  const handleProductCardOrderNow = async (p: SigmaProductCardData) => {
    await addToCart(String(p.id), 1);
    navigate(`/checkout?productId=${p.id}`);
  };

  // Active category questions
  const currentCategoryQuestions = RECOMMENDED_QUESTIONS.filter(
    (q) => q.category === selectedCategory
  );

  // Filtered list for "All Questions" search dialog
  const allFilteredQuestions = RECOMMENDED_QUESTIONS.filter((q) => {
    if (!searchQuestionTerm.trim()) return true;
    const term = searchQuestionTerm.toLowerCase();
    return (
      q.question.toLowerCase().includes(term) ||
      (q.shortLabel && q.shortLabel.toLowerCase().includes(term)) ||
      q.answerText.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col bg-gradient-to-br from-sky-100/90 via-cyan-50/80 to-blue-100/90 text-slate-900 overflow-hidden font-sans select-none selection:bg-cyan-500 selection:text-white">
      {/* Liquid Water Ambient Glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 bg-cyan-300/30 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-32 w-80 h-80 bg-sky-300/30 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 w-80 h-80 bg-blue-300/25 rounded-full blur-3xl" />

      {/* Top Header */}
      <header className="shrink-0 z-30 bg-gradient-to-r from-sky-500/95 via-cyan-500/90 to-blue-600/95 backdrop-blur-2xl text-white px-3 sm:px-4 py-2.5 shadow-[0_4px_20px_rgba(2,132,199,0.22)] border-b border-white/40 flex items-center justify-between">
        {/* Left: Back Button & Title */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 border border-white/40 active:scale-95 text-white transition-all flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.7)] backdrop-blur-md"
            title="Go Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 border border-white shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
              <h1 className="text-base sm:text-lg font-black tracking-wide leading-none text-white drop-shadow-sm">Sigma</h1>
              <Badge className="bg-white/25 hover:bg-white/30 text-white text-[9px] font-black uppercase px-2 py-0.5 border border-white/40 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] backdrop-blur-md">
                AI Shopping Manager
              </Badge>
            </div>
            <p className="text-[10px] text-white/95 font-medium mt-0.5 drop-shadow-xs">
              Powered by Durtup.shop • স্বয়ংক্রিয় প্রশ্নোত্তর গাইড
            </p>
          </div>
        </div>

        {/* Right Actions & Menu */}
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
            <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-2xl border border-sky-100/90 text-slate-800 shadow-[0_12px_40px_rgba(14,165,233,0.18)] rounded-3xl p-1.5 z-50">
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
                onClick={() => setIsAllQuestionsOpen(true)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-cyan-600 hover:bg-cyan-50/80 rounded-2xl cursor-pointer transition-colors"
              >
                <Grid className="h-4 w-4 text-sky-500" />
                <span>সকল প্রশ্ন একত্রে দেখুন ({RECOMMENDED_QUESTIONS.length})</span>
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Messages Scroll Area */}
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

            {/* Message Bubble */}
            <div
              className={cn(
                "max-w-[94%] sm:max-w-[85%] p-4 sm:p-5 transition-all",
                msg.sender === "user"
                  ? "bg-gradient-to-tr from-cyan-600 via-sky-600 to-blue-600 text-white rounded-3xl rounded-tr-md font-medium shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),_0_8px_25px_rgba(2,132,199,0.3)] border border-sky-300/40"
                  : "bg-white/85 backdrop-blur-2xl border border-white/90 text-slate-800 rounded-3xl rounded-tl-md shadow-[inset_0_2px_4px_rgba(255,255,255,1),_0_10px_30px_rgba(14,165,233,0.12),_0_2px_8px_rgba(0,0,0,0.03)]"
              )}
            >
              {msg.sender === "user" ? (
                <div className="flex items-center gap-2">
                  <span className="text-base">👤</span>
                  <p className="text-xs sm:text-sm font-semibold leading-relaxed">{msg.text}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <FormattedMessageText text={msg.text} />

                  {/* Contextual Follow-up Chips inside AI Message */}
                  {msg.quickActions && msg.quickActions.length > 0 && (
                    <div className="pt-2.5 border-t border-sky-100/80 mt-2 space-y-1.5">
                      <p className="text-[11px] font-bold text-sky-900/60 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        <span>প্রাসঙ্গিক অপশন ও পরবর্তী পদক্ষেপ:</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.quickActions.map((qa, qIdx) => (
                          <button
                            key={qIdx}
                            type="button"
                            disabled={isTyping}
                            onClick={() => {
                              if (qa.link) {
                                navigate(qa.link);
                              } else {
                                handleSelectQuestion(qa.action || qa.label, qa.label);
                              }
                            }}
                            className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-sky-50/95 hover:bg-sky-100 active:scale-95 border border-sky-200/90 hover:border-cyan-400 text-sky-950 hover:text-cyan-700 transition-all flex items-center gap-1 shadow-xs cursor-pointer backdrop-blur-md"
                          >
                            <span>{qa.label}</span>
                            <ChevronRight className="h-3 w-3 opacity-60 text-cyan-600" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
                onAddToCart={(id) => addToCart(String(id), 1)}
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

      {/* Bottom Horizontal Recommended Question Pills Hub */}
      <footer className="shrink-0 z-30 bg-white/90 backdrop-blur-2xl border-t border-sky-200/80 shadow-[0_-6px_25px_rgba(2,132,199,0.12)] px-3 py-2 sm:px-4 sm:py-2.5">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Category Filter Pills Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {QUESTION_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "whitespace-nowrap shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95",
                  selectedCategory === cat.id
                    ? "bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 text-white shadow-[0_2px_8px_rgba(6,182,212,0.35)]"
                    : "bg-sky-50/90 hover:bg-sky-100 text-sky-950 border border-sky-200/70"
                )}
              >
                <span>{cat.icon}</span>
                <span>{cat.label.replace(/^.+?\s/, "")}</span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setIsAllQuestionsOpen(true)}
              className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 flex items-center gap-1 transition-all active:scale-95"
              title="সব প্রশ্ন একসাথে দেখুন"
            >
              <Grid className="h-3 w-3 text-cyan-600" />
              <span>সব ({RECOMMENDED_QUESTIONS.length})</span>
            </button>
          </div>

          {/* Horizontally Scrollable Question Pills Deck (Matching exactly the pill chip style) */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {currentCategoryQuestions.map((q) => {
              const isCurrentActive = activeQuestionId === q.id && isTyping;

              return (
                <button
                  key={q.id}
                  type="button"
                  disabled={isTyping}
                  onClick={() => handleSelectQuestion(q.id, q.question)}
                  className={cn(
                    "whitespace-nowrap shrink-0 text-xs font-bold px-3.5 py-2 rounded-full border transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs",
                    isCurrentActive
                      ? "bg-cyan-500 text-white border-cyan-400 shadow-[0_4px_12px_rgba(6,182,212,0.3)]"
                      : "bg-white/95 hover:bg-white text-slate-800 hover:text-cyan-700 border-sky-200 hover:border-cyan-400 hover:shadow-sm"
                  )}
                >
                  <span className="text-sm">{q.icon}</span>
                  <span>{q.shortLabel || q.question}</span>
                  <ChevronRight className="h-3 w-3 opacity-60 text-cyan-600" />
                </button>
              );
            })}
          </div>
        </div>
      </footer>

      {/* "All Questions" Knowledge Base Modal */}
      <Dialog open={isAllQuestionsOpen} onOpenChange={setIsAllQuestionsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-4 sm:p-6 bg-white rounded-3xl shadow-2xl border border-sky-100 overflow-hidden">
          <DialogHeader className="pb-3 border-b border-sky-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-sm">
                  <Grid className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-black text-slate-900">
                    রেকমেন্ডেড সকল প্রশ্ন ও বিষয়সমূহ
                  </DialogTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    যেকোনো প্রশ্নে ক্লিক করে সরাসরি উত্তর ও প্রোডাক্ট দেখুন
                  </p>
                </div>
              </div>
            </div>

            {/* Search Input for Questions */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-600" />
              <input
                type="text"
                placeholder="প্রশ্ন বা বিষয় খুঁজুন (যেমন: ডেলিভারি, ক্যাশ অন ডেলিভারি, ঘড়ি)..."
                value={searchQuestionTerm}
                onChange={(e) => setSearchQuestionTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-2xl bg-sky-50 border border-sky-200 focus:outline-none focus:border-cyan-500 text-slate-800 placeholder:text-slate-400"
              />
              {searchQuestionTerm && (
                <button
                  type="button"
                  onClick={() => setSearchQuestionTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </DialogHeader>

          {/* List of Questions in Modal */}
          <div className="flex-1 overflow-y-auto py-2 space-y-4 pr-1">
            {QUESTION_CATEGORIES.map((cat) => {
              const catQuestions = allFilteredQuestions.filter((q) => q.category === cat.id);
              if (catQuestions.length === 0) return null;

              return (
                <div key={cat.id} className="space-y-2">
                  <div className="flex items-center gap-1.5 px-1 py-1">
                    <span className="text-sm">{cat.icon}</span>
                    <h3 className="text-xs font-extrabold text-sky-950">{cat.label}</h3>
                    <span className="text-[10px] text-slate-400 font-medium">({catQuestions.length})</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {catQuestions.map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          setIsAllQuestionsOpen(false);
                          handleSelectQuestion(q.id, q.question);
                        }}
                        className="text-left px-3.5 py-2 rounded-full bg-sky-50/80 hover:bg-cyan-50 border border-sky-200/80 hover:border-cyan-300 transition-all flex items-center gap-2 group cursor-pointer active:scale-95 shadow-2xs"
                      >
                        <span className="text-sm shrink-0">{q.icon}</span>
                        <span className="text-xs font-bold text-slate-800 group-hover:text-cyan-800">
                          {q.shortLabel || q.question}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-cyan-600" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {allFilteredQuestions.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                কোনো প্রশ্ন পাওয়া যায়নি। অন্য শব্দ দিয়ে সার্চ করুন।
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
