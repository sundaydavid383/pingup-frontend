// ─────────────────────────────────────────────────────────────────────────────
// Drop-in replacement for the push notification section of App.jsx
// Replace the existing requestNotificationPermission / subscribeUserToPush
// functions and the two useEffects that call them.
// ─────────────────────────────────────────────────────────────────────────────

// ── Helper ──────────────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
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

    // Check for existing subscription first
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      });
      console.log('🔔 New push subscription created');
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

// ── useEffect to paste into App.jsx ─────────────────────────────────────────
// Replace your existing notification useEffect with this one:

/*
useEffect(() => {
  if (!user || !token) return;

  const timeoutId = setTimeout(() => {
    console.warn('⚠️ Notification permission request timed out');
  }, 15_000);

  requestNotificationPermission(token).finally(() => clearTimeout(timeoutId));

  return () => clearTimeout(timeoutId);
}, [user, token]);
*/

export { requestNotificationPermission, subscribeUserToPush };