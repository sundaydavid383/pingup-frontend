// src/pages/ChatBox.jsx
import React, { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ImageIcon, SendHorizonal, Mic, Square, Check, CheckCheck, Trash2} from "lucide-react";
import axiosBase from "../utils/axiosBase";
import moment from "moment";
import ProfileAvatar from "../component/shared/ProfileAvatar";
import { useAuth } from "../context/AuthContext";
import "../styles/ui.css";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";
import { useSocket } from "../context/useSocket";
import { useMessageContext } from "../context/MessageContext";
import { FaArrowDown } from "react-icons/fa";
import ThemeDropdown from "../component/ThemeDropdown";
import BackButton from "../component/shared/BackButton";
import "../component/themeDropdown.css";
import './chatbox.css'
import { useTheme } from "../context/ThemeContext";
import AudioMessage from "../component/shared/AudioMessage";
import ChatMessagesFull from "../component/ChatMessagesFull";
import { ArrowLeft } from "lucide-react";
import ChatboxHeader from "../component/shared/ChatboxHeader";
import ChatboxInput from "../component/shared/ChatboxInput";
import HeaderArrow from "../component/shared/HeaderArrow";
import ImageComposer from "../component/shared/ImageComposer";






const ChatBox = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, sidebarOpen } = useAuth();
  const { socket, connected, onlineUsers } = useSocket();
  // use the connected flag from context 
  const { unreadMessages, addUnread, clearUnread, getTotalUnread, incrementUnread } = useMessageContext();
  const [messages, setMessages] = useState([]);
  const [showScrollButton, setShowScrollButton] = useState(true); const [text, setText] = useState(""); 
  const [image, setImage] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [typingUser, setTypingUser] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [receiver, setReceiver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typingUserFromId, setTypingUserFromId] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const { currentTheme, setCurrentTheme } = useTheme();
   const [lastActive, setLastActive] = useState(receiver?.lastActiveAt || null);
  const sendSound = useRef(new Audio("/sounds/send.mp3"));
  const receiveSound = useRef(new Audio("/sounds/receive.mp3"));
  const containerRef = useRef(null);
  const chatContainerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const bottomRef = useRef(null);
  const MAX_RECORD_TIME = 60;
  const placeholders = ["Say hi 👋", "Send a quick note...", "Type your message...", "What's on your mind?", "Write a reply...", "Start the conversation 💬", "Drop a thought here ✨", "Share your idea 💡",];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [sending, setSending] = useState(false);
  const hasInitialScrolledRef = useRef(false);

  //==================chnage placeholderfs ===============
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
    }, 20000);
    return () => clearInterval(interval);
  }, []);


  // Track if user is near bottom


const scrollToBottom = (options = "smooth") => {
  requestAnimationFrame(() => {
    if (!bottomRef.current) return;

    // If options is string, convert to object
    const scrollOptions =
      typeof options === "string" ? { behavior: options, block: "end" } : options;

    bottomRef.current.scrollIntoView(scrollOptions);
  });
};



  const isUserNearBottom = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const nearBottom = distanceFromBottom < 150; // threshold in px
      isUserNearBottom.current = nearBottom;
      setShowScrollButton(!nearBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);







  // eslint-disable-line //======================== FETCH RECEIVER + CHAT =========================== 
  useEffect(() => {
    if (!user || !userId) return; const fetchData = async () => {
      try {
        setLoading(true);
        const [receiverRes, chatRes] = await Promise.all([
          axiosBase.get(`/api/user/${userId}`),
          axiosBase.get(`/api/chat/room?user1=${user._id}&user2=${userId}`),]);
          
        setReceiver(receiverRes.data.user || null);
         setLastActive(receiverRes.data.user?.lastActiveAt || null);
        if (chatRes.data?.room) setChatId(chatRes.data.room._id);
        if (Array.isArray(chatRes.data?.messages)) {
          const uniqueMsgs = [...new Map(
            chatRes.data.messages.map((m) => [m._id, m]))
            .values(),]; setMessages(uniqueMsgs);
        }
        clearUnread(userId);
      }
      catch (err) {
        console.error("❌ Error fetching chat:", err);
      }
      finally {
        setLoading(false);

      }
    };
    fetchData();
  }, [user, userId]);
  
  // eslint-disable-line // =========================== SOCKET CONNECTION =========================== 
  useEffect(() => {
    if (!socket || !user) {
      console.log("⚠️ useEffect skipped — no socket or user")
        ; return;
    }
    console.log("🧩 ChatBox socket ready:", socket.id, "for user:", user?._id);

    const handleMessageRead = ({ messageId, reader }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ?
          { ...m, status: "seen" } :
          m)));
    };
const handleReceiveMessage = (newMsg) => {
  setMessages(prev => {
    // 1️⃣ Ignore exact duplicates
    if (prev.some(m => m._id === newMsg._id)) return prev;

    // 2️⃣ Ignore your own messages coming from the socket
    if (newMsg.from_user_id === user._id) return prev;

    // 3️⃣ Replace temp message if it exists (optimistic UI)
    const tempIndex = prev.findIndex(m =>
      m._id.startsWith("temp_") &&
      m.from_user_id === newMsg.from_user_id &&
      m.to_user_id === newMsg.to_user_id &&
      m.text === newMsg.text &&
      (!newMsg.media_url || m.media_url === newMsg.media_url) // check media match
    );

    if (tempIndex !== -1) {
      const updated = [...prev];
      updated[tempIndex] = newMsg;
      return updated;
    }

    // 4️⃣ Otherwise append the new message
    return [...prev, newMsg];
  });
};






const handleTypingFrom = ({ from_user_id }) => {
  setTypingUser(true);
  setTypingUserFromId(from_user_id);
  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  // Only hide typing after 2s of inactivity
  typingTimeoutRef.current = setTimeout(() => {
    setTypingUser(false);
    setTypingUserFromId(null);
  }, 2000); 
};

 

    // socket.on("userOnline", handleUserOnline);
    //socket.on("userOffline", handleUserOffline);
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("typing", handleTypingFrom);
    socket.on("messageRead", handleMessageRead);
    return () => {
      console.log("🧹 Cleaning up socket listeners...");

      // socket.off("userOnline", handleUserOnline);
      //socket.off("userOffline", handleUserOffline);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("typing", handleTypingFrom);
      socket.off("messageRead", handleMessageRead);
    };
  },
    [socket, user]);
  // eslint-disable-line //====================FAILED MESSAGE ====================/ // 
  // LocalStorage helpers 
  const getFailedMessages = () => {
    try {
      return JSON.parse(localStorage.getItem("failed_messages"))
        || [];
    } catch { return []; }
  };
  const saveFailedMessages = (msgs) => { localStorage.setItem("failed_messages", JSON.stringify(msgs)); };
  useEffect(() => {
    const stored = getFailedMessages();
    if (stored.length > 0) {
      setMessages((prev) => [
        ...prev,
        ...stored.filter(f => !prev.some(m => m._id === f._id))
      ]);
    }
  }, []);
  // =========================== JOIN ROOM =========================== 
  useEffect(() => {
    if (chatId && connected && socket) {
      socket.emit("joinRoom", chatId);
    }
  }, [chatId, connected, socket]);
  // ============================== Intersection Observer (mark read) ==========================
  let lastReadSent = 0;

  function sendRead(messageId, chatId) {
    const now = Date.now();
    if (now - lastReadSent < 500) return; // throttle 500ms
    lastReadSent = now;

    socket.emit("messageRead", { messageId, chatId });
  }
  useIntersectionObserver({
    containerRef,
    messages,
    onVisible: (messageId) => {
      const msg = messages.find(m => m._id === messageId);
      if (!msg) return;
      if (msg._id.startsWith("temp_")) return;

      sendRead(messageId, chatId);

      // remove from unread
      clearUnread(msg.from_user_id);
    }
  });



  // ======================== SEND MESSAGE ====================== 
  const sendMessage = async (overrideText = null) => {
    const currentText = (overrideText !== null) ? overrideText : text;
    if (!currentText && !image && !audioURL) return; 
    
    const message_type = audioURL ? "audio" : image ? "image" : "text";
    const tempId = "temp_" + Date.now();
    const tempMsg = {
      _id: tempId, chatId, from_user_id: user._id, to_user_id: userId, text: currentText || "",
      message_type, media_url: audioURL || (image ? URL.createObjectURL(image) : ""),
      createdAt: new Date().toISOString(), sending: true, status: "sending",
    };
    // optimistic UI
    setMessages((p) => [...p, tempMsg]);

    // clear only the controlled input state (not needed when overrideText used), // but keep consistent UX:
    setText("");
    try {
      setSending(true);
      const formData = new FormData();
      formData.append("chatId", chatId || "");
      formData.append("from_user_id", user._id);
      formData.append("to_user_id", userId);
      formData.append("text", tempMsg.text);
      formData.append("tempId", tempId);
      if (image) formData.append("media", image, image.name || `image_${Date.now()}`);
      if (audioURL) {
        const blob = await fetch(audioURL).then(r => r.blob());
        let ext = blob.type === "audio/webm" ? "webm" : "mp3";
        formData.append("media", blob, `audio_${Date.now()}.${ext}`);
      }
      scrollToBottom();
      const res = await axiosBase.post("/api/chat/message",
        formData, {
        headers: { Accept: "application/json" },
        withCredentials: true,
      });
      const serverMsg = res.data.message;
      setMessages((prev) => prev.map((m) =>
        m._id === tempId ?
          {
            ...serverMsg, status: onlineUsers.has(userId) ?
              "delivered" : "sent"
          } : m));
      setImage(null); setAudioURL(null);
      setSending(false);
      sendSound.current.currentTime = 0;
      sendSound.current.play().catch(() => { }); // catch avoids console errors if autoplay blocked

      // optionally emit socket event if your backend expects it // 
      socket?.emit('sendMessage', serverMsg);
    }
    catch (err) {
      console.error("❌ sendMessage error:", err);
      const failedMsg = { ...tempMsg, failed: true, status: "failed" };
      setMessages((p) => p.map((m) => (m._id === tempId ? failedMsg : m)));
      const stored = getFailedMessages();
      setSending(false);
      saveFailedMessages([...stored, failedMsg]);
    }
    finally{
      setSending(false)
      console.log("setting sending to false", sending)
    }
  };
  // ============================== RESEND MESSAGE ========================= 
  const resendMessage = async (failedMsg) => {
    if (!failedMsg || !failedMsg.failed) return;
    const { text, message_type, media_url, _id: tempId } = failedMsg;
    const newTempId = "temp_" + Date.now();
    // Update UI: mark as resending 
    setMessages((prev) => prev.map((m) => m._id === tempId ?
      { ...m, status: "sending", failed: false, _id: newTempId }
      : m));
    try {
      const formData = new FormData();
      formData.append("chatId", chatId);
      formData.append("from_user_id", user._id);
      formData.append("to_user_id", userId);
      formData.append("text", text);
      formData.append("tempId", newTempId);
      if (message_type === "image" && media_url) {
        const blob = await fetch(media_url).then((r) => r.blob());
        formData.append("media", blob, `image_${Date.now()}.jpg`);
      }
      else if (message_type === "audio" && media_url) {
        const blob = await fetch(media_url).
          then((r) => r.blob()); formData.append("media", blob, `audio_${Date.now()}.mp3`);
      }
      const res = await axiosBase.post("/api/chat/message",
        formData, {
        headers: { Accept: "application/json" },
        withCredentials: true,
      });
      const serverMsg = res.data.message;
      scrollToBottom();
      setMessages((prev) => prev.map((m) =>
        m._id === newTempId ?
          {
            ...serverMsg, status: onlineUsers.has(userId)
              ? "delivered" : "sent"
          } : m));
      // Remove from localStorage after success 
      const stored = getFailedMessages();
      saveFailedMessages(stored.filter((m) => m._id !== failedMsg._id));
    }
    catch (err) {
      console.error("❌ resendMessage error:", err);
      setMessages((prev) => prev.map((m) => m._id === newTempId ?
        { ...m, failed: true, status: "failed" } : m));
    }
  };
  // ========================= AUDIO RECORD ==========================
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

const startRecording = async () => {
  setRecording(true); // show recording UI

  try {
    // Stop previous recorder and tracks if any
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
    }

    // Always request a fresh audio stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Choose MIME type based on platform
    const mimeType = isIOS
      ? "audio/mp4"           // safest for iOS Safari
      : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : MediaRecorder.isTypeSupported("audio/wav")
      ? "audio/wav"
      : "audio/mp3";

    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
    audioChunksRef.current = [];
    setRecordTime(0);

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      console.log("🎤 Recorded blob:", blob, "size:", blob.size);
      if (blob.size > 0) setAudioURL(URL.createObjectURL(blob));
      else console.error("❌ Audio blob is empty!");
    };

    mediaRecorderRef.current.start();

    const start = Date.now();
    recordTimerRef.current = setInterval(() => {
      const sec = Math.floor((Date.now() - start) / 1000);
      setRecordTime(sec);
      if (sec >= MAX_RECORD_TIME) stopRecording();
    }, 500);
  } catch (err) {
    console.error("Mic error:", err);
    setRecording(false); // reset UI if mic fails
  }
};

const stopRecording = () => {
  if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
    mediaRecorderRef.current.stop();
    // Stop the tracks to release mic for iOS
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
  }
  clearInterval(recordTimerRef.current);
  setRecording(false);
};



  useEffect(() => {
    return () => clearInterval(recordTimerRef.current);
  }, []);

  // =========================== HELPERS ========================== 
  const sortedMessages = [...messages].sort((a, b) =>
    new Date(a.createdAt) - new Date(b.createdAt));
  const formatTime = (iso) => new Date(iso).
    toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const imageMessages = sortedMessages.filter(m => m.message_type === "image" && m.media_url);
  // Input bar height / spacing
  const INPUT_BAR_HEIGHT_PX = 96;
  // a safe height accounting for padding and potential previews 


  useEffect(() => {
  if (
    loading === false &&
    containerRef.current &&
    sortedMessages.length > 0 &&
    !hasInitialScrolledRef.current
  ) {
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "auto", // instant, no animation
    });

    hasInitialScrolledRef.current = true; // 🔒 lock it forever
  }
}, [loading, sortedMessages.length]);





  //================disconnect user================
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit("userOnline", user._id);

    return () => {
      socket.emit("userOffline", user._id);
    };
  }, [socket, user]);


useEffect(() => { 
  if (!socket || !receiver) return;

  const handleUserOffline = (offlineUserId) => {
    if (offlineUserId === receiver._id) {
      setLastActive(new Date().toISOString());
    }
  };

  socket.on("userOffline", handleUserOffline);

  return () => {
    socket.off("userOffline", handleUserOffline);
  };
}, [socket, receiver]);



  //=[==============================
  // =====SCROLL TO BOTTOM ON FIRST LOAD=
  // =============================
  // ===================================]

  // Scroll to bottom on initial load
  useEffect(() => {
    if (containerRef.current && sortedMessages.length > 0) {

    }
  }, [sortedMessages]);


  //  ================== Image navigation ================
  useEffect(() => {
    if (!showMediaViewer) return;
    const handleKey = (e) => {
      if (e.key === "ArrowRight") {
        setCurrentImageIndex((prev) =>
          (prev + 1) % imageMessages.length);
      }
      else if (e.key === "ArrowLeft") {
        setCurrentImageIndex((prev) => (prev === 0 ? imageMessages.length - 1 : prev - 1));
      } else if (e.key === "Escape") {
        setShowMediaViewer(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  },
    [showMediaViewer, imageMessages.length]);


  //======================================
  //========================================RETURN HEADER
  //===========================================
  //=================================================
  // Determines what header/content to show based on current state
  const renderHeader = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-3 p-3 bg-multi-gradient text-white">
          <div className="w-12 h-12 rounded-full shimmer" />
          <div className="flex-1">
            <div className="h-4 w-32 shimmer rounded mb-2" />
            <div className="h-3 w-20 shimmer rounded" />
          </div>
        </div>
      );
    }

    if (!receiver) {
      return (
        <div className="flex items-center justify-center p-4 text-gray-700">
          ❌ Unable to fetch user
        </div>
      );
    }

    // When chat is empty
    if (receiver && sortedMessages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="mb-2 title">
            <ProfileAvatar user={receiver} size={48} />
          </div>
          <p className="font-medium">{receiver.name}</p>
          <p className="text-sm text-gray-600">Start a conversation 💬</p>
        </div>
      );
    }

    // When messages exist
    return (
      <div className="flex items-center justify-between p-2 bg-[var(--hover-subtle-bg)] text-[var(--primary)]">
<div className="flex title items-center gap-3">
  <HeaderArrow sidebarOpen={sidebarOpen} navigate={navigate} />
  <div onClick={() => navigate(`/profile/${receiver._id}`)} className="cursor-pointer">
    <ProfileAvatar user={receiver} size={48} />
  </div>
  <div>
<p className="font-medium text-[0.9rem] text-[var(--primary)]">
  {receiver.username}
</p>
{typingUser && typingUserFromId === receiver._id ? (
 <span className="glassy-typing">
  Typing
  <span className="typing-dots">
    <span></span>
    <span></span>
    <span></span>
  </span>
</span>
) : onlineUsers.has(receiver._id) ? (
  <span className="inline-flex items-center gap-2 px-2 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full transition-all duration-300 ease-in-out">
    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
    Online
  </span>
) : lastActive ? (
  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-[0.8rem] font-medium rounded-lg transition-colors duration-300 ease-in-out hover:bg-gray-200">
    Active {moment(lastActive).fromNow()}
    <span className="hidden sm:inline text-gray-400">
      ({moment(lastActive).format("ddd D MMMM  h:mma")})
    </span>
  </span>
) : (
  <span className="inline-flex items-center gap-2 px-2 py-1 bg-gray-50 text-gray-400 text-sm font-medium rounded-full">
    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
    Offline
  </span>
)}


          </div>
        </div>
        <ThemeDropdown containerRef={chatContainerRef} />
      </div>
    );
  };


  // ============================= sidebar widht ==============
  // -------------------------------
  // measurement using ResizeObserver
  // -------------------------------
  const [sidebarWidth, setSidebarWidth] = useState(0);

  useEffect(() => {
    let ro;
    const updateSidebarWidth = () => {
      try {
        const el = document.querySelector('.sidebar-root') ||
          document.querySelector('#sidebar') ||
          document.querySelector('.sidebar');
        if (!el) {
          setSidebarWidth(0);
          return;
        }
        const rect = el.getBoundingClientRect();
        setSidebarWidth(Math.round(rect.width));
      } catch (e) {
        setSidebarWidth(0);
      }
    };

    updateSidebarWidth();

    // ResizeObserver will pick up sidebar width changes (animations, responsive)
    try {
      const el = document.querySelector('.sidebar-root') ||
        document.querySelector('#sidebar') ||
        document.querySelector('.sidebar');
      if (el && typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => updateSidebarWidth());
        ro.observe(el);
      }
    } catch (e) {
      // ignore if ResizeObserver unsupported
    }

    // also listen for window resize as fallback
    const onResize = () => updateSidebarWidth();
    window.addEventListener('resize', onResize);

    // if your sidebar toggles with animation, measure again after a short delay
    const t = setTimeout(updateSidebarWidth, 120);

    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(t);
      if (ro && ro.disconnect) ro.disconnect();
    };
  }, [sidebarOpen]); // re-run when sidebar open state toggles



  // =========================== RETURN UI =========================== 
  return (
    <div
     ref={chatContainerRef} 
      className="flex flex-col mt-15 h-[84%] mobilenav_intervention_inverse w-full relative">

      

        <ChatboxHeader sidebarOpen={sidebarOpen} sidebarWidth={208}>    
                {renderHeader()}
      </ChatboxHeader>
        <div
        ref={containerRef}
          className="flex flex-col chatbox-wrapper 
          chatbox-messages bg-[var(--input-chatbox-bg-gradient)]"
         style={{
            background: "var(--input-chatbox-bg-gradient)",
            color: "var(--input-text-color)",
            paddingBottom: "calc(14px + env(safe-area-inset-bottom))",
          }}>
          {loading ?
            (
            <div className="flex flex-col min-h-screen bg-multi-gradient select-none animate-fadeIn overflow-hidden">
              {/* Top bar shimmer */}
              {/* Messages shimmer */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-5 max-w-4xl mx-auto px-4">
                  {[...Array(10)].map((_, idx) => {
                    const isSender = idx % 2 === 0;
                    const type = ["text", "image", "audio"][Math.floor(Math.random() * 3)];
                    let content;
                    // Determine background based on theme variables
                    const senderBg = "var(--input-bubble-sender, #ffffff)";
                    const receiverBg = "var(--input-bubble-receiver, #7c3aed)";
                    if (type === "text") {
                      const bubbleWidth = [100, 160, 240, 120][Math.floor(Math.random() * 4)];
                      const bubbleHeight = [16, 24, 36][Math.floor(Math.random() * 3)];
                      content = (<div className={`shockwave rounded-xl ${isSender ? "rounded-br-none" : "rounded-bl-none"}`}
                        style={{ width: bubbleWidth + "px", height: bubbleHeight + "px", backgroundColor: isSender ? senderBg : receiverBg, }} />
                      );
                    } else if (type === "image") {
                      const imgWidth = [160, 200, 250][Math.floor(Math.random() * 3)];
                      const imgHeight = [120, 160][Math.floor(Math.random() * 2)];
                      content = (<div className="shockwave rounded-2xl"
                        style={{ width: imgWidth + "px", height: imgHeight + "px", backgroundColor: isSender ? senderBg : receiverBg, }} />
                      );
                    }
                    else if (type === "audio") {
                      content = (<div className="flex items-center gap-2 px-4 py-2 rounded-full shockwave"
                        style={{ width: 180, height: 44, backgroundColor: isSender ? senderBg : receiverBg, }} >
                        <div className="w-5 h-5 rounded-full shimmer" />
                        <div className="flex-1 h-2 shimmer rounded" />
                        <div className="w-3 h-3 rounded-full shimmer" />
                      </div>);
                    }
                    return (<div key={idx} className={`flex ${isSender ? "justify-end" : "justify-start"}`}>
                      {content} </div>);
                  }
                )
                  } 
                  </div>
                   </div> 
                  {/* Input bar shimmer */}
              <div className="p-3 border-t shadow-inner fixed bottom-0 left-0 right-0"
                style={{ backgroundColor: "var(--input-bg-color, #ffffff)" }} >
                <div className="max-w-4xl mx-auto px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-11 shockwave rounded-full" />
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-10 h-10 shockwave rounded-full" />
                    ))} </div> </div> </div>
              {/* Shimmer styles */}
              <style>
                {`
  .shockwave, .shimmer {
    box-sizing: border-box;
    overflow: hidden;
  }
  .shockwave {
    background: linear-gradient(100deg, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.35) 37%, rgba(255,255,255,0.2) 63%);
    background-size: 400% 100%;
    animation: shockwaveMove 1.4s ease infinite;
    position: relative;
  }
  @keyframes shockwaveMove {
    0% { background-position: 100% 0; }
    100% { background-position: 0 0; }
  }
  .animate-fadeIn {
    animation: fadeIn 0.4s ease-in-out;
  }
`}
              </style>

            </div >)
            : receiver && sortedMessages.length === 0 ?
              (
              <>
               {/* Top bar */}

                {/* Empty state */}
                <div className="flex flex-col items-center justify-center flex-1 bg-multi-gradient text-center px-6 animate-fadeIn">
                  <div className="bg-white/90 p-8 rounded-2xl shadow-md max-w-sm w-full"> <div className="flex justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-[var(--input-accent)] animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} > <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m-1 7a9 9 0 110-18 9 9 0 010 18z" /> </svg>
                  </div> <h2 className="text-lg font-semibold text-gray-800 mb-2">
                      No messages yet 💬
                    </h2>
                    <p className="text-sm text-gray-600 mb-6"> Start a new conversation with{" "}
                      <span className="font-medium text-[var(--input-accent)]">
                        {/* {receiver.full_name.split(" ")[0]} */}
                      </span>{" "} by sending your first message. </p>
                    <button onClick={() => sendMessage("hello")}
                      className="bg-black text-white px-6 py-2 rounded-full font-medium hover:opacity-90 transition-all" >
                      ✍️ Say Hello </button>
                  </div> 
                  </div> 
                  </>
                  ) :
              sortedMessages.length > 0 ? (
                <ChatMessagesFull
                  messages={sortedMessages}
                  user={user}
                  resendMessage={resendMessage}
                  imageMessages={imageMessages}
                  currentImageIndex={currentImageIndex}
                  setCurrentImageIndex={setCurrentImageIndex}
                  setShowMediaViewer={setShowMediaViewer}
                  showMediaViewer={showMediaViewer}
                  formatTime={formatTime}
                  typingUser={typingUser}
                  typingUserFromId={typingUserFromId}
                  scrollToBottom={scrollToBottom}
                  showScrollButton={showScrollButton}
                  
                />
              )
                :
                (
                  // ❌ FETCH ERROR
         <div className="
          flex flex-col items-center justify-center
          h-[92vh]
          bg-gradient-to-br from-gray-100 to-gray-200
          text-center px-6 animate-fadeIn
        ">

                    <div className="bg-white p-8 rounded-2xl shadow-md max-w-sm w-full">
                      <div className="flex justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-red-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} > <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-800 mb-2">
                         Unable to fetch your messages 😔
                      </h2>
                      <p className="text-sm text-gray-600 mb-6"> It seems there was a problem connecting to the server. Please check your internet connection or try refreshing this page. </p>
                      <button onClick={() => window.location.reload()}
                        className="bg-[var(--input-accent)] text-white px-6 py-2 rounded-full 
                      font-medium hover:opacity-90 transition-all btn" > 🔄 Retry </button>
                       </div> 
                      </div>
                      )
          }

          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center justify-center w-11 h-11 rounded-full shadow-lg transition-all duration-300 bg-blue-500/70 hover:bg-blue-600/90 backdrop-blur-md text-white z-50 cursor-pointer"
            >
              <FaArrowDown />
            </button>
          )}
          
            <div ref={bottomRef} style={{ height: 1 }} />
        </div >



      {/* Input — aligned to messages column (max-w-4xl) and fixed to bottom */}
<ChatboxInput sidebarOpen={sidebarOpen} sidebarWidth={225}>

  {/* Textarea (only show if not recording) */}
 {!recording && !audioURL && !image && (
    <textarea
      id="chatInput"
      className="flex-1 min-h-[40px] max-h-[120px] max-w-[500px] resize-none outline-none border-none text-sm leading-relaxed text-black"
      style={{
        borderRadius: "20px",
        padding: "12px 16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        background: "#fff",
        width: "100%", // still keep this
        minWidth: 0,   // important for flex shrinking
      }}
      placeholder={placeholders[placeholderIndex] || ""}
      value={typeof text === "string" ? text : ""}
      rows={1}
      onFocus={() => setPlaceholderIndex(0)}
      onChange={(e) => {
        const val = e.target.value;
        setText(val);
        e.target.style.height = "auto";
        const newHeight = Math.min(e.target.scrollHeight, 120);
        e.target.style.height = `${newHeight}px`;
        if (socket && chatId && user?._id)
          socket.emit("typing", { chatId, from_user_id: user._id });
      }}
      onKeyDown={async (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (text.trim() !== "") {
            await sendMessage();
            setText("");
            e.target.style.height = "auto";
          }
        }
      }}
    />
  )}

<ImageComposer
  image={image}
  setImage={setImage}
  caption={text}
  setCaption={setText}
  onSend={sendMessage}
  sending={sending}
/>




  <div className="flex items-end gap-2">
  {/* Image preview or upload */}
  {!recording && !audioURL && !image && (
    <>
      { (
        <label htmlFor="image" className="cursor-pointer relative">
          <ImageIcon className="text-gray-500" />
<input
  type="file"
  id="image"
  accept="image/*"
  hidden
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file); // <-- correctly sets the single image
      console.log("Selected file:", file.name);
    }
    e.target.value = "";
  }}
/>

        </label>
      )}
    </>
  )}

  {/* Recording / audio preview */}
{(audioURL || recording) && (
  <div className="flex flex-col items-center w-full gap-3">
    {audioURL ? (
    <div className="w-full max-w-md">
      <div className="group flex items-center justify-between bg-gray-100 rounded-xl px-3 py-2">
        <AudioMessage msg={{ media_url: audioURL }} />

<button
  onClick={() => setAudioURL(null)}
  className="ml-2 text-red-300 hover:text-red-500 transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
  title="Delete audio"
>
  <Trash2 size={25} />
</button>
      </div>
    </div>
  ) : (
      <div className="flex items-center w-full gap-3">
        {/* Range-style progress bar filling all available space */}
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={MAX_RECORD_TIME}
            value={recordTime}
            readOnly
            className="w-full h-3 rounded-full appearance-none bg-gray-300 accent-red-500"
            style={{
              background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(recordTime / MAX_RECORD_TIME) * 100}%, #d1d5db ${(recordTime / MAX_RECORD_TIME) * 100}%, #d1d5db 100%)`,
            }}
          />
        </div>

        {/* Time indicator */}
        <span className="text-xs text-gray-700 min-w-[50px] text-right">
          {recordTime}s / {MAX_RECORD_TIME}s
        </span>

        {/* Stop button */}
        <button
          onClick={stopRecording}
          className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
        >
          Stop
        </button>
      </div>
    )}
  </div>
)}




  {/* Send button (shows if text, image, or audio exist) */}

{(!recording && (text?.trim() || image || audioURL)) && !image && (
  <button
    onClick={() =>{scrollToBottom(); sendMessage()}}
    style={{ backgroundColor: "var(--input-primary)" }}
    className="text-white p-2 rounded-full flex items-center justify-center"
    title="Send"
    disabled={sending} // disable while sending
  >
    {sending ? (
      <svg
        className="animate-spin h-5 w-5 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
        ></path>
      </svg>
    ) : (
      <SendHorizonal size={18} />
    )}
  </button>
)}


  {/* Record button (show only if nothing to send) */}
  {!recording && !text?.trim() && !image && !audioURL && (
    <button
      onClick={startRecording}
      className="flex items-center justify-center p-3 mt-2 rounded-full transition-all duration-200 bg-[var(--input-accent)] text-[white] hover:bg-gray-300"
      title="Start Recording"
    >
      <Mic size={18} />
    </button>
  )}
  </div>
</ChatboxInput>

      </div>
      );
}; export default ChatBox;