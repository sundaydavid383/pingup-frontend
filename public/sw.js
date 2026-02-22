// ====================
// Service Worker (sw.js) - Enhanced for Deep Linking
// ====================

// Install - take control immediately
self.addEventListener('install', (event) => {
  console.log("🟢 Service Worker installing…");
  self.skipWaiting(); // immediately activate
});

// Activate - claim clients immediately
self.addEventListener('activate', (event) => {
  console.log("🟢 Service Worker activated");
  self.clients.claim(); // control all pages
});

// ====================
// Listen for push events
// ====================
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json(); // parse the JSON payload

  console.log("📬 Push notification received:", data);

  const options = {
    body: data.body,
    icon: data.icon || "/logo.png",          // sender profile image
    badge: "/logo.png",
    image: data.image || data.senderBackground || "",      // large background (Android supported)
    tag: data.chatId || 'default',          // group notifications by chat
    renotify: true,                         // notify for new messages in same chat
    data: {
      url: data.url || '/',                 // chat URL
      chatId: data.chatId,                 // chat ID for navigation
      messageId: data.messageId,            // exact message to scroll to
      senderId: data.senderId,              // sender ID
      type: 'chat-notification'             // notification type
    },
    actions: [
      { action: 'reply', title: 'Reply' },
      { action: 'markRead', title: 'Mark Read' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ====================
// Handle notification click - Deep Linking
// ====================
self.addEventListener("notificationclick", (event) => {
  event.notification.close(); // close the notification

  const notificationData = event.notification.data;
  const { url, chatId, messageId, senderId } = notificationData;
  
  console.log("👆 Notification clicked:", { url, chatId, messageId, senderId });

  // Build the URL with query params for deep linking
  let targetUrl = url || '/';
  const params = new URLSearchParams();
  
  if (chatId) params.append('chatId', chatId);
  if (messageId) params.append('message', messageId);
  if (senderId) params.append('sender', senderId);
  
  const queryString = params.toString();
  const fullUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;

  console.log("🔗 Target URL:", fullUrl);

  event.waitUntil(
    // First, try to focus an existing window/tab
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        console.log("📱 Found windows:", windowClients.length);

        // Check for existing chat tab
        for (let client of windowClients) {
          // If there's a client with the same base URL, focus it and send the message
          if (client.url.includes('/chat') || client.url.includes(url)) {
            console.log("✅ Focusing existing chat window");
            
            // Send message to scroll to specific message
            client.postMessage({ 
              type: 'SCROLL_TO_MESSAGE',
              chatId,
              messageId,
              senderId
            });
            
            return client.focus();
          }
        }

        // No existing chat found - open new window
        console.log("📱 Opening new chat window");
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
      })
  );
});

// ====================
// Handle notification action buttons (Reply, Mark Read)
// ====================
self.addEventListener("notificationaction", (event) => {
  const { action, notification } = event;
  const { chatId, messageId, senderId } = notification.data;
  
  console.log("🔘 Notification action:", action, { chatId, messageId });

  if (action === 'reply') {
    // Open chat with reply intent
    const replyUrl = `/chat/${chatId}?action=reply&message=${messageId}`;
    
    event.waitUntil(
      clients.matchAll({ type: "window" })
        .then((windowClients) => {
          for (let client of windowClients) {
            if (client.url.includes('/chat')) {
              client.postMessage({ 
                type: 'REPLY_TO_MESSAGE',
                chatId,
                messageId
              });
              return client.focus();
            }
          }
          return clients.openWindow(replyUrl);
        })
    );
  } else if (action === 'markRead') {
    // Send mark read intent
    event.waitUntil(
      clients.matchAll({ type: "window" })
        .then((windowClients) => {
          for (let client of windowClients) {
            client.postMessage({ 
              type: 'MARK_READ',
              chatId,
              messageId
            });
          }
        })
    );
  }
});

// ====================
// Listen for messages from pages
// ====================
self.addEventListener("message", (event) => {
  console.log("SW received message from page:", event.data);
  
  // Handle messages from the frontend
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'GET_VERSION':
        event.ports[0].postMessage({ version: '1.0.0' });
        break;
    }
  }
});

// ====================
// Background sync (if supported)
// ====================
self.addEventListener('sync', (event) => {
  console.log("🔄 Background sync:", event.tag);
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(
      // Sync messages in background
      console.log("Syncing messages...")
    );
  }
});
