import React, { useEffect, useState } from 'react';
import { db } from '@/integrations/firebase/client';
import { collection, query, orderBy, limit, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { sendBrowserNotification, playNewOrderSound, unlockAudio } from '@/hooks/useAdminOrderNotifications';
import { Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PushNotificationInitializer: React.FC = () => {
  const navigate = useNavigate();
  const [showSoftPrompt, setShowSoftPrompt] = useState(false);

  // 1. Device registration (saves device to Firestore `push_tokens` for live admin counters)
  useEffect(() => {
    if (typeof window === 'undefined') return;

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

    // Check if we should ask for notification permission on phone/web
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      const dismissed = sessionStorage.getItem('durtup_notif_prompt_dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => setShowSoftPrompt(true), 3500);
        return () => clearTimeout(timer);
      }
    }
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

            // Only notify for fresh campaigns (within last 90 seconds)
            const campaignTime = data.created_at ? new Date(data.created_at).getTime() : (data.timestamp || Date.now());
            const isFresh = Date.now() - campaignTime < 90000;

            if (isFresh && !notifiedCampaigns.has(campaignId)) {
              notifiedCampaigns.add(campaignId);

              // 🔊 Play pleasant chime & vibrate phone
              playNewOrderSound();

              // 📱 Trigger native mobile/browser push notification
              sendBrowserNotification(data.title || '🛍️ Durtup.shop Special Offer!', {
                body: data.message || 'Check out the latest discounts and deals!',
                product_image: data.image_url || data.image || '/icon-512.png',
                tag: `campaign-${campaignId}`,
                data: {
                  url: data.action_url || data.url || '/',
                  campaign_id: campaignId
                }
              });
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

  const handleEnableNotifications = async () => {
    unlockAudio();
    setShowSoftPrompt(false);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          playNewOrderSound();
          sendBrowserNotification('🔔 Notifications Enabled!', {
            body: 'You will now receive instant flash sales, order updates, and discount alerts directly on your phone!',
            product_image: '/icon-512.png',
            data: { url: '/' }
          });
        }
      } catch (e) {
        console.warn('Permission request error:', e);
      }
    }
  };

  const handleDismissPrompt = () => {
    setShowSoftPrompt(false);
    sessionStorage.setItem('durtup_notif_prompt_dismissed', 'true');
  };

  if (!showSoftPrompt) return null;

  return (
    <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 z-50 bg-card border border-primary/30 rounded-2xl p-3.5 shadow-2xl shadow-primary/10 flex items-start gap-3 animate-in slide-in-from-top-4 duration-300">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-md">
        <Bell className="w-5 h-5 animate-bounce" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs sm:text-sm font-bold text-foreground leading-tight">
          অফার ও ডিসকাউন্ট নোটিফিকেশন 🔔
        </h4>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
          সেরা ডিল এবং নতুন অফার সবার আগে আপনার ফোনে পেতে নোটিফিকেশন অন করুন।
        </p>
        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={handleEnableNotifications}
            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer"
          >
            অনুমতি দিন (Allow)
          </button>
          <button
            onClick={handleDismissPrompt}
            className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            পরে (Later)
          </button>
        </div>
      </div>
      <button
        onClick={handleDismissPrompt}
        className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PushNotificationInitializer;

