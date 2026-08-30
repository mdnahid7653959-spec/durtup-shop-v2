import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  RotateCcw, 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  CreditCard, 
  ChevronRight,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Mic,
  MicOff,
  ImagePlus,
  Zap,
  Lock,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { 
  askSigmaAIAgent, 
  confirmSigmaOrder, 
  initSpeechRecognition, 
  type AIMessage,
  type SigmaProductCardData 
} from "@/lib/durtupAIAgent";
import { SigmaProductCard } from "./SigmaProductCard";
import { SigmaComparisonCard } from "./SigmaComparisonCard";
import { SigmaCartCard } from "./SigmaCartCard";
import { SigmaOrderConfirmationCard } from "./SigmaOrderConfirmationCard";
import { SigmaOrderTrackingCard } from "./SigmaOrderTrackingCard";
import { SigmaSupportTicketCard } from "./SigmaSupportTicketCard";
import { SigmaToolActivityIndicator } from "./SigmaToolActivityIndicator";
import { getCachedMohasagorProducts } from "@/utils/mohasagorCache";
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
    <div className="space-y-1.5 text-xs sm:text-[13px] leading-relaxed text-slate-800">
      {lines.map((line, lineIdx) => {
        if (!line.trim()) {
          return <div key={lineIdx} className="h-1" />;
        }

        if (line.startsWith("### ")) {
          return (
            <h4 key={lineIdx} className="font-extrabold text-xs sm:text-sm text-orange-600 mt-2 mb-1 flex items-center gap-1.5">
              {renderFormattedSpan(line.replace("### ", ""))}
            </h4>
          );
        }

        if (line.startsWith("- ")) {
          return (
            <div key={lineIdx} className="flex items-start gap-1.5 pl-1 my-0.5">
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

export function DurtupAIAssistant() {
  const { user, profile } = useAuth();
  const { items: cartItems, subtotal: cartSubtotal, addToCart, removeItem, updateQuantity, clearCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [unreadPrompt, setUnreadPrompt] = useState(true);
  const [promptIndex, setPromptIndex] = useState(0);
  const [fadeAnim, setFadeAnim] = useState(true);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [attachedImage, setAttachedImage] = useState<{ base64: string; mimeType: string; previewUrl: string } | null>(null);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognizerRef = useRef<any>(null);

  // Floating Draggable Position
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });
  const hasMovedRef = useRef(false);

  // Initialize position from localStorage or default to bottom-right
  useEffect(() => {
    const updatePosition = () => {
      const saved = localStorage.getItem("sigma_bubble_pos");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === "number" && typeof parsed.y === "number") {
            const maxX = Math.max(10, window.innerWidth - 65);
            const maxY = Math.max(10, window.innerHeight - 75);
            setPosition({
              x: Math.min(Math.max(10, parsed.x), maxX),
              y: Math.min(Math.max(10, parsed.y), maxY),
            });
            return;
          }
        } catch (e) {}
      }

      // Default position: bottom-right
      const defaultX = Math.max(10, window.innerWidth - (window.innerWidth < 640 ? 68 : 80));
      const defaultY = Math.max(10, window.innerHeight - (window.innerWidth < 640 ? 145 : 90));
      setPosition({ x: defaultX, y: defaultY });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, []);

  // Handle Touch Dragging
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!position) return;
    const touch = e.touches[0];
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.startX;
    const dy = touch.clientY - dragStartRef.current.startY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasMovedRef.current = true;
    }

    const maxX = Math.max(10, window.innerWidth - 65);
    const maxY = Math.max(10, window.innerHeight - 75);
    const newX = Math.min(Math.max(10, dragStartRef.current.posX + dx), maxX);
    const newY = Math.min(Math.max(10, dragStartRef.current.posY + dy), maxY);

    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (position) {
      localStorage.setItem("sigma_bubble_pos", JSON.stringify(position));
    }
  };

  // Handle Mouse Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!position) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = moveEvent.clientX - dragStartRef.current.startX;
      const dy = moveEvent.clientY - dragStartRef.current.startY;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasMovedRef.current = true;
      }

      const maxX = Math.max(10, window.innerWidth - 65);
      const maxY = Math.max(10, window.innerHeight - 75);
      const newX = Math.min(Math.max(10, dragStartRef.current.posX + dx), maxX);
      const newY = Math.min(Math.max(10, dragStartRef.current.posY + dy), maxY);

      setPosition({ x: newX, y: newY });
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      if (position) {
        localStorage.setItem("sigma_bubble_pos", JSON.stringify(position));
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Preload catalog
  useEffect(() => {
    getCachedMohasagorProducts().then((res) => {
      if (res && res.length > 0) setCatalog(res);
    }).catch(() => {});
  }, []);

  // First name extraction
  const rawName = profile?.full_name || user?.user_metadata?.full_name || profile?.name || "";
  const cleanName = rawName
    ? rawName.replace(/^(md\.?|mohammad|mohammed|mrs\.?|mr\.?|mst\.?)\s+/i, "").split(" ")[0] || rawName.split(" ")[0]
    : "";

  // Dynamic message rotation timer for floating pill
  const userPrompts = [
    `হাই ${cleanName}! আমি Sigma — আপনার AI শপিং অ্যাসিস্ট্যান্ট`,
    `আজকে কী কিনতে চাচ্ছেন, ${cleanName}?`,
    `🔥 ${cleanName}, সেরা অফার ও ডিসকাউন্ট জানতে ক্লিক করুন!`,
    `🛍️ ${cleanName}, যেকোনো প্রোডাক্ট খুঁজতে আমাকে বলুন!`,
  ];

  const guestPrompts = [
    "হাই! আমি Sigma — Powered by Durtup.shop",
    "আজকে কী কিনতে চাচ্ছেন? AI সহায়তা নিন!",
    "🔥 সেরা গ্যাজেট ও অফার দেখতে ক্লিক করুন!",
    "🛍️ প্রোডাক্ট খোঁজা ও অর্ডার করতে আমি প্রস্তুত!",
  ];

  const activePrompts = cleanName ? userPrompts : guestPrompts;
  const currentPromptText = activePrompts[promptIndex % activePrompts.length];

  useEffect(() => {
    const timer = setInterval(() => {
      setFadeAnim(false);
      setTimeout(() => {
        setPromptIndex((prev) => (prev + 1) % activePrompts.length);
        setFadeAnim(true);
      }, 250);
    }, 4500);

    return () => clearInterval(timer);
  }, [activePrompts.length]);

  // Initial Greeting
  const defaultGreeting: AIMessage = {
    id: "welcome-1",
    sender: "ai",
    text: cleanName
      ? `আসসালামু আলাইকুম **${cleanName}**! 👋 আমি **Sigma** — Durtup.shop-এর অফিশিয়াল Personal Shopping Manager।\n\nProduct খোঁজা, comparison, cart manage করা, order তৈরি করা বা tracking—সবকিছুতেই আমি আপনাকে সাহায্য করতে পারি। আজ কী খুঁজছেন?`
      : `হাই! আমি **Sigma** — Durtup.shop-এর অফিশিয়াল Personal Shopping Manager (Powered by Durtup.shop)।\n\nProduct খোঁজা, specs তুলনা করা, কার্টে যোগ কিংবা অর্ডার করতে আমাকে লিখুন বা ছবি আপলোড করুন:`,
    timestamp: "Just now",
    quickActions: [
      { label: "🔥 সেরা গ্যাজেট দেখাও", action: "best_gadgets" },
      { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
      { label: "💰 কম বাজেটের প্রোডাক্ট", action: "budget_search" },
      { label: "⚖️ প্রোডাক্ট তুলনা করুন", action: "compare_products" },
      { label: "🎁 উপহার আইডিয়া", action: "gift_finder" },
      { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
      { label: "💵 ক্যাশ অন ডেলিভারি নিয়ম", action: "payment_info" },
    ],
  };

  const [messages, setMessages] = useState<AIMessage[]>([defaultGreeting]);

  // Update greeting on profile change
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === "welcome-1") {
      setMessages([defaultGreeting]);
    }
  }, [cleanName]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen, attachedImage, toolStatus]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setUnreadPrompt(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Voice Input Setup
  useEffect(() => {
    const recognizer = initSpeechRecognition(
      (transcript) => {
        setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
    speechRecognizerRef.current = recognizer;
  }, []);

  const toggleVoiceInput = () => {
    if (!speechRecognizerRef.current?.isSupported) {
      toast.error("আপনার ব্রাউজারে ভয়েস রিকগনিশন সাপোর্ট নেই। অনুগ্রহ করে টাইপ করুন।");
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
          currentPath: location.pathname,
        },
      });

      // Handle Real-Time Actions returned by Sigma
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
      console.error("[Sigma Chat Error]:", err);
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
      // Clear purchased items from Cart
      await clearCart().catch(() => {});

      // Record to Firestore & Admin Notifications
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

        // Push notification & sound
        sendOrderSuccessPushNotification({
          orderNumber,
          customerName: cleanName || "সম্মানিত গ্রাহক",
          productName: "Sigma Verified Order",
          totalAmount: 760,
          paymentMethod,
          orderId
        }).catch(() => {});

        // Telegram Notification
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

  return (
    <>
      {/* Floating Draggable Trigger Button & Context Pill */}
      <div
        style={{
          position: "fixed",
          left: position ? `${position.x}px` : "auto",
          top: position ? `${position.y}px` : "auto",
          right: position ? "auto" : "1rem",
          bottom: position ? "auto" : "5rem",
          touchAction: "none",
        }}
        className="z-50 flex items-center gap-2.5 select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* Dynamic rotating prompt pill */}
        {unreadPrompt && (
          <button
            type="button"
            onClick={(e) => {
              if (hasMovedRef.current) {
                e.preventDefault();
                return;
              }
              navigate("/messages");
            }}
            className={cn(
              "hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/90 backdrop-blur-md border border-cyan-400/40 text-slate-800 shadow-xl shadow-cyan-500/10 hover:border-cyan-500 transition-all text-xs font-bold cursor-pointer",
              fadeAnim ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
            )}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>{currentPromptText}</span>
            <ChevronRight className="h-3.5 w-3.5 text-cyan-600" />
          </button>
        )}

        {/* Main Floating Bubble Button - Water Droplet Orb with Drag & Slide Capability */}
        <button
          type="button"
          onClick={(e) => {
            if (hasMovedRef.current) {
              e.preventDefault();
              return;
            }
            navigate("/messages");
          }}
          className="group relative h-13 w-13 sm:h-14 sm:w-14 rounded-full bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),_0_8px_30px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95 transition-transform duration-150 flex items-center justify-center border-2 border-white/50 cursor-grab active:cursor-grabbing"
          aria-label="Open Sigma AI Shopping Manager"
        >
          <div className="relative pointer-events-none">
            <Bot className="h-6 w-6 sm:h-7 sm:w-7 group-hover:rotate-12 transition-transform duration-300" />
            <Sparkles className="h-3.5 w-3.5 text-cyan-200 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <span className="pointer-events-none absolute -bottom-1 text-[9px] font-black uppercase tracking-wider bg-sky-950/90 text-cyan-300 px-2 py-0.2 rounded-full border border-cyan-400/40 shadow-xs">
            Sigma
          </span>
        </button>
      </div>

      {/* Expandable Assistant Drawer - Liquid Water Droplet Glass */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 bg-gradient-to-br from-sky-100/90 via-cyan-50/80 to-blue-100/90 backdrop-blur-2xl border border-white/80 shadow-[0_16px_50px_rgba(14,165,233,0.25)] flex flex-col transition-all duration-300 overflow-hidden font-sans",
            isExpanded
              ? "inset-2 sm:inset-6 rounded-3xl"
              : "bottom-4 right-4 sm:right-6 w-[94vw] sm:w-[420px] h-[82vh] sm:h-[640px] max-h-[720px] rounded-3xl"
          )}
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-sky-500/90 via-cyan-500/85 to-blue-600/90 backdrop-blur-2xl text-white flex items-center justify-between shrink-0 shadow-md border-b border-white/30">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.7)]">
                <span className="text-lg">💧</span>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-sky-600 shadow-xs" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-base tracking-wide leading-none text-white">Sigma</h3>
                  <Badge className="bg-white/25 hover:bg-white/30 text-white text-[9px] font-black uppercase px-2 py-0 border border-white/40 rounded-full">
                    AI Manager
                  </Badge>
                </div>
                <p className="text-[10px] text-white/95 font-medium mt-0.5">
                  Powered by Durtup.shop
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMessages([defaultGreeting])}
                className="h-8 w-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                title="Reset Chat"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="h-8 w-8 rounded-xl bg-white/15 hover:bg-white/25 hidden sm:flex items-center justify-center text-white transition-colors"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3.5 text-xs sm:text-sm bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col",
                  msg.sender === "user" ? "items-end" : "items-start"
                )}
              >
                {/* Message Bubble */}
                <div
                  className={cn(
                    "max-w-[90%] sm:max-w-[85%] rounded-2xl p-3 sm:p-3.5 shadow-sm",
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-br-none font-medium"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs"
                  )}
                >
                  {/* User image attachment preview */}
                  {msg.userImage && (
                    <img
                      src={msg.userImage}
                      alt="Uploaded by user"
                      className="max-h-40 rounded-xl mb-2 object-cover border border-white/30"
                    />
                  )}
                  {msg.sender === "user" ? (
                    <p className="text-xs sm:text-[13px] leading-relaxed">{msg.text}</p>
                  ) : (
                    <FormattedMessageText text={msg.text} />
                  )}
                </div>

                {/* Rich Product Cards */}
                {msg.products && msg.products.length > 0 && (
                  <div className="w-full mt-2 flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-none">
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

                {/* Quick Action Chips */}
                {msg.quickActions && msg.quickActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.quickActions.map((qa, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (qa.link) {
                            window.location.href = qa.link;
                          } else {
                            handleSendMessage(qa.label);
                          }
                        }}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-orange-500 hover:bg-orange-50/70 text-slate-700 hover:text-orange-600 transition-all shadow-xs"
                      >
                        {qa.label}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {/* Tool Execution Status */}
            {toolStatus && (
              <div className="flex items-center">
                <SigmaToolActivityIndicator activityText={toolStatus} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Attached Image Thumbnail Preview */}
          {attachedImage && (
            <div className="px-4 py-2 bg-white border-t border-slate-200 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <img
                  src={attachedImage.previewUrl}
                  alt="Attachment Preview"
                  className="h-9 w-9 rounded-lg object-cover border border-orange-500"
                />
                <span className="text-[11px] text-slate-700 font-semibold">ছবি যুক্ত করা হয়েছে (Photo attached)</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="h-6 w-6 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Chat Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0 shadow-lg">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Image Picker File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImagePick}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-orange-50 border border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-300 flex items-center justify-center transition-colors shrink-0"
                title="Upload product photo"
              >
                <ImagePlus className="h-4 w-4" />
              </button>

              {/* Voice Recognition Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={cn(
                  "h-10 w-10 rounded-xl border flex items-center justify-center transition-all shrink-0",
                  isListening
                    ? "bg-rose-600 text-white border-rose-500 animate-pulse"
                    : "bg-slate-100 hover:bg-orange-50 border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-300"
                )}
                title={isListening ? "Listening... click to stop" : "Voice search"}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              {/* Text Input */}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="প্রোডাক্ট খুঁজুন বা প্রশ্ন লিখুন..."
                disabled={isTyping}
                className="flex-1 h-10 bg-slate-100/90 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-xl px-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
              />

              {/* Send Button */}
              <Button
                type="submit"
                disabled={(!inputValue.trim() && !attachedImage) || isTyping}
                className="h-10 w-10 p-0 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white shrink-0 shadow-md shadow-orange-500/20"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
