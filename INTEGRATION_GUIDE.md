# WhatsApp-Level Chat Seen System - Integration Guide

**Complete step-by-step implementation guide**

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [File Structure](#file-structure)
3. [Step-by-Step Integration](#step-by-step-integration)
4. [Backend Requirements](#backend-requirements)
5. [Testing Checklist](#testing-checklist)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Files You Need

```
src/
├── hooks/
│   └── useSeenManager.js          ← NEW HOOK (handles all seen logic)
├── component/
│   └── ChatMessagesFull.jsx        ← UPDATE to use hook
│   └── ChatMessagesFull_REFACTORED.jsx ← REFERENCE implementation
└── utils/
    └── axiosBase.js               ← USE existing (no changes needed)

Root/
├── CHAT_SEEN_SYSTEM_ARCHITECTURE.md    ← Read this first
├── SOCKET_EVENT_CONTRACT.js            ← Backend spec
└── INTEGRATION_GUIDE.md                ← This file
```

---

## File Structure

Your updated ChatMessagesFull component should look like:

```javascript
import useSeenManager from "../hooks/useSeenManager"; // ← NEW IMPORT

const ChatMessagesFull = ({ /* ...props */ }) => {
  // Use the hook
  const seenManager = useSeenManager({
    messages,
    setMessages,
    chatId,
    userId: user._id,
    socket,
    containerRef,
    scrollStopped,
  });

  // Then use seenManager values in JSX:
  // - seenManager.lastSeenMessage
  // - seenManager.receiverLastSeen
  // - seenManager.unseenBelowCount
  // - seenManager.scrollToBottom()
  // - seenManager.isMessageSeen(msg)
  // - seenManager.hasUnseenMessages
};
```

---

## Step-by-Step Integration

### Step 1: Create the useSeenManager Hook

1. Copy `useSeenManager.js` file into `src/hooks/`
2. Verify imports are available in your project:
   - `React`, `useState`, `useEffect`, `useCallback`, `useRef`
   - `axiosBase` from `../utils/axiosBase`

### Step 2: Update ChatMessagesFull in Your Project

Replace your current ChatMessagesFull.jsx with changes from ChatMessagesFull_REFACTORED.jsx:

**Most Important Changes:**

```javascript
// 1. Import the hook
import useSeenManager from "../hooks/useSeenManager";

// 2. Initialize in component
const seenManager = useSeenManager({
  messages,
  setMessages,
  chatId,
  userId: user._id,
  socket,
  containerRef,
  scrollStopped,
  scrollStopDebounce: 1200, // Can adjust if needed
});

// 3. Register message ref with hook
<div
  ref={(el) => {
    if (el) {
      messageRefs.current[msg._id] = el;
      seenManager.setMessageRef(msg._id, el); // ← NEW LINE
    }
  }}
  // ... rest of message props
>

// 4. Update checkmark logic
{sentByUser ? (
  seenManager.receiverLastSeen &&
  new Date(msg.createdAt) <=
    new Date(seenManager.receiverLastSeen.createdAt)
    ? <CheckCheck className="text-blue-500" />
    : <CheckCheck className="text-gray-400" /> // or single check
) : (
  seenManager.isMessageSeen(msg)
    ? <CheckCheck className="text-blue-500" />
    : // ...
)}

// 5. Add unseen count to scroll button
{seenManager.hasUnseenMessages && (
  <div className="absolute -top-2 -right-2 bg-red-500 rounded-full">
    {seenManager.getUnseenCountLabel()}
  </div>
)}

// 6. Use hook's scrollToBottom
onClick={() => seenManager.scrollToBottom()}
```

### Step 3: Verify Parent Component Props

The parent component (likely `Messages.jsx` or `ChatBox.jsx`) should pass:

```javascript
<ChatMessagesFull
  messages={messages}
  setMessages={setMessages}
  chatId={chatId}
  containerRef={containerRef}        // ← REQUIRED
  scrollStopped={scrollStopped}      // ← REQUIRED
  user={user}
  socket={socket}                    // ← REQUIRED (from useSocket)
  receiver={otherUser}
  // ... other props
/>
```

Make sure `scrollStopped` boolean is properly tracked by parent.

### Step 4: Backend API Routes

Your backend must implement:

#### GET `/api/chat/:chatId/last-seen`
```javascript
// Response
{
  "message": {
    "_id": "msg_123",
    "text": "Hello",
    "createdAt": "2026-02-18T10:30:00Z",
    // ... full message object
  },
  "receiverLastSeen": {
    "messageId": "msg_120",
    "createdAt": "2026-02-18T10:25:00Z",
    "userId": "user_2"
  }
}
```

#### POST `/api/chat/:chatId/last-seen`
```javascript
// Request body
{
  "messageId": "msg_125"
}

// Response
{
  "success": true,
  "message": {  // The message object
    "_id": "msg_125",
    "createdAt": "2026-02-18T10:32:00Z"
  }
}
```

### Step 5: Socket Event Handlers

Your backend socket handlers:

```javascript
// Handle updateLastSeen from frontend
socket.on("updateLastSeen", async (data) => {
  const { chatId, messageId, userId } = data;
  
  // Save to DB
  const message = await Message.findById(messageId);
  const conversation = await Conversation.findById(chatId);
  conversation.lastSeenMessage[userId] = {
    messageId,
    createdAt: message.createdAt,
  };
  await conversation.save();
  
  // Emit to other user
  const otherUserId = conversation.participants.find(p => p !== userId);
  socket.to(otherUserId).emit("receiverSeenMessage", {
    chatId,
    messageId,
    userId,
    createdAt: message.createdAt,
  });
});

// On new message, broadcast to recipient
socket.on("newMessage", async (messageData) => {
  // Save message
  const msg = await Message.create(messageData);
  
  // Broadcast
  socket.to(messageData.to_user_id).emit("newMessage", msg);
});

// On message delete
socket.on("deleteMessage", async (data) => {
  const { messageId, chatId } = data;
  
  // Delete from DB
  await Message.findByIdAndDelete(messageId);
  
  // Broadcast to all users in chat
  socket.to(chatId).emit("messageDeleted", {
    messageId,
    chatId,
  });
});
```

---

## Backend Requirements

### 1. Conversation Model

```javascript
// Mongoose example
const conversationSchema = new Schema({
  _id: ObjectId,
  participants: [ObjectId],           // User IDs
  messages: [ObjectId],               // Message IDs
  createdAt: Date,
  updatedAt: Date,
  
  // CRITICAL: Track last seen per user
  lastSeenMessage: {
    type: Map,
    of: new Schema({
      messageId: ObjectId,
      createdAt: Date,
      timestamp: Date
    }),
    default: {}
  }
});

// Example: { "user_1": {messageId: "msg_5", createdAt: ...}, "user_2": {...} }
```

### 2. Message Model

```javascript
const messageSchema = new Schema({
  _id: ObjectId,
  chatId: ObjectId,
  from_user_id: ObjectId,
  to_user_id: ObjectId,
  text: String,
  message_type: String,               // "text", "image", "audio"
  media_url: String,
  
  status: String,                     // "sending", "sent", "delivered", "seen"
  seenBy: [ObjectId],                 // Users who've seen
  seenAt: Date,
  
  createdAt: Date,
  updatedAt: Date,
  
  // For replies
  replyTo: {
    _id: ObjectId,
    text: String,
    from_user_id: ObjectId
  }
});
```

### 3. API Endpoint: GET /api/chat/:chatId/last-seen

```javascript
router.get("/api/chat/:chatId/last-seen", async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;
  
  try {
    const conversation = await Conversation.findById(chatId);
    
    if (!conversation) {
      return res.status(404).json({ error: "Chat not found" });
    }
    
    // Get this user's last seen message
    const lastSeenData = conversation.lastSeenMessage.get(userId.toString());
    
    let message = null;
    if (lastSeenData) {
      message = await Message.findById(lastSeenData.messageId);
    }
    
    // Get the other user's last seen
    const otherUserId = conversation.participants.find(
      p => p.toString() !== userId.toString()
    );
    const receiverLastSeen = conversation.lastSeenMessage.get(otherUserId.toString());
    
    res.json({
      message,
      receiverLastSeen
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 4. API Endpoint: POST /api/chat/:chatId/last-seen

```javascript
router.post("/api/chat/:chatId/last-seen", async (req, res) => {
  const { chatId } = req.params;
  const { messageId } = req.body;
  const userId = req.user._id;
  
  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    
    const conversation = await Conversation.findById(chatId);
    
    // Update last seen
    conversation.lastSeenMessage.set(userId.toString(), {
      messageId,
      createdAt: message.createdAt,
      timestamp: new Date()
    });
    
    await conversation.save();
    
    res.json({
      success: true,
      message
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 5. Socket Middleware for Rate Limiting

```javascript
// Add to your socket connection handler
const lastUpdateMap = new Map();

io.on("connection", (socket) => {
  socket.on("updateLastSeen", (data) => {
    const key = `${data.userId}_${data.chatId}`;
    const now = Date.now();
    const lastTime = lastUpdateMap.get(key) || 0;
    
    // Rate limit: max 1 update per 500ms per user per chat
    if (now - lastTime < 500) {
      console.warn(`Rate limit: ${key} throttled`);
      return;
    }
    
    lastUpdateMap.set(key, now);
    
    // Process the update...
    handleUpdateLastSeen(data, socket);
  });
});
```

---

## Testing Checklist

### Unit Tests (Frontend)

```javascript
// test/hooks/useSeenManager.test.js

describe("useSeenManager", () => {
  it("should initialize with null lastSeenMessage", () => {
    // Test initial state
  });
  
  it("should update lastSeenMessage on scroll stop", () => {
    // Test scroll behavior
  });
  
  it("should calculate correct unseenBelowCount", () => {
    // Test unseen calculation
  });
  
  it("should not emit duplicate socket events", () => {
    // Test deduplication
  });
  
  it("should handle message deletion", () => {
    // Test edge case
  });
  
  it("should fetch last seen on chatId change", () => {
    // Test initialization
  });
});
```

### Integration Tests (E2E)

```javascript
// tests/e2e/chat-seen.spec.js

describe("Chat Seen System", () => {
  test("User scrolls and other user sees checkmark", async () => {
    // Open two browsers
    // User A sends message
    // User B scrolls message into view
    // Wait 1.2s for debounce
    // Assert User A sees blue checkmark
  });
  
  test("Unseen count updates correctly", async () => {
    // Send multiple messages
    // Check scroll button shows count
    // Scroll up
    // Count should increase/decrease appropriately
  });
  
  test("Reconnect restores state", async () => {
    // Open chat
    // Scroll to message
    // Disconnect network
    // Reconnect
    // Assert state restored
  });
  
  test("Delete message updates lastSeenMessage", async () => {
    // Scroll to message #5
    // Another user deletes message #5
    // Assert lastSeenMessage updates to #4
  });
});
```

### Manual Testing

```
□ Send message
□ Wait for "delivered" status
□ Scroll to message
□ Wait 1.2s (no scroll)
□ Check if checkmark turns blue on sender's device
□ Refresh page on receiver
□ Assert last seen message restored
□ Scroll up to old messages
□ New messages arrive
□ Assert not marked as seen (only viewport matters)
□ Delete last seen message
□ Assert no error, lastSeenMessage updates
□ Rapid scroll up/down
□ Assert smooth (no jank)
□ Only ONE socket emit (dedup works)
```

---

## Troubleshooting

### Issue: Messages not marked as seen

**Causes:**
1. `scrollStopped` not being set properly by parent
2. IntersectionObserver not detecting visible messages
3. Socket not connected

**Debug Steps:**
```javascript
// In useSeenManager
useEffect(() => {
  console.log("scrollStopped:", scrollStopped);
  console.log("containerRef:", containerRef.current);
  console.log("lastSeenMessage:", lastSeenMessage);
}, [scrollStopped, lastSeenMessage]);
```

### Issue: Duplicate socket emissions

**Causes:**
1. Effect running multiple times
2. Ref tracking not working

**Debug Steps:**
```javascript
console.log("lastEmittedMessageIdRef:", lastEmittedMessageIdRef.current);
console.log("About to emit:", messageId);

// Check if same messageId is being emitted
```

### Issue: Blue checkmarks not appearing

**Causes:**
1. `receiverLastSeen` not updating
2. Checkmark condition wrong
3. UI not re-rendering

**Debug Steps:**
```javascript
// Verify socket listener is receiving events
socket.on("receiverSeenMessage", (data) => {
  console.log("Received receiverSeenMessage:", data);
  // Should see this in console when other user scrolls
});
```

### Issue: Unseen count always wrong

**Causes:**
1. `calculateUnseenBelowCount` not called at right time
2. `lastSeenMessage` not updated before count calculation

**Debug Steps:**
```javascript
useEffect(() => {
  console.log("lastSeenMessage:", lastSeenMessage);
  console.log("messages.length:", messages.length);
  console.log("unseenBelowCount:", unseenBelowCount);
}, [lastSeenMessage, messages]);
```

### Issue: High CPU usage

**Causes:**
1. IntersectionObserver not cleaned up
2. Too many ref updates
3. Excessive state updates

**Optimization:**
```javascript
// Add debounce to IntersectionObserver callback
const observerCallback = useCallback(
  debounce((entries) => {
    // Handle entries
  }, 300),
  []
);
```

### Issue: Scroll performance degraded

**Causes:**
1. Too many message refs
2. ContainerRef not properly assigned
3. Render optimization needed

**Solution:**
```javascript
// Use React.memo for message components
const MessageBubble = React.memo(({ msg, ... }) => {
  return ( /* ... */ );
});
```

---

## Next Steps

1. ✅ Read CHAT_SEEN_SYSTEM_ARCHITECTURE.md
2. ✅ Read SOCKET_EVENT_CONTRACT.js
3. ✅ Copy useSeenManager.js to src/hooks/
4. ✅ Update ChatMessagesFull.jsx
5. ✅ Implement backend APIs
6. ✅ Implement socket handlers
7. ✅ Run manual tests
8. ✅ Deploy and monitor

---

## Production Checklist

Before deploying:

- [ ] Error logging set up (console.error tracking)
- [ ] Socket connection pooling configured
- [ ] Rate limiting implemented on backend
- [ ] Database indexes on Message.createdAt and Conversation._id
- [ ] Message persistence tested with network loss
- [ ] Large message load tested (1000+ messages)
- [ ] Cross-browser testing complete (iOS/Android Safari)
- [ ] Performance monitoring set up
- [ ] Memory leak testing (DevTools)
- [ ] Stress testing (100+ concurrent users)

---

## Support & Debugging

For issues, check:

1. Browser DevTools → Console (errors?)
2. Browser DevTools → Network → WebSockets (connected?)
3. Backend logs (socket events received?)
4. Database (lastSeenMessage saved?)
5. Add console.log statements in useSeenManager hooks

Print out:
```javascript
console.table({
  lastSeenMsg: lastSeenMessage?._id,
  receiverLastSeen: receiverLastSeen?.messageId,
  unseenCount: unseenBelowCount,
  scrollStopped,
  socketConnected: socket?.connected,
});
```

