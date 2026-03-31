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

/**
 * GlobalPipModal - A floating, draggable chat window.
 *
 * Renders when pipOpen && activeChatId. Unmounts when either is falsy.
 * Outer div has pointer-events:none (via .pip-wrapper CSS) so background stays interactive.
 * Inner .modal-glass has pointer-events:auto so the PIP itself is clickable.
 */
const GlobalPipModal = () => {
    console.group("🏗️ [GlobalPipModal] Component Render");
    console.log("→ GlobalPipModal rendering at", new Date().toISOString());

    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket } = useSocket();

    const {
        pipOpen,
        activeChatId,
        activeChatHistory,
        setActiveChatHistory,
        chatId,
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
        mediaViewerOpen,
        setMediaViewerOpen,
        mediaInitialIndex,
        setMediaInitialIndex,
        chatImages,
        setChatImages,
        closePipModal,
    } = usePipModal();

    console.log("📋 Context state:", {
        pipOpen,
        activeChatId,
        activeChatHistoryLength: activeChatHistory?.length,
        chatId,
        chatLoading,
        draftLength: draft?.length,
        hasImage: !!image,
        hasAudioURL: !!audioURL,
        recording,
        isAtBottom,
    });

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

    // Active user info fetched from API
    const [activeUser, setActiveUser] = useState(null);

    // ─── MutationObserver: Log when PiP/modal elements are added to DOM ───
    useEffect(() => {
        console.log("🔬 [GlobalPipModal] Setting up MutationObserver for PiP/modal DOM changes");
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        const el = node;
                        const classList = el.className || "";
                        const id = el.id || "";
                        const tag = el.tagName?.toLowerCase() || "";
                        const text = (typeof classList === "string" ? classList : "") + " " + id;

                        if (/pip|modal|picture.in.picture/i.test(text)) {
                            console.group("🔬 [MutationObserver] PiP/Modal element added");
                            console.log("  Tag:", tag);
                            console.log("  ID:", id);
                            console.log("  Classes:", classList);
                            console.log("  Element:", el);
                            console.log("  Parent:", el.parentElement);
                            console.groupEnd();
                        }
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
        console.log("✅ MutationObserver active — watching for pip/modal/picture-in-picture elements");

        return () => {
            console.log("🔬 [MutationObserver] Disconnecting observer");
            observer.disconnect();
        };
    }, []);

    // Component mount/unmount logging
    useEffect(() => {
        console.log("🟢 [GlobalPipModal] Component MOUNTED");
        return () => {
            console.log("🔴 [GlobalPipModal] Component UNMOUNTED");
        };
    }, []);

    // Log conditional render check
    console.log("🔍 Conditional render check:", { pipOpen, activeChatId, willRender: !!(pipOpen && activeChatId) });

    // Fetch active user info when chat changes
    useEffect(() => {
        console.group("👤 [GlobalPipModal] Active user fetch effect");
        console.log("→ activeChatId changed:", activeChatId);
        if (activeChatId) {
            console.log("🌐 Fetching user info for:", activeChatId);
            axios.get(`/api/user/${activeChatId}`)
                .then(res => {
                    console.log("✅ Active user fetched:", res.data.user);
                    setActiveUser(res.data.user);
                })
                .catch(err => {
                    console.error("❌ Error fetching user:", err);
                });
        } else {
            console.log("⏭️ Skipping fetch — activeChatId is falsy");
        }
        console.groupEnd();
    }, [activeChatId]);

    // Toggle message expansion
    const toggleChatMessageExpansion = (messageId) => {
        console.log("📖 [GlobalPipModal] toggleChatMessageExpansion()", { messageId });
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
        console.group("🖱️ [GlobalPipModal] handleMouseDown()");
        const targetTag = e.target.tagName;
        const targetClass = e.target.className;
        console.log("  Target tag:", targetTag, "class:", targetClass);
        if (targetTag === 'BUTTON' || targetTag === 'INPUT' || targetTag === 'TEXTAREA') {
            console.log("  ⏭️ Skipping drag — target is interactive element");
            console.groupEnd();
            return;
        }
        console.log("  🟢 Starting drag");
        setIsDragging(true);
        dragStartPos.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
        console.log("  Drag start offset:", dragStartPos.current);
        console.groupEnd();
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
        console.log("🖱️ [GlobalPipModal] handleMouseUp() — drag ended");
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

    const scrollToBottom = (smooth = true) => {
        if (scrollRef.current) {
            console.log("📜 [GlobalPipModal] scrollToBottom()", { smooth, scrollHeight: scrollRef.current.scrollHeight });
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: smooth ? "smooth" : "auto",
            });
        } else {
            console.warn("⚠️ [GlobalPipModal] scrollToBottom() — scrollRef.current is null");
        }
    };

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const atBottom = scrollTop + clientHeight >= scrollHeight - 20;
        setIsAtBottom(atBottom);
    };

    // Auto-scroll when new messages arrive (only if user was at bottom)
    useEffect(() => {
        console.group("📜 [GlobalPipModal] Auto-scroll effect");
        console.log("  pipOpen:", pipOpen, "activeChatId:", activeChatId, "historyLength:", activeChatHistory.length, "isAtBottom:", isAtBottom);
        if (!pipOpen || !activeChatId || activeChatHistory.length === 0) {
            console.log("  ⏭️ Skipping scroll — conditions not met");
            console.groupEnd();
            return;
        }
        if (isAtBottom) {
            console.log("  📜 User at bottom — scrolling to bottom");
            requestAnimationFrame(() => scrollToBottom());
        } else {
            console.log("  ⏭️ User not at bottom — not auto-scrolling");
        }
        console.groupEnd();
    }, [activeChatHistory, pipOpen, activeChatId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Send message
    const handleSend = async () => {
        console.group("📤 [GlobalPipModal] handleSend()");
        console.log("→ Entering handleSend()");
        console.log("  draft:", draft?.substring(0, 50), "hasImage:", !!image, "hasAudioURL:", !!audioURL);
        console.log("  activeChatId:", activeChatId, "chatId:", chatId);

        if (!draft.trim() && !image && !audioURL) {
            console.log("  ⏭️ Early return — no content to send");
            console.groupEnd();
            return;
        }
        if (!activeChatId) {
            console.log("  ⏭️ Early return — no activeChatId");
            console.groupEnd();
            return;
        }

        const message_type = audioURL ? "audio" : image ? "image" : "text";
        const tempId = "temp_" + Date.now();
        console.log("  message_type:", message_type, "tempId:", tempId);

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
        console.log("  📋 Temp message created:", { _id: tempId, type: message_type });

        setActiveChatHistory(prev => [...prev, tempMsg]);
        console.log("  ✓ Added temp message to history");

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

            console.log("  🌐 Posting to /api/chat/message...");
            const res = await axios.post("/api/chat/message", formData, {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });
            console.log("  ✅ Message sent! Server response:", res.data);

            const serverMsg = res.data.message;
            setActiveChatHistory(prev => prev.map(m => m._id === tempId ? { ...serverMsg, status: "sent" } : m));
            console.log("  ✓ Replaced temp message with server message");

            requestAnimationFrame(() => scrollToBottom());
            setImage(null);
            setAudioURL(null);
            setDraft("");
            console.log("  ✓ Cleared draft/image/audio");

            sendSound.current.currentTime = 0;
            sendSound.current.play().catch(() => { });

            if (socket) {
                socket.emit("sendMessage", serverMsg);
                console.log("  ✓ Emitted sendMessage via socket");
            } else {
                console.warn("  ⚠️ Socket is null — cannot emit sendMessage");
            }
        } catch (err) {
            console.error("  ❌ Error sending message:", err);
            console.error("  Error message:", err.message);
            console.error("  Error response:", err.response?.data);
            setActiveChatHistory(prev => prev.map(m => m._id === tempId ? { ...m, failed: true, status: "failed" } : m));
            console.log("  ✓ Marked message as failed");
        }
        console.log("✅ handleSend() complete");
        console.groupEnd();
    };

    // Audio recording
    const startRecording = async () => {
        console.group("🎙️ [GlobalPipModal] startRecording()");
        console.log("→ Entering startRecording()");
        try {
            console.log("  🌐 Requesting microphone access...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log("  ✅ Microphone access granted");
            setAudioStream(stream);
            setRecording(true);
            setRecordTime(0);
            setAudioLevel(0);

            const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/wav";
            console.log("  📋 Using mimeType:", mimeType);
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                console.log("🎙️ [GlobalPipModal] MediaRecorder.onstop");
                const blob = new Blob(audioChunksRef.current, { type: mimeType });
                console.log("  📋 Audio blob size:", blob.size, "type:", blob.type);
                if (blob.size > 0) setAudioURL(URL.createObjectURL(blob));
                setRecording(false);
                setAudioLevel(0);
                stream.getTracks().forEach(track => track.stop());
                setAudioStream(null);
                console.log("  ✅ Recording stopped, audioURL set");
            };

            mediaRecorderRef.current.start();
            console.log("  🟢 MediaRecorder started");

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
                    console.log("  ⏰ Max record time reached — stopping");
                    mediaRecorderRef.current.stop();
                }
            }, 500);
        } catch (err) {
            console.error("  ❌ Mic error:", err);
            setRecording(false);
        }
        console.groupEnd();
    };

    const stopRecording = () => {
        console.log("🎙️ [GlobalPipModal] stopRecording()");
        mediaRecorderRef.current?.stop();
        clearInterval(recordTimerRef.current);
        setRecording(false);
        setAudioLevel(0);
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            setAudioStream(null);
        }
    };

    // Reset position near top-right when PIP opens
    useEffect(() => {
        console.group("📐 [GlobalPipModal] Position reset effect");
        console.log("  pipOpen:", pipOpen);
        if (pipOpen) {
            const newPos = {
                x: window.innerWidth - 360 - 39,
                y: 20,
            };
            console.log("  📐 Resetting position to:", newPos, "(window width:", window.innerWidth, ")");
            setPosition(newPos);
        }
        console.groupEnd();
    }, [pipOpen]);

    // Log final DOM state after render
    useEffect(() => {
        if (!pipOpen || !activeChatId) return;
        // Use a small delay to let the DOM update
        const timer = setTimeout(() => {
            console.group("🔍 [GlobalPipModal] Final DOM State Check");
            const pipWrapper = document.querySelector('.pip-wrapper');
            const modalGlass = document.querySelector('.modal-glass');
            console.log("  .pip-wrapper in DOM:", !!pipWrapper);
            console.log("  .modal-glass in DOM:", !!modalGlass);

            if (modalGlass) {
                const styles = window.getComputedStyle(modalGlass);
                console.log("  .modal-glass computed styles:");
                console.log("    display:", styles.display);
                console.log("    visibility:", styles.visibility);
                console.log("    opacity:", styles.opacity);
                console.log("    pointer-events:", styles.pointerEvents);
                console.log("    position:", styles.position);
                console.log("    zIndex:", styles.zIndex);
                console.log("    width:", styles.width);
                console.log("    height:", styles.height);
                console.log("    transform:", styles.transform);
            }

            if (pipWrapper) {
                const wrapperStyles = window.getComputedStyle(pipWrapper);
                console.log("  .pip-wrapper computed styles:");
                console.log("    display:", wrapperStyles.display);
                console.log("    visibility:", wrapperStyles.visibility);
                console.log("    pointer-events:", wrapperStyles.pointerEvents);
                console.log("    position:", wrapperStyles.position);
            }

            console.log("  modalRef.current:", modalRef.current);
            console.log("  scrollRef.current:", scrollRef.current);
            console.groupEnd();
        }, 100);

        return () => clearTimeout(timer);
    }, [pipOpen, activeChatId]);

    // Simple conditional rendering - if not open, render nothing
    if (!pipOpen || !activeChatId) {
        console.log("🚫 [GlobalPipModal] NOT RENDERING — pipOpen:", pipOpen, "activeChatId:", activeChatId);
        console.groupEnd(); // Component Render group
        return null;
    }

    console.log("🟢 [GlobalPipModal] RENDERING modal — pipOpen:", pipOpen, "activeChatId:", activeChatId);
    console.log("  Position:", position);
    console.log("  Active user:", activeUser);
    console.log("  Messages count:", activeChatHistory.length);
    console.log("  Modal ref exists:", !!modalRef.current);
    console.groupEnd(); // Component Render group

    return (
        /*
         * .pip-wrapper has pointer-events:none so all background elements
         * (sidebar, buttons, links, etc.) remain clickable.
         * Only the inner .modal-glass has pointer-events:auto.
         */
        <div className="pip-wrapper">
            {console.log("🎨 [GlobalPipModal] Rendering JSX — .pip-wrapper")}
            <div
                style={{
                    position: "fixed",
                    right: 20,
                    top: 0,
                    width: 360,
                    height: 500,
                    zIndex: 99950,
                }}
                ref={(el) => {
                    if (el) console.log("📦 [GlobalPipModal] Outer container mounted:", { width: 360, height: 500, zIndex: 99950 });
                }}
            >
                <div
                    ref={modalRef}
                    className="modal-glass"
                    style={{
                        position: "absolute",
                        left: position.x,
                        top: position.y,
                        cursor: isDragging ? "grabbing" : "grab",
                    }}
                    onMouseDown={handleMouseDown}
                >
                    <div className="modal-glass-header">
                        <div className="relative">
                            <ProfileAvatar user={activeUser} size={42} />
                        </div>
                        <p className="text-sm font-bold truncate">{activeUser?.username}</p>
                        <button
                            onClick={() => {
                                console.group("🔗 [GlobalPipModal] Maximize button clicked");
                                console.log("  Navigating to:", `/chatbox/${activeChatId}`);
                                console.log("  Calling closePipModal()...");
                                navigate(`/chatbox/${activeChatId}`);
                                closePipModal();
                                console.groupEnd();
                            }}
                            className="p-1 rounded-full hover:bg-gray-200 transition absolute right-13"
                            title="Maximize"
                        >
                            <Maximize2 size={22} />
                        </button>
                        <button
                            onClick={() => {
                                console.log("🛑 [GlobalPipModal] Close button clicked — calling closePipModal()");
                                closePipModal();
                            }}
                            className="p-1 rounded-full hover:bg-red-100 transition absolute right-0"
                            title="Close"
                        >
                            <X size={22} />
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
