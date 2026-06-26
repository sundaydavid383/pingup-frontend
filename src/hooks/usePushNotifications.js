import { useState, useEffect, useCallback } from "react";
import axiosBase from "../utils/axiosBase";

// Your VAPID public key from .env
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported] = useState(
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );

  // Check current subscription state on mount
  useEffect(() => {
    if (!isSupported) return;

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub);
      });
    });
  }, [isSupported]);

  const requestPermissionAndSubscribe = useCallback(async () => {
    if (!isSupported) {
      console.warn("Push notifications not supported in this browser");
      return { success: false, reason: "unsupported" };
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error("VITE_VAPID_PUBLIC_KEY is not set in .env");
      return { success: false, reason: "no_vapid_key" };
    }

    try {
      // 1. Request browser permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        return { success: false, reason: "denied" };
      }

      // 2. Get the service worker registration
      // Uses the EXISTING service worker — we never register a new one here
      const reg = await navigator.serviceWorker.ready;

      // 3. Subscribe to push
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // 4. Send subscription to your backend
      const subJson = subscription.toJSON();
      await axiosBase.post("/api/notifications/push-subscribe", {
        endpoint: subJson.endpoint,
        keys: subJson.keys,
      });

      setIsSubscribed(true);
      console.log("✅ Push notifications subscribed successfully");
      return { success: true };
    } catch (err) {
      console.error("❌ Push subscription error:", err);
      return { success: false, reason: err.message };
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await axiosBase.delete("/api/notifications/push-unsubscribe", {
          data: { endpoint: sub.endpoint },
        });
        await sub.unsubscribe();
        setIsSubscribed(false);
        console.log("✅ Unsubscribed from push notifications");
      }
    } catch (err) {
      console.error("❌ Push unsubscribe error:", err);
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    requestPermissionAndSubscribe,
    unsubscribe,
  };
}