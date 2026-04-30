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
    const [position, setPosition] = useState({ x: 0, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });

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

    // Drag handlers
    const handleMouseDown = useCallback((e) => {
        const targetTag = e.target.tagName;
        if (targetTag === 'BUTTON' || targetTag === 'INPUT' || targetTag === 'TEXTAREA') {
            return;
        }
        setIsDragging(true);
        dragStartPos.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    }, [position]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        const newPos = {
            x: e.clientX - dragStartPos.current.x,
            y: e.clientY - dragStartPos.current.y
        };
        setPosition(newPos);
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

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
        <div className="pip-wrapper">
            <div style={{
                position: "fixed",
                right: "20px",
                top: "0",
                width: "360px",
                height: "500px",
                zIndex: 99950,
                pointerEvents: "none"
            }}>
                <div
                    ref={modalRef}
                    className="modal-glass"
                    style={{
                        position: "absolute",
                        left: position.x,
                        top: position.y,
                        cursor: isDragging ? "grabbing" : "grab",
                        pointerEvents: "auto"
                    }}
                    onMouseDown={handleMouseDown}
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
                                <div className={` ${msg.message_type === "image" || msg.message_type === "audio" ? "px-1 py-1" : "px-3 py-2"} rounded-2xl text-sm max-w-[85%] ${msg.from_user_id === user?._id ? "bg-black text-white rounded-tr-none" : "bg-white border rounded-tl-none"}`}>
                                    {msg.message_type === "text" && (
                                        <div className="flex flex-col gap-1">
                                            <p>{getDisplayChatText(msg.text, msg._id)}</p>
                                            {shouldShowReadMore(msg.text) && (
                                                <button
                                                    onClick={() => toggleChatMessageExpansion(msg._id)}
                                                    className="flex items-center gap-1 text-xs font-semibold opacity-70 hover:opacity-100 transition-opacity mt-1"
                                                    style={{ color: msg.from_user_id === user?._id ? 'rgba(255, 255, 255, 0.9)' : 'var(--primary)' }}
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
                                            onLoad={() => {
                                                requestAnimationFrame(() => scrollToBottom(false));
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

                    {/* INPUT AREA */}
                    <div className="p-3 bg-white border-t">
                        {image && (
                            <ImagePreview
                                file={image}
                                onRemove={() => setImage(null)}
                            />
                        )}

                        <div
                            className="flex items-center gap-2 px-3 py-2 rounded-full"
                            style={{
                                borderRadius: "50px",
                                backgroundColor: "rgba(255, 255, 255, 0.3)",
                                backdropFilter: "blur(20px)",
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

                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="pipImageInput"
                                        hidden
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) setImage(file);
                                            e.target.value = "";
                                        }}
                                    />
                                    <button
                                        onClick={() => document.getElementById("pipImageInput").click()}
                                        className="p-1 rounded-full hover:bg-[var(--secondary)] transition"
                                        title="Upload Image"
                                    >
                                        <ImageIcon size={24} />
                                    </button>

                                    <button
                                        onClick={recording ? stopRecording : startRecording}
                                        className={`p-1 rounded-full transition ${audioURL ? "bg-green-100" : "hover:bg-[var(--secondary)]"}`}
                                        title={recording ? "Stop Recording" : audioURL ? "Recorded" : "Record Audio"}
                                    >
                                        <Mic size={24} />
                                    </button>

                                    <button
                                        onClick={handleSend}
                                        disabled={!(draft.trim() || image || audioURL)}
                                        className={`p-1 rounded-full transition ${draft.trim() || image || audioURL ? "text-black hover:bg-gray-200" : "text-gray-300 cursor-not-allowed"}`}
                                    >
                                        <Send size={24} fill="currentColor" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Scroll to Bottom Button */}
                    {!isAtBottom && (
                        <button
                            onClick={() => scrollToBottom(true)}
                            className="scroll-to-bottom-btn"
                            style={{
                                position: "absolute",
                                bottom: "80px",
                                right: "20px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                padding: "10px 14px",
                                borderRadius: "50px",
                                backgroundColor: "rgba(255, 255, 255, 0.85)",
                                backdropFilter: "blur(10px)",
                                WebkitBackdropFilter: "blur(10px)",
                                boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                                color: "#111",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s ease-in-out",
                                zIndex: 100,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                            }}
                        >
                            <FaArrowDown size={18} strokeWidth={3} />
                        </button>
                    )}
                </div>

                {/* Media Viewer */}
                {mediaViewerOpen && (
                    <MediaViewer
                        post={{
                            attachments: chatImages,
                        }}
                        initialIndex={mediaInitialIndex}
                        onClose={() => setMediaViewerOpen(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default GlobalPipModal;
