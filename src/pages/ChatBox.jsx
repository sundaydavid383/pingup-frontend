// src/pages/ChatBox.jsx
import React, { useRef, useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ImageIcon, SendHorizonal, Mic, ImageUpIcon, FileIcon, VideoIcon } from "lucide-react";
import axiosBase from "../utils/axiosBase";
import moment from "moment";
import ProfileAvatar from "../component/shared/ProfileAvatar";
import { useAuth } from "../context/AuthContext";
import "../styles/ui.css";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";
import { useSocket } from "../context/SocketContext";
import { useMessageContext } from "../context/MessageContext";
import { FaArrowDown } from "react-icons/fa";
import ThemeDropdown from "../component/ThemeDropdown";
import BackButton from "../component/shared/BackButton";
import "../component/themeDropdown.css";
import './chatbox.css'
import '../styles/chat-highlight.css'
import { useTheme } from "../context/ThemeContext";
import AudioMessage from "../component/shared/AudioMessage";
import ChatMessagesFull from "../component/ChatMessagesFull";
import { ArrowLeft } from "lucide-react";
import ChatboxHeader from "../component/shared/ChatboxHeader";
import ChatboxInput from "../component/shared/ChatboxInput";
import MediaDropdown from "../component/MediaDropdown";
import HeaderArrow from "../component/shared/HeaderArrow";
import ImageComposer from "../component/shared/ImageComposer";






const ChatBox = ({ userId: propUserId }) => {
  const [replyTo, setReplyTo] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const params = useParams();
  const userId = propUserId || params.userId;
  const navigate = useNavigate();
  const { user, sidebarOpen } = useAuth();
  const { socket, connected, onlineUsers } = useSocket();
  // use the connected flag from context 
  const { unreadMessages, addUnread, clearUnread, getTotalUnread, incrementUnread } = useMessageContext();
  // 1. INITIALIZE FROM LOCAL STORAGE
  // Use a state initializer that depends on userId
  const [messages, setMessages] = useState(() => {
    const cached = localStorage.getItem(`chat_history_${userId}`);
    return cached ? JSON.parse(cached) : [];
  });

  // Reset messages when userId changes (chat switching)
  useEffect(() => {
    const cached = localStorage.getItem(`chat_history_${userId}`);
    setMessages(cached ? JSON.parse(cached) : []);
  }, [userId]);

  // Input ref for focusing
  const inputRef = useRef(null);



  // Only show loading if we have zero cached messages
/*   const [loading, setLoading] = useState(messages.length === 0);
 */  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false); // loading now only affects empty fetch, not initial display
  const dropdownRef = useRef(null);
  // ... other states (image, audio, etc.)

  const [showScrollButton, setShowScrollButton] = useState(true);
  /* const [text, setText] = useState("");  */
  const [image, setImage] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [typingUser, setTypingUser] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [receiver, setReceiver] = useState(null);
  /* const [loading, setLoading] = useState(true); */
  const [typingUserFromId, setTypingUserFromId] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [showMediaDropdown, setShowMediaDropdown] = useState(false);
  const { currentTheme, setCurrentTheme } = useTheme();


  const [lastActive, setLastActive] = useState(receiver?.lastActiveAt || null);
  const sendSound = useRef(new Audio("/sounds/send.mp3"));
  const receiveSound = useRef(new Audio("/sounds/receive.mp3"));

  /* scroll logic */
  const lastScrollTop = useRef(0);
  const scrollStopTimeout = useRef(null);

  const [scrollDirection, setScrollDirection] = useState("down");
  const [scrollStopped, setScrollStopped] = useState(false);
  const containerRef = useRef(null);
  const chatContainerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const pausedTimeRef = useRef(0);
  const recordingStartRef = useRef(null);
  const lastPauseTimeRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const showMenuRef = useRef(null);
  const mediaDropdownRef = useRef(null);
  const MAX_RECORD_TIME = 60;
  const placeholders = ["Say hi 👋", "Send a quick note...", "Type your message...", "What's on your mind?", "Write a reply...", "Start the conversation 💬", "Drop a thought here ✨", "Share your idea 💡",];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  /* const [sending, setSending] = useState(false); */
  const hasInitialScrolledRef = useRef(false);

  //==================chnage placeholderfs ===============
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
    }, 500000);
    return () => clearInterval(interval);
  }, []);

  const handleMediaSelect = (type) => {
    setShowMediaDropdown(false);
    if (type === "image" && imageInputRef.current) imageInputRef.current.click();
    if (type === "file" && fileInputRef.current) fileInputRef.current.click();
    if (type === "video" && videoInputRef.current) videoInputRef.current.click();
  };


  // Track if user is near bottom


  // Scroll-to-bottom when clicking the scroll button
  const scrollToMessage = (messageId) => {
    if (!containerRef.current) return;
    const messageEl = containerRef.current.querySelector(`[data-message-id="${messageId}"]`);
    if (messageEl) {
      messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a temporary highlight effect
      messageEl.classList.add('message-highlight');
      setTimeout(() => {
        messageEl.classList.remove('message-highlight');
      }, 2000);
    }
  };

  // Scroll to original message being replied to
  // If not in DOM, load older messages automatically
  const scrollToReplyMessage = useCallback(async (replyToMessage) => {
    if (!containerRef.current || !replyToMessage || !replyToMessage._id) return;

    const replyId = replyToMessage._id;
    const container = containerRef.current;

    // First, check if the message is already in the DOM
    let messageEl = container.querySelector(`[data-message-id="${replyId}"]`);

    if (messageEl) {
      // Message exists in DOM - scroll to it with highlight
      messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageEl.classList.add('message-highlight');
      setTimeout(() => {
        messageEl.classList.remove('message-highlight');
      }, 2000);
      return;
    }

    // Message not in DOM - need to load older messages
    // Find the oldest message timestamp to use for pagination
    const oldestMessage = messages.length > 0
      ? messages.reduce((oldest, msg) =>
        new Date(msg.createdAt) < new Date(oldest.createdAt) ? msg : oldest
      )
      : null;

    const oldestTimestamp = oldestMessage ? new Date(oldestMessage.createdAt).toISOString() : null;

    // Show loading indicator (could add a state for this)
    console.log('Loading older messages to find reply...');

    try {
      // Fetch older messages - using the chat room API with before parameter
      const response = await axiosBase.get(`/api/chat/room?user1=${user._id}&user2=${userId}&before=${oldestTimestamp}&limit=50`);

      if (response.data?.messages && response.data.messages.length > 0) {
        // Add new messages to the existing ones (prepend since they're older)
        const olderMessages = response.data.messages;
        olderMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        setMessages(prev => {
          // Check if any of the new messages are already in the array
          const existingIds = new Set(prev.map(m => m._id));
          const newMessages = olderMessages.filter(m => !existingIds.has(m._id));
          return [...newMessages, ...prev];
        });

        // After messages are loaded, try to scroll to the target message again
        setTimeout(() => {
          messageEl = container.querySelector(`[data-message-id="${replyId}"]`);
          if (messageEl) {
            messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageEl.classList.add('message-highlight');
            setTimeout(() => {
              messageEl.classList.remove('message-highlight');
            }, 2000);
          } else {
            // If still not found, try loading more (recursive approach with limit)
            console.log('Message still not found, may need more loading...');
          }
        }, 100);
      } else {
        console.log('No more older messages available');
      }
    } catch (err) {
      console.error('Error loading older messages:', err);
    }
  }, [containerRef, messages, user._id, userId]);

  const scrollToBottom = () => {
    if (containerRef.current) {
      const container = containerRef.current;
      // Simply scroll to the full scrollHeight to reach true bottom
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      })
    }
  };


  //================= REMOVING FILES DROPDOWN ===============
  useEffect(() => {
    function handleClickOutside(event) {
      // Check if click is inside the header dropdown menu
      if (showMenuRef.current && !showMenuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      // Check if click is inside media dropdown
      if (mediaDropdownRef.current && !mediaDropdownRef.current.contains(event.target)) {
        setShowMediaDropdown(false);
      }
      // Check if click is inside any theme dropdown portal (rendered outside the main DOM)
      const themeDropdowns = document.querySelectorAll('.theme-dropdown-portal');
      const isInsideThemeDropdown = Array.from(themeDropdowns).some(
        portal => portal.contains(event.target)
      );
      if (isInsideThemeDropdown) {
        return; // Don't close the header menu when clicking inside theme dropdown
      }
    }

    // Attach the listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup on unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  // ===================== NEAR BOTTOM SCROLL DETECTION =====================


  const isUserNearBottomRef = useRef(true);
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const checkNearBottom = () => {
      const scrollPosition = container.scrollTop + container.clientHeight;
      const threshold = 150; // px from bottom to consider "near"
      isUserNearBottomRef.current = scrollPosition >= container.scrollHeight - threshold;
      setShowScrollButton(!isUserNearBottomRef.current);
    };

    container.addEventListener("scroll", checkNearBottom);
    checkNearBottom(); // initial check

    return () => container.removeEventListener("scroll", checkNearBottom);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;

    const handleScroll = () => {
      const currentTop = el.scrollTop;

      const isDown = currentTop > lastScrollTop.current;
      lastScrollTop.current = currentTop;

      setScrollDirection(isDown ? "down" : "up");

      if (scrollStopTimeout.current) {
        clearTimeout(scrollStopTimeout.current);
      }

      setScrollStopped(false);

      scrollStopTimeout.current = setTimeout(() => {
        setScrollStopped(true);
      }, 1500);
    };

    el.addEventListener("scroll", handleScroll);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      if (scrollStopTimeout.current) clearTimeout(scrollStopTimeout.current);
    };
  }, []);









  // eslint-disable-line //======================== FETCH RECEIVER + CHAT =========================== 
  useEffect(() => {
    if (!user || !userId) return;

    const fetchData = async () => {
      try {
        // Try to get cached chatId first as fallback
        const cachedChatId = localStorage.getItem(`chatId_${userId}`);
        if (cachedChatId) {
          setChatId(cachedChatId);
        }

        const [receiverRes, chatRes] = await Promise.all([
          axiosBase.get(`/api/user/${userId}`),
          axiosBase.get(`/api/chat/room?user1=${user._id}&user2=${userId}`),
        ]);

        setReceiver(receiverRes.data.user || null);
        setLastActive(receiverRes.data.user?.lastActiveAt || null);

        if (chatRes.data?.room) {
          setChatId(chatRes.data.room._id);
          // Update chatId in localStorage for future reference
          localStorage.setItem(`chatId_${userId}`, chatRes.data.room._id);
        }

        if (Array.isArray(chatRes.data?.messages)) {
          // Replace messages entirely for this chat - don't merge with previous
          const newMessages = [...chatRes.data.messages];
          newMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

          // Save to localStorage
          localStorage.setItem(`chat_history_${userId}`, JSON.stringify(newMessages));

          setMessages(newMessages);
        }

        clearUnread(userId);
      } catch (err) {
        console.error("❌ Error fetching chat:", err);
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
        const tempIndex = prev.findIndex(m => m._id === newMsg.tempId);
        if (tempIndex !== -1) {
          const updated = [...prev];
          updated[tempIndex] = { ...newMsg, status: "delivered" };
          return updated;
        }

        if (prev.some(m => m._id === newMsg._id)) return prev; // normal duplicate prevention

        return [...prev, newMsg];
      });

      if (isUserNearBottomRef.current) {
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }

      receiveSound.current.currentTime = 0;
      receiveSound.current.play().catch(() => { });
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
    [socket]);
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

    // Build reply object with complete info
    const replyInfo = replyTo ? {
      _id: replyTo._id,
      text: replyTo.text,
      from_user_id: replyTo.from_user_id,
      message_type: replyTo.message_type
    } : null;

    const tempMsg = {
      _id: tempId,
      chatId,
      from_user_id: user._id,
      to_user_id: userId,
      text: currentText || "",
      replyTo: replyInfo,
      message_type,
      media_url: audioURL || (image ? URL.createObjectURL(image) : ""),
      createdAt: new Date().toISOString(),
      sending: true,
      status: "sending",
    };

    setReplyTo(null); // reset reply state

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
      formData.append("replyTo", replyTo ? replyTo._id : null);
      if (image) formData.append("media", image, image.name || `image_${Date.now()}`);
      if (audioURL) {
        const blob = await fetch(audioURL).then(r => r.blob());
        let ext = blob.type === "audio/webm" ? "webm" : "mp3";
        formData.append("media", blob, `audio_${Date.now()}.${ext}`);
      }
      requestAnimationFrame(() => {
        scrollToBottom();
      });
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
    finally {
      setSending(false)
      console.log("setting sending to false", sending)
    }
  };
  // ============================== RESEND MESSAGE ========================= 
  const resendMessage = async (failedMsg) => {
    if (!failedMsg || !failedMsg.failed) return;
    const { text, message_type, media_url, _id: tempId } = failedMsg;
    const newTempId = "temp_" + Date.now();

    const replyInfo = replyTo?._id
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
      formData.append("replyTo", replyInfo ? replyInfo : "");
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
      requestAnimationFrame(() => {
        scrollToBottom();
      });
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

  // ======================== BLOCK USER ======================
  const handleBlockUser = async () => {
    if (!receiver?._id) return;

    setBlocking(true);
    try {
      // Call the block user API - user will implement the backend
      await axiosBase.post(`/api/users/block/${receiver._id}`, {}, {
        withCredentials: true
      });

      // Clear chat history locally
      setMessages([]);
      localStorage.removeItem(`chat_history_${userId}`);

      // Close menu and show success
      setShowMenu(false);
      setShowBlockConfirm(false);
      alert(`You have blocked ${receiver.username || 'this user'}. Chat history has been cleared.`);

      // Navigate back or close chat
      navigate(-1);
    } catch (err) {
      console.error("Error blocking user:", err);
      alert("Failed to block user. Please try again.");
    } finally {
      setBlocking(false);
    }
  };

  // ========================= AUDIO RECORD ==========================
  const startRecording = async () => {
    setRecording(true); // <-- immediately show the recording UI
    setIsPaused(false);
    pausedTimeRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/wav")
          ? "audio/wav"
          : "audio/mp3";

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      setRecordTime(0);

      // Ensure we collect data periodically for longer recordings
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      // Request data every second to prevent data loss
      const dataInterval = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData();
        }
      }, 1000);

      mediaRecorderRef.current.onstop = () => {
        clearInterval(dataInterval);
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log("🎤 Recorded blob:", blob, "size:", blob.size);
        if (blob.size > 0) setAudioURL(URL.createObjectURL(blob));
        else console.error("❌ Audio blob is empty!");
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        clearInterval(dataInterval);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(1000); // Start collecting data every 1 second
      recordingStartRef.current = Date.now();

      recordTimerRef.current = setInterval(() => {
        if (!isPaused) {
          const sec = Math.floor((Date.now() - recordingStartRef.current - pausedTimeRef.current) / 1000);
          setRecordTime(sec);
          if (sec >= MAX_RECORD_TIME) stopRecording();
        }
      }, 100); // Update every 100ms for smoother timer
    } catch (err) {
      console.error("Mic error:", err);
      // Handle permission denied
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert("Microphone access was denied. Please allow microphone access to record voice messages.");
      }
      setRecording(false); // reset UI if mic fails
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    clearInterval(recordTimerRef.current);
    setRecording(false);
    setIsPaused(false);
  };

  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        // Resuming from pause
        // Calculate how long we were paused and add to total paused time
        const pauseDuration = Date.now() - lastPauseTimeRef.current;
        pausedTimeRef.current += pauseDuration;

        mediaRecorderRef.current.resume();
        recordingStartRef.current = Date.now(); // Reset start time for next calculation
        setIsPaused(false);
      } else {
        // Pausing
        lastPauseTimeRef.current = Date.now();
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  };


  useEffect(() => {
    return () => {
      // Cleanup: stop any ongoing recording when component unmounts
      clearInterval(recordTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
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


  // //================disconnect user================
  // useEffect(() => {
  //   if (!socket || !user) return;

  //   socket.emit("userOnline", user._id);

  //   return () => {
  //     socket.emit("userOffline", user._id);
  //   };
  // }, [socket, user]);


  useEffect(() => {
    if (!receiver) return;

    if (!onlineUsers.has(receiver._id)) {
      setLastActive(receiver.lastActiveAt || new Date().toISOString());
    }
  }, [onlineUsers, receiver]);


  //=[==============================
  // =====SCROLL TO BOTTOM ON FIRST LOAD=
  // =============================
  // ===================================]

  // Scroll to bottom on initial load
  useEffect(() => {
    if (containerRef.current && sortedMessages.length > 0) {

    }
  }, [sortedMessages]);


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
        <div className="flex items-center justify-center p-4 text-gray-700 gap-3">
          <span><div className="loader"></div></span>
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
      <div className="flex items-center justify-between p-3 shadow-sm sticky top-0 z-20"
        style={{
          background: 'var(--color-6)',
          borderBottom: '1px solid rgba(0,0,0,0.08)'
        }}>
        <div className="flex items-center gap-3">
          <HeaderArrow sidebarOpen={sidebarOpen} navigate={navigate} />
          <div onClick={() => navigate(`/profile/${receiver._id}`)} className="cursor-pointer relative">
            <ProfileAvatar user={receiver} size={48} />
            {onlineUsers.has(receiver._id) && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            )}
          </div>
          <div className="flex flex-col">
            <p className="font-semibold text-gray-900 text-sm">{receiver.username}</p>
            <span className="text-xs text-gray-500">{onlineUsers.has(receiver._id) ? "Online" : `Active ${moment(lastActive).fromNow()}`}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 relative">
          {/* Three-dot button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(true);
            }}

            className="p-2.5 rounded-full transition-all duration-200 hover:bg-black/5 active:scale-90 text-gray-600"
            aria-label="More options"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>

          {/* Dropdown */}
          {showMenu && (
            <>
              {/* click-outside overlay */}
              <div
                ref={showMenuRef}
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />


              <div
                className="fixed right-4 top-16 w-56 z-[100] overflow-hidden animate-in fade-in zoom-in duration-150 origin-top-right"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  borderRadius: "18px",
                  border: "1px solid rgba(255, 255, 255, 0.5)",
                  boxShadow:
                    "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div className="p-1.5 flex flex-col gap-1">

                  {/* ================= Appearance ================= */}
                  <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Appearance
                  </div>

                  <div className="rounded-xl hover:bg-white/40 transition-colors" onClick={(e) => e.stopPropagation()}>
                    <ThemeDropdown containerRef={chatContainerRef} />
                  </div>

                  <div className="h-[1px] bg-gray-200/50 my-1 mx-2" />

                  {/* ================= Chat Actions ================= */}
                  <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Chat
                  </div>

                  {/* View Profile */}
                  <button
                    onClick={() => {
                      navigate(`/profile/${receiver._id}`);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-white/40 rounded-xl transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    View Profile
                  </button>

                  {/* Search Chat */}
                  <button
                    onClick={() => {
                      // TODO: open search modal
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-white/40 rounded-xl transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    Search in Chat
                  </button>

                  {/* Clear Chat */}
                  <button
                    onClick={() => {
                      // TODO: clear messages logic
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-white/40 rounded-xl transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    Clear Chat
                  </button>

                  <div className="h-[1px] bg-gray-200/50 my-1 mx-2" />

                  {/* ================= Privacy & Safety ================= */}
                  <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Privacy
                  </div>

                  {/* Mute Notifications */}
                  <button
                    onClick={() => {
                      // TODO: mute logic
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-white/40 rounded-xl transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    Mute Notifications
                  </button>

                  {/* Block User */}
                  <button
                    onClick={() => {
                      setShowBlockConfirm(true);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50/50 rounded-xl transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Block User
                  </button>

                  {/* Report User */}
                  <button
                    onClick={() => {
                      // TODO: report logic
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50/50 rounded-xl transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    Report User
                  </button>


                </div>

              </div>
            </>
          )}

          {/* Block User Confirmation Dialog */}
          {showBlockConfirm && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/50 z-[90]"
                onClick={() => setShowBlockConfirm(false)}
              />
              {/* Confirmation Dialog */}
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-full max-w-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Block {receiver?.username || 'User'}?
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    This will clear your chat history and prevent this user from contacting you. You can unblock them later in settings.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowBlockConfirm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBlockUser}
                      disabled={blocking}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition disabled:opacity-50"
                    >
                      {blocking ? 'Blocking...' : 'Block User'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
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
      className="chatbox-wrapper flex flex-col w-full overflow-hidden bg-[var(--bg-main)]"
      style={{
        height: "100dvh", // Dynamic viewport height for mobile browsers
        maxHeight: "100dvh",
        minHeight: "100dvh",
      }}
    >



      <ChatboxHeader sidebarOpen={sidebarOpen} sidebarWidth={208}>
        {renderHeader()}
      </ChatboxHeader>
      <div
        ref={containerRef}
        className="flex-1 flex flex-col chatbox-wrapper 
          chatbox-messages bg-[var(--input-chatbox-bg-gradient)] overflow-y-auto"
        style={{
          background: "var(--input-chatbox-bg-gradient)",
          color: "var(--input-text-color)",
          paddingTop: "60px",
          paddingBottom: "100px",
          overflowY: "auto",
          WebkitOverflowY: "auto",
          overscrollBehavior: "contain",
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
                    const senderBg = "var(--input-bubble-sender, #ffffff)";
                    const receiverBg = "var(--input-bubble-receiver, #7c3aed)";

                    // Bubble content
                    if (type === "text") {
                      const bubbleWidth = [100, 160, 240, 120][Math.floor(Math.random() * 4)];
                      const bubbleHeight = [16, 24, 36][Math.floor(Math.random() * 3)];
                      content = (
                        <div
                          className={`shockwave rounded-xl ${isSender ? "rounded-br-none" : "rounded-bl-none"}`}
                          style={{ width: bubbleWidth + "px", height: bubbleHeight + "px", backgroundColor: isSender ? senderBg : receiverBg }}
                        />
                      );
                    } else if (type === "image") {
                      const imgWidth = [160, 200, 250][Math.floor(Math.random() * 3)];
                      const imgHeight = [120, 160][Math.floor(Math.random() * 2)];
                      content = (
                        <div
                          className="shockwave rounded-2xl"
                          style={{ width: imgWidth + "px", height: imgHeight + "px", backgroundColor: isSender ? senderBg : receiverBg }}
                        />
                      );
                    } else if (type === "audio") {
                      content = (
                        <div
                          className="flex items-center gap-2 px-4 py-2 rounded-full shockwave"
                          style={{ width: 180, height: 44, backgroundColor: isSender ? senderBg : receiverBg }}
                        >
                          <div className="w-5 h-5 rounded-full shimmer" />
                          <div className="flex-1 h-2 shimmer rounded" />
                          <div className="w-3 h-3 rounded-full shimmer" />
                        </div>
                      );
                    }

                    // Return the message bubble with Reply button
                    return (
                      <div key={idx} className={`flex ${isSender ? "justify-end" : "justify-start"} group relative`}>
                        {content}

                        {/* Reply button */}
                        <button
                          onClick={() => setReplyTo({ id: idx, text: type === "text" ? "Text message" : type === "image" ? "Image" : "Audio" })}
                          className="absolute -top-3 right-0 hidden group-hover:flex text-xs px-2 py-1 bg-white shadow rounded-full text-gray-600 hover:text-black"
                        >
                          Reply
                        </button>
                      </div>
                    );
                  })}
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
                setMessages={setMessages}
                chatId={chatId}
                scrollDirection={scrollDirection}
                scrollStopped={scrollStopped}
                containerRef={containerRef}
                user={user}
                resendMessage={resendMessage}
                imageMessages={imageMessages}
                setCurrentImageIndex={setCurrentImageIndex}
                setShowMediaViewer={setShowMediaViewer}
                formatTime={formatTime}
                typingUser={typingUser}
                typingUserFromId={typingUserFromId}
                scrollToBottom={scrollToBottom}
                scrollToMessage={scrollToMessage}
                scrollToReplyMessage={scrollToReplyMessage}
                showScrollButton={showScrollButton}
                setReplyTo={setReplyTo}
                receiver={receiver}
                inputRef={inputRef}

              />
            )
              :
              (
                // ❌ FETCH ERROR
                <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br 
              from-gray-100 to-gray-200 text-center px-6 animate-fadeIn">
                  <div className="bg-white p-8 rounded-2xl shadow-md max-w-sm w-full">
                    <div className="flex justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-red-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} > <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-2"> Unable to fetch your messages 😔
                    </h2>
                    <p className="text-sm text-gray-600 mb-6"> It seems there was a problem connecting to the server. Please check your internet connection or try refreshing this page. </p>
                    <button onClick={() => window.location.reload()}
                      className="bg-[var(--input-accent)] text-white px-6 py-2 rounded-full 
                      font-medium hover:opacity-90 transition-all btn" > 🔄 Retry </button>
                  </div>
                </div>
              )
        }

      </div >



      {/* Input — aligned to messages column (max-w-4xl) and fixed to bottom */}
      <ChatboxInput sidebarOpen={sidebarOpen} sidebarWidth={225}>
        {replyTo && (
          <div className="reply-bar">
            <div className="reply-bar-content">
              <div className="reply-bar-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 10h10a8 8 0 0 1 8 8v4M3 10l6 6M3 10l6-6" />
                </svg>
                Replying to {replyTo.from_user_id === user._id ? 'yourself' : (replyTo.name || 'message')}
              </div>
              <div className="reply-bar-text">
                {replyTo.text || (replyTo.message_type === 'image' ? '📷 Image' : replyTo.message_type === 'audio' ? '🎤 Audio' : 'Message')}
              </div>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="reply-bar-close"
              title="Close reply"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="input-container">
          {!recording && !audioURL && !(image instanceof File) && (
            <textarea
              ref={inputRef}
              id="chatInput"
              className="input-field"
              placeholder={placeholders[placeholderIndex] || ""}
              value={typeof text === "string" ? text : ""}
              rows={1}
              onFocus={() => setPlaceholderIndex(0)}
              onChange={(e) => {
                const val = e.target.value;
                setText(val);
                e.target.style.height = "auto";
                const newHeight = Math.min(e.target.scrollHeight, 100);
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

          {/* Image preview - displays above input controls */}
          {image instanceof File && (
            <div className="flex flex-wrap gap-3 pl-2">
              {image && (
                <div className="image-preview">
                  <img
                    src={URL.createObjectURL(image)}
                    alt="Selected"
                    style={{ maxWidth: "120px", maxHeight: "120px", borderRadius: "12px" }}
                  />
                  <button
                    onClick={() => setImage(null)}
                    className="image-preview-remove"
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Input controls - buttons and actions */}
          <div className="input-controls">
            {!recording && !audioURL && !(image instanceof File) && (
              <div className="input-group">
                <div className="relative">
                  {/* ATTACH MEDIA BUTTON */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowMediaDropdown(prev => !prev); }}
                    className="media-button"
                    title="Attach media"
                  >
                    <ImageUpIcon size={20} />
                  </button>

                  {/* MEDIA DROPDOWN - Fixed positioning with proper constraints */}
                  {showMediaDropdown && (
                    <div
                      ref={mediaDropdownRef}
                      className="media-dropdown"
                    >
                      {/* IMAGE INPUT */}
                      <label
                        htmlFor="image"
                        className="cursor-pointer"
                      >
                        <ImageIcon size={18} />
                        <span>Upload Image</span>
                      </label>

                      {/* FILE INPUT */}
                      <label
                        htmlFor="file"
                        className="cursor-pointer"
                      >
                        <FileIcon size={18} />
                        <span>Upload File</span>
                      </label>

                      {/* VIDEO INPUT */}
                      <label
                        htmlFor="video"
                        className="cursor-pointer"
                      >
                        <VideoIcon size={18} />
                        <span>Upload Video</span>
                      </label>
                    </div>
                  )}

                  {/* HIDDEN INPUTS */}
                  <input
                    ref={imageInputRef}
                    type="file"
                    id="image"
                    accept="image/*"
                    className="hidden"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      if (f instanceof File) setImage(f);
                      e.target.value = "";
                    }}
                  />

                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file"
                    className="hidden"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      if (f instanceof File) setImage(f);
                      e.target.value = "";
                    }}
                  />

                  <input
                    ref={videoInputRef}
                    type="file"
                    id="video"
                    accept="video/*"
                    className="hidden"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      if (f instanceof File) setImage(f);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
            )}

            {/* Image Composer - for editing before send */}
            {!recording && !audioURL && image instanceof File ? (
              <ImageComposer
                image={image}
                setImage={setImage}
                caption={text}
                setCaption={setText}
                onSend={sendMessage}
                sending={sending}
              />
            ) : null}

            {/* Recording / audio preview */}
            {(audioURL || recording) && (
              <div className="w-full">
                {audioURL ? (
                  <div className="relative inline-block w-full">
                    <AudioMessage msg={{ media_url: audioURL }} />
                    <button
                      onClick={() => setAudioURL(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition"
                      title="Cancel audio"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="recording-container">
                    {/* Left side - Lock button */}
                    <button
                      className="recording-lock"
                      title="Lock recording"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    </button>

                    {/* Center - Timer and Waveform */}
                    <div className="recording-center">
                      {/* Timer */}
                      <span className="recording-timer">
                        {Math.floor(recordTime / 60)}:{String(recordTime % 60).padStart(2, '0')}
                      </span>

                      {/* Waveform */}
                      <div className="recording-waveform">
                        <div className="wave-bar" />
                        <div className="wave-bar" />
                        <div className="wave-bar" />
                        <div className="wave-bar" />
                        <div className="wave-bar" />
                        <div className="wave-bar" />
                        <div className="wave-bar" />
                      </div>
                    </div>

                    {/* Right side - Delete, Pause, Send */}
                    <div className="recording-actions">
                      {/* Delete button */}
                      <button
                        onClick={() => {
                          stopRecording();
                          setRecording(false);
                          setRecordTime(0);
                        }}
                        className="recording-delete"
                        title="Cancel recording"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>

                      {/* Pause button */}
                      <button
                        onClick={togglePause}
                        className="recording-pause"
                        title={isPaused ? "Resume recording" : "Pause recording"}
                      >
                        {isPaused ? (
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                        )}
                      </button>

                      {/* Send button */}
                      <button
                        onClick={stopRecording}
                        className="recording-send"
                        title="Send voice message"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Send button (shows if text, image, or audio exist) */}
            {(!recording && (text?.trim() || image || audioURL)) && !(image instanceof File) && (
              <button
                onClick={() => { scrollToBottom(); sendMessage() }}
                className="send-button"
                title="Send message"
                disabled={sending}
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
                  <SendHorizonal size={20} />
                )}
              </button>
            )}

            {/* Record button (show only if nothing to send) */}
            {!recording && !text?.trim() && !image && !audioURL && (
              <button
                onClick={startRecording}
                className="record-button"
                title="Start voice recording"
              >
                <Mic size={18} />
              </button>
            )}
          </div>
        </div>
      </ChatboxInput>

    </div>
  );

}; export default ChatBox;
