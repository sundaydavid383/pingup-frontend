/**
 * SOCKET.IO EVENT CONTRACT
 * 
 * Backend ↔ Frontend event definitions for WhatsApp-level seen system
 * 
 * ============================================================
 * FRONTEND → BACKEND EVENTS
 * ============================================================
 */

// ─────────────────────────────────────────────────────────
// EVENT: updateLastSeen
// ─────────────────────────────────────────────────────────
// WHEN: User scrolls and stops (1.2s debounce)
// EMITTED BY: Frontend (ChatMessagesFull via useSeenManager)
// RECEIVED BY: Backend socket handler

socket.emit("updateLastSeen", {
    chatId: "chat_abc123",              // ✅ REQUIRED
    messageId: "msg_xyz789",            // ✅ REQUIRED - Last visible message
    userId: "user_john_123",            // ✅ REQUIRED - Current user
    timestamp: "2026-02-18T10:30:45Z"   // ✅ OPTIONAL - ISO timestamp
});

/**
 * BACKEND SHOULD:
 * 
 * 1. Receive event and validate:
 *    - chatId exists
 *    - messageId belongs to chat
 *    - userId is member of chat
 * 
 * 2. Find message and get its createdAt timestamp:
 *    const msg = await Message.findById(messageId);
 *    const threshold = msg.createdAt;
 * 
 * 3. Update conversation state:
 *    const conversation = await Conversation.findById(chatId);
 *    conversation.lastSeenMessage[userId] = {
 *      messageId: messageId,
 *      createdAt: threshold,
 *      timestamp: new Date()
 *    };
 *    await conversation.save();
 * 
 * 4. Find the OTHER user in conversation:
 *    const otherUserId = conversation.participants.find(p => p !== userId);
 * 
 * 5. Emit receiverSeenMessage to other user:
 *    socket.to(otherUserId).emit("receiverSeenMessage", {
 *      chatId: chatId,
 *      messageId: messageId,
 *      userId: userId,
 *      createdAt: threshold  // Use message's createdAt, not current time
 *    });
 * 
 * 6. Optional: Update notification count for unread messages
 *    // Mark all messages up to this threshold as seen
 *    // Useful for calculating unread badge counts
 */

// ─────────────────────────────────────────────────────────
// EVENT: typingStarted
// ─────────────────────────────────────────────────────────
// WHEN: User starts typing
// EMITTED BY: Frontend (ChatBox component or similar)

socket.emit("typingStarted", {
    chatId: "chat_abc123",
    userId: "user_john_123",
    name: "John"
});

// Backend broadcasts to other user in conversation:
// socket.to(otherUserId).emit("userTyping", {...})

// ─────────────────────────────────────────────────────────
// EVENT: typingStopped
// ─────────────────────────────────────────────────────────

socket.emit("typingStopped", {
    chatId: "chat_abc123",
    userId: "user_john_123"
});

/**
 * ============================================================
 * BACKEND → FRONTEND EVENTS
 * ============================================================
 */

// ─────────────────────────────────────────────────────────
// EVENT: receiverSeenMessage
// ─────────────────────────────────────────────────────────
// WHEN: The OTHER user updates their lastSeenMessage and our message is now seen
// EMITTED BY: Backend (in response to updateLastSeen)
// RECEIVED BY: Frontend (socket.on listener in useSeenManager)

socket.on("receiverSeenMessage", ({
    chatId: "chat_abc123",                        // ✅ REQUIRED
    messageId: "msg_xyz789",                      // ✅ REQUIRED - Last message they saw
    userId: "user_jane_456",                      // ✅ REQUIRED - Who saw it
    createdAt: "2026-02-18T10:30:45Z"             // ✅ REQUIRED - When (from message)
}) => {
    /**
     * FRONTEND SHOULD:
     * 
     * 1. Update receiverLastSeen state:
     *    setReceiverLastSeen({
     *      messageId,
     *      createdAt,
     *      userId
     *    });
     * 
     * 2. Update all messages with createdAt <= threshold:
     *    setMessages(prev =>
     *      prev.map(msg =>
     *        new Date(msg.createdAt) <= new Date(createdAt)
     *          ? {...msg, status: "seen", seenBy: [..., userId]}
     *          : msg
     *      )
     *    );
     * 
     * 3. Trigger UI update:
     *    - Single checkmark ✓ → becomes double checkmark ✓✓
     *    - Checkmark color changes to blue
     *    - Message displayed as "Seen at {time}"
     */
});

// ─────────────────────────────────────────────────────────
// EVENT: newMessage
// ─────────────────────────────────────────────────────────
// WHEN: User receives a message from another user
// EMITTED BY: Backend
// RECEIVED BY: Frontend (RecentMessages or similar)

socket.on("newMessage", ({
    _id: "msg_new_123",
    chatId: "chat_abc123",
    from_user_id: "user_jane_456",
    to_user_id: "user_john_123",
    text: "Hello there!",
    message_type: "text",
    createdAt: "2026-02-18T10:35:00Z",
    status: "delivered",
    seenBy: []
}) => {
    /**
     * FRONTEND SHOULD:
     * 
     * 1. Add to messages array:
     *    setMessages(prev => [...prev, newMessage]);
     * 
     * IMPORTANT: Do NOT mark as seen yet
     * - Message is only seen when user scrolls to it
     * - Use IntersectionObserver to detect visibility
     * - Only after scroll stops (1.2s debounce) should it be marked seen
     */
});

// ─────────────────────────────────────────────────────────
// EVENT: messageDeleted
// ─────────────────────────────────────────────────────────
// WHEN: User deletes message for everyone
// EMITTED BY: Backend (after deletion)
// RECEIVED BY: Frontend (both sender and receiver)

socket.on("messageDeleted", ({
    messageId: "msg_xyz789",
    chatId: "chat_abc123"
}) => {
    /**
     * FRONTEND SHOULD:
     * 
     * 1. Remove from messages array:
     *    setMessages(prev =>
     *      prev.filter(msg => msg._id !== messageId)
     *    );
     * 
     * 2. If deleted message was lastSeenMessage:
     *    Find the next earlier message and use that as new lastSeenMessage
     */
});

// ─────────────────────────────────────────────────────────
// EVENT: messageDelivered
// ─────────────────────────────────────────────────────────
// WHEN: Message successfully reached backend (optional)
// EMITTED BY: Backend
// RECEIVED BY: Frontend (sender only)

socket.on("messageDelivered", ({
    messageId: "msg_xyz789",
    chatId: "chat_abc123",
    status: "delivered"  // or "sent"
}) => {
    /**
     * FRONTEND SHOULD:
     * 
     * 1. Update message status:
     *    setMessages(prev =>
     *      prev.map(msg =>
     *        msg._id === messageId
     *          ? {...msg, status: "delivered"}
     *          : msg
     *      )
     *    );
     * 
     * 2. Update checkmark:
     *    Single ✓ stays single (gray)
     *    Later becomes double ✓✓ (gray) when message reaches recipient
     */
});

// ─────────────────────────────────────────────────────────
// EVENT: userTyping
// ─────────────────────────────────────────────────────────
// WHEN: Other user is typing
// EMITTED BY: Backend (broadcasts to other user)
// RECEIVED BY: Frontend

socket.on("userTyping", ({
    chatId: "chat_abc123",
    userId: "user_jane_456",
    name: "Jane",
    isTyping: true
}) => {
    // Show typing indicator in UI
    // setTypingUser(name);
    // setTypingUserFromId(userId);
});

// ─────────────────────────────────────────────────────────
// EVENT: userStoppedTyping
// ─────────────────────────────────────────────────────────

socket.on("userStoppedTyping", ({
    chatId: "chat_abc123",
    userId: "user_jane_456"
}) => {
    // Hide typing indicator
    // setTypingUser(null);
});

// ─────────────────────────────────────────────────────────
// EVENT: userOnline / userOffline
// ─────────────────────────────────────────────────────────
// WHEN: User comes online or goes offline
// EMITTED BY: Backend
// RECEIVED BY: Frontend (all users)

socket.on("userOnline", ({
    userId: "user_jane_456",
    timestamp: "2026-02-18T10:40:00Z"
}) => {
    // Update online status in UI
    // Add to onlineUsers set
});

socket.on("userOffline", ({
    userId: "user_jane_456",
    timestamp: "2026-02-18T10:40:15Z"
}) => {
    // Update offline status in UI
    // Remove from onlineUsers set
});

/**
 * ============================================================
 * INITIALIZATION FLOW
 * ============================================================
 */

/**
 * When user opens a chat:
 * 
 * 1. Frontend calls: GET /api/chat/:chatId/last-seen
 *    Response: {
 *      message: {_id, createdAt, ...},
 *      receiverLastSeen: {messageId, createdAt}
 *    }
 * 
 * 2. Frontend sets state:
 *    setLastSeenMessage(response.message);
 *    setReceiverLastSeen(response.receiverLastSeen);
 * 
 * 3. Backend returns:
 *    - This user's last seen message (loaded from DB)
 *    - Other user's last seen message (if available)
 */

/**
 * ============================================================
 * ERROR HANDLING
 * ============================================================
 */

/**
 * If updateLastSeen fails (network error):
 * 
 * 1. Frontend catches error and logs it
 * 2. Does NOT retry automatically
 * 3. On next successful scroll stop, retries
 * 4. Backend API is source of truth
 * 
 * Example error handling in useSeenManager:
 */
const updateLastSeenOnBackend = useCallback(
    async (messageId) => {
        try {
            await axiosBase.post(`/api/chat/${chatId}/last-seen`, {
                messageId,
            });

            socket.emit("updateLastSeen", {
                chatId,
                messageId,
                userId,
            });
        } catch (error) {
            console.error("Failed to update last seen:", error);
            // Error is logged but doesn't block UI
            // Next scroll attempt will retry
        }
    },
    [chatId, userId, socket]
);

/**
 * ============================================================
 * SOCKET CONNECTION LIFECYCLE
 * ============================================================
 */

// When user connects to socket:
socket.on("connect", () => {
    // Emit "join" event to notify backend
    socket.emit("join", {
        userId: currentUser._id,
        chatId: activeChatId
    });
});

// When user disconnects:
socket.on("disconnect", () => {
    // Frontend automatically sets socket.connected = false
    // Does NOT emit updateLastSeen when disconnected
});

// When user reconnects:
socket.on("connect", () => {
    // Fetch last seen from API to sync state
    fetchLastSeenFromBackend();

    // Re-join active chat
    socket.emit("join", {
        userId: currentUser._id,
        chatId: activeChatId
    });
});

/**
 * ============================================================
 * RATE LIMITING CONSIDERATIONS
 * ============================================================
 */

/**
 * Frontend debounces updateLastSeen:
 * - 1.2 second debounce = max ~50 emissions per minute
 * 
 * Backend should:
 * 1. Accept max 1 updateLastSeen per chatId per user per 500ms
 * 2. Ignore duplicate messageIds from same user
 * 3. Implement socket rate limiting (e.g., socket.io middleware)
 * 
 * Example backend rate limiter:
 * const lastUpdate = new Map(); // {`${userId}_${chatId}`: timestamp}
 * 
 * socket.on("updateLastSeen", (data) => {
 *   const key = `${data.userId}_${data.chatId}`;
 *   const now = Date.now();
 *   const lastTime = lastUpdate.get(key) || 0;
 *   
 *   if (now - lastTime < 500) {
 *     return; // Rate limit exceeded
 *   }
 *   
 *   lastUpdate.set(key, now);
 *   // Process updateLastSeen...
 * });
 */

/**
 * ============================================================
 * MESSAGE OBJECT SCHEMA
 * ============================================================
 */

const messageSchema = {
    _id: String,                    // Unique message ID
    chatId: String,                 // Chat this belongs to
    from_user_id: String,           // Sender ID
    to_user_id: String,             // Recipient ID
    text: String,                   // Message content
    message_type: String,           // "text" | "image" | "audio"
    media_url: String,              // For image/audio messages

    // Seen tracking
    status: String,                 // "sending" | "sent" | "delivered" | "seen"
    seenBy: [String],               // Array of user IDs who've seen
    seenAt: Date,                   // When message was seen

    // Timestamps
    createdAt: Date,                // When message was created
    updatedAt: Date,

    // Reply context
    replyTo: {
        _id: String,
        text: String,
        from_user_id: String,
        message_type: String
    }
};

/**
 * ============================================================
 * TESTING PROTOCOL
 * ============================================================
 */

/**
 * Test Case 1: Basic Seen Flow
 * 
 * Setup: Two browsers open, same chat
 * 
 * Steps:
 * 1. User A sends message
 * 2. User B receives message (offline for now)
 * 3. User B scrolls and stops on message
 * 4. User B's frontend emits updateLastSeen
 * 
 * Expected:
 * ✓ User A sees double blue checkmark
 * ✓ Message shows "Seen at [time]"
 * ✓ No duplicate emissions
 */

/**
 * Test Case 2: Rapid Scroll
 * 
 * Steps:
 * 1. User scrolls up/down rapidly through 50 messages
 * 2. Each scroll position triggers IntersectionObserver
 * 
 * Expected:
 * ✓ Only ONE emission after scroll stops (debounce works)
 * ✓ No jank, responsive UI
 * ✓ Correct "last visible" message identified
 */

/**
 * Test Case 3: Disconnect/Reconnect
 * 
 * Steps:
 * 1. User reading chat, connection lost
 * 2. User comes back online
 * 3. User is still in same chat
 * 
 * Expected:
 * ✓ State restored from API fetch
 * ✓ No duplicate seen events
 * ✓ Consistent with other user's view
 */

/**
 * Test Case 4: Message Deletion
 * 
 * Steps:
 * 1. User's lastSeenMessage is message #5
 * 2. Message #5 is deleted by other user
 * 3. Frontend receives messageDeleted event
 * 
 * Expected:
 * ✓ Message #5 removed from array
 * ✓ lastSeenMessage updated to message #4
 * ✓ No cascading errors
 */

/**
 * ============================================================
 * WEBRTC AUDIO/VIDEO CALL EVENTS
 * ============================================================
 */

/**
 * ─────────────────────────────────────────────────────────
 * EVENT: callInitiated (Frontend → Backend) 
 * ─────────────────────────────────────────────────────────
 * WHEN: User initiates a call (audio or video)
 * EMITTED BY: Frontend (CallContainer via useCallManager)
 * RECEIVED BY: Backend
 */

socket.emit("callInitiated", {
    callId: "call_abc123_xyz",              // ✅ REQUIRED - Unique call identifier
    initiatorId: "user_john_123",           // ✅ REQUIRED - Who started the call
    receiverId: "user_jane_456",            // ✅ REQUIRED - Who to call
    callType: "video",                      // ✅ REQUIRED - "audio" or "video"
    timestamp: "2026-02-18T10:50:00Z"       // ✅ OPTIONAL - ISO timestamp
});

/**
 * BACKEND SHOULD:
 * 
 * 1. Validate:
 *    - initiatorId is authenticated user
 *    - receiverId exists and is not blocked
 *    - No ongoing call between these users
 * 
 * 2. Check if receiver is online:
 *    - If online: forward callInitiated to receiver
 *    - If offline: send missed call notification
 * 
 * 3. Emit to receiver (if online):
 *    io.to(receiverId).emit("incomingCall", {
 *      callId,
 *      callType,
 *      initiatorId,
 *      initiatorName,
 *      initiatorImage,
 *      timestamp
 *    });
 */

/**
 * ─────────────────────────────────────────────────────────
 * EVENT: incomingCall (Backend → Frontend)
 * ─────────────────────────────────────────────────────────
 * WHEN: Current user receives a call from another user
 * EMITTED BY: Backend (in response to callInitiated)
 * RECEIVED BY: Frontend (CallContext)
 */

socket.on("incomingCall", ({
    callId: "call_abc123_xyz",              // ✅ REQUIRED
    callType: "video",                      // ✅ REQUIRED - "audio" or "video"
    initiatorId: "user_john_123",           // ✅ REQUIRED - Who's calling
    initiatorName: "John Smith",            // ✅ REQUIRED - Display name
    initiatorImage: "https://...",          // ✅ OPTIONAL - Profile picture
    timestamp: "2026-02-18T10:50:00Z"       // ✅ OPTIONAL
}) => {
    /**
     * FRONTEND SHOULD:
     * 
     * 1. Update CallContext:
     *    setCall({
     *      callId,
     *      callType,
     *      initiatorId,
     *      initiatorName,
     *      status: "ringing"
     *    });
     * 
     * 2. Show IncomingCallModal component
     * 
     * 3. Play ringtone sound
     * 
     * 4. Setup auto-reject after 30 seconds (optional):
     *    setTimeout(() => rejectCall(), 30000);
     */
});

/**
 * ─────────────────────────────────────────────────────────
 * EVENT: callAccepted (Frontend → Backend)
 * ─────────────────────────────────────────────────────────
 * WHEN: User accepts an incoming or initiated call
 * EMITTED BY: Frontend (IncomingCallModal or CallUI)
 * RECEIVED BY: Backend
 */

socket.emit("callAccepted", {
    callId: "call_abc123_xyz",              // ✅ REQUIRED
    acceptorId: "user_jane_456",            // ✅ REQUIRED - Who accepted
    timestamp: "2026-02-18T10:50:05Z"       // ✅ OPTIONAL
});

/**
 * BACKEND SHOULD:
 * 
 * 1. Update call status in DB:
 *    const call = await Call.findById(callId);
 *    call.status = "accepted";
 *    call.acceptedAt = new Date();
 *    await call.save();
 * 
 * 2. Emit acknowledgment to initiator:
 *    io.to(initiatorId).emit("callAcceptedAck", {
 *      callId,
 *      acceptorId,
 *      timestamp
 *    });
 * 
 * 3. Signal to both users to setup WebRTC:
 *    - Both users start capturing media
 *    - Both users setup PeerConnection
 *    - Both users start exchanging SDP offers/answers (signaling)
 */

/**
 * ─────────────────────────────────────────────────────────
 * EVENT: callAcceptedAck (Backend → Frontend)
 * ─────────────────────────────────────────────────────────
 * WHEN: Initiator is notified that other user accepted call
 * EMITTED BY: Backend (in response to callAccepted)
 * RECEIVED BY: Frontend (CallContext)
 */

socket.on("callAcceptedAck", ({
    callId: "call_abc123_xyz",
    acceptorId: "user_jane_456",
    timestamp: "2026-02-18T10:50:05Z"
}) => {
    /**
     * FRONTEND SHOULD:
     * 
     * 1. Update CallContext:
     *    setCall(prev => ({...prev, status: "connecting"}));
     * 
     * 2. Start WebRTC negotiation:
     *    - createPeerConnection()
     *    - Setup local media stream
     *    - Create and send SDP offer
     */
});

/**
 * ─────────────────────────────────────────────────────────
 * EVENT: webrtcOffer (Frontend → Backend)
 * ─────────────────────────────────────────────────────────
 * WHEN: User's WebRTC peer connection needs to send SDP offer
 * EMITTED BY: Frontend (useWebRTC hook)
 * RECEIVED BY: Backend (signaling relay)
 */

socket.emit("webrtcOffer", {
    callId: "call_abc123_xyz",              // ✅ REQUIRED
    to: "user_jane_456",                    // ✅ REQUIRED - Receiver of offer
    sdp: "v=0\r\no=...",                    // ✅ REQUIRED - SDP offer string
    timestamp: "2026-02-18T10:50:06Z"
});

/**
 * BACKEND SHOULD:
 * 
 * 1. Relay SDP offer to other user:
 *    io.to(to).emit("webrtcOffer", {
 *      callId,
 *      from: initiatorId,
 *      sdp,
 *      timestamp
 *    });
 */

/**
 * ─────────────────────────────────────────────────────────
 * EVENT: webrtcOffer (Backend → Frontend - Incoming)
 * ─────────────────────────────────────────────────────────
 * WHEN: Frontend receives SDP offer from remote peer
 * EMITTED BY: Backend (relaying from other user)
 * RECEIVED BY: Frontend (useWebRTC hook)
 */

socket.on("webrtcOffer", ({
    callId: "call_abc123_xyz",
    from: "user_john_123",
    sdp: "v=0\r\no=..."
}) => {
    /**
     * FRONTEND SHOULD:
     * 
     * 1. Set remote description on PeerConnection:
     *    peerConnection.setRemoteDescription(
     *      new RTCSessionDescription({type: "offer", sdp})
     *    );
     * 
     * 2. Create SDP answer:
     *    const answer = await peerConnection.createAnswer();
     *    await peerConnection.setLocalDescription(answer);
     * 
     * 3. Send answer back via webrtcAnswer event
     */
});

/**
 * ─────────────────────────────────────────────────────────
 * EVENT: webrtcAnswer (Frontend → Backend)
 * ─────────────────────────────────────────────────────────
 * WHEN: User responds to WebRTC offer with answer
 * EMITTED BY: Frontend (useWebRTC hook)
 * RECEIVED BY: Backend
 */

socket.emit("webrtcAnswer", {
    callId: "call_abc123_xyz",
    to: "user_john_123",
    sdp: "v=0\r\no=...",
    timestamp: "2026-02-18T10:50:07Z"
});

/**
 * BACKEND SHOULD:
 * 
 * 1. Relay answer to other user:
 *    io.to(to).emit("webrtcAnswer", {
 *      callId,
 *      from: userId,
 *      sdp,
 *      timestamp
 *    });
 */

/**
 * ─────────────────────────────────────────────────────────
 * EVENT: webrtcAnswer (Backend → Frontend - Incoming)
 * ─────────────────────────────────────────────────────────
 */

socket.on("webrtcAnswer", ({
    callId: "call_abc123_xyz",
    from: "user_jane_456",
    sdp: "v=0\r\no=..."
}) => {
    /**
     * FRONTEND SHOULD:
     * 
     * 1. Set remote description:
     *    peerConnection.setRemoteDescription(
     *      new RTCSessionDescription({type: "answer", sdp})
     *    );
     * 
     * 2. Media should now be flowing once ICE candidates connected
     */
});

/**
 * ─────────────────────────────────────────────────────────
 * EVENT: webrtcIceCandidate (Frontend → Backend)
 * ─────────────────────────────────────────────────────────
 * WHEN: Local peer generates ICE candidates during negotiation
 * EMITTED BY: Frontend (useWebRTC hook on icecandidate event)
 * RECEIVED BY: Backend
 */

socket.emit("webrtcIceCandidate", {
    callId: "call_abc123_xyz",
    to: "user_jane_456",
    candidate: {
        candidate: "candidate:...",          // ✅ REQUIRED - ICE candidate string
        sdpMLineIndex: 0,                   // ✅ REQUIRED
        sdpMid: "0"                         // ✅ REQUIRED
    }
});

/**
 * BACKEND SHOULD:
 * 
 * 1. Relay ICE candidate to other user:
 *    io.to(to).emit("webrtcIceCandidate", {
 *      callId,
 *      from: userId,
 *      candidate,
 *      timestamp
 *    });
 */

/**
 * ─────────────────────────────────────────────────────────
 * EVENT: webrtcIceCandidate (Backend → Frontend - Incoming)
 * ─────────────────────────────────────────────────────────
 */

socket.on("webrtcIceCandidate", ({
    callId: "call_abc123_xyz",
    from: "user_john_123",
    candidate: {
        candidate: "candidate:...",
        sdpMLineIndex: 0,
        sdpMid: "0"
    }
}) => {
    /**
     * FRONTEND SHOULD:
     * 
     * 1. Add candidate to PeerConnection:
     *    try {
     *      await peerConnection.addIceCandidate(
     *        new RTCIceCandidate(candidate)
     *      );
     *    } catch (e) {
     *      console.error("Failed to add ICE candidate:", e);
     *    }
     */
});

/**
 * ─────────────────────────────────────────────────────────
 * EVENT: callRejected (Frontend → Backend)
 * ─────────────────────────────────────────────────────────
 * WHEN: User rejects an incoming call
 * EMITTED BY: Frontend (IncomingCallModal)
 * RECEIVED BY: Backend
 */

socket.emit("callRejected", {
    callId: "call_abc123_xyz",
    rejecterId: "user_jane_456",
    reason: "busy",                         // ✅ OPTIONAL - "busy", "declined", etc.
    timestamp: "2026-02-18T10:50:05Z"
});

/**
 * BACKEND SHOULD:
 * 
 * 1. Update call status:
 *    const call = await Call.findById(callId);
 *    call.status = "rejected";
 *    call.rejectedAt = new Date();
 *    await call.save();
 * 
 * 2. Notify initiator:
 *    io.to(initiatorId).emit("callRejectedAck", {
 *      callId,
 *      reason
 *    });
 */

/**
 * ─────────────────────────────────────────────────────────
 * EVENT: callRejectedAck (Backend → Frontend)
 * ─────────────────────────────────────────────────────────
 */

socket.on("callRejectedAck", ({
    callId: "call_abc123_xyz",
    reason: "busy"
}) => {
    /**
     * FRONTEND SHOULD:
     * 
     * 1. Close peer connection
     * 2. Update CallContext:
     *    setCall(prev => ({...prev, status: "rejected"}));
     * 3. Show notification: "Call was rejected"
     * 4. Clear call state after 2 seconds
     */
});

/**
 * ─────────────────────────────────────────────────────────
 * EVENT: callEnded (Frontend → Backend)
 * ─────────────────────────────────────────────────────────
 * WHEN: User ends an active call
 * EMITTED BY: Frontend (CallUI - end call button)
 * RECEIVED BY: Backend
 */

socket.emit("callEnded", {
    callId: "call_abc123_xyz",
    endedBy: "user_jane_456",
    duration: 45,                           // ✅ OPTIONAL - Call duration in seconds
    timestamp: "2026-02-18T10:50:50Z"
});

/**
 * BACKEND SHOULD:
 * 
 * 1. Update call status in DB:
 *    const call = await Call.findById(callId);
 *    call.status = "ended";
 *    call.endedAt = new Date();
 *    call.duration = duration;
 *    await call.save();
 * 
 * 2. Notify other user:
 *    io.to(otherUserId).emit("callEndedAck", {
 *      callId,
 *      endedBy,
 *      duration
 *    });
 */

/**
 * ─────────────────────────────────────────────────────────
 * EVENT: callEndedAck (Backend → Frontend)
 * ─────────────────────────────────────────────────────────
 */

socket.on("callEndedAck", ({
    callId: "call_abc123_xyz",
    endedBy: "user_jane_456",
    duration: 45
}) => {
    /**
     * FRONTEND SHOULD:
     * 
     * 1. Close peer connection:
     *    peerConnection.close();
     * 
     * 2. Stop all media tracks:
     *    localStream.getTracks().forEach(t => t.stop());
     * 
     * 3. Clear video elements
     * 
     * 4. Update CallContext:
     *    setCall(prev => ({...prev, status: "ended"}));
     * 
     * 5. Show call summary (optional):
     *    - Duration
     *    - Who ended the call
     *    - Option to call back
     * 
     * 6. Clear state after 2 seconds
     */
});

/**
 * ─────────────────────────────────────────────────────────
 * EVENT: callRinging (Optional notification)
 * ─────────────────────────────────────────────────────────
 * WHEN: Call is still ringing after some time
 * EMITTED BY: Backend (after 5-10 seconds of ringing)
 * RECEIVED BY: Frontend (to update UI, play different sound)
 */

socket.on("callRinging", ({
    callId: "call_abc123_xyz",
    ringCount: 3
}) => {
    // Optional: Play different sound, update UI to show "calling..."
});

/**
 * ============================================================
 * CALL STATE MACHINE
 * ============================================================
 */

/**
 * States:
 * 
 * IDLE (initial)
 *   └─ User taps call button
 *       └─ INITIATING (emits callInitiated)
 *           ├─ Remote accepts
 *           │   └─ CONNECTING (exchanging WebRTC signals)
 *           │       └─ Media flows
 *           │           └─ CONNECTED (active call)
 *           │               └─ User taps end
 *           │                   └─ ENDED (emits callEnded)
 *           │                       └─ IDLE
 *           │
 *           ├─ Remote rejects
 *           │   └─ REJECTED
 *           │       └─ IDLE
 *           │
 *           └─ Timeout (30 seconds)
 *               └─ CANCELLED
 *                   └─ IDLE
 * 
 * IDLE
 *   └─ Incoming call received
 *       └─ RINGING (shows IncomingCallModal)
 *           ├─ User accepts
 *           │   └─ CONNECTING (exchanges WebRTC signals)
 *           │       └─ CONNECTED
 *           │           └─ IDLE
 *           │
 *           ├─ User rejects
 *           │   └─ REJECTED
 *           │       └─ IDLE
 *           │
 *           └─ Timeout (30 seconds)
 *               └─ MISSED
 *                   └─ IDLE
 */

/**
 * ============================================================
 * ERROR SCENARIOS
 * ============================================================
 */

/**
 * Scenario 1: User offline/disconnected
 * 
 * When initiating call to offline user:
 * - Backend does NOT emit incomingCall
 * - After 30 seconds: Frontend shows "User is unavailable"
 * - User receives missed call notification later
 */

/**
 * Scenario 2: WebRTC negotiation fails
 * 
 * If ICE candidates don't connect:
 * - Check browser console for errors
 * - Fallback: Show "Unable to connect media"
 * - Auto-disconnect after 10 seconds
 * - User can retry
 */

/**
 * Scenario 3: Network interruption during active call
 * 
 * If connection drops:
 * - PeerConnection emits "connectionstatechange" = "failed"
 * - Frontend shows "Connection lost"
 * - User can manually end call or wait for auto-reconnect
 * - After 30 seconds of failed state, auto-disconnect
 */

/**
 * Scenario 4: Multiple concurrent calls
 * 
 * Frontend MUST prevent:
 * - Making a new call while one is active
 * - Accepting a new call while one is active
 * - Implementation: Check CallContext.status !== "IDLE"
 * 
 * If incoming call arrives during active call:
 * - Option 1: Auto-reject with "busy" reason
 * - Option 2: Show option to switch calls
 */

/**
 * ============================================================
 * CALL TIMING & METRICS
 * ============================================================
 */

/**
 * Ringing timeout: 30 seconds
 * - If no accept/reject after 30 seconds, auto-reject
 * 
 * Connection timeout: 10 seconds
 * - If no media after 10 seconds of CONNECTING state, fail
 * 
 * ICE gathering timeout: 5 seconds
 * - Wait max 5 seconds for ICE candidates
 * 
 * Call timer: Start when both users have media streams connected
 * - Format: "mm:ss" or "hh:mm:ss"
 */

/**
 * ============================================================
 * WEBRTC CONSTRAINTS
 * ============================================================
 */

/**
 * Audio constraints recommended:
 * {
 *   audio: {
 *     echoCancellation: true,
 *     noiseSuppression: true,
 *     autoGainControl: true
 *   }
 * }
 * 
 * Video constraints recommended:
 * {
 *   audio: true,
 *   video: {
 *     width: { ideal: 1280 },
 *     height: { ideal: 720 },
 *     facingMode: "user"
 *   }
 * }
 * 
 * Mobile video constraints (lower bandwidth):
 * {
 *   audio: true,
 *   video: {
 *     width: { ideal: 640 },
 *     height: { ideal: 480 },
 *     facingMode: "user"
 *   }
 * }
 */
