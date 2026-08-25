import React, { useEffect, useRef } from "react";
import { db } from "@/integrations/firebase/client";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { playNewOrderSound, sendBrowserNotification, unlockAudio } from "@/hooks/useAdminOrderNotifications";
import { useToast } from "@/hooks/use-toast";

/**
 * GlobalAdminNotificationListener
 * 24/7 background listener across the entire Admin Panel.
 * Automatically sounds chime, vibrates phone, and posts native Android/Desktop push notifications
 * whenever ANY customer places an order on the storefront.
 */
export const GlobalAdminNotificationListener: React.FC = () => {
  const { toast } = useToast();
  const processedDocIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  // 1. Permission request, Audio unlock, & Screen WakeLock
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load previously notified orders from session storage
    try {
      const saved = sessionStorage.getItem("durtup_notified_orders");
      if (saved) {
        JSON.parse(saved).forEach((id: string) => processedDocIds.current.add(id));
      }
    } catch {}

    const handleFirstTouch = async () => {
      unlockAudio();
      if ("Notification" in window && Notification.permission === "default") {
        try {
          const perm = await Notification.requestPermission();
          if (perm === "granted") {
            playNewOrderSound();
            sendBrowserNotification("🔔 Durtup Admin Alerts Active!", {
              body: "Real-time order push notifications enabled on this device!",
              product_image: "/durtup-logo.png",
              data: { url: "/admin/orders" }
            });
          }
        } catch (e) {
          console.warn("[Admin Notification] Permission error:", e);
        }
      }
      window.removeEventListener("click", handleFirstTouch);
      window.removeEventListener("touchstart", handleFirstTouch);
    };

    window.addEventListener("click", handleFirstTouch, { once: true });
    window.addEventListener("touchstart", handleFirstTouch, { once: true });

    // WakeLock to prevent phone sleep while admin panel is open
    let wakeLock: any = null;
    if ("wakeLock" in navigator) {
      try {
        (navigator as any).wakeLock.request("screen").then((lock: any) => {
          wakeLock = lock;
        }).catch(() => {});
      } catch {}
    }

    return () => {
      window.removeEventListener("click", handleFirstTouch);
      window.removeEventListener("touchstart", handleFirstTouch);
      if (wakeLock) {
        try { wakeLock.release(); } catch {}
      }
    };
  }, []);

  const handleIncomingOrder = (data: any, source: string) => {
    const orderId = data.id || data.order_id || "";
    if (!orderId) return;

    if (processedDocIds.current.has(orderId)) return;
    processedDocIds.current.add(orderId);

    try {
      sessionStorage.setItem("durtup_notified_orders", JSON.stringify(Array.from(processedDocIds.current).slice(-60)));
    } catch {}

    const orderNum = data.order_number || orderId.slice(0, 8) || "NEW";
    const customerName = data.customer_name || data.shipping_address?.firstName || "Customer";
    const prodName = data.product_name || (Array.isArray(data.items) && data.items[0]?.name) || "Item";
    const amount = Number(data.total_amount || data.total || 0);
    const prodImg = data.product_image || data.image_url || (Array.isArray(data.items) && data.items[0]?.image) || "/durtup-logo.png";
    const payMethod = data.payment_method ? data.payment_method.toUpperCase() : "COD";

    // 🔊 1. Sound & Vibration
    playNewOrderSound();

    // 📱 2. Notification Push
    sendBrowserNotification(`🛍️ New Order #${orderNum}! (৳${amount.toLocaleString()})`, {
      body: `${customerName} ordered "${prodName}" • ${payMethod}`,
      product_image: prodImg,
      tag: `admin-order-${orderId}`,
      data: {
        url: "/admin/orders",
        order_id: orderId,
        order_number: orderNum
      }
    });

    // 🍞 3. In-App Toast
    toast({
      title: `🛍️ New Order #${orderNum}!`,
      description: `${customerName} ordered ${prodName} (৳${amount.toLocaleString()})`,
    });
  };

  // 2. Real-time Firestore listener on `admin_notifications`
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const notifRef = collection(db, "admin_notifications");
      const q = query(notifRef, orderBy("created_at", "desc"), limit(25));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isFirstLoad.current) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              handleIncomingOrder({ id: change.doc.id, ...change.doc.data() }, "firestore_admin_notif");
            }
          });
        } else {
          snapshot.forEach((d) => processedDocIds.current.add(d.id));
          isFirstLoad.current = false;
        }
      }, (err) => {
        console.warn("[GlobalAdminNotificationListener] Firestore realtime listener warning:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("[GlobalAdminNotificationListener] Error:", e);
    }
  }, [toast]);

  // 3. Cross-tab Broadcast Channel & Custom Event listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    let bc: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel("durtup_admin_order_notifications");
        bc.onmessage = (evt) => {
          if (evt.data?.type === "new_order" && evt.data?.order) {
            handleIncomingOrder(evt.data.order, "broadcast_channel");
          }
        };
      } catch {}
    }

    const handleCustomEvent = (evt: any) => {
      if (evt.detail) {
        handleIncomingOrder(evt.detail, "custom_event");
      }
    };

    window.addEventListener("durtup_new_order", handleCustomEvent as EventListener);

    return () => {
      if (bc) bc.close();
      window.removeEventListener("durtup_new_order", handleCustomEvent as EventListener);
    };
  }, [toast]);

  return null;
};

export default GlobalAdminNotificationListener;
