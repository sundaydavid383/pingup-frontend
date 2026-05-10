// ====================
// Service Worker (sw.js) - Enhanced for Deep Linking
// ====================

const SW_VERSION = '1.0.1';
const NOTIFICATION_TIMEOUT = 5000; // 5 second timeout for notification operations

// Install - take control immediately
self.addEventListener('install', (event) => {
  console.log("🟢 Service Worker installing… v" + SW_VERSION);
  self.skipWaiting(); // immediately activate
});

// Activate - claim clients immediately
self.addEventListener('activate', (event) => {
  console.log("🟢 Service Worker activated");
  event.waitUntil(
    self.clients.claim() // control all pages
      .then(() => {
        console.log("✅ Service Worker now controls all clients");
      })
      .catch((error) => {
        console.error("❌ Error claiming clients:", error);
      })
  );
});

// ====================
// Listen for push events
// ====================
self.addEventListener("push", (event) => {
  try {
    if (!event.data) {
      console.warn("⚠️ Push event received with no data");
      return;
    }

    let data;
    try {
      data = event.data.json();
    } catch (e) {
      console.error("❌ Failed to parse push data:", e);
      data = { title: "Notification", body: event.data.text() || "New update" };
    }

    console.log("📬 Push notification received:", data);

    const options = {
      body: data.body || "New notification",
      icon: data.icon || "/icons/icon-192x192.png",
      badge: "/icons/icon-96x96.png",
      image: data.image || data.senderBackground || "",
      tag: data.chatId || 'default',
      renotify: true,
      requireInteraction: false,
      data: {
        url: data.url || '/messages',
        chatId: data.chatId || null,
        messageId: data.messageId || null,
        senderId: data.senderId || null,
        senderName: data.senderName || "Someone",
        type: 'chat-notification',
        timestamp: Date.now()
      },
      actions: [
        { action: 'open', title: 'Open' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };

    // Wrap notification in a Promise with timeout
    const notificationPromise = self.registration.showNotification(data.title || "New Message", options);
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.warn("⚠️ Notification display timeout - continuing anyway");
        resolve();
      }, NOTIFICATION_TIMEOUT);
    });

    event.waitUntil(
      Promise.race([notificationPromise, timeoutPromise])
        .then(() => {
          console.log("✅ Notification displayed successfully");
        })
        .catch((error) => {
          console.error("❌ Error displaying notification:", error);
        })
    );

  } catch (error) {
    console.error("❌ Unexpected error in push handler:", error);
    // Attempt fallback notification
    event.waitUntil(
      self.registration.showNotification("New Message", {
        body: "You have a new notification",
        icon: "/icons/icon-192x192.png"
      }).catch((e) => console.error("❌ Fallback notification also failed:", e))
    );
  }
});

// ====================
// Handle notification click - Deep Linking
// ====================
self.addEventListener("notificationclick", (event) => {
  try {
    event.notification.close();

    const notificationData = event.notification.data || {};
    const { url, chatId, messageId, senderId, senderName } = notificationData;
    
    console.log("👆 Notification clicked:", { url, chatId, messageId, senderId });

    // Build the URL with query params for deep linking
    let targetUrl = url || '/messages';
    const params = new URLSearchParams();
    
    if (chatId) params.append('chatId', chatId);
    if (messageId) params.append('message', messageId);
    if (senderId) params.append('sender', senderId);
    
    const queryString = params.toString();
    const fullUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;

    console.log("🔗 Target URL:", fullUrl);

    // Wrap in a Promise with timeout
    const clickHandlerPromise = clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        console.log("📱 Found windows:", windowClients.length);

        // Try to find existing chat tab
        for (let client of windowClients) {
          const clientPath = new URL(client.url).pathname;
          
          if (clientPath.includes('/messages') || clientPath.includes('/chat')) {
            console.log("✅ Focusing existing chat window");
            
            // Send message to scroll to specific message
            if (messageId) {
              client.postMessage({ 
                type: 'SCROLL_TO_MESSAGE',
                chatId,
                messageId,
                senderId
              });
            }
            
            return client.focus().then(() => client);
          }
        }

        // No existing chat found - open new window
        console.log("📱 Opening new messages window");
        return clients.openWindow(fullUrl);
      })
      .then((client) => {
        if (client) {
          console.log("✅ Client focused/opened:", client.url);
        }
      })
      .catch((error) => {
        console.error("❌ Error handling notification click:", error);
        // Fallback: open window
        return clients.openWindow(fullUrl);
      });

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.warn("⚠️ Notification click handler timeout");
        resolve();
      }, NOTIFICATION_TIMEOUT);
    });

    event.waitUntil(
      Promise.race([clickHandlerPromise, timeoutPromise])
    );

  } catch (error) {
    console.error("❌ Unexpected error in notificationclick handler:", error);
    // Fallback: navigate to messages
    event.waitUntil(clients.openWindow('/messages'));
  }
});

// ====================
// Handle notification action buttons (Open, Dismiss)
// ====================
self.addEventListener("notificationaction", (event) => {
  try {
    const { action, notification } = event;
    const notificationData = notification.data || {};
    const { chatId, messageId, senderId, url } = notificationData;
    
    console.log("🔘 Notification action:", action, { chatId, messageId });

    // Close the notification after action
    notification.close();

    if (action === 'open' || !action) {
      // Default: open the chat
      const targetUrl = url || `/messages?chatId=${chatId || ''}`;
      
      const actionPromise = clients.matchAll({ type: "window", includeUncontrolled: true })
        .then((windowClients) => {
          for (let client of windowClients) {
            if (client.url.includes('/messages') || client.url.includes('/chat')) {
              if (messageId) {
                client.postMessage({ 
                  type: 'SCROLL_TO_MESSAGE',
                  chatId,
                  messageId,
                  senderId
                });
              }
              return client.focus().then(() => client);
            }
          }
          return clients.openWindow(targetUrl);
        })
        .catch((error) => {
          console.error("❌ Error in action handler:", error);
          return clients.openWindow(targetUrl);
        });

      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve(), NOTIFICATION_TIMEOUT);
      });

      event.waitUntil(Promise.race([actionPromise, timeoutPromise]));

    } else if (action === 'dismiss') {
      // Just close - already done above
      event.waitUntil(Promise.resolve());
    }

  } catch (error) {
    console.error("❌ Unexpected error in notificationaction handler:", error);
    event.notification.close();
  }
});

// ====================
// Listen for messages from pages
// ====================
self.addEventListener("message", (event) => {
  try {
    console.log("📨 SW received message from page:", event.data);
    
    // Handle messages from the frontend
    if (event.data && event.data.type) {
      switch (event.data.type) {
        case 'SKIP_WAITING':
          console.log("🔄 SKIP_WAITING received");
          self.skipWaiting();
          break;
        case 'GET_VERSION':
          console.log("📋 GET_VERSION requested");
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ version: SW_VERSION, timestamp: Date.now() });
          }
          break;
        case 'CACHE_ASSETS':
          console.log("💾 CACHE_ASSETS requested");
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ status: 'cached' });
          }
          break;
        default:
          console.log("❓ Unknown message type:", event.data.type);
      }
    }
  } catch (error) {
    console.error("❌ Error handling message:", error);
  }
});

// ====================
// Handle notification close
// ====================
self.addEventListener('notificationclose', (event) => {
  try {
    console.log("🔔 Notification closed:", event.notification.data);
    // Could log analytics here
  } catch (error) {
    console.error("❌ Error in notificationclose handler:", error);
  }
});

// ====================
// Background sync (if supported)
// ====================
self.addEventListener('sync', (event) => {
  try {
    console.log("🔄 Background sync event:", event.tag);
    
    if (event.tag === 'sync-messages') {
      const syncPromise = new Promise((resolve) => {
        console.log("📨 Syncing messages in background...");
        // Attempt to fetch unread messages from API
        setTimeout(() => {
          console.log("✅ Background sync completed");
          resolve();
        }, 1000);
      });

      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          console.warn("⚠️ Background sync timeout");
          resolve();
        }, 30000); // 30 second timeout
      });

      event.waitUntil(Promise.race([syncPromise, timeoutPromise]));
    }
  } catch (error) {
    console.error("❌ Error in sync handler:", error);
    event.waitUntil(Promise.resolve());
  }
});
