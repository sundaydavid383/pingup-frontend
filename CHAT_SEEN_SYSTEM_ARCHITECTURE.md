# WhatsApp-Level Message Seen System Architecture

**Version 1.0** | Production-Ready Design

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Core Architecture](#core-architecture)
3. [Data Structures](#data-structures)
4. [State Management](#state-management)
5. [Socket Event Contract](#socket-event-contract)
6. [Event Flow](#event-flow)
7. [Performance Optimizations](#performance-optimizations)
8. [Edge Cases & Handling](#edge-cases--handling)

---

## System Overview

### What Makes This WhatsApp-Level

✅ **Viewport Intelligent** - Only marks messages seen when user actually views them  
✅ **Real-Time Bidirectional** - Both users see seen status instantly  
✅ **Optimized Scroll Detection** - Uses IntersectionObserver + debounce  
✅ **Full Message Lifecycle** - Sent → Delivered → Seen (dual checkmarks)  
✅ **Resilient** - Handles disconnects, reloads, race conditions  
✅ **Performance First** - Minimal re-renders, zero blocking operations  

### The Core Problem

Without proper seen tracking:
- Users don't know if messages are read
- Phantom reads/writes possible
- Sync issues across tabs/devices
- Inconsistent state in race conditions

### Our Solution

A **threshold-based system** where the last visible message acts as a barrier:
- Messages **above/at threshold** = seen
- Messages **below threshold** = unseen
- Only update threshold when scroll stops (after 1.2s debounce)

---

## Core Architecture

### Layered Responsibility Model

```
┌─────────────────────────────────────────┐
│  ChatMessagesFull Component             │
│  (Handles: Rendering, Dropdown, Media) │
└──────────────────────┬──────────────────┘
                       │
┌──────────────────────▼──────────────────┐
│  useSeenManager Hook                    │
│  (Handles: Core seen logic, debounce)   │
└──────────────────────┬──────────────────┘
                       │
┌──────────────────────▼──────────────────┐
│  useSocket Hook                         │
│  (Handles: Real-time socket events)     │
└──────────────────────┬──────────────────┘
                       │
┌──────────────────────▼──────────────────┐
│  Backend API + Socket.io Server         │
│  (Handles: Persistence, other users)    │
└─────────────────────────────────────────┘
```

### **The Three Core Concepts**

#### 1️⃣ **Last Seen Message** (Viewport Threshold)
```
The LATEST message visible in viewport that user has stopped scrolling on.
Acts as a dividing line between seen/unseen.

Example Timeline:
┌─────────────────────┐
│  Message 10         │  ← Below viewport
│  Message 9          │  ← Below viewport
├─────────────────────┤  ← Viewport edge
│  Message 8 ✅       │  ← LAST VISIBLE (threshold = Message 8)
│  Message 7 ✅       │
│ (scrolled and       │
│  stopped here)      │
└─────────────────────┘
```

#### 2️⃣ **Receiver Last Seen** (What They've Seen)
```
Tracks the LAST message the other user has marked as seen.
Allows us to show them accurate checkmarks for our sent messages.

{
  messageId: "msg_123",
  createdAt: "2026-02-18T10:30:00Z",
  userId: "user_2"
}
```

#### 3️⃣ **Unseen Count Below**
```
How many unread messages exist BELOW current viewport.

Example:
Last visible: Message 5
Total messages: 15
Unseen below = 15 - 5 = 10 unseen

Show "↓ 10" on scroll button.
```

---

## Data Structures

### Message Object (Extended)

```javascript
{
  _id: "msg_abc123",
  text: "Hello!",
  from_user_id: "user_1",
  to_user_id: "user_2",
  createdAt: "2026-02-18T10:30:00Z",
  
  // Status tracking
  status: "seen" | "delivered" | "sending" | "failed",
  
  // Seen metadata
  seenBy: ["user_2"],              // Array of user IDs who've seen
  seenAt: "2026-02-18T10:30:05Z",  // When it was seen
  
  // Media
  message_type: "text" | "image" | "audio",
  media_url: "https://...",
  
  // Reply context
  replyTo: {
    _id: "msg_parent",
    text: "Original message",
    from_user_id: "user_1"
  }
}
```

### Chat Conversation State

```javascript
{
  chatId: "chat_xyz789",
  messages: [Message[], // Array of all messages
  
  // Critical seen tracking states
  lastSeenMessage: Message | null,      // Last message user scrolled to
  receiverLastSeen: {
    messageId: string,
    createdAt: string,
    userId: string
  } | null,
  
  // UI state
  unseenBelowCount: number,
  isScrolling: boolean,
  scrollDirection: "up" | "down" | null
}
```

---

## State Management

### State Structure (Component Level)

```javascript
// Core seen states
const [lastSeenMessage, setLastSeenMessage] = useState(null);
const [receiverLastSeen, setReceiverLastSeen] = useState(null);

// UI states
const [unseenBelowCount, setUnseenBelowCount] = useState(0);

// Refs for avoiding duplicate effects
const hasInitializedRef = useRef(false);
const lastEmittedMessageIdRef = useRef(null);
```

### State Transitions

```
USER OPENS CHAT
    ↓
fetchLastSeenFromBackend()
    ↓
setLastSeenMessage(saved)
setReceiverLastSeen(receiver's saved)
    ↓
USER SCROLLS IN VIEWPORT
    ↓
START debounceTimer(1200ms)
showScrollButton = true
    ↓
SCROLL STOPS
    ↓
(1.2s passes without scroll)
    ↓
IntersectionObserver detects visible messages
    ↓
calculateLastVisibleMessage()
    ↓
IF (new message > old lastSeenMessage):
  setLastSeenMessage(newMessage)
  emitSocket("updateLastSeen", {chatId, messageId})
  callAPI(POST /api/chat/:id/last-seen)
    ↓
RECEIVER GETS UPDATE (socket)
    ↓
socket.on("updateLastSeen", ({chatId, messageId}))
setReceiverLastSeen({messageId, createdAt, userId})
updateMessageStates() → show blue checkmarks
    ↓
BOTH USERS SYNCED ✅
```

---

## Socket Event Contract

### Events Your Backend Must Emit/Listen

#### **1. updateLastSeen** ← Frontend Emits
```javascript
// When user scrolls and stops on a message
socket.emit("updateLastSeen", {
  chatId: "chat_123",
  messageId: "msg_456",
  userId: "user_1",
  timestamp: "2026-02-18T10:30:00Z"
})

// Backend should:
// 1. Save to DB: conversation.lastSeenMessage[userId] = {messageId, timestamp}
// 2. Emit to other user: receiverSeenMessage event
// 3. Potentially update notification count
```

#### **2. receiverSeenMessage** ← Backend Emits
```javascript
// When the OTHER user sees our messages
socket.on("receiverSeenMessage", ({
  chatId: "chat_123",
  messageId: "msg_456",        // Last message THEY saw
  userId: "user_2",             // Who saw it
  createdAt: "2026-02-18T10:30:00Z"  // When they saw it
})

// Frontend should:
// 1. setReceiverLastSeen({messageId, createdAt, userId})
// 2. Update all messages <= createdAt to show blue checkmark
// 3. Trigger UI re-render of message statuses
```

#### **3. messageDeleted** ← Backend Emits (Already Implemented)
```javascript
socket.on("messageDeleted", ({
  messageId: "msg_456",
  chatId: "chat_123"
})

// Frontend: Remove message from array
```

#### **4. messageDelivered** ← Backend Emits (Optional for Delivered State)
```javascript
socket.on("messageDelivered", ({
  chatId: "chat_123",
  messageId: "msg_456",
  status: "delivered"
})

// Frontend: Update message status to "delivered"
```

---

## Event Flow

### Scenario: User A Sends, User B Reads

```
USER A                              USER B
─────────────────────────────────────────────────────

Sends message
    │
    ├─→ API: POST /messages
    │   └─→ Backend saves
    │       └─→ Emits "newMessage" 
    │           
    │                          ← Receives "newMessage"
    │                          Appends to messages[]
    │                          Currently OFF-SCREEN
    │
    │                          Scrolls down
    │                          (scrolling = true)
    │
    │                          Scroll stops
    │                          (1.2s debounce)
    │
    │                          IntersectionObserver fires
    │                          Message IS visible
    │                          
    │                          lastSeenMessage = msg
    │                          
    │                          Emit: "updateLastSeen"
    │                                 {chatId, messageId}
    │
    │                          └─→ Backend receives
    │                              Updates lastSeenMessage[userId]
    │                              Emits: "receiverSeenMessage"
    │
    ← receiverSeenMessage arrives
    setReceiverLastSeen({messageId, createdAt})
    Update message: status = "seen"
    Show blue ✓✓ checkmark
    
    UI Updates:
    ✓ → ✓✓ (single to double)
    Gray → Blue
```

### Load Balancing

```
CHAT OPENS
    │
    ├─→ Component Mounts
    │
    ├─→ useSeenManager initializes
    │
    ├─→ Fetch: GET /api/chat/:id/last-seen
    │   {
    │     message: {_id, createdAt, ...},
    │     receiverLastSeen: {messageId, createdAt}
    │   }
    │
    ├─→ setLastSeenMessage(message)
    └─→ setReceiverLastSeen(receiverLastSeen)
    
    Socket listeners registered:
    - receiverSeenMessage
    - userSeenMessage (if applicable)
    - messageDeleted
    
    IntersectionObserver ready
```

---

## Performance Optimizations

### 1️⃣ **Debounce Scroll Stop**

```javascript
// DON'T fire on every pixel scrolled
// DO fire 1.2 seconds after scroll ends

const handleScroll = useCallback(() => {
  clearTimeout(scrollDebounceRef.current);
  
  scrollDebounceRef.current = setTimeout(() => {
    // Only NOW calculate visible messages
    intersectionObserver.observe(messages);
  }, 1200); // 1.2 second debounce
}, []);
```

### 2️⃣ **Dedup Socket Events**

```javascript
// Prevent emitting same messageId twice

const lastEmittedMessageIdRef = useRef(null);

if (lastVisibleMsg._id === lastEmittedMessageIdRef.current) {
  return; // Skip duplicate emission
}

lastEmittedMessageIdRef.current = lastVisibleMsg._id;
socket.emit("updateLastSeen", {...});
```

### 3️⃣ **IntersectionObserver Threshold**

```javascript
// 60% of message must be in viewport to count as "visible"

const observer = new IntersectionObserver(
  (entries) => { /* ... */ },
  {
    root: containerRef.current,
    threshold: 0.6,  // At least 60% visible
    rootMargin: "0px"
  }
);
```

### 4️⃣ **Avoid Re-render on Socket Update**

```javascript
// Only update state if actually different

setReceiverLastSeen(prev => {
  if (prev?.messageId === messageId) {
    return prev; // No update = no render
  }
  return {messageId, createdAt, userId};
});
```

### 5️⃣ **Lazy Load Old Messages**

```javascript
// Infinite scroll up for old messages
// Only mark seen for messages currently in viewport

useEffect(() => {
  if (!scrolled) return;
  
  // Load older messages
  if (isTopOfList) {
    fetchOlderMessages();
  }
}, [scrollPosition]);
```

### 6️⃣ **Batch Message Updates**

```javascript
// Update multiple messages in single setState

setMessages(prev =>
  prev.map(msg => 
    new Date(msg.createdAt) <= new Date(threshold)
      ? {...msg, status: "seen"}
      : msg
  )
); // Single render, not 100 renders
```

---

## Edge Cases & Handling

### Edge Case 1: New Message Arrives While Reading Old Messages

```javascript
// Scenario: User reading message from 1 hour ago
//          New message arrives
//          Should it auto-mark as seen?

SOLUTION:
- NO auto-mark on message arrival
- Only mark when user's threshold reaches it via scroll
- Keep unseen count accurate
- This prevents false "read" notifications
```

### Edge Case 2: Jump to Bottom (Manual Scroll)

```javascript
// Scenario: User clicks "Jump to Bottom" button

SOLUTION:
function scrollToBottom() {
  containerRef.current.scrollTop = containerRef.current.scrollHeight;
  
  // This triggers scroll listeners
  // After 1.2s debounce, marks latest as seen
  // No special handling needed - reuses existing flow
}
```

### Edge Case 3: Socket Disconnect & Reconnect

```javascript
// Scenario: Network loss during chat

SOLUTION:
// On reconnect:
1. Re-fetch: GET /api/chat/:chatId/last-seen
   (backend has truth)
2. setLastSeenMessage(fetched)
3. setReceiverLastSeen(fetched)
4. Clear pending updates queue
5. Resume normal socket listeners

// Prevents duplicate emits from queued events
```

### Edge Case 4: Browser Back Button (Navigation Change)

```javascript
// Scenario: User navigates away, comes back

SOLUTION:
// On component mount:
useEffect(() => {
  // Fetch last seen state from API
  // This ensures we pick up where we left off
  
  return () => {
    // On unmount: save scroll position
    sessionStorage.setItem(`scroll_${chatId}`, scrollPos);
  };
}, [chatId]);
```

### Edge Case 5: Rapid Scrolling Up & Down

```javascript
// Scenario: User scrolls frantically
//          Multiple IntersectionObserver callbacks

SOLUTION:
1. Debounce scroll (1.2s) prevents excessive checks
2. Only update if NEW message > OLD message
3. lastEmittedMessageIdRef prevents duplicate emits
4. setReceiverLastSeen prevState check prevents unnecessary renders

Result: Smooth, responsive, zero jank
```

### Edge Case 6: Message Order Changed (Server-Side Reorder)

```javascript
// Rare but possible: Messages re-ordered by backend

SOLUTION:
// Use createdAt timestamp for comparison, not array index

const isMessageSeen = (msg) => {
  if (!lastSeenMessage) return false;
  return new Date(msg.createdAt) <= new Date(lastSeenMessage.createdAt);
}

// This works even if array order changes
```

### Edge Case 7: Delete Message that Was Last Seen

```javascript
// Scenario: User's last seen message gets deleted

SOLUTION:
// On message delete socket event:
socket.on("messageDeleted", ({messageId}) => {
  setMessages(prev => prev.filter(m => m._id !== messageId));
  
  // If deleted was lastSeenMessage:
  if (lastSeenMessage?._id === messageId) {
    // Find new last message before it
    const newLastSeen = messages.find(m =>
      new Date(m.createdAt) < new Date(messageId.createdAt)
    );
    setLastSeenMessage(newLastSeen || messages[0]);
  }
});
```

---

## Testing Checklist

### Unit Tests

- [ ] `isMessageSeen()` correctly compares timestamps
- [ ] `calculateUnseenCount()` returns correct number
- [ ] `calculateLastVisibleMessage()` picks latest when multiple visible
- [ ] Debounce timer prevents duplicate emissions
- [ ] Socket dedup prevents reemitting same messageId

### Integration Tests

- [ ] User A sends → User B receives → User B scrolls → User A sees blue checkmark
- [ ] Reconnect → state restores correctly
- [ ] Navigate away → scroll position saved → come back → position restored
- [ ] Delete message → lastSeenMessage updated if needed
- [ ] Rapid scroll → no jank, no missed marks

### E2E Tests (Cypress/Playwright)

- [ ] Two browser windows → one user scrolls → other sees updates
- [ ] Network throttle → disconnect → reconnect → sync works
- [ ] Unseen count changes as user scrolls down
- [ ] Click scroll button → maps to bottom → count resets to 0

---

## Summary Table

| Aspect | Solution |
|--------|----------|
| **Seen Detection** | IntersectionObserver + 60% threshold |
| **Debounce** | 1200ms after scroll stop |
| **Deduplication** | lastEmittedMessageIdRef ||**Threshold Logic** | All messages at/above last visible = seen |
| **Real-Time Sync** | Socket: updateLastSeen ↔ receiverSeenMessage |
| **Performance** | Batch updates, lazy loading, ref-based dedup |
| **Resilience** | Fetch on connect, prevent race conditions |

---

## Next Steps

1. ✅ Implement `useSeenManager` custom hook
2. ✅ Refactor `ChatMessagesFull` to use hook
3. ✅ Define socket events on backend
4. ✅ Add unseen count to scroll button UI
5. ✅ Write tests for edge cases
6. ✅ Monitor performance in production

