import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, Maximize2, Image as ImageIcon, Mic, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePipModal } from "../context/PipModalContext";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/useSocket";
import ProfileAvatar from "./shared/ProfileAvatar";
import MediaViewer from "./shared/MediaViewer";
import ImagePreview from "./shared/ImagePreview";
import AudioMessage from "./shared/AudioMessage";
import axios from "../utils/axiosBase";
import { FaArrowDown } from "react-icons/fa";
import ChatMessagesSkeleton from "./skeleton/ChatMessagesSkeleton";
import "../styles/message.css";
import { useMessageSeen } from "../../MessageSeenContext";

const GlobalPipModal = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket } = useSocket();

    const {
        pipOpen, activeChatId, activeChatHistory, setActiveChatHistory,
        chatId, chatLoading, closePipModal,
    } = usePipModal();

    const hasOpenedRef = useRef(false);
    const modalRef = useRef(null);
    const scrollRef = useRef(null);
    const { clearUnreadForChat, getConvoByOtherUser } = useMessageSeen();
    useEffect(() => {
  if (!activeChatId) return;
  const convo = getConvoByOtherUser(activeChatId);
  if (convo?._id) {
    clearUnreadForChat(convo._id);
  }
}, [activeChatId]);

    const [activeUser, setActiveUser] = useState(null);
    const [expandedChatMessages, setExpandedChatMessages] = useState(new Set());

    const [draft, setDraft] = useState("");
    const [image, setImage] = useState(null);
    const [audioURL, setAudioURL] = useState(null);
    const [recording, setRecording] = useState(false);
    const [recordTime, setRecordTime] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0);
    const [audioStream, setAudioStream] = useState(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
    const [mediaInitialIndex, setMediaInitialIndex] = useState(0);
    const [chatImages, setChatImages] = useState([]);

    useEffect(() => {
        if (!activeChatId) return;
        setDraft("");
        setImage(null);
        setAudioURL(null);
        setRecording(false);
        setRecordTime(0);
        setAudioLevel(0);
        setAudioStream(null);
        setIsAtBottom(true);
        setMediaViewerOpen(false);
        setMediaInitialIndex(0);
        setChatImages([]);
        setExpandedChatMessages(new Set());
    }, [activeChatId]);

    // Stable render condition - prevents flicker
    const shouldRender = useMemo(() => pipOpen && !!activeChatId, [pipOpen, activeChatId]);

    // Position reset (only once when opening)
    useEffect(() => {
        if (shouldRender && !hasOpenedRef.current) {
            setPosition({ x: window.innerWidth - 400, y: 20 });
            hasOpenedRef.current = true;
        }
    }, [shouldRender]);

    // Fetch active user
    useEffect(() => {
        if (!activeChatId) return;
        axios.get(`/api/user/${activeChatId}`)
            .then(res => setActiveUser(res.data.user))
            .catch(() => {});
    }, [activeChatId]);

    const scrollToBottom = useCallback((smooth = true) => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: smooth ? "smooth" : "auto"
            });
        }
    }, []);

    useEffect(() => {
        if (shouldRender && isAtBottom) {
            requestAnimationFrame(() => scrollToBottom());
        }
    }, [activeChatHistory, shouldRender, isAtBottom, scrollToBottom]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            hasOpenedRef.current = false;
        };
    }, []);


    const [position, setPosition] = useState({ x: window.innerWidth - 380, y: window.innerHeight - 540 });
const isDragging = useRef(false);
const dragStartPos = useRef({ x: 0, y: 0 });

const MODAL_W = 360;
const MODAL_H = 500;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const handleMouseDown = useCallback((e) => {
    const tag = e.target.tagName;
    if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SVG' || tag === 'PATH') return;
    e.preventDefault();
    isDragging.current = true;
    dragStartPos.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
    };

    const handleMove = (moveEvent) => {
        if (!isDragging.current) return;
        const newX = clamp(
            moveEvent.clientX - dragStartPos.current.x,
            0,
            window.innerWidth - MODAL_W
        );
        const newY = clamp(
            moveEvent.clientY - dragStartPos.current.y,
            0,
            window.innerHeight - MODAL_H
        );
        setPosition({ x: newX, y: newY });
    };

    const handleUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
}, [position]);

// Touch support
const handleTouchStart = useCallback((e) => {
    const tag = e.target.tagName;
    if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA') return;
    const touch = e.touches[0];
    isDragging.current = true;
    dragStartPos.current = {
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
    };

    const handleTouchMove = (moveEvent) => {
        if (!isDragging.current) return;
        moveEvent.preventDefault();
        const t = moveEvent.touches[0];
        const newX = clamp(t.clientX - dragStartPos.current.x, 0, window.innerWidth - MODAL_W);
        const newY = clamp(t.clientY - dragStartPos.current.y, 0, window.innerHeight - MODAL_H);
        setPosition({ x: newX, y: newY });
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
}, [position]);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const atBottom = scrollTop + clientHeight >= scrollHeight - 30;
        setIsAtBottom(atBottom);
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

    const getDisplayChatText = (text, messageId) => {
        const CHARACTER_THRESHOLD = 100;
        if (!text || text.length <= CHARACTER_THRESHOLD) return text;
        if (expandedChatMessages.has(messageId)) return text;
        const truncated = text.substring(0, CHARACTER_THRESHOLD);
        const lastSpace = truncated.lastIndexOf(' ');
        return (lastSpace > -1 ? truncated.substring(0, lastSpace) : truncated) + '...';
    };

    const shouldShowReadMore = (text) => {
        const CHARACTER_THRESHOLD = 100;
        return text && text.length > CHARACTER_THRESHOLD;
    };

    // Send message
    const handleSend = async () => {
        if (!draft.trim() && !image && !audioURL) return;
        if (!activeChatId) return;

        const message_type = audioURL ? "audio" : image ? "image" : "text";
        const tempId = "temp_" + Date.now();

        const tempMsg = {
            _id: tempId,
            chatId,
            from_user_id: user?._id,
            to_user_id: activeChatId,
            text: draft,
            message_type,
            media_url: audioURL || (image ? URL.createObjectURL(image) : ""),
            createdAt: new Date().toISOString(),
            sending: true,
            status: "sending"
        };

        setActiveChatHistory(prev => [...prev, tempMsg]);

        try {
            const formData = new FormData();
            formData.append("chatId", chatId || "");
            formData.append("from_user_id", user?._id);
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

            requestAnimationFrame(() => scrollToBottom());
            setImage(null);
            setAudioURL(null);
            setDraft("");

            if (socket) {
                socket.emit("sendMessage", serverMsg);
            }
        } catch (err) {
            setActiveChatHistory(prev => prev.map(m => m._id === tempId ? { ...m, failed: true, status: "failed" } : m));
        }
    };

    // Audio recording
    const mediaRecorderRef = useRef(null);
    const recordTimerRef = useRef(null);
    const audioChunksRef = useRef([]);
    const MAX_RECORD_TIME = 60;

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setAudioStream(stream);
            setRecording(true);
            setRecordTime(0);
            setAudioLevel(0);

            const SUPPORTED_MIME = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4",          // Safari 14.1+
].find(t => MediaRecorder.isTypeSupported(t)) ?? "";

// If empty string, let the browser pick its own default — still works
const recorderOptions = SUPPORTED_MIME ? { mimeType: SUPPORTED_MIME } : {};
mediaRecorderRef.current = new MediaRecorder(stream, recorderOptions);
const mimeType = mediaRecorderRef.current.mimeType; // read the actual type back
console.log("🎙️ Recording with MIME:", mediaRecorderRef.current.mimeType);
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
                stream.getTracks().forEach(track => track.stop());
                setAudioStream(null);
            };

            mediaRecorderRef.current.start();

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

            const start = Date.now();
            recordTimerRef.current = setInterval(() => {
                const sec = Math.floor((Date.now() - start) / 1000);
                setRecordTime(sec);
                if (sec >= MAX_RECORD_TIME) {
                    mediaRecorderRef.current?.stop();
                }
            }, 500);
        } catch (err) {
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

if (!shouldRender) {
    hasOpenedRef.current = false;
    return null;
}

return (
    <>
        <div
    ref={modalRef}
    className="modal-glass"
    style={{
        position: "fixed",
        left: `${position.x}px`,   // ← left/top now, not right/bottom
        top: `${position.y}px`,
        width: `${MODAL_W}px`,
        height: `${MODAL_H}px`,
        zIndex: 99950,
        cursor: isDragging.current ? "grabbing" : "grab",
        display: "flex",
        flexDirection: "column",
        pointerEvents: "auto",
        userSelect: "none",        // ← prevents text selection while dragging
    }}
    onMouseDown={handleMouseDown}
    onTouchStart={handleTouchStart}
>
            {/* HEADER */}
            <div className="modal-glass-header">
                <div className="relative">
                    <ProfileAvatar user={activeUser} size={42} />
                </div>
                <p className="text-sm font-bold truncate">{activeUser?.username}</p>

                <button
                    onClick={() => {
                        navigate(`/chatbox/${activeChatId}`);
                        closePipModal();
                    }}
                    className="p-1 rounded-full hover:bg-gray-200 transition absolute right-13"
                    title="Maximize"
                >
                    <Maximize2 size={22} />
                </button>

                <button
                    onClick={closePipModal}
                    className="p-1 rounded-full hover:bg-red-100 transition absolute right-0"
                    title="Close"
                >
                    <X size={22} />
                </button>
            </div>

            {/* MESSAGES */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8f9fa]"
            >
                {chatLoading ? <ChatMessagesSkeleton /> : activeChatHistory?.map((msg, i) => (
                    <div key={msg._id || i} className={`flex flex-col ${msg.from_user_id === user?._id ? "items-end" : "items-start"}`}>
                        <div className={`${msg.message_type === "image" || msg.message_type === "audio" ? "px-1 py-1" : "px-3 py-2"} rounded-2xl text-sm max-w-[85%] ${msg.from_user_id === user?._id ? "bg-black text-white rounded-tr-none" : "bg-white border rounded-tl-none"}`}>
                            {msg.message_type === "text" && (
                                <div className="flex flex-col gap-1">
                                    <p>{getDisplayChatText(msg.text, msg._id)}</p>
                                    {shouldShowReadMore(msg.text) && (
                                        <button
                                            onClick={() => toggleChatMessageExpansion(msg._id)}
                                            className="flex items-center gap-1 text-xs font-semibold opacity-70 hover:opacity-100 transition-opacity mt-1"
                                            style={{ color: msg.from_user_id === user?._id ? 'rgba(255,255,255,0.9)' : 'var(--primary)' }}
                                        >
                                            {expandedChatMessages.has(msg._id) ? "Read less" : "Read more"}
                                        </button>
                                    )}
                                </div>
                            )}
                            {msg.message_type === "image" && (
                                <img
                                    src={msg.media_url}
                                    alt="sent"
                                    className="max-w-[260px] rounded-xl"
                                    onLoad={() => requestAnimationFrame(() => scrollToBottom(false))}
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

            {/* INPUT AREA */}
            <div className="p-3 bg-white border-t flex-shrink-0">
                {image && <ImagePreview file={image} onRemove={() => setImage(null)} />}
                <div className="flex items-center gap-2 px-3 py-2 rounded-full"
                    style={{
                        backgroundColor: "rgba(255,255,255,0.3)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                    }}
                >
                    {recording ? (
                        <div className="flex items-center gap-2 w-full px-1">
                            <span className="text-xs text-gray-600 w-14">{MAX_RECORD_TIME - recordTime}s left</span>
                            <input type="range" min="0" max="255" value={audioLevel} readOnly className="flex-1 h-1 accent-green-500"/>
                            <span className="text-xs text-red-500">Recording…</span>
                        </div>
                    ) : audioURL ? (
                        <div className="flex items-center gap-2 w-full">
                            <button onClick={() => setAudioURL(null)} className="p-1 rounded-full hover:bg-red-100 transition flex-1 text-center text-sm">Delete</button>
                            <button onClick={handleSend} className="p-1 rounded-full bg-green-100 hover:bg-green-200 transition flex-1 text-center text-sm">Send</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 w-full">
                            <input
                                value={draft}
                                disabled={recording}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder={recording ? "Recording voice…" : "Message..."}
                                className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-400"
                            />
                            <input type="file" accept="image/*" id="pipImageInput" hidden
                                onChange={(e) => { const f = e.target.files[0]; if (f) setImage(f); e.target.value = ""; }}
                            />
                            <button onClick={() => document.getElementById("pipImageInput").click()}
                                className="p-1 rounded-full hover:bg-gray-100 transition" title="Upload Image">
                                <ImageIcon size={20} />
                            </button>
                            <button onClick={recording ? stopRecording : startRecording}
                                className={`p-1 rounded-full transition ${audioURL ? "bg-green-100" : "hover:bg-gray-100"}`}
                                title={recording ? "Stop Recording" : "Record Audio"}>
                                <Mic size={20} />
                            </button>
                            <button onClick={handleSend}
                                disabled={!(draft.trim() || image || audioURL)}
                                className={`p-1 rounded-full transition ${draft.trim() || image || audioURL ? "text-black hover:bg-gray-200" : "text-gray-300 cursor-not-allowed"}`}>
                                <Send size={20} fill="currentColor" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Scroll to bottom */}
            {!isAtBottom && (
                <button
                    onClick={() => scrollToBottom(true)}
                    style={{
                        position: "absolute",
                        bottom: "80px", right: "20px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "8px", borderRadius: "50%",
                        backgroundColor: "rgba(255,255,255,0.9)",
                        backdropFilter: "blur(10px)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        cursor: "pointer", zIndex: 100,
                    }}
                >
                    <FaArrowDown size={16} />
                </button>
            )}
        </div>

        {mediaViewerOpen && (
            <MediaViewer
                post={{ attachments: chatImages }}
                initialIndex={mediaInitialIndex}
                onClose={() => setMediaViewerOpen(false)}
            />
        )}
    </>
);
};

export default GlobalPipModal;
