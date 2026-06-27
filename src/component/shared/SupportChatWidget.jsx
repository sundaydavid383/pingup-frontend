import axiosBase from "../../utils/axiosBase";
// components/SupportChatWidget.jsx
import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
     const { data } = await axiosBase.post("/api/voicebip/chat", {
  message: userMsg.content,
  history: messages,
});
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: data.reply || data.message || 'Sorry, I could not get a response.',
        },
      ]);
    } catch (err) {
  console.error("Support Chat Error:", err);

  const errorMessage =
    err.response?.data?.error ||
    err.response?.data?.message ||
    err.message ||
    "Unable to contact the support assistant.";

  setMessages([
    ...newMessages,
    {
      role: "assistant",
      content: errorMessage,
    },
  ]);
} finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--dark-indigo-gradient)',
          color: 'var(--text-main)',
          border: '1px solid var(--input-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: open
            ? '0 0 0 6px var(--very-light-opaque-primary), 0 8px 24px var(--sf-glow)'
            : '0 6px 20px var(--sf-glow)',
          cursor: 'pointer',
          zIndex: 11100,
          transition: 'var(--transition-default)',
        }}
        aria-label="Open support chat"
      >
        {open ? <X size={22} strokeWidth={2} /> : <MessageCircle size={24} strokeWidth={2} />}
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '92px',
            right: '24px',
            width: '350px',
            height: '470px',
            background: 'var(--form-bg)',
            backdropFilter: 'var(--backdrop-blur)',
            WebkitBackdropFilter: 'var(--backdrop-blur)',
            border: '1px solid var(--input-border)',
            borderRadius: 'calc(var(--radius) * 1.6)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px var(--opaque-primary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 11100,
            animation: 'springsSupportFadeIn 0.22s ease',
          }}
        >
          <style>{`
            @keyframes springsSupportFadeIn {
              from { opacity: 0; transform: translateY(8px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          {/* Header */}
          <div
            style={{
              padding: '16px 18px',
              background: 'var(--dark-indigo-gradient)',
              borderBottom: '1px solid var(--opaque-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'var(--hover-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={16} color="var(--secondary)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '14.5px' }}>
                SpringsCircle Support
              </div>
              <div
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--success)',
                    boxShadow: '0 0 6px var(--success)',
                    display: 'inline-block',
                  }}
                />
                Online now
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {messages.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
                Ask me anything about SpringsCircle, connections, posts, goals, or your account.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius)',
                    fontSize: '13.5px',
                    lineHeight: 1.5,
                    background:
                      m.role === 'user' ? 'var(--hover-gradient)' : 'var(--glassy-white)',
                    color: m.role === 'user' ? 'var(--secondary)' : 'var(--text-dark)',
                    border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  color: 'var(--text-secondary)',
                  fontSize: '12.5px',
                  fontStyle: 'italic',
                }}
              >
                Typing…
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              borderTop: '1px solid var(--opaque-primary)',
              background: 'var(--input-bg)',
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a question…"
              style={{
                flex: 1,
                border: '1px solid var(--input-border)',
                background: 'transparent',
                color: 'var(--text-main)',
                borderRadius: 'var(--radius)',
                padding: '10px 13px',
                fontSize: '13.5px',
                outline: 'none',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              style={{
                border: 'none',
                background: 'var(--dark-indigo-gradient)',
                color: 'var(--text-main)',
                borderRadius: 'var(--radius)',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.5 : 1,
                transition: 'var(--transition-default)',
                flexShrink: 0,
              }}
            >
              <Send size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}