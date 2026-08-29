import React, { useEffect, useState, useRef } from 'react';
import { db } from '@/integrations/firebase/client';
import { collection, query, orderBy, limit, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { sendBrowserNotification, playNewOrderSound } from '@/hooks/useAdminOrderNotifications';
import { X, ExternalLink, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BroadcastPayload {
  id: string;
  title: string;
  message: string;
  image_url?: string | null;
  action_url?: string | null;
}

export const PushNotificationInitializer: React.FC = () => {
  const navigate = useNavigate();
  const [activeBroadcast, setActiveBroadcast] = useState<BroadcastPayload | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Register Service Worker & Save Device Token to Firestore
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register Service Worker for Mobile Notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[PushNotificationInitializer] Service worker register warning:', err);
      });
    }

    const registerDeviceToken = async () => {
      try {
        let deviceId = localStorage.getItem('durtup_device_id');
        if (!deviceId) {
          deviceId = 'dev_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
          localStorage.setItem('durtup_device_id', deviceId);
        }

        const ua = navigator.userAgent;
        let platform: 'android' | 'ios' | 'web' = 'web';
        if (/android/i.test(ua)) platform = 'android';
        else if (/iphone|ipad|ipod/i.test(ua)) platform = 'ios';

        const tokenDocRef = doc(db, 'push_tokens', deviceId);
        await setDoc(tokenDocRef, {
          id: deviceId,
          token: deviceId,
          platform: platform,
          is_active: true,
          permission: 'Notification' in window ? Notification.permission : 'unsupported',
          user_agent: ua,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('[PushNotificationInitializer] Device registration warning:', err);
      }
    };

    registerDeviceToken();
  }, []);

  // 2. Real-time broadcast notification listener (User phone push notifications sent by Admin)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const notifiedCampaigns = new Set<string>();

    try {
      const q = query(
        collection(db, 'broadcast_notifications'),
        orderBy('created_at', 'desc'),
        limit(5)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const campaignId = change.doc.id;

            // Only notify for fresh campaigns (within last 2 minutes)
            const campaignTime = data.created_at ? new Date(data.created_at).getTime() : (data.timestamp || Date.now());
            const isFresh = Date.now() - campaignTime < 120000;

            if (isFresh && !notifiedCampaigns.has(campaignId)) {
              notifiedCampaigns.add(campaignId);

              // 🔊 1. Sound & Vibration
              playNewOrderSound();

              // 📱 2. System Notification Shade (Android / Web)
              sendBrowserNotification(data.title || '🛍️ Durtup.shop Special Offer!', {
                body: data.message || 'Check out the latest discounts and deals!',
                product_image: data.image_url || data.image || '/icon-512.png',
                tag: `campaign-${campaignId}`,
                data: {
                  url: data.action_url || data.url || '/',
                  campaign_id: campaignId
                }
              });

              // 💬 3. Floating Heads-Up Push Notification Card on Mobile/Screen
              setActiveBroadcast({
                id: campaignId,
                title: data.title || '🛍️ Durtup.shop Special Offer!',
                message: data.message || 'Check out the latest discounts and deals!',
                image_url: data.image_url || data.image || null,
                action_url: data.action_url || data.url || '/'
              });

              // Auto dismiss floating card after 12 seconds
              if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
              dismissTimerRef.current = setTimeout(() => {
                setActiveBroadcast(null);
              }, 12000);
            }
          }
        });
      }, (err) => {
        console.warn('[PushNotificationInitializer] Broadcast listener warning:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('[PushNotificationInitializer] Broadcast listener setup error:', e);
    }
  }, []);

  const handleBroadcastClick = () => {
    if (activeBroadcast?.action_url) {
      const url = activeBroadcast.action_url;
      setActiveBroadcast(null);
      if (url.startsWith('http')) {
        window.open(url, '_blank');
      } else {
        navigate(url);
      }
    } else {
      setActiveBroadcast(null);
    }
  };

  return (
    <>
      {/* 1. Interactive Floating Push Notification Alert (Heads-Up Banner for Phone & Web) */}
      {activeBroadcast && (
        <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-5 sm:w-[420px] z-[9999] animate-in slide-in-from-top-6 duration-300">
          <div className="bg-card/95 backdrop-blur-md border-2 border-primary/40 rounded-2xl p-3.5 shadow-2xl shadow-primary/20 flex flex-col gap-2.5">
            <div className="flex items-start gap-3">
              {activeBroadcast.image_url ? (
                <img
                  src={activeBroadcast.image_url}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover border border-primary/20 shadow-sm shrink-0 bg-muted"
                  onError={(e) => { (e.target as any).style.display = 'none'; }}
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">
                    🔔 New Offer
                  </span>
                  <span className="text-[10px] text-muted-foreground">এখনই</span>
                </div>
                <h4 className="text-sm font-bold text-foreground leading-tight line-clamp-1">
                  {activeBroadcast.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                  {activeBroadcast.message}
                </p>
              </div>
              <button
                onClick={() => setActiveBroadcast(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-border/40">
              <button
                onClick={handleBroadcastClick}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
              >
                <span>অফারটি দেখুন (View Deal)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveBroadcast(null)}
                className="py-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors cursor-pointer"
              >
                বাদ দিন
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PushNotificationInitializer;

