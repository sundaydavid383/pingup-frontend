/**
 * Service Worker Helper Functions
 * Utilities for managing service worker lifecycle and communication
 */

export const SW_TIMEOUT = 10000; // 10 second timeout for SW operations

/**
 * Register service worker with proper error handling and timeouts
 */
export async function registerServiceWorker() {
  try {
    if (!('serviceWorker' in navigator)) {
      console.warn("⚠️ Service Workers not supported");
      return null;
    }

    const registration = await Promise.race([
      navigator.serviceWorker.register('/sw.js', { scope: '/' }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SW registration timeout')), SW_TIMEOUT)
      )
    ]);

    console.log('✅ Service Worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Get service worker controller with fallback
 */
export async function getServiceWorkerController() {
  try {
    if (!('serviceWorker' in navigator)) return null;

    const registration = await navigator.serviceWorker.ready;
    return registration.active || registration.installing;
  } catch (error) {
    console.error('❌ Error getting SW controller:', error);
    return null;
  }
}

/**
 * Send message to service worker with timeout
 */
export async function sendMessageToSW(message, timeout = 5000) {
  try {
    const controller = await getServiceWorkerController();
    if (!controller) {
      console.warn("⚠️ No active service worker to send message to");
      return null;
    }

    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();

      const timeoutId = setTimeout(() => {
        reject(new Error('SW message timeout'));
      }, timeout);

      channel.port1.onmessage = (event) => {
        clearTimeout(timeoutId);
        resolve(event.data);
      };

      channel.port1.onerror = (error) => {
        clearTimeout(timeoutId);
        reject(error);
      };

      controller.postMessage(message, [channel.port2]);
    });
  } catch (error) {
    console.error('❌ Error sending message to SW:', error);
    return null;
  }
}

/**
 * Check if service worker is active and responsive
 */
export async function checkServiceWorkerHealth() {
  try {
    const response = await sendMessageToSW(
      { type: 'GET_VERSION' },
      5000
    );

    if (response && response.version) {
      console.log('✅ Service Worker is healthy - v' + response.version);
      return true;
    }
    return false;
  } catch (error) {
    console.warn('⚠️ Service Worker health check failed:', error.message);
    return false;
  }
}

/**
 * Setup message listener for SW events
 */
export function setupSWMessageListener(handler) {
  if (!('serviceWorker' in navigator)) {
    console.warn("⚠️ Service Workers not supported");
    return () => {}; // Return cleanup function
  }

  navigator.serviceWorker.addEventListener('message', handler);

  // Return cleanup function
  return () => {
    navigator.serviceWorker.removeEventListener('message', handler);
  };
}

/**
 * Request notification permission and setup push
 */
export async function setupPushNotifications(vapidKey) {
  try {
    if (!vapidKey) {
      throw new Error('Missing VAPID key');
    }

    // Check permission
    if (window.Notification.permission === 'denied') {
      console.warn('⚠️ Notifications are blocked by user');
      return false;
    }

    if (window.Notification.permission === 'default') {
      const permission = await window.Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('⚠️ User denied notification permission');
        return false;
      }
    }

    // Get registration and subscribe
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await Promise.race([
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey)
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Push subscription timeout')), SW_TIMEOUT)
        )
      ]);
    }

    console.log('✅ Push subscription successful');
    return subscription;
  } catch (error) {
    console.error('❌ Push setup failed:', error);
    return null;
  }
}

/**
 * Convert VAPID key from base64url to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  try {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
  } catch (error) {
    console.error('❌ Error converting VAPID key:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('✅ Unsubscribed from push notifications');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error unsubscribing:', error);
    return false;
  }
}

/**
 * Trigger background sync
 */
export async function triggerBackgroundSync(tag = 'sync-messages') {
  try {
    const registration = await navigator.serviceWorker.ready;

    if ('sync' in registration) {
      await registration.sync.register(tag);
      console.log('✅ Background sync registered:', tag);
      return true;
    } else {
      console.warn('⚠️ Background Sync API not supported');
      return false;
    }
  } catch (error) {
    console.error('❌ Error registering background sync:', error);
    return false;
  }
}


// ── Core subscribe function ──────────────────────────────────────────────────
async function subscribeUserToPush(token) {
  const PUBLIC_VAPID_KEY = import.meta.env.VITE_PUBLIC_VAPID_KEY;

  if (!PUBLIC_VAPID_KEY) {
    console.error('❌ VITE_PUBLIC_VAPID_KEY is missing from .env');
    return;
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('⚠️ Push not supported in this browser');
    return;
  }

  try {
    // Wait for SW to be ready (with timeout)
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SW ready timeout')), 10_000)
      ),
    ]);
          // ✅ Replace just the subscribe block inside subscribeUserToPush
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
          });
          console.log('🔔 New push subscription created');
        } catch (firstErr) {
          console.warn('⚠️ First subscription attempt failed, retrying after 2s...', firstErr.message);
          // ✅ Wait for SW to fully activate then retry once
          await new Promise(resolve => setTimeout(resolve, 2000));
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
          });
          console.log('🔔 Push subscription created on retry');
        }
      } else {
        console.log('🔔 Existing push subscription found');
      }

    // ✅ Send to backend WITH auth header
    const SERVER = (import.meta.env.VITE_SERVER || '').replace(/\/$/, '');
    const res = await fetch(`${SERVER}/api/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,   // ← this was missing before
      },
      body: JSON.stringify(subscription.toJSON()),
    });

    if (res.ok) {
      console.log('✅ Push subscription saved to server');
    } else {
      const body = await res.json().catch(() => ({}));
      console.warn('⚠️ Server rejected subscription:', res.status, body);
    }
  } catch (err) {
    console.error('❌ subscribeUserToPush error:', err.message);
  }
}

// ── Permission request ───────────────────────────────────────────────────────
async function requestNotificationPermission(token) {
  if (!('Notification' in window)) {
    console.warn('⚠️ Notifications not supported');
    return;
  }

  const permission = Notification.permission;

  if (permission === 'denied') {
    console.log('⚠️ Notifications blocked by user');
    return;
  }

  if (permission === 'granted') {
    await subscribeUserToPush(token);
    return;
  }

  // Ask the user
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    await subscribeUserToPush(token);
  } else {
    console.log('⚠️ User dismissed notification prompt');
  }
}
export default {
  registerServiceWorker,
  getServiceWorkerController,
  sendMessageToSW,
  checkServiceWorkerHealth,
  setupSWMessageListener,
  setupPushNotifications,
  unsubscribeFromPush,
  triggerBackgroundSync,
  urlBase64ToUint8Array,
  requestNotificationPermission,
  subscribeUserToPush,
  SW_TIMEOUT
};
