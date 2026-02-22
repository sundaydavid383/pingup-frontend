# WhatsApp-Level Seen System - Visual Architecture & Flow Diagrams

---

## 1. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ChatMessagesFull Component                                 │ │
│  │ ├─ Message rendering                                       │ │
│  │ ├─ Message options (delete, reply)                         │ │
│  │ ├─ Scroll state management                                 │ │
│  │ └─ UI updates                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ▲                                       │
│                           │ uses                                  │
│                           ▼                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ useSeenManager Hook (Custom) ✨                            │ │
│  │                                                             │ │
│  │ State:                                                      │ │
│  │  • lastSeenMessage (threshold)                             │ │
│  │  • receiverLastSeen (their threshold)                      │ │
│  │  • unseenBelowCount (UI badge)                             │ │
│  │                                                             │ │
│  │ Listeners (Socket):                                        │ │
│  │  • receiverSeenMessage → update checkmarks                 │ │
│  │  • userSeenMessage → mark our messages seen                │ │
│  │  • messageDeleted → cleanup state                          │ │
│  │                                                             │ │
│  │ Actions:                                                    │ │
│  │  • scrollToBottom() → mark as seen                         │ │
│  │  • calculateUnseenCount() → UI update                      │ │
│  │  • updateLastSeenOnBackend() → API + Socket               │ │
│  │  • getLastVisibleMessage() → IntersectionObserver          │ │
│  │                                                             │ │
│  │ Tools:                                                      │ │
│  │  • IntersectionObserver (60% threshold)                    │ │
│  │  • Debounce (1200ms)                                       │ │
│  │  • Dedup Refs (prevent duplicates)                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ▲                                       │
│                           │ calls to                              │
│      ┌────────────────────┼────────────────────┐                 │
│      │                    │                    │                 │
│      ▼                    ▼                    ▼                 │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐         │
│  │ axios    │         │ Socket   │         │ Refs     │         │
│  │ (API)    │         │ (Events) │         │ (DOM)    │         │
│  └──────────┘         └──────────┘         └──────────┘         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                               ▲
                               │ HTTP & WS
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js + Socket.io)                   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ API Routes                                                 │ │
│  │  GET  /api/chat/:chatId/last-seen                          │ │
│  │  POST /api/chat/:chatId/last-seen                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ▲                                       │
│                           │ reads/writes                          │
│  ┌────────────────────────┼────────────────────────────────────┐ │
│  │                        ▼                                    │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ Database (MongoDB)                                   │  │ │
│  │  │                                                      │  │ │
│  │  │ Conversation:                                        │  │ │
│  │  │  {                                                   │  │ │
│  │  │    participants: [user_1, user_2],                   │  │ │
│  │  │    messages: [msg_1, msg_2, ...],                    │  │ │
│  │  │    lastSeenMessage: {                                │  │ │
│  │  │      user_1: {messageId, createdAt},                 │  │ │
│  │  │      user_2: {messageId, createdAt}                  │  │ │
│  │  │    }                                                 │  │ │
│  │  │  }                                                   │  │ │
│  │  │                                                      │  │ │
│  │  │ Message:                                             │  │ │
│  │  │  {                                                   │  │ │
│  │  │    _id, text, from_user_id, to_user_id,             │  │ │
│  │  │    status, seenAt, createdAt                         │  │ │
│  │  │  }                                                   │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ▲                                       │
│                           │                                       │
│  ┌────────────────────────┴────────────────────────────────────┐ │
│  │ Socket.io Event Handlers                                   │ │
│  │                                                             │ │
│  │ socket.on("updateLastSeen")                                │ │
│  │   ├─ Validate chatId, messageId, userId                    │ │
│  │   ├─ Get message.createdAt (threshold)                     │ │
│  │   ├─ Save to Conversation.lastSeenMessage[userId]          │ │
│  │   ├─ Find otherUserId                                      │ │
│  │   └─ Emit "receiverSeenMessage" to otherUserId             │ │
│  │                                                             │ │
│  │ socket.on("sendMessage")                                   │ │
│  │   ├─ Validate message data                                 │ │
│  │   ├─ Save to Message collection                            │ │
│  │   ├─ Add to Conversation.messages                          │ │
│  │   └─ Emit "newMessage" to recipient                        │ │
│  │                                                             │ │
│  │ socket.on("deleteMessage")                                 │ │
│  │   ├─ Validate ownership                                    │ │
│  │   ├─ Delete from Message collection                        │ │
│  │   └─ Emit "messageDeleted" to all participants             │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. User Scroll → Seen Status Event Flow

```
USER A (Sender)                           USER B (Receiver)
─────────────────────────────────────────────────────────────────

Send Message
│
├─→ Set status: "sending"
├─→ API: POST /messages
│   └─→ Response: message object
│       ├─ Set status: "sent"
│       ├─ Show: ✓ (single check)
│       │
│       ├─→ Socket emit: "sendMessage"
│       │
│       └─────────────────────────────────────────────────────→
│                            Receives "newMessage"
│                            │
│                            ├─> messages.push(msg)
│                            │
│                            ├─> Message renders
│                            │   (OFF-VIEWPORT)
│                            │
│                            ├─> NOT marked as seen
│                            │   (IntersectionObserver: not visible)
│                            │
│                            └─> Status: "delivered"
│
│                         USER SCROLLS TO MSG
│                            │
│                            ├─> Scroll event fires
│                            │
│                            ├─> scrollStopped = false
│                            │   Clear debounce timer
│                            │
│                            ├─> Set debounce timer (1200ms)
│                            │
│                            └─> User scrolls... or stops?
│
│                         SCROLL STOPS
│                            │
│                            ├─> 1200ms timer expires
│                            │
│                            ├─> scrollStopped = true
│                            │
│                            ├─> IntersectionObserver activates
│                            │   ├─ Detect visible messages
│                            │   ├─ Filter by 60% visibility
│                            │   └─ Find LATEST visible
│                            │
│                            ├─> lastSeenMessage updated
│                            │
│                            ├─> API: POST /api/chat/:id/last-seen
│                            │   {messageId: "msg_123"}
│                            │
│                            ├─> Socket emit: "updateLastSeen"
│                            │   {chatId, messageId, userId}
│                            │
│  ← Socket event: "receiverSeenMessage"
│     {chatId, messageId, userId, createdAt}
│
├─> setReceiverLastSeen({messageId, createdAt})
│
├─> Update messages:
│   └─ All msgs with createdAt <= threshold
│      ├─ status: "seen"
│      ├─ seenBy: [..., userId]
│
├─> Re-render message status
│   ├─ ✓ (single check)
│   │
│   └─ ✓✓ (double check, BLUE)
│
└─> UI shows:
    "Seen at 10:30 AM"

                                       USER B
                                       └─ lastSeenMessage = msg
                                       └─ All old msgs marked seen
                                       └- Status update in DB
```

---

## 3. State Update Cascade

```
User stops scroll
        │
        ▼
scrollStopped → true
        │
        ▼
useSeenManager effect triggered
        │
        ▼
getLastVisibleMessage()
        ├─ Read messageRefs
        ├─ Calculate visibility %
        ├─ Filter visible (>60%)
        └─ Return latest
        │
        ▼
Compare with lastSeenMessage
        │
        ├─ Same? → SKIP (dedup)
        │
        └─ Different? → PROCEED
                │
                ▼
        setLastSeenMessage(new)
        setUnseenBelowCount(new)
                │
                ▼
        calculateUnseenBelowCount()
        ├─ Count messages > lastSeenMessage
        └─ setUnseenBelowCount(count)
                │
                ▼
        updateLastSeenOnBackend(messageId)
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
    API Call         Socket Emit
        │               │
    POST /last-seen   "updateLastSeen"
        │               │
        └───────┬───────┘
                │
        BACKEND RECEIVES
                │
        ┌───────┴─────────┐
        │                 │
        ▼                 ▼
    Save to DB       Emit to receiver
    Conversation        │
    .lastSeenMessage   ▼
    [userId]        "receiverSeenMessage"
                     {messageId, createdAt}
                        │
    FRONTEND RECEIVES ←──┘
        │
        ▼
    socket.on("receiverSeenMessage", ({messageId, createdAt}))
        │
        ▼
    setReceiverLastSeen({messageId, createdAt})
        │
        ▼
    setMessages(prev =>
      prev.map(msg =>
        msg.createdAt <= createdAt
          ? {...msg, status: "seen"}
          : msg
      )
    )
        │
        ▼
    RE-RENDER
        │
        ├─ Checkmark changes: ✓ → ✓✓
        ├─ Color changes: GRAY → BLUE
        └─ Label shows: "Seen at 10:30"
```

---

## 4. Unseen Count Badge Flow

```
scrolled to message 5 of 15:

unseenBelowCount = 15 - 5 = 10

┌─────────────────────────┐
│ ↓ 10                    │   ← Scroll button badge
└─────────────────────────┘

User clicks button:
        │
        ▼
seenManager.scrollToBottom()
        │
        ├─ containerRef.scrollTop = scrollHeight
        │
        └─ After 100ms:
            ├─ Get latest message
            ├─ updateLastSeenOnBackend(latest._id)
            └─ setUnseenBelowCount(0)
                │
                ▼
            ┌─────────────────────────┐
            │ ↓                       │   ← Badge hidden
            └─────────────────────────┘

New message arrives while user reading old messages:

    Total messages: 11 → 12
    lastSeenMessage: message 5
    unseenBelowCount = 12 - 5 = 7

    ┌─────────────────────────┐
    │ ↓ 7                     │   ← Updated badge
    └─────────────────────────┘

User scrolls up (further into past):

    Visible: messages 1-3
    lastSeenMessage: message 5 (threshold unchanged)
    unseenBelowCount = 12 - 5 = 7

    ┌─────────────────────────┐
    │ ↓ 7                     │   ← Count stays same
    └─────────────────────────┘
    
    (Only changes when lastSeenMessage updates)
```

---

## 5. Race Condition Prevention

### Scenario: User Scrolls Fast, Multiple Visible Messages Set

```
BEFORE (Old Code):

Scroll event fires 100x
Each triggers IntersectionObserver
Each tries to update lastSeenMessage
Multiple socket emissions ❌

AFTER (With useSeenManager):

Scroll event fires 100x
        ▼
1200ms debounce activated
All events ignored during debounce
        ▼
1200ms passes, scroll stops
        ▼
Single IntersectionObserver callback
        ▼
Find latest visible message
        ▼
if (lastEmittedMessageIdRef === messageId) {
  return; // Already emitted ✅
}
        ▼
Single socket emission ✅
Zero duplicates ✅
```

### Scenario: Rapid Socket Events from Receiver

```
BEFORE (Old Code):

receiverSeenMessage fires 5x
Each updates all messages ❌
Multiple re-renders ❌

AFTER (With useSeenManager):

receiverSeenMessage fires 5x
        ▼
First event: update state
  setReceiverLastSeen(prev => {
    if (prev?.messageId === messageId) return prev;
    return {messageId, createdAt, userId};
  })
        ▼
Messages 2-5: no-op (same messageId)
        ▼
Single state update ✅
Single re-render ✅
```

---

## 6. Message Lifecycle Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    MESSAGE LIFECYCLE                           │
└────────────────────────────────────────────────────────────────┘

STEP 1: CREATION
────────────────
User types message and presses send
    │
    ├─ Create local message object
    ├─ status: "sending"
    ├─ Render with gray color
    └─ Show spinner animation


STEP 2: TRANSMISSION
────────────────────
Call API: POST /messages
    │
    ├─ Server receives
    ├─ Saves to MongoDB
    ├─ Returns message with _id
    └─ Status: "sent"


STEP 3: DELIVERY
────────────────
Server emits: "newMessage" event
    │
    ├─ Socket sends to recipient
    ├─ Recipient receives "newMessage"
    ├─ Appends to messages array
    └─ Status: "delivered"
    
Sender shows:
    ✓ (single check, gray)


STEP 4: VISIBILITY
──────────────────
Recipient scrolls to message
    │
    ├─ IntersectionObserver detects >60% visible
    ├─ Message visible in viewport
    └─ Waiting for scroll stop


STEP 5: SEEN (THRESHOLD)
────────────────────────
Recipient stops scrolling for 1.2s
    │
    ├─ useSeenManager calculates last visible
    ├─ Updates lastSeenMessage in state
    ├─ Calls API: POST /api/chat/:chatId/last-seen
    ├─ Emits socket: "updateLastSeen"
    └─ Status: "seen"


STEP 6: REAL-TIME SYNC
──────────────────────
Backend receives "updateLastSeen"
    │
    ├─ Saves to Conversation.lastSeenMessage
    ├─ Emits "receiverSeenMessage" to sender
    └─ Includes message.createdAt (threshold)


STEP 7: CONFIRMATION
────────────────────
Sender receives "receiverSeenMessage"
    │
    ├─ setReceiverLastSeen({messageId, createdAt})
    ├─ Update all messages with createdAt <= threshold
    ├─ Set status: "seen"
    ├─ Re-render with blue checkmark
    └─ Show "Seen at [time]"


STEP 8: END STATE
─────────────────
Recipient:
  ✓✓ (double check, BLUE)
  status: "seen"
  seenAt: timestamp


EDGE CASE: MESSAGE DELETED
──────────────────────────
If deleted before seen:
    ├─ Cannot be marked seen
    └─ Backend removes from DB

If deleted after seen:
    ├─ Both users see deletion
    ├─ Removed from messages array
    └─ lastSeenMessage may update
```

---

## 7. Performance Metrics

```
METRIC                          TARGET      IMPACT
──────────────────────────────────────────────────────
Scroll debounce                 1200ms      ← Prevents 100+ re-renders
IntersectionObserver threshold  60%         ← Accurate visibility
Socket emission rate            max 2/sec   ← Rate limited
State update batching           Single      ← Single re-render per batch
Message ref overhead            ~2KB each   ← Memory efficient
Memory usage (1000 msgs)        ~4MB        ← Manageable
CPU usage idle                  <1%         ← Lightweight
CPU usage scrolling             <5%         ← Smooth scroll
Network bandwidth               ~50B/event  ← Minimal
```

---

## 8. Browser Compatibility

```
FEATURE                 CHROME  FIREFOX  SAFARI  EDGE
────────────────────────────────────────────────────
IntersectionObserver    ✅      ✅       ✅      ✅
Socket.io               ✅      ✅       ✅      ✅
Ref management          ✅      ✅       ✅      ✅
RequestAnimationFrame   ✅      ✅       ✅      ✅
setTimeout              ✅      ✅       ✅      ✅
Map objects             ✅      ✅       ✅      ✅
──────────────────────────────────────────────────────
Overall                 ✅      ✅       ✅      ✅

Mobile Support:
iOS Safari 14+          ✅
Android Chrome          ✅
Android Firefox         ✅
```

---

## 9. State Machine Diagram

```
                    ┌─────────────────┐
                    │    NOT LOADED   │
                    │  (Initial)      │
                    └────────┬────────┘
                             │
                    Init: GET /last-seen
                             │
                             ▼
                    ┌──────────────────┐
                    │   INITIALIZING   │
                    │  (Fetch from DB) │
                    └────────┬─────────┘
                             │
                       State restored
                             │
            ┌────────────────┴────────────────┐
            │                                 │
            ▼                                 ▼
    ┌───────────────────┐         ┌──────────────────┐
    │ READY_TO_RECEIVE  │         │ SCROLL_DETECTED  │
    │ (Idle, no scroll) │◄────┐   │ (User scrolling) │
    └────────┬──────────┘     │   └────────┬─────────┘
             │                │            │
             │          No more scroll     │
             │          for 1200ms         │
             │                │            │
             └────────────────┤            │
                              │            │
                              ▼            │
                      ┌────────────────┐   │
                      │ CALC_VISIBLE   │   │
                      │ LAST VIS MSG   │───┘
                      └────────┬───────┘
                               │
                               ▼
                      ┌────────────────┐
                      │ UPDATE_STATE   │
                      │ & BACKEND      │
                      └────────┬───────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
         Success │                           │ Failure
                 │                           │
                 ▼                           ▼
        ┌──────────────────┐      ┌──────────────────┐
        │ SYNCED           │      │ SYNC_FAILED      │
        │ (All systems OK) │      │ (Retry on next   │
        └────────┬─────────┘      │  scroll stop)    │
                 │                └──────────┬───────┘
                 │                           │
         New scroll detected                 │
                 │                   Retry next scroll
                 │                           │
                 └──────────┬────────────────┘
                            │
                            ▼
                   ┌────────────────┐
                   │ SCROLL_DETECTED│
                   └────────────────┘
```

---

## Summary

This architecture provides:

✅ **Viewport Intelligence** - Only marks seen when truly visible  
✅ **Real-Time Sync** - Instant updates via WebSocket  
✅ **Performance** - Debounced, deduplicated, batched updates  
✅ **Reliability** - Recovers from disconnects, handles edge cases  
✅ **WhatsApp-Level UX** - Blue checkmarks, seen timestamps, unseen badge  

All powered by a single, testable `useSeenManager` hook!

