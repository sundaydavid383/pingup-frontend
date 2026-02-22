import React, { useState, useRef, useEffect, useCallback } from "react";
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

const GlobalPipModal = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket } = useSocket();

    const {
        pipOpen,
        activeChatId,
        activeChatHistory,
        setActiveChatHistory,
        chatId,
        setChatId,
        draft,
        setDraft,
        image,
        setImage,
        audioURL,
        setAudioURL,
        recording,
        setRecording,
        recordTime,
        setRecordTime,
        audioLevel,
        setAudioLevel,
        audioStream,
        setAudioStream,
        isAtBottom,
        setIsAtBottom,
        chatLoading,
        setChatLoading,
        mediaViewerOpen,
        setMediaViewerOpen,
        mediaInitialIndex,
        setMediaInitialIndex,
        chatImages,
        setChatImages,
        closePipModal,
    } = usePipModal();

    // Draggable state
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const modalRef = useRef(null);
    const scrollRef = useRef(null);
    const sendSound = useRef(new Audio("/sounds/send.mp3"));
    const mediaRecorderRef = useRef(null);
    const recordTimerRef = useRef(null);
    const MAX_RECORD_TIME = 60;
    const audioChunksRef = useRef([]);

    // Expanded messages state
    const [expandedChatMessages, setExpandedChatMessages] = useState(new Set());
    const CHARACTER_THRESHOLD = 100;

    // Find active user from connections (we'll need to get this from context or props)
    const [activeUser, setActiveUser] = useState(null);

    // Fetch active user info
    useEffect(() => {
        if (activeChatId) {
            axios.get(`/api/user/${activeChatId}`)
                .then(res => setActiveUser(res.data.user))
                .catch(err => console.error("Error fetching user:", err));
        }
    }, [activeChatId]);

    // Get status display
    const getStatusDisplay = (usr) => {
        // This would need online status from socket - simplified for now
        return null;
    };

    // Toggle message expansion
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

    console.log("this are the dependancy data", {
        "activeChatHistory":activeChatHistory, "pipOpen":pipOpen, "activeChatId":activeChatId, "isAtBottom":isAtBottom, "user?._id":user?._id
    });

    const getDisplayChatText = (text, messageId) => {
        if (!text || text.length <= CHARACTER_THRESHOLD) return text;
        if (expandedChatMessages.has(messageId)) return text;
        const truncated = text.substring(0, CHARACTER_THRESHOLD);
        const lastSpace = truncated.lastIndexOf(' ');
        return (lastSpace > -1 ? truncated.substring(0, lastSpace) : truncated) + '...';
    };

    const shouldShowReadMore = (text) => {
        return text && text.length > CHARACTER_THRESHOLD;
    };

    // Drag handlers
    const handleMouseDown = useCallback((e) => {
        // Don't start dragging if clicking on buttons or input
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
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
        setPosition({
            x: e.clientX - dragStartPos.current.x,
            y: e.clientY - dragStartPos.current.y
        });
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Add global mouse event listeners
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

    // Scroll to bottom
    const scrollToBottom = (smooth = true) => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: smooth ? "smooth" : "auto",
            });
        }
    };

    // Handle scroll
    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 10);
        }
    };

    // Auto-scroll when new messages arrive
    useEffect(() => {
        if (!pipOpen || !activeChatId || activeChatHistory.length === 0) return;

        const lastMessage = activeChatHistory[activeChatHistory.length - 1];
        const sentByMe = lastMessage?.from_user_id === user?._id;

        if (sentByMe) {
            requestAnimationFrame(() => scrollToBottom());
        } else if (isAtBottom) {
            requestAnimationFrame(() => scrollToBottom());
        }
    }, [activeChatHistory, pipOpen, activeChatId, isAtBottom, user?._id]);

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

            sendSound.current.currentTime = 0;
            sendSound.current.play().catch(() => { });

            if (socket) socket.emit("sendMessage", serverMsg);
        } catch (err) {
            console.error("Error sending message:", err);
            setActiveChatHistory(prev => prev.map(m => m._id === tempId ? { ...m, failed: true, status: "failed" } : m));
        }
    };

    // Audio recording
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

    if (!pipOpen || !activeChatId) return null;

    return (
        <>
            <div
                ref={modalRef}
                className="modal-glass"
                style={{
                    position: 'fixed',
                    bottom: position.y > 0 ? 'auto' : '1.5rem',
                    right: position.x !== 0 ? 'auto' : '1.5rem',
                    left: position.x !== 0 ? `${position.x}px` : 'auto',
                    top: position.y > 0 ? `${position.y}px` : 'auto',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    transform: 'translate(0, 0)',
                }}
                onMouseDown={handleMouseDown}
            >
                <div className="modal-glass-header">
                    <div className="relative">
                        <ProfileAvatar user={activeUser} size={42} />
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
                        onClick={closePipModal}
                        className="p-1 rounded-full hover:bg-red-100 transition absolute right-0"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8f9fa]"
                >
                    {chatLoading ? <ChatMessagesSkeleton /> : activeChatHistory.map((msg, i) => (
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
                                                {expandedChatMessages.has(msg._id) ? (
                                                    <>Read less</>
                                                ) : (
                                                    <>Read more</>
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
            </div>

            {/* Scroll to bottom button */}
            {!isAtBottom && (
                <button
                    onClick={() => {
                        requestAnimationFrame(() => scrollToBottom());
                    }}
                    className="fixed bottom-35 right-8 flex items-center justify-center w-8 h-8 rounded-full shadow-xl transition-all duration-300 z-50 cursor-pointer border border-white/40 hover:scale-110 active:scale-95"
                    style={{
                        background: "rgba(255, 255, 255, 0.2)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        boxShadow: "0 20px 32px 0 rgba(31, 38, 135, 0.65)",
                        border: "1px solid rgba(105, 105, 105, 0.58)",
                    }}
                >
                    <FaArrowDown size={10} className="text-gray-800 drop-shadow-sm" />
                </button>
            )}

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
        </>
    );
};

export default GlobalPipModal;
