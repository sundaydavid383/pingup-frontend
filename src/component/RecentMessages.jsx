import React, { useState, useEffect, useRef } from "react";
import { Image as ImageIcon, Mic, FileText, File, Send, X, Maximize2, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import axios from "../utils/axiosBase";
import { FaArrowDown } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/useSocket";
import { useMessageContext } from "../context/MessageContext";
import ProfileAvatar from "./shared/ProfileAvatar";
import RecentMessagesSkeleton from "./skeleton/RecentMessagesSkeleton";
import MediaViewer from "../component/shared/MediaViewer";
import ImagePreview from "../component/shared/ImagePreview";
import ChatMessagesSkeleton from "./skeleton/ChatMessagesSkeleton";
import "../styles/message.css";
import AudioMessage from "../component/shared/AudioMessage";

const RecentMessages = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadMap, setUnreadMap] = useState({});
  const [lastMessages, setLastMessages] = useState({});
  const [activeChatHistory, setActiveChatHistory] = useState([]); // Store full history for PiP


  const [image, setImage] = useState(null);
  const sendSound = useRef(new Audio("/sounds/send.mp3"));
  const receiveSound = useRef(new Audio("/sounds/receive.mp3"));
  const audioChunksRef = useRef([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [pipOpen, setPipOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [chatId, setChatId] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const [audioURL, setAudioURL] = useState(null);

  // recording and image 
  const mediaRecorderRef = useRef(null);
  const recordTimerRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioStream, setAudioStream] = useState(null);
  const [recordTime, setRecordTime] = useState(0);
  const MAX_RECORD_TIME = 60; // maximum record time in seconds



  // Media Viewer State

  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [mediaInitialIndex, setMediaInitialIndex] = useState(0);
  const [chatImages, setChatImages] = useState([]);

  // Read-more state for recent messages
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const [expandedChatMessages, setExpandedChatMessages] = useState(new Set());
  const CHARACTER_THRESHOLD = 200;

  const toggleMessageExpansion = (messageId) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const toggleChatMessageExpansion = (messageId) => {
    setExpandedChatMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const getDisplayText = (text, messageId) => {
    if (!text || text.length <= CHARACTER_THRESHOLD) return text;
    if (expandedMessages.has(messageId)) return text;
    return text.substring(0, CHARACTER_THRESHOLD) + "...";
  };

  const getDisplayChatText = (text, messageId) => {
    if (!text || text.length <= CHARACTER_THRESHOLD) return text;
    if (expandedChatMessages.has(messageId)) return text;
    return text.substring(0, CHARACTER_THRESHOLD) + "...";
  };

  const shouldShowReadMore = (text) => {
    return text && text.length > CHARACTER_THRESHOLD;
  };

  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const { unreadMessages, addUnread, clearUnread } = useMessageContext();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const processedMessages = useRef(new Set());
  const scrollRef = useRef(null);
  const lastMessage = activeChatHistory?.[activeChatHistory.length - 1];
  const sentByMe = lastMessage?.from_user_id === user._id;

  // 1. Auto-scroll PiP
  useEffect(() => {
    if (!pipOpen || !activeChatId || !lastMessage) return;

    // If I sent the message → ALWAYS scroll
    if (sentByMe) {
      requestAnimationFrame(() => {
        scrollToBottom();
      })
      return;
    }

    // If someone else sent it → scroll only if user is already near bottom
    if (isAtBottom) {
      requestAnimationFrame(() => {
        scrollToBottom();
      })
    }
  }, [activeChatHistory, pipOpen, activeChatId]);


  // 2. Fetch History when PiP Opens
  const fetchChatHistory = async (userId) => {
    try {
      setChatLoading(true);
      const res = await axios.get(
        `/api/chat/room?user1=${user._id}&user2=${userId}`
      );

      if (res.data?.room) setChatId(res.data.room._id);
      setActiveChatHistory(res.data?.messages || []);

      // ⬇️ force scroll after initial render
      requestAnimationFrame(() => {
        scrollToBottom(false);
      });
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setChatLoading(false);
    }
  };


  // 3. Initial Load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [connRes, msgRes] = await Promise.all([
          axios.get("api/user/connections"),
          axios.get("api/messages/last")
        ]);
        setConnections(connRes.data.data?.connections || connRes.data.data?.followers || []);
        if (msgRes.data.success) setLastMessages(msgRes.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // 4. Central Socket Listener (Updates both List and PiP)
  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (data) => {
      const { from_user_id, to_user_id, message } = data;
      const otherId = from_user_id === user._id ? to_user_id : from_user_id;

      // Update the recent list preview
      setLastMessages(prev => ({
        ...prev,
        [otherId]: { ...message, senderId: from_user_id }
      }));

      // If this is the active PiP, add to history
      if (otherId === activeChatId) {
        setActiveChatHistory(prev => [...prev, message]);
        socket.emit("markAsRead", { userId: otherId });
      } else if (from_user_id !== user._id) {
        addUnread(otherId, message);
      }
    };

    socket.on("newMessageAlert", handleIncoming);
    socket.on("newMessageNotification", handleIncoming);
    return () => {
      socket.off("newMessageAlert");
      socket.off("newMessageNotification");
    };
  }, [socket, activeChatId, user._id]);


  // scrolling logic
  const scrollToBottom = (smooth = true) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      })

    }
  }
  // 5. Send Message
  const handleSend = async () => {
    if (!draft.trim() && !image && !audioURL) return;
    if (!activeChatId) return;

    const message_type = audioURL ? "audio" : image ? "image" : "text";

    const tempId = "temp_" + Date.now();
    const tempMsg = {
      _id: tempId,
      chatId,
      from_user_id: user._id,
      to_user_id: activeChatId,
      text: draft,
      message_type,
      media_url: audioURL || (image ? URL.createObjectURL(image) : ""),
      createdAt: new Date().toISOString(),
      sending: true,
      status: "sending"
    };

    // Update UI immediately
    setActiveChatHistory(prev => [...prev, tempMsg]);
    setLastMessages(prev => ({ ...prev, [activeChatId]: tempMsg }));

    // Clear draft locally


    try {
      const formData = new FormData();
      formData.append("chatId", chatId || "");
      formData.append("from_user_id", user._id);
      formData.append("to_user_id", activeChatId);
      formData.append("text", draft);
      formData.append("tempId", tempId);

      if (image) formData.append("media", image, image.name);
      if (audioURL) {
        const blob = await fetch(audioURL).then(r => r.blob());
        const ext = blob.type === "audio/webm" ? "webm" : "mp3";
        formData.append("media", blob, `audio_${Date.now()}.${ext}`);
      }

      const res = await axios.post("/api/chat/message", formData, {
        headers: { Accept: "application/json" },
        withCredentials: true,
      });

      const serverMsg = res.data.message;
      setActiveChatHistory(prev => prev.map(m => m._id === tempId ? { ...serverMsg, status: "sent" } : m));
      setLastMessages(prev => ({ ...prev, [activeChatId]: { ...serverMsg, status: "sent" } }));

      // Reset media after send
      requestAnimationFrame(() => {
        scrollToBottom();
      })
      setImage(null);
      setAudioURL(null);
      setDraft("");

      // Play sound
      sendSound.current.currentTime = 0;
      sendSound.current.play().catch(() => { });

      // Emit via socket
      socket.emit("sendMessage", serverMsg);
    } catch (err) {
      console.error("Error sending message:", err);
      setActiveChatHistory(prev => prev.map(m => m._id === tempId ? { ...m, failed: true, status: "failed" } : m));
    }
  };


  // ========================= AUDIO RECORD ==========================
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream); // store stream to stop tracks later

      setRecording(true);
      setRecordTime(0);
      setAudioLevel(0);

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/wav";
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size > 0) setAudioURL(URL.createObjectURL(blob));
        setRecording(false);
        setAudioLevel(0);
        stream.getTracks().forEach(track => track.stop()); // stop mic
        setAudioStream(null);
      };

      mediaRecorderRef.current.start();

      // Live audio level
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const animate = () => {
        if (!recording) return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(avg);
        requestAnimationFrame(animate);
      };
      animate();

      // Timer
      const start = Date.now();
      recordTimerRef.current = setInterval(() => {
        const sec = Math.floor((Date.now() - start) / 1000);
        setRecordTime(sec);
        if (sec >= MAX_RECORD_TIME) mediaRecorderRef.current.stop();
      }, 500);
    } catch (err) {
      console.error("Mic error:", err);
      setRecording(false);
    }
  };


  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    clearInterval(recordTimerRef.current);
    setRecording(false);
    setAudioLevel(0);
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
  };



  const getStatusDisplay = (usr) => {
    if (onlineUsers.has(usr._id)) {
      return (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse" />
      );
    }

    return null;
  };



  const activeUser = connections.find(u => u._id === activeChatId);

  return (
    <>
      {connections.length > 0 && (
        <div className="w-full bg-white rounded-xl shadow-md p-0 m-0">
          <h3 className="font-semibold text-sm px-2 pt-2 mb-2">Recent Messages</h3>
          <div className="flex flex-col max-h-[60vh] overflow-y-auto no-scrollbar">
            {loading ? <RecentMessagesSkeleton /> : connections.map((usr) => {
              const last = lastMessages[usr._id];
              console.log("Last message for", usr.username, ":", last);
              const unread = unreadMessages[usr._id]?.length || 0;
              return (
                <div
                  key={usr._id}
                  onClick={() => {
                    setActiveChatId(usr._id);
                    setPipOpen(true);
                    fetchChatHistory(usr._id);
                    clearUnread(usr._id);
                  }}
                  className="flex gap-3 px-3 py-3 cursor-pointer rounded-lg transition-all duration-200 hover:bg-[var(--hover-subtle-bg)] hover:shadow-sm"

                >
                  {/* Profile Avatar */}
                  <ProfileAvatar user={usr} size={44} />

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    {/* Top row: username and timestamp */}
                    <div className="flex justify-between items-center">
                      <span
                        className="flex items-center gap-1 truncate text-xs min-w-0"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        @{usr.username}
                      </span>
                      {last && (
                        <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                          {moment(last.createdAt).format("h:mm A")}
                        </span>
                      )}
                    </div>

                    {/* Bottom row: last message + unread */}
                    <div className="flex justify-between -mt-3 items-center mt-1">
                      <span
                        className="flex items-center gap-1 truncate text-xs flex-col items-start"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {!last && "Click to chat"}

                        {last?.type === "text" && (
                          <div className="flex flex-col gap-0.5 w-full">
                            <span className="truncate w-full">{getDisplayText(last.text, last._id)}</span>
                            {shouldShowReadMore(last.text) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMessageExpansion(last._id);
                                }}
                                className="flex items-center gap-1 text-[10px] font-semibold opacity-70 hover:opacity-100 transition-opacity"
                                style={{ color: "var(--primary)" }}
                              >
                                {expandedMessages.has(last._id) ? (
                                  <>
                                    <ChevronUp size={12} />
                                    Less
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown size={12} />
                                    More
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}

                        {last?.type === "image" && (
                          <>
                            <ImageIcon size={12} />
                            <span>Photo</span>
                          </>
                        )}

                        {last?.type === "audio" && (
                          <>
                            <Mic size={12} />
                            <span>Voice message</span>
                          </>
                        )}

                        {last?.type === "file" && (
                          <>
                            <FileText size={12} />
                            <span>Document</span>
                          </>
                        )}
                      </span>


                      {unread > 0 && (
                        <span
                          className="flex items-center justify-center rounded-full w-5 h-5 text-[10px] font-bold"
                          style={{
                            background: "var(--primary)",
                            color: "var(--white)",
                          }}
                        >
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              );

            })}
          </div>

          {pipOpen && activeChatId && (
            <div className="modal-glass">
              <div className="modal-glass-header">


                <div className="relative"><ProfileAvatar user={activeUser} size={42} />
                  {getStatusDisplay(activeUser)}
                </div>
                <p className="text-sm font-bold truncate">{activeUser?.username}</p>
                <button
                  onClick={() => navigate(`/chatbox/${activeChatId}`)}
                  className="p-1 rounded-full hover:bg-gray-200 transition absolute right-8"
                  title="Maximize"
                >
                  <Maximize2 size={16} />
                </button>
                <button
                  onClick={() => setPipOpen(false)}
                  className="p-1 rounded-full hover:bg-red-100 transition absolute right-0"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div ref={scrollRef}
                onScroll={() => {
                  if (scrollRef.current) {
                    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
                    setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 10);
                  }
                }} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8f9fa]">
                {chatLoading ? <ChatMessagesSkeleton /> : activeChatHistory.map((msg, i) => (
                  <div key={msg._id || i} className={`flex flex-col ${msg.from_user_id === user._id ? "items-end" : "items-start"}`}>
                    <div className={` ${msg.message_type === "image" || msg.message_type === "audio" ? "px-1 py-1" : "px-3 py-2"} rounded-2xl text-sm max-w-[85%] ${msg.from_user_id === user._id ? "bg-black text-white rounded-tr-none" : "bg-white border rounded-tl-none"
                      }`}>
                      {msg.message_type === "text" && (
                        <div className="flex flex-col gap-1">
                          <p>{getDisplayChatText(msg.text, msg._id)}</p>
                          {shouldShowReadMore(msg.text) && (
                            <button
                              onClick={() => toggleChatMessageExpansion(msg._id)}
                              className="flex items-center gap-1 text-xs font-semibold opacity-70 hover:opacity-100 transition-opacity mt-1"
                              style={{ color: msg.from_user_id === user._id ? 'rgba(255, 255, 255, 0.9)' : 'var(--primary)' }}
                            >
                              {expandedChatMessages.has(msg._id) ? (
                                <>
                                  <ChevronUp size={12} />
                                  Read less
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={12} />
                                  Read more
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {msg.message_type === "image" && (
                        <img
                          src={msg.media_url}
                          alt="sent"
                          className="max-w-[260px] rounded-xl"
                          onLoad={() => {
                            requestAnimationFrame(() => {
                              scrollToBottom(false);
                            });
                          }}
                          onClick={() => {
                            const images = activeChatHistory
                              .filter(m => m.message_type === "image")
                              .map(m => m.media_url);

                            const index = images.findIndex(url => url === msg.media_url);
                            setChatImages(images);
                            setMediaInitialIndex(index);
                            setMediaViewerOpen(true);
                          }}
                        />
                      )}

                      {msg.message_type === "audio" && (
                        <AudioMessage msg={{ media_url: msg.media_url }} />

                      )}

                    </div>
                  </div>
                ))}
              </div>



              <div className="p-3 bg-white border-t">
                {/* Image Preview */}
                {image && (
                  <ImagePreview
                    file={image}
                    onRemove={() => setImage(null)}
                  />
                )}

                <div
                  className="flex  items-center gap-2 px-3 py-2 rounded-full"
                  style={{
                    borderRadius: "50px",
                    backgroundColor: "rgba(255, 255, 255, 0.3)", // translucent
                    backdropFilter: "blur(20px)",              // blur effect
                    WebkitBackdropFilter: "blur(20px)",
                  }}
                >
                  {recording ? (
                    <div className="mb-2 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-14">
                          {MAX_RECORD_TIME - recordTime}s left
                        </span>
                        <input
                          type="range"
                          min="0"
                          max="255"
                          value={audioLevel}
                          readOnly
                          className="flex-1 h-1 accent-green-500"
                        />
                        <span className="text-xs text-red-500">Recording…</span>
                      </div>
                    </div>
                  ) : audioURL ? (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        onClick={() => setAudioURL(null)}
                        className="p-1 rounded-full hover:bg-red-100 transition flex-1 text-center"
                      >
                        Delete
                      </button>
                      <button
                        onClick={handleSend}
                        className="p-1 rounded-full bg-green-100 hover:bg-green-200 transition flex-1 text-center"
                      >
                        Send
                      </button>
                    </div>
                  ) :
                    (<div className="flex items-center gap-2 w-full">

                      {/* Text Input */}
                      <input
                        value={draft}
                        disabled={recording}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder={recording ? "Recording voice…" : "Message..."}
                        className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-400"
                      />


                      {/* Image Upload */}
                      <input
                        type="file"
                        accept="image/*"
                        id="imageInput"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) setImage(file);
                          e.target.value = "";
                        }}
                      />
                      <button
                        onClick={() => document.getElementById("imageInput").click()}
                        className="p-1 rounded-full hover:bg-[var(--secondary)] transition"
                        title="Upload Image"
                      >
                        <ImageIcon size={24} />
                      </button>

                      {/* Record Audio */}
                      <button
                        onClick={recording ? stopRecording : startRecording}
                        className={`p-1 rounded-full transition ${audioURL ? "bg-green-100" : "hover:bg-[var(--secondary)]"}`}
                        title={recording ? "Stop Recording" : audioURL ? "Recorded" : "Record Audio"}
                      >
                        <Mic size={24} />
                      </button>



                      {/* Send Button */}
                      <button
                        onClick={handleSend}
                        disabled={!(draft.trim() || image || audioURL)}
                        className={`p-1 rounded-full transition ${draft.trim() || image || audioURL ? "text-black hover:bg-gray-200" : "text-gray-300 cursor-not-allowed"}`}
                      >
                        <Send size={24} fill="currentColor" />
                      </button>
                    </div>)}



                </div>
              </div>
            </div>
          )}

          {mediaViewerOpen && (
            <MediaViewer
              post={{
                attachments: chatImages,
              }}
              initialIndex={mediaInitialIndex}
              onClose={() => setMediaViewerOpen(false)}
            />
          )}
          {!isAtBottom && (
            <button
              onClick={() => {
                requestAnimationFrame(() => {
                  scrollToBottom();
                });
              }}
              className="fixed bottom-35 right-8 flex items-center justify-center w-8 h-8 rounded-full shadow-xl transition-all duration-300 z-50 cursor-pointer border border-white/40 hover:scale-110 active:scale-95 z-[999999]"
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                boxShadow: "0 20px 32px 0 rgba(31, 38, 135, 0.65)",
                border: "1px solid rgba(105, 105, 105, 0.58)",
              }}
            >
              <FaArrowDown size={10} className="text-gray-800 drop-shadow-sm" />
            </button>)
          }
        </div>
      )}
    </>
  )
}


export default RecentMessages;