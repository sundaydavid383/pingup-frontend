import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useMessageSeen } from '../../MessageSeenContext'; // Corrected import path
import ProfileAvatar from "../component/shared/ProfileAvatar";
import ThemeDropdown, { applyThemeVars, THEMES } from "../component/ThemeDropdown";
import "../component/themeDropdown.css";
import './chatbox.css'
import '../styles/chat-highlight.css'
import { useTheme } from "../context/ThemeContext";
import AudioMessage from "../component/shared/AudioMessage";
import ChatMessagesFull from "../component/ChatMessagesFull";
import ChatboxHeader from "../component/shared/ChatboxHeader";
import ChatboxInput from "../component/shared/ChatboxInput";
import HeaderArrow from "../component/shared/HeaderArrow";
import ImageComposer from "../component/shared/ImageComposer";
import { CallContext, CALL_TYPES } from "../context/CallContext";
import useCall from "../hooks/useCall";
import { Phone, Video, ImageUpIcon, Mic, SendHorizonal, ImageIcon, FileIcon, VideoIcon } from "lucide-react";
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/useSocket';
import axiosBase from "../utils/axiosBase";
import moment from "moment";
import toast from 'react-hot-toast';


const ChatBox = ({ userId: propUserId }) => {
  const { initiateCall: initiateCallFromContext, currentCall } = React.useContext(CallContext);
  const { initiateAudioCall, initiateVideoCall } = useCall();
  const [replyTo, setReplyTo] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const params = useParams();
  const navigate = useNavigate();
  const { user, sidebarOpen } = useAuth();
  const userId = propUserId || params.userId || user?._id;
  const { socket, connected, onlineUsers } = useSocket();

  const { 
    setLastSeenMessageForChat, 
    updateConversationLastMessage, 
    clearUnreadForChat, 
    getConvoByOtherUser, 
    setActiveChatId, 
    refetchConversations   
  } = useMessageSeen();


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
  const [lastActive, setLastActive] = useState(null)
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
  const { currentTheme, setCurrentTheme, THEME_KEY } = useTheme();
  const chatIdRef = useRef(null);

// ✅ ADD THIS — keep ref in sync whenever chatId changes
useEffect(() => {
    chatIdRef.current = chatId;
}, [chatId]);
  // Apply saved theme on mount to restore on page refresh
  useEffect(() => {
    if (chatContainerRef.current) {
      const savedTheme = localStorage.getItem(THEME_KEY) || "Default";
      applyThemeVars(THEMES[savedTheme]?.vars || THEMES.Default.vars, chatContainerRef.current);
    }
  }, [THEME_KEY]);

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
    }, 20000);
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
    console.log("📬 ChatBox: scrollToMessage called with", messageId);
    
    // Try first with getElementById (most reliable)
    let messageEl = document.getElementById(`msg_${messageId}`);
    
    // If not found, try with querySelector on container
    if (!messageEl && containerRef.current) {
      messageEl = containerRef.current.querySelector(`[data-message-id="${messageId}"]`);
    }
    
    if (messageEl) {
      messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a temporary highlight effect
      messageEl.classList.add('message-highlight');
      setTimeout(() => {
        messageEl.classList.remove('message-highlight');
      }, 2000);
      console.log("📬 ChatBox: Message found and scrolling to", messageId);
    } else {
      console.log("📬 ChatBox: Message element not found for", messageId);
    }
  };

  // Scroll to original message being replied to
  // If not in DOM, load older messages automatically
  const scrollToReplyMessage = useCallback(async (replyToMessage) => {
    if (!containerRef.current || !replyToMessage || !replyToMessage._id) return;

    console.log("📬 ChatBox: scrollToReplyMessage called with", replyToMessage._id);

    const replyId = replyToMessage._id;
    const container = containerRef.current;

    // First, check if the message is already in the DOM
    let messageEl = container.querySelector(`[data-message-id="${replyId}"]`) || document.getElementById(`msg_${replyId}`);

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
      const response = await axiosBase.get(`/api/chat/room?user1=${user?._id}&user2=${userId}&before=${oldestTimestamp}&limit=50`);

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
  }, [containerRef, messages, user?._id, userId]);

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


  useEffect(() => {
  if (!userId) return;
  setActiveChatId(userId); // tell context "this chat is open"
  return () => {
    setActiveChatId(null); // clear when leaving
  };
}, [userId, setActiveChatId]);

  // ===================== NEAR BOTTOM SCROLL DETECTION =====================
  // Ref to track if user is near bottom (used for scroll button visibility)
  const isUserNearBottomRef = useRef(true);
  // Ref to track if user is actively scrolling (to prevent auto-scroll bounce)
  const isUserScrollingRef = useRef(false);
  // Timeout ref for debouncing scroll stop
  const scrollActivityTimeoutRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const checkNearBottom = () => {
      // Use a smaller threshold - show button when user scrolls just a few pixels away
      // This ensures the button appears quickly when user scrolls up
      const threshold = 50; // pixels from bottom to consider "near"
      const scrollPosition = container.scrollTop + container.clientHeight;
      const scrollHeight = container.scrollHeight;

      // User is near bottom if they're within threshold of the bottom
      isUserNearBottomRef.current = scrollPosition >= scrollHeight - threshold;

      // Show scroll button when NOT near bottom (i.e., user has scrolled up)
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
      // Mark that user is actively scrolling
      isUserScrollingRef.current = true;
      
      // Clear any existing timeout
      if (scrollActivityTimeoutRef.current) {
        clearTimeout(scrollActivityTimeoutRef.current);
      }
      
      // Set a timeout to mark scrolling as stopped after user stops for 300ms
      scrollActivityTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 300);

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
      if (scrollActivityTimeoutRef.current) clearTimeout(scrollActivityTimeoutRef.current);
    };
  }, []);









  // eslint-disable-line //======================== FETCH RECEIVER + CHAT =========================== 
  useEffect(() => {
    if (!user || !userId) return;

    const fetchData = async () => {
       if (localStorage.getItem(`blocked_${userId}`) === 'true') {
        setLoading(false);
        return;
      }
      try {
        // Try to get cached chatId first as fallback
        const cachedChatId = localStorage.getItem(`chatId_${userId}`);
        if (cachedChatId) {
          setChatId(cachedChatId);
          clearUnreadForChat(cachedChatId);
        }

        const [receiverRes, chatRes] = await Promise.all([
          axiosBase.get(`/api/user/${userId}`),
          axiosBase.get(`/api/chat/room?user1=${user?._id}&user2=${userId}`),
        ]);

        setReceiver(receiverRes.data.user || null);
        setLastActive(receiverRes.data.user?.lastActiveAt || null);

        // REPLACE the entire doubled block with this clean version:
if (chatRes.data?.room) {
  const roomId = chatRes.data.room._id;
  setChatId(roomId);
  localStorage.setItem(`chatId_${userId}`, roomId);
  clearUnreadForChat(roomId);
  refetchConversations(); // ✅ re-sync sidebar counts from backend
}

      if (Array.isArray(chatRes.data?.messages)) {
          const newMessages = [...chatRes.data.messages];
          newMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          localStorage.setItem(`chat_history_${userId}`, JSON.stringify(newMessages));
          setMessages(newMessages);
      }

        // This is now handled by the intersection observer
        // clearUnread(userId);
      } catch (err) {
        console.error("❌ Error fetching chat:", err);
      }
    };

    fetchData();
    
  }, [user, userId]);





  // eslint-disable-line // =========================== SOCKET CONNECTION =========================== 
useEffect(() => {
    if (!socket || !user) return;

    const handleMessageRead = ({ messageId, reader }) => {
        setMessages((prev) =>
            prev.map((m) => (m._id === messageId ? { ...m, status: "seen" } : m))
        );
    };

    const handleReceiveMessage = (newMsg) => {
        setMessages(prev => {
            const tempIndex = prev.findIndex(m => m._id === newMsg.tempId);
            if (tempIndex !== -1) {
                const updated = [...prev];
                updated[tempIndex] = { ...newMsg, status: "delivered" };
                return updated;
            }
            if (prev.some(m => m._id === newMsg._id)) return prev;
            return [...prev, newMsg];
        });

        if (isUserNearBottomRef.current) {
            requestAnimationFrame(() => scrollToBottom());
        }
        receiveSound.current.currentTime = 0;
        receiveSound.current.play().catch(() => {});
    };

const handleTypingFrom = ({ from_user_id, chatId: typingChatId }) => {
    if (typingChatId && chatIdRef.current && 
        typingChatId.toString() !== chatIdRef.current.toString()) {
      return;
    }
    setTypingUser(true);
    setTypingUserFromId(from_user_id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
        setTypingUser(false);
        setTypingUserFromId(null);
    }, 2000);
};

    // ✅ Window event (from SocketContext global handler — receiver NOT in room)
    const handleNewMessageAlert = (e) => {
        const msg = e.detail?.message;
        if (!msg?._id) return;
        if (msg.chatId?.toString() !== chatIdRef.current?.toString()) return;
        handleReceiveMessage(msg);
    };

    // ✅ Direct socket event (receiver IS in room — this was missing!)
    const handleDirectReceiveMessage = (msg) => {
        if (!msg?._id) return;
        if (msg.chatId?.toString() !== chatIdRef.current?.toString()) return;
        // Don't process our own sent messages (already handled optimistically)
        if (msg.from_user_id === user._id) return;
        handleReceiveMessage(msg);
    };

    socket.on("typing", handleTypingFrom);
    socket.on("messageRead", handleMessageRead);
    socket.on("receiveMessage", handleDirectReceiveMessage); // ✅ ADD THIS BACK
    window.addEventListener("newMessageAlert", handleNewMessageAlert);

    return () => {
        socket.off("typing", handleTypingFrom);
        socket.off("messageRead", handleMessageRead);
        socket.off("receiveMessage", handleDirectReceiveMessage); // ✅ cleanup
        window.removeEventListener("newMessageAlert", handleNewMessageAlert);
    };
}, [socket, user]);
  // FIXED: Stable Online / Last Seen Status
  const getStatusText = useMemo(() => {
    if (!receiver) return "Loading...";

    // Priority 1: Real-time socket online status
    if (onlineUsers.has(receiver._id)) {
      return "Online";
    }

    // Priority 2: Last active timestamp
    if (!receiver.lastActiveAt) return "Offline";

    const lastSeen = new Date(receiver.lastActiveAt);
    const now = new Date();
    const diffMs = now - lastSeen;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    // Grace period to prevent flickering
    if (diffSecs < 90) {
      return "Online";
    }
    if (diffMins < 60) {
      return `Last seen ${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    }
    if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `Last seen ${hours} hour${hours > 1 ? 's' : ''} ago`;
    }

    return "Offline";
  }, [receiver, onlineUsers]);

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
      from_user_id: user?._id,
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
      formData.append("from_user_id", user?._id);
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
      
      // 🔴 CRITICAL: Update the conversation's lastMessage to trigger re-sort in Messages.jsx
      // This ensures the chat jumps to top immediately and the list re-sorts
      updateConversationLastMessage(chatId, serverMsg);
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
      formData.append("from_user_id", user?._id);
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

  // ======================== SEARCH IN CHAT ======================
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const handleSearchResultClick = (msg) => {
    // Close modal and clear search state
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
    
    // Scroll to the selected message with a small delay to ensure DOM is ready
    setTimeout(() => {
      scrollToMessage(msg._id);
    }, 100);
  };

  // ======================== CLEAR CHAT ======================
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const handleClearChat = async () => {
    console.log("📌 Clear Chat: starting...");
    setClearing(true);
    toast.loading("Clearing chat...", { id: "clearChat" });
    try {
      await axiosBase.delete(`/api/chat/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log("📌 Clear Chat: success");
      setMessages([]);
      localStorage.removeItem(`chat_history_${userId}`);
      setShowMenu(false);
      setShowClearConfirm(false);
      toast.success("Chat cleared successfully", { id: "clearChat" });
    } catch (err) {
      console.error("📌 Clear Chat: failed -", err.response?.data?.message || err.message);
      // Still clear locally even if API fails
      setMessages([]);
      localStorage.removeItem(`chat_history_${userId}`);
      setShowMenu(false);
      setShowClearConfirm(false);
      toast.error(err.response?.data?.message || "Failed to clear chat – please try again", { id: "clearChat" });
    } finally {
      setClearing(false);
    }
  };

  // ======================== MUTE NOTIFICATIONS ======================
  const [muting, setMuting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const handleMuteNotifications = async () => {
    setMuting(true);
    try {
      await axiosBase.post(`/api/chat/${chatId}/mute`, 
        { muted: !isMuted },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setIsMuted(!isMuted);
      setShowMenu(false);
      alert(isMuted ? "Notifications unmuted." : "Notifications muted for this chat.");
    } catch (err) {
      console.error("Error muting notifications:", err);
      alert("Failed to update notification settings.");
    } finally {
      setMuting(false);
    }
  };

  // ======================== REPORT USER ======================
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  
  const handleReportUser = async () => {
    if (!reportReason.trim()) {
      toast.error("Please select a reason for reporting");
      return;
    }
    console.log("📌 Report User: starting...");
    setReporting(true);
    toast.loading("Sending report...", { id: "reportUser" });
    try {
      await axiosBase.post(`/api/user/report/${receiver._id}`, 
        { reason: reportReason },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      console.log("📌 Report User: success");
      setShowMenu(false);
      setShowReportConfirm(false);
      setReportReason('');
      toast.success("Report sent. Thank you! We will review it.", { id: "reportUser" });
    } catch (err) {
      console.error("📌 Report User: failed -", err.response?.data?.message || err.message);
      setShowMenu(false);
      setShowReportConfirm(false);
      setReportReason('');
      toast.error(err.response?.data?.message || err.message || "Report failed", { id: "reportUser" });
    } finally {
      setReporting(false);
    }
  };

// ======================== BLOCK USER ======================
// Check if this user is already blocked on mount
const [isBlocked, setIsBlocked] = useState(() => {
  return localStorage.getItem(`blocked_${userId}`) === 'true';
});
useEffect(() => {
  if (!isBlocked || !userId || receiver) return;
  axiosBase.get(`/api/user/${userId}`)
    .then(res => setReceiver(res.data.user || null))
    .catch(() => {}); // silent fail — username display is optional
}, [isBlocked, userId, receiver]);

const handleBlockUser = async () => {
  const targetId = receiver?._id || userId;
  if (!targetId) return;


  const alreadyBlocked = isBlocked;
  const actionLabel = alreadyBlocked ? "Unblocking" : "Blocking";

  setBlocking(true);
  toast.loading(`${actionLabel} user...`, { id: "blockUser" });
  try {
    const res = await axiosBase.post(`/api/user/block/${targetId}`, {});
    const wasBlocked = res.data?.blocked; // true = now blocked, false = now unblocked

    if (wasBlocked) {
      // Just blocked — clear chat, set flag
      setMessages([]);
      localStorage.removeItem(`chat_history_${userId}`);
      localStorage.removeItem(`chatId_${userId}`);
      localStorage.setItem(`blocked_${userId}`, 'true');
      setIsBlocked(true);
      toast.success(`${receiver?.username || 'User'} has been blocked`, { id: "blockUser" });
      setShowMenu(false);
      setShowBlockConfirm(false);
      setTimeout(() => navigate(-1), 1500);
    } else {
      // Just unblocked — remove flag, allow chat to reload
      localStorage.removeItem(`blocked_${userId}`);
      setIsBlocked(false);
      toast.success(`${receiver?.username || 'User'} has been unblocked`, { id: "blockUser" });
      setShowMenu(false);
      setShowBlockConfirm(false);
      // Reload chat data now that user is unblocked
      window.location.reload();
    }
  } catch (err) {
    const isNetworkErr = !err?.response || err.code === 'ERR_NETWORK';
    setShowMenu(false);
    setShowBlockConfirm(false);
    toast.error(
      isNetworkErr
        ? "Could not connect to server. Please check your internet and try again."
        : err?.response?.data?.message || "Action failed. Please try again.",
      { id: "blockUser" }
    );
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
      // Let ChatMessagesFull handle initial scroll to last seen message
      // This ensures we scroll to the correct position after seenManager fetches last seen
      hasInitialScrolledRef.current = true;
    }
  }, [loading, sortedMessages.length]);

  // Auto-scroll to bottom when new messages are added\n  useEffect(() => {\n    if (containerRef.current && sortedMessages.length > 0) {\n      // Only auto-scroll if user is NOT actively scrolling - prevents bounce\n      if (isUserScrollingRef.current) {\n        return;\n      }\n      \n      const container = containerRef.current;\n      const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;\n      \n      if (isNearBottom) {\n        containerRef.current.scrollTo({\n          top: containerRef.current.scrollHeight,\n          behavior: "smooth"\n        });\n      }\n    }\n  }, [sortedMessages]);


  // //================disconnect user================
  // useEffect(() => {
  //   if (!socket || !user) return;

  //   socket.emit("userOnline", user._id);

  //   return () => {
  //     socket.emit("userOffline", user._id);
  //   };
  // }, [socket, user]);


  // ========================= LAST SEEN & ONLINE STATUS =========================
  // Format last seen properly - fix "Active a few seconds ago" bug
  const formatLastSeen = (lastActiveIso) => {
    if (!lastActiveIso) return "Online";
    
    const lastSeen = new Date(lastActiveIso);
    const now = new Date();
    const diffMs = now - lastSeen;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    // Only show "Active X ago" if within 5 minutes (prevent false "Active now")
    if (diffSecs < 60) {
      return "Online";
    } else if (diffMins < 60) {
      return `Last seen ${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `Last seen ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `Last seen ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffWeeks < 4) {
      return `Last seen ${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    } else {
      return `Last seen ${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    }
  };


  // Scroll to bottom on initial load
  useEffect(() => {
    if (containerRef.current && sortedMessages.length > 0) {

    }
  }, [sortedMessages]);

  //========================================RETURN HEADER
  //===========================================
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
            <span className="text-xs text-gray-500">{getStatusText}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 relative">
          {/* Audio Call Button - WhatsApp Style */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log("🎙️ Audio Call Button Clicked!");
              console.log("📋 Receiver Info:", receiver);
              if (receiver?._id) {
                console.log("✅ Calling audio to:", receiver._id, receiver.name);
                initiateAudioCall(receiver._id, receiver.name, receiver.profile_picture);
              } else {
                console.error("❌ No receiver ID found!");
              }
            }}
            className="p-2.5 rounded-full transition-all duration-200 hover:bg-green-100 active:scale-90 text-green-600"
            aria-label="Audio call"
            title="Voice call"
          >
            <Phone size={20} />
          </button>

          {/* Video Call Button - WhatsApp Style */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log("📹 Video Call Button Clicked!");
              console.log("📋 Receiver Info:", receiver);
              if (receiver?._id) {
                console.log("✅ Calling video to:", receiver._id, receiver.name);
                initiateVideoCall(receiver._id, receiver.name, receiver.profile_picture);
              } else {
                console.error("❌ No receiver ID found!");
              }
            }}
            className="p-2.5 rounded-full transition-all duration-200 hover:bg-green-100 active:scale-90 text-green-600"
            aria-label="Video call"
            title="Video call"
          >
            <Video size={20} />
          </button>

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
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />


              <div
                ref={showMenuRef}
                className="fixed right-4 top-16 w-56 z-[100] animate-in fade-in zoom-in duration-150 origin-top-right"

                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  borderRadius: "18px",
                  overflow: "visible",
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

                  <div 
                    onClick={(e) => e.stopPropagation()}
                    style={{ overflow: 'visible', position: 'static', pointerEvents: 'auto' }}
                  >
                    <div className="rounded-xl hover:bg-white/40 transition-colors inline-block">
                      <ThemeDropdown containerRef={chatContainerRef} />
                    </div>
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
                    <span className="w-2 h-2 rounded-full bg-[var(--primary-color)]" />
                    View Profile
                  </button>

                  {/* Search Chat */}
                  <button
                    onClick={() => {
                      setShowSearchModal(true);
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
                      setShowClearConfirm(true);
                      setShowMenu(false);
                    }}
                    disabled={clearing}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-white/40 rounded-xl transition disabled:opacity-50"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    {clearing ? 'Clearing...' : 'Clear Chat'}
                  </button>

                  <div className="h-[1px] bg-gray-200/50 my-1 mx-2" />

                  {/* ================= Privacy & Safety ================= */}
                  <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Privacy
                  </div>

                  {/* Mute Notifications */}
                  <button
                    onClick={handleMuteNotifications}
                    disabled={muting}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-white/40 rounded-xl transition disabled:opacity-50"
                  >
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    {muting ? 'Updating...' : isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                  </button>

                  {/* Block User */}
                  <button
                    onClick={() => {
                      setShowBlockConfirm(true);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50/50 rounded-xl transition"
                  >
                      <span className={`w-2 h-2 rounded-full ${isBlocked ? 'bg-orange-400' : 'bg-red-500'}`} />
                      {isBlocked ? 'Unblock User' : 'Block User'}
                  </button>

                  {/* Report User */}
                  <button
                    onClick={() => {
                      setShowReportConfirm(true);
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

{/* Block / Unblock User Confirmation Dialog */}
{showBlockConfirm && (
  <>
    <div
      className="fixed inset-0 bg-black/50 z-[90]"
      onClick={() => setShowBlockConfirm(false)}
    />
    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-full max-w-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {isBlocked
            ? `Unblock ${receiver?.username || 'User'}?`
            : `Block ${receiver?.username || 'User'}?`}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {isBlocked
            ? `Unblocking ${receiver?.username || 'this user'} will allow them to contact you again and restore your connection.`
            : `Blocking ${receiver?.username || 'this user'} will prevent them from contacting you. You can unblock them at any time.`}
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
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 ${
              isBlocked
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {blocking
              ? isBlocked ? 'Unblocking...' : 'Blocking...'
              : isBlocked ? 'Unblock User' : 'Block User'}
          </button>
        </div>
      </div>
    </div>
  </>
)}

          {/* Clear Chat Confirmation Dialog */}
          {showClearConfirm && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-[90]"
                onClick={() => setShowClearConfirm(false)}
              />
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-full max-w-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Clear Chat History?
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    This will permanently delete all messages in this conversation. This action cannot be undone.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleClearChat}
                      disabled={clearing}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition disabled:opacity-50"
                    >
                      {clearing ? 'Clearing...' : 'Clear Chat'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Report User Dialog */}
          {showReportConfirm && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-[90]"
                onClick={() => { setShowReportConfirm(false); setReportReason(''); }}
              />
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-full max-w-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Report {receiver?.username || 'User'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Why are you reporting this user?
                  </p>
                  <div className="space-y-2 mb-4">
                    {[
                      { id: 'spam', label: 'Spam or misleading' },
                      { id: 'harassment', label: 'Harassment or bullying' },
                      { id: 'inappropriate', label: 'Inappropriate content' },
                      { id: 'fake', label: 'Fake account' },
                      { id: 'other', label: 'Other' }
                    ].map((reason) => (
                      <label key={reason.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="radio"
                          name="reportReason"
                          value={reason.id}
                          checked={reportReason === reason.id}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="w-4 h-4 text-red-500"
                        />
                        <span className="text-sm text-gray-700">{reason.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => { setShowReportConfirm(false); setReportReason(''); }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReportUser}
                      disabled={reporting || !reportReason}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition disabled:opacity-50"
                    >
                      {reporting ? 'Reporting...' : 'Submit Report'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Search Chat Modal */}
          {showSearchModal && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-[90]"
                onClick={() => { setShowSearchModal(false); setSearchQuery(''); setSearchResults([]); }}
              />
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-4 mx-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Search in Chat
                  </h3>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSearchQuery(value);
                        if (value.trim()) {
                          const query = value.toLowerCase();
                          const results = messages.filter(msg =>
                            (msg.text || msg.message || '') && (msg.text || msg.message || '').toLowerCase().includes(query)
                          );
                          setSearchResults(results);
                        } else {
                          setSearchResults([]);
                        }
                      }}
                      placeholder="Search messages..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      autoFocus
                    />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {searchResults.map((msg, idx) => (
                        <div
                          key={msg._id || idx}
                          onClick={() => handleSearchResultClick(msg)}
                          className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        >
                          <p className="text-sm text-gray-700 truncate">{msg.text || msg.message || ''}</p>
                          <p className="text-xs text-gray-400">
                            {msg.from_user_id === user?._id ? 'You' : receiver?.username} • {moment(msg.createdAt).format('MMM D, h:mm A')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchQuery && searchResults.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No messages found</p>
                  )}
                  <button
                    onClick={() => { setShowSearchModal(false); setSearchQuery(''); setSearchResults([]); }}
                    className="mt-3 w-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

    );
  };


  // ============================= sidebar widht ==============
  // measurement using ResizeObserver  // -------------------------------
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
  // Fixed heights for header and input to ensure consistent layout
  const HEADER_HEIGHT = 60;
  const INPUT_HEIGHT = 90; // Account for input height + safe area insets + border radius

  // State to track visual viewport height (for mobile keyboard handling)
  // State to track visual viewport height (for mobile keyboard handling)
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateHeight = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    // Set initial height
    updateHeight();

    // Listen for visual viewport resize (mobile keyboard)
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateHeight);
    }

    // Fallback window resize
    window.addEventListener("resize", updateHeight);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateHeight);
      }
      window.removeEventListener("resize", updateHeight);
    };
  }, []);


  // Handle visual viewport changes (mobile keyboard appearance)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };

    // Also listen for window resize as fallback
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  

  return (
    <div
      ref={chatContainerRef}
      className="chatbox-container"
    >
      {/* Header - sticky at top within flex container */}
      {!showMediaViewer &&
         (
          <ChatboxHeader sidebarOpen={sidebarOpen} sidebarWidth={208}>
            {renderHeader()}
          </ChatboxHeader>
        )
      }

      {/* Messages Container - scrollable area between header and input */}
      <div
        ref={containerRef}
        className="chatbox-messages"
      >
        {
              isBlocked ?
              (  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
    <div className="bg-white p-8 rounded-2xl shadow-md max-w-sm w-full">
      <div className="flex justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">User Blocked</h2>
      <p className="text-sm text-gray-600 mb-6">
        You have blocked {receiver?.username || 'this user'}. Unblock them to resume chatting.
      </p>
      <button
        onClick={handleBlockUser}
        disabled={blocking}
        className="bg-orange-500 text-white px-6 py-2 rounded-full font-medium hover:bg-orange-600 transition-all disabled:opacity-50"
      >
        {blocking ? 'Unblocking...' : 'Unblock User'}
      </button>
    </div>
  </div>
) 
              :
                loading ?
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
                {/* Empty state - properly centered */}
                <div className="chat-empty-state"
                //  style={{ minHeight: 'calc(100vh - 150px)' }}
                >
                  <div className="bg-white/90 p-8 rounded-2xl shadow-md max-w-sm w-full">
                    <div className="flex justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-[var(--input-accent)] animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} > 
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m-1 7a9 9 0 110-18 9 9 0 010 18z" /> 
                      </svg>
                    </div> 
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                      No messages yet 💬
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Start a new conversation by sending your first message.
                    </p>
                    <button onClick={() => sendMessage("hello")}
                      className="bg-[var(--primary)] text-white px-6 py-2 rounded-full font-medium hover:opacity-90 transition-all" >
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
                currentImageIndex={currentImageIndex}
                setShowMediaViewer={setShowMediaViewer}
                showMediaViewer={showMediaViewer} 
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
      {/* Extra padding so last message isn't hidden under input */}
      <div className="h-24" aria-hidden="true"></div>
      </div >



      {/* Input — aligned to messages column (max-w-4xl) and fixed to bottom */}
      {!showMediaViewer && 
      <ChatboxInput sidebarOpen={sidebarOpen} sidebarWidth={225}>
        {replyTo && (
          <div className="reply-bar">
            <div className="reply-bar-content">
              <div className="reply-bar-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 10h10a8 8 0 0 1 8 8v4M3 10l6 6M3 10l6-6" />
                </svg>
                Replying to {replyTo.from_user_id === user?._id ? 'yourself' : (replyTo.name || 'message')}
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
                  socket.emit("typing", { chatId, from_user_id: user?._id });
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

            {/* Recording / audio preview - Part 6 Enhanced UI */}
            {(audioURL || recording) && (
              <div className="w-full">
                {audioURL ? (
                  /* Audio Preview with Send/Delete buttons */
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex-1">
                      <AudioMessage msg={{ media_url: audioURL }} />
                    </div>
                    {/* Delete button */}
                    <button
                      onClick={() => setAudioURL(null)}
                      className="flex items-center justify-center w-10 h-10 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition"
                      title="Delete recording"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                    {/* Send button */}
                    <button
                      onClick={() => { scrollToBottom(); sendMessage() }}
                      className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                      title="Send voice note"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  /* Active Recording UI - Part 6 Enhanced with big Stop button */
                  <div className="recording-container">
                    {/* Left side - Big Red Stop Button */}
                    <button
                      onClick={stopRecording}
                      className="recording-stop"
                      title="Stop recording"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                    </button>

                    {/* Center - Timer and Waveform */}
                    <div className="recording-center">
                      {/* Recording indicator */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs text-red-500 font-medium">
                          {isPaused ? 'PAUSED' : 'RECORDING'}
                        </span>
                      </div>
                      
                      {/* Timer */}
                      <span className="recording-timer">
                        {Math.floor(recordTime / 60)}:{String(recordTime % 60).padStart(2, '0')}
                      </span>

                      {/* Waveform */}
                      <div className="recording-waveform">
                        {[...Array(7)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`wave-bar ${isPaused ? 'paused' : 'active'}`}
                            style={{ animationDelay: `${i * 0.1}s` }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Right side - Pause, Delete */}
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
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>

                      {/* Pause/Resume button */}
                      <button
                        onClick={togglePause}
                        className="recording-pause"
                        title={isPaused ? "Resume recording" : "Pause recording"}
                      >
                        {isPaused ? (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                        )}
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
     }

    </div>
  );

}; export default ChatBox;



