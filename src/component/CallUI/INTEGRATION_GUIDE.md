/**
 * WEBRTC AUDIO/VIDEO CALL SYSTEM - INTEGRATION GUIDE
 * 
 * This document explains how to integrate the call system into your React app.
 */

// ============================================================
// STEP 1: Wrap Your App with CallProvider and CallContainer
// ============================================================

// In your main App.jsx or Layout.jsx:

import { CallProvider } from "./context/CallContext";
import CallContainer from "./component/CallUI/CallContainer";

function App() {
  const user = /* your current user */;

  return (
    <CallProvider>
      <CallContainer user={user}>
        {/* Your entire app goes here */}
        <Routes>
          <Route path="/chat" element={<ChatBox />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* ... other routes */}
        </Routes>
      </CallContainer>
    </CallProvider>
  );
}

// ============================================================
// STEP 2: Add Call Buttons to User Components
// ============================================================

// Example: UserCard.jsx
import useCall from "../hooks/useCall";
import { Phone, Video } from "lucide-react";

function UserCard({ user }) {
  const { initiateAudioCall, initiateVideoCall, hasActiveCall } = useCall();

  const handleAudioCall = () => {
    if (hasActiveCall()) {
      alert("End current call first");
      return;
    }
    initiateAudioCall(user._id, user.name, user.profileImage);
  };

  const handleVideoCall = () => {
    if (hasActiveCall()) {
      alert("End current call first");
      return;
    }
    initiateVideoCall(user._id, user.name, user.profileImage);
  };

  return (
    <div className="border rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src={user.profileImage} alt={user.name} className="w-10 h-10 rounded-full" />
        <div>
          <p className="font-semibold">{user.name}</p>
          <p className="text-xs text-gray-500">@{user.username}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {/* Audio Call Button */}
        <button
          onClick={handleAudioCall}
          className="p-2 hover:bg-gray-200 rounded-full transition"
          title="Audio call"
        >
          <Phone size={20} className="text-blue-500" />
        </button>

        {/* Video Call Button */}
        <button
          onClick={handleVideoCall}
          className="p-2 hover:bg-gray-200 rounded-full transition"
          title="Video call"
        >
          <Video size={20} className="text-green-500" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// STEP 3: Add Ringtone Audio File
// ============================================================

// Create public/audio/ringtone.mp3
// Place your ringtone audio file in: public/audio/ringtone.mp3
// 
// Free ringtone sources:
// - freepd.com
// - zapsplat.com
// - notification sounds from your OS

// ============================================================
// STEP 4: Backend Integration
// ============================================================

// Your backend needs to handle these Socket.IO events:
// See SOCKET_EVENT_CONTRACT.js for detailed specs

// Key endpoints needed:
// POST /api/calls/initiate
// POST /api/calls/accept
// POST /api/calls/reject
// POST /api/calls/end
// DELETE /api/calls/:callId

// Key socket handlers needed:
// socket.on("callInitiated") → forward to receiver
// socket.on("callAccepted") → send acknowledgment
// socket.on("callRejected") → send acknowledgment
// socket.on("callEnded") → send acknowledgment
// socket.on("webrtcOffer") → relay to peer
// socket.on("webrtcAnswer") → relay to peer
// socket.on("webrtcIceCandidate") → relay to peer

// ============================================================
// STEP 5: Additional UI Components
// ============================================================

// Example: Call Button for Messages Chat
import useCall from "../hooks/useCall";

function ChatHeader({ receiver }) {
  const { initiateAudioCall, initiateVideoCall } = useCall();

  return (
    <div className="flex justify-between items-center p-4 border-b">
      <h2>{receiver.name}</h2>
      <div className="flex gap-2">
        <button
          onClick={() => initiateAudioCall(receiver._id, receiver.name, receiver.image)}
          className="p-2 hover:bg-gray-100 rounded"
        >
          📞
        </button>
        <button
          onClick={() => initiateVideoCall(receiver._id, receiver.name, receiver.image)}
          className="p-2 hover:bg-gray-100 rounded"
        >
          📹
        </button>
      </div>
    </div>
  );
}

// ============================================================
// STEP 6: Styling (Tailwind CSS)
// ============================================================

// The components already use Tailwind CSS classes.
// Make sure your tailwind.config.js includes:

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

// ============================================================
// STEP 7: Handle Permissions
// ============================================================

// Desktop - Chrome/Firefox:
// First camera/mic access will show permission prompt

// Mobile - iOS/Android:
// Add to your app manifest or iOS app config:
// - camera permission
// - microphone permission
// - speaker access

// Example React Native code (if applicable):
// const permissions = [
//   PERMISSIONS.IOS.CAMERA,
//   PERMISSIONS.IOS.MICROPHONE,
// ];
// requestMultiple(permissions);

// ============================================================
// STEP 8: Error Handling
// ============================================================

// Common errors and solutions:

// 1. "Device not found"
//    Solution: User has no camera/microphone. Fall back to audio-only.
//    
// 2. "Permission denied"
//    Solution: User blocked camera/mic. Show permission settings link.
//    
// 3. "Network error"
//    Solution: No internet or backend down. Retry mechanism.
//    
// 4. "Multiple concurrent calls"
//    Solution: Always check hasActiveCall() before initiating.
//    
// 5. "Media stream not found"
//    Solution: Browser timing issue. Add retry logic with delay.

// ============================================================
// STEP 9: Testing
// ============================================================

// Test scenarios:
// 1. Same device/browser - open in two devtools windows
// 2. Different devices - ensure same backend/socket namespace
// 3. Network conditions - use Chrome DevTools throttling
// 4. Mobile - use Android Studio emulator or physical device
// 5. Permissions - test with/without permissions granted

// Test checklist:
// ☐ Audio call initiates
// ☐ Video call initiates
// ☐ Incoming call modal appears
// ☐ Accept connects media
// ☐ Reject ends call
// ☐ End call closes streams
// ☐ Mute/unmute works
// ☐ Video toggle works
// ☐ Speaker toggle works
// ☐ Call timer increases
// ☐ Disconnect handled gracefully
// ☐ Mobile responsive
// ☐ Dark mode (if applicable)

// ============================================================
// STEP 10: Production Checklist
// ============================================================

// Requirements:
// ☐ STUN/TURN servers configured (for NAT traversal)
// ☐ CallContext provider wraps entire app
// ☐ CallContainer placed in root layout
// ☐ All socket events implemented on backend
// ☐ Error boundaries added
// ☐ Permissions requested appropriately
// ☐ Mobile tested thoroughly
// ☐ Call quality settings (bitrate limits for mobile)
// ☐ Logging/monitoring setup
// ☐ Rate limiting on backend
// ☐ Security: validate user permissions
// ☐ Performance: optimize for 5G/4G/WiFi

// Optional enhancements:
// ☐ Screen sharing (getDisplayMedia API)
// ☐ Recording (MediaRecorder API)
// ☐ Call history/logs
// ☐ Call transfer
// ☐ Conference calls (multiple users)
// ☐ Virtual backgrounds
// ☐ Noise cancellation
// ☐ Call statistics (bandwidth, latency, packet loss)

// ============================================================
// EXAMPLE: Complete Integration
// ============================================================

/*
// App.jsx
import { CallProvider } from "./context/CallContext";
import CallContainer from "./component/CallUI/CallContainer";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Load user
    const loadUser = async () => {
      const userData = await fetchCurrentUser();
      setUser(userData);
    };
    loadUser();
  }, []);

  if (!user) return <LoadingSpinner />;

  return (
    <div className="h-screen">
      <CallProvider>
        <CallContainer user={user}>
          <Navbar />
          <Routes>
            <Route path="/feed" element={<Feed />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
          </Routes>
        </CallContainer>
      </CallProvider>
    </div>
  );
}

// UserProfile.jsx
import useCall from "../hooks/useCall";

function UserProfile() {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const { initiateVideoCall } = useCall();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>{userData?.name}</h1>
        <button
          onClick={() => initiateVideoCall(userId, userData?.name, userData?.image)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Video Call
        </button>
      </div>
      {/* Profile content */}
    </div>
  );
}
*/

export default "INTEGRATION_GUIDE_COMPLETE";
