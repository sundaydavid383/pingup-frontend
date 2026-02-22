/**
 * BACKEND IMPLEMENTATION GUIDE - WebRTC Call System
 * 
 * This is a reference implementation for the Node.js/Express backend
 * Complete as per the SOCKET_EVENT_CONTRACT.js specifications
 */

// ============================================================
// 1. SOCKET.IO SETUP
// ============================================================

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Track connected users and their socket IDs
const userSockets = new Map(); // userId → socketId
const activeCalls = new Map();  // callId → {initiator, receiver, status, ...}

// ============================================================
// 2. SOCKET EVENT HANDLERS
// ============================================================

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  /**
   * USER JOIN - Register user when they connect
   */
  socket.on('join', ({ userId, chatId }) => {
    userSockets.set(userId, socket.id);
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined with socket ${socket.id}`);
  });

  /**
   * CALL INITIATED - User A starts a call
   */
  socket.on('callInitiated', ({ callId, initiatorId, receiverId, callType, timestamp }) => {
    console.log(`Call initiated: ${initiatorId} → ${receiverId}`);

    // Validate call doesn't already exist
    if (activeCalls.has(callId)) {
      socket.emit('error', { message: 'Call already exists' });
      return;
    }

    // Store call information
    activeCalls.set(callId, {
      callId,
      initiatorId,
      receiverId,
      callType,
      status: 'ringing',
      startedAt: new Date(),
      initiatorSocket: socket.id
    });

    // Find receiver's socket
    const receiverSocketId = userSockets.get(receiverId);

    if (receiverSocketId) {
      // Receiver is online - send incoming call
      io.to(`user_${receiverId}`).emit('incomingCall', {
        callId,
        callType,
        initiatorId,
        initiatorName: socket.initiatorName || 'User', // Get from your DB
        initiatorImage: socket.initiatorImage || null,
        timestamp
      });
      console.log(`Incoming call sent to ${receiverId}`);
    } else {
      // Receiver is offline - store missed call notification
      storeeMissedCall(receiverId, {
        callId,
        initiatorId,
        callType,
        timestamp
      });
      
      // Notify caller that receiver is offline
      socket.emit('callRejectedAck', {
        callId,
        reason: 'offline'
      });
    }
  });

  /**
   * CALL ACCEPTED - User B accepts the call
   */
  socket.on('callAccepted', ({ callId, acceptorId, timestamp }) => {
    console.log(`Call accepted: ${acceptorId}`);

    const call = activeCalls.get(callId);
    if (!call) {
      socket.emit('error', { message: 'Call not found' });
      return;
    }

    // Update call status
    call.status = 'accepted';
    call.acceptorSocket = socket.id;
    call.acceptedAt = new Date();

    // Send acknowledgment to initiator
    io.to(`user_${call.initiatorId}`).emit('callAcceptedAck', {
      callId,
      acceptorId,
      timestamp
    });

    // Create a room for this call
    socket.join(`call_${callId}`);
    io.to(`user_${call.initiatorId}`).emit('joinCallRoom', {
      callId,
      room: `call_${callId}`
    });

    console.log(`Call accepted - both parties can now exchange WebRTC signals`);
  });

  /**
   * CALL REJECTED - User B rejects the call
   */
  socket.on('callRejected', ({ callId, rejecterId, reason, timestamp }) => {
    console.log(`Call rejected: ${rejecterId} - reason: ${reason}`);

    const call = activeCalls.get(callId);
    if (!call) return;

    call.status = 'rejected';
    call.rejectedAt = new Date();

    // Notify initiator
    io.to(`user_${call.initiatorId}`).emit('callRejectedAck', {
      callId,
      reason
    });

    // Clean up call
    setTimeout(() => activeCalls.delete(callId), 5000);
  });

  /**
   * WEBRTC OFFER - Relay SDP offer to peer
   */
  socket.on('webrtcOffer', ({ callId, to, sdp }) => {
    const call = activeCalls.get(callId);
    if (!call) {
      socket.emit('error', { message: 'Call not found' });
      return;
    }

    console.log(`WebRTC offer relayed for call ${callId}`);

    // Relay offer to the other user
    io.to(`user_${to}`).emit('webrtcOffer', {
      callId,
      from: socket.userId,
      sdp
    });
  });

  /**
   * WEBRTC ANSWER - Relay SDP answer to peer
   */
  socket.on('webrtcAnswer', ({ callId, to, sdp }) => {
    const call = activeCalls.get(callId);
    if (!call) {
      socket.emit('error', { message: 'Call not found' });
      return;
    }

    console.log(`WebRTC answer relayed for call ${callId}`);

    // Relay answer to the other user
    io.to(`user_${to}`).emit('webrtcAnswer', {
      callId,
      from: socket.userId,
      sdp
    });
  });

  /**
   * WEBRTC ICE CANDIDATE - Relay ICE candidate to peer
   */
  socket.on('webrtcIceCandidate', ({ callId, to, candidate }) => {
    // Relay ICE candidate to the other user
    io.to(`user_${to}`).emit('webrtcIceCandidate', {
      callId,
      from: socket.userId,
      candidate
    });
  });

  /**
   * CALL ENDED - User ends active call
   */
  socket.on('callEnded', ({ callId, endedBy, duration, timestamp }) => {
    console.log(`Call ended: ${endedBy} - duration: ${duration}s`);

    const call = activeCalls.get(callId);
    if (!call) {
      socket.emit('error', { message: 'Call not found' });
      return;
    }

    const otherUserId = endedBy === call.initiatorId ? call.receiverId : call.initiatorId;

    // Notify other user
    io.to(`user_${otherUserId}`).emit('callEndedAck', {
      callId,
      endedBy,
      duration
    });

    // Store call history
    storeCallHistory({
      callId,
      initiatorId: call.initiatorId,
      receiverId: call.receiverId,
      callType: call.callType,
      status: 'completed',
      duration,
      startedAt: call.startedAt,
      endedAt: new Date()
    });

    // Cleanup
    activeCalls.delete(callId);
    socket.leave(`call_${callId}`);
  });

  /**
   * DISCONNECT - Clean up when user disconnects
   */
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Remove from user mapping
    if (socket.userId) {
      userSockets.delete(socket.userId);
    }

    // End any active calls for this user
    for (const [callId, call] of activeCalls.entries()) {
      if (call.initiatorSocket === socket.id || call.acceptorSocket === socket.id) {
        const otherUserId = call.initiatorSocket === socket.id 
          ? call.receiverId 
          : call.initiatorId;

        io.to(`user_${otherUserId}`).emit('callEndedAck', {
          callId,
          endedBy: socket.userId,
          duration: Math.floor((new Date() - call.startedAt) / 1000),
          reason: 'disconnected'
        });

        activeCalls.delete(callId);
      }
    }
  });
});

// ============================================================
// 3. REST API ENDPOINTS
// ============================================================

/**
 * GET /api/webrtc/turn-servers
 * Get TURN server credentials for WebRTC
 */
app.get('/api/webrtc/turn-servers', async (req, res) => {
  try {
    // Verify user is authenticated
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Get TURN credentials from provider
    const turnServers = await getTurnServers();

    res.json({ iceServers: turnServers });
  } catch (error) {
    console.error('Error getting TURN servers:', error);
    res.status(500).json({ error: 'Failed to get TURN servers' });
  }
});

/**
 * POST /api/calls/history
 * Get call history for user
 */
app.post('/api/calls/history', async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { limit = 50, offset = 0 } = req.body;

    // Query from database
    const calls = await getCallHistory(userId, limit, offset);
    
    res.json({ calls });
  } catch (error) {
    console.error('Error fetching call history:', error);
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
});

/**
 * DELETE /api/calls/:callId
 * End a call (for cleanup/emergency)
 */
app.delete('/api/calls/:callId', async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user?._id;

    const call = activeCalls.get(callId);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    // Verify user is part of this call
    if (call.initiatorId !== userId && call.receiverId !== userId) {
      return res.status(403).json({ error: 'Not part of this call' });
    }

    // Emit end call to other user
    const otherUserId = call.initiatorId === userId ? call.receiverId : call.initiatorId;
    io.to(`user_${otherUserId}`).emit('callEndedAck', {
      callId,
      endedBy: userId,
      reason: 'forced_end'
    });

    activeCalls.delete(callId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({ error: 'Failed to end call' });
  }
});

// ============================================================
// 4. HELPER FUNCTIONS
// ============================================================

/**
 * Get TURN servers from provider
 * Example using Xirsys
 */
async function getTurnServers() {
  try {
    const response = await fetch('https://api.xirsys.com/getToken', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.XIRSYS_JWT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: process.env.XIRSYS_USERNAME,
        secure: 1
      })
    });

    const data = await response.json();
    return data.d?.v?.iceServers || [];
  } catch (error) {
    console.error('Error getting TURN servers:', error);
    return []; // Fallback to STUN only
  }
}

/**
 * Store call history in database
 */
async function storeCallHistory(callData) {
  try {
    const Call = require('../models/Call');
    await Call.create({
      callId: callData.callId,
      initiator: callData.initiatorId,
      receiver: callData.receiverId,
      type: callData.callType,
      status: callData.status,
      duration: callData.duration,
      startedAt: callData.startedAt,
      endedAt: callData.endedAt
    });
  } catch (error) {
    console.error('Error storing call history:', error);
  }
}

/**
 * Store missed call notification
 */
async function storeeMissedCall(receiverId, callData) {
  try {
    const Notification = require('../models/Notification');
    await Notification.create({
      user: receiverId,
      type: 'missed_call',
      data: {
        callId: callData.callId,
        initiatorId: callData.initiatorId,
        callType: callData.callType,
        timestamp: callData.timestamp
      }
    });
  } catch (error) {
    console.error('Error storing missed call:', error);
  }
}

/**
 * Get call history from database
 */
async function getCallHistory(userId, limit, offset) {
  try {
    const Call = require('../models/Call');
    const calls = await Call.find({
      $or: [
        { initiator: userId },
        { receiver: userId }
      ]
    })
      .sort({ startedAt: -1 })
      .skip(offset)
      .limit(limit);
    
    return calls;
  } catch (error) {
    console.error('Error fetching call history:', error);
    return [];
  }
}

// ============================================================
// 5. DATABASE MODELS
// ============================================================

/**
 * Call Model - Store call history
 */
const callSchema = new Schema({
  callId: { type: String, unique: true, required: true },
  initiator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['audio', 'video'], required: true },
  status: { type: String, enum: ['completed', 'rejected', 'missed', 'failed'], default: 'completed' },
  duration: { type: Number, default: 0 },
  startedAt: { type: Date, required: true },
  endedAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

// ============================================================
// 6. ENVIRONMENT VARIABLES
// ============================================================

/*
Required .env variables:

XIRSYS_JWT=your_xirsys_jwt_token
XIRSYS_USERNAME=your_xirsys_username

Or for another TURN provider:
TURN_SERVER_URL=turn:turn.example.com:3478
TURN_USERNAME=user123
TURN_PASSWORD=pass123

*/

// ============================================================
// 7. RATE LIMITING
// ============================================================

/**
 * Rate limiter for call attempts
 */
const callAttempts = new Map();

function checkCallRateLimit(userId) {
  const key = `call_${userId}`;
  const now = Date.now();
  const attempts = callAttempts.get(key) || [];

  // Remove old attempts (older than 1 minute)
  const recentAttempts = attempts.filter(time => now - time < 60000);

  if (recentAttempts.length >= 10) {
    return false; // Rate limited
  }

  recentAttempts.push(now);
  callAttempts.set(key, recentAttempts);
  return true;
}

// Use in socket handler:
// if (!checkCallRateLimit(socket.userId)) {
//   socket.emit('error', { message: 'Too many call attempts' });
//   return;
// }

// ============================================================
// 8. ERROR HANDLING AND LOGGING
// ============================================================

/**
 * Logging for debugging
 */
function logCall(action, data) {
  console.log(`[CALL ${new Date().toISOString()}] ${action}:`, data);
  
  // Optional: Send to external logging service
  // logToExternalService({ action, data, timestamp: new Date() });
}

// ============================================================
// 9. TESTING
// ============================================================

/*

Test with curl:

# Test incoming call
curl -X POST http://localhost:3000/api/calls/history \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"limit": 10, "offset": 0}'

# Test TURN servers endpoint
curl -X GET http://localhost:3000/api/webrtc/turn-servers \
  -H "Authorization: Bearer YOUR_JWT"

*/

// ============================================================
// 10. START SERVER
// ============================================================

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Socket.IO server listening on port ${PORT}`);
});

module.exports = { io, app, server };
