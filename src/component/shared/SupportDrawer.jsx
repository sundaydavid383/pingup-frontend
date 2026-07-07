// component/shared/SupportDrawer.jsx
import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Minus, AlertTriangle, RotateCcw } from 'lucide-react';
import { useSupportChat as useSupportChatContext } from '../../context/SupportChatContext';
import { useSupportChat } from '../../hooks/useSupportChat';

const renderFormattedMessage = (content) => {
  if (!content) return null;

  const blocks = content.split(/\n{2,}/).filter(Boolean);

  return blocks.map((block, blockIndex) => {
    const lines = block.split('\n').filter(Boolean);

    return (
      <div key={blockIndex} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {lines.map((line, lineIndex) => (
          <div key={`${blockIndex}-${lineIndex}`} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
            {line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, partIndex) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={`${blockIndex}-${lineIndex}-${partIndex}`}>{part.slice(2, -2)}</strong>;
              }
              return <span key={`${blockIndex}-${lineIndex}-${partIndex}`}>{part}</span>;
            })}
          </div>
        ))}
      </div>
    );
  });
};

export default function SupportDrawer() {
  const { supportOpen, setSupportOpen } = useSupportChatContext();
  const { messages, status, errorMessage, send, resetError } = useSupportChat();
  const [input, setInput] = useState('');
  const [minimized, setMinimized] = useState(false);
  const [lastFailedText, setLastFailedText] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const sending = status === 'sending';
  const quotaExceeded = status === 'quota_exceeded';
  const hasError = status === 'error';

  useEffect(() => {
    if (!minimized) scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, minimized, status]);

  useEffect(() => {
    if (supportOpen && !minimized && !quotaExceeded) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [supportOpen, minimized, quotaExceeded]);

  const handleSend = () => {
    if (!input.trim() || sending || quotaExceeded) return;
    setLastFailedText(input);
    send(input);
    setInput('');
  };

  const handleRetry = () => {
    resetError();
    if (lastFailedText) send(lastFailedText);
  };

  if (!supportOpen) return null;

  return (
    <>
      <style>{`
        @keyframes scSlideIn { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes scSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes scBounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.35; } 40% { transform: translateY(-5px); opacity: 1; } }
        @keyframes scPulseGreen { 0%, 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.6); } 50% { box-shadow: 0 0 0 5px rgba(22,163,74,0); } }
        @keyframes scPulseAmber { 0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.5); } 50% { box-shadow: 0 0 0 4px rgba(245,158,11,0); } }
        .sc-drawer { animation: scSlideIn 0.3s cubic-bezier(0.34,1.2,0.64,1); }
        .sc-minimized-tab { animation: scSlideUp 0.25s cubic-bezier(0.34,1.2,0.64,1); }
        .sc-msg { animation: scSlideUp 0.2s ease; }
        .sc-messages::-webkit-scrollbar { width: 3px; }
        .sc-messages::-webkit-scrollbar-track { background: transparent; }
        .sc-messages::-webkit-scrollbar-thumb { background: var(--opaque-primary); border-radius: 4px; }
        .sc-input:focus { border-color: var(--primary-color) !important; }
        .sc-close-btn:hover { background: var(--opaque-primary) !important; color: var(--text-main) !important; }
        .sc-send-btn:not(:disabled):hover { opacity: 0.85; transform: scale(1.05); }
        .sc-online-dot { animation: scPulseGreen 2s ease infinite; }
        .sc-online-dot.sc-limited { animation: scPulseAmber 2s ease infinite; }
        .sc-retry-btn:hover { opacity: 0.8; }
      `}</style>

      {minimized ? (
        <div
          className="sc-minimized-tab"
          onClick={() => setMinimized(false)}
          style={{
            position: 'fixed', bottom: '80px', right: 0,
            background: 'var(--dark-indigo-gradient)',
            border: '1px solid var(--input-border)', borderRight: 'none',
            borderRadius: 'calc(var(--radius) * 1.2) 0 0 calc(var(--radius) * 1.2)',
            padding: '10px 14px 10px 12px', display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer', zIndex: 1300, boxShadow: '-4px 4px 16px rgba(0,0,0,0.3)',
            transition: 'var(--transition-default)',
          }}
        >
          <Sparkles size={15} color="var(--hover-light)" />
          <span style={{ color: 'var(--text-main)', fontSize: '12px', fontWeight: 600 }}>Support</span>
          {quotaExceeded && <AlertTriangle size={13} color="var(--warning)" />}
          {!quotaExceeded && messages.length > 0 && (
            <span style={{
              background: 'var(--success)', color: 'white', borderRadius: '999px',
              fontSize: '10px', fontWeight: 700, padding: '1px 6px', minWidth: '18px', textAlign: 'center',
            }}>
              {messages.filter(m => m.role === 'assistant').length}
            </span>
          )}
        </div>
      ) : (
        <>
          <div
            onClick={() => setSupportOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(3px)', zIndex: 1200 }}
            className="md:hidden"
          />

          <div
            className="sc-drawer"
            style={{
              position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: '440px', height: '100dvh',
              background: 'var(--form-bg)',
              backgroundImage: `radial-gradient(circle at 15% 0%, var(--ob-mesh-1), transparent 55%),
                                 radial-gradient(circle at 100% 100%, var(--ob-mesh-2), transparent 60%)`,
              backdropFilter: 'var(--backdrop-blur)', WebkitBackdropFilter: 'var(--backdrop-blur)',
              borderLeft: '1px solid var(--input-border)', boxShadow: '-12px 0 40px rgba(0,0,0,0.4)',
              display: 'flex', flexDirection: 'column', zIndex: 1300,
            }}
          >
            {/* Header */}
            <div style={{
              padding: '14px 16px', background: 'var(--dark-indigo-gradient)',
              borderBottom: '1px solid var(--opaque-primary)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0,
            }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%', background: 'var(--sf-chip-bg-on)',
                border: '2px solid var(--sf-chip-border-on)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Sparkles size={16} color="white" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '14px', letterSpacing: '0.01em' }}>
                  SpringsCircle Support
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                  <span
                    className={`sc-online-dot${quotaExceeded ? ' sc-limited' : ''}`}
                    style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: quotaExceeded ? 'var(--warning)' : 'var(--success)',
                      display: 'inline-block', flexShrink: 0,
                    }}
                  />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                    {quotaExceeded ? 'Limited · Voicebip AI' : 'Online · Powered by Voicebip AI'}
                  </span>
                </div>
              </div>
              <button onClick={() => setMinimized(true)} title="Minimize" className="sc-close-btn" style={iconBtnStyle}>
                <Minus size={15} strokeWidth={2} />
              </button>
              <button onClick={() => setSupportOpen(false)} title="Close" className="sc-close-btn" style={iconBtnStyle}>
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            {/* Messages */}
            <div className="sc-messages" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.length === 0 && !quotaExceeded && (
                <div style={{
                  background: 'var(--ob-niche-glow)', border: '1px solid var(--sf-chip-border-on)',
                  borderRadius: 'calc(var(--radius) * 1.2)', padding: '14px 16px', marginBottom: '6px',
                }}>
                  <p style={{ color: 'var(--text-main)', fontSize: '13px', fontWeight: 600, margin: '0 0 6px 0' }}>
                    Hi there! How can we help?
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', lineHeight: 1.65, margin: 0 }}>
                    Ask about connections, posts, goals, account settings, or anything else on SpringsCircle.
                  </p>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className="sc-msg" style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%',
                  display: 'flex', flexDirection: 'column', gap: '3px', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', paddingInline: '4px' }}>
                    {m.role === 'user' ? 'You' : 'Support'}
                  </span>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: m.role === 'user'
                      ? 'calc(var(--radius)*1.2) calc(var(--radius)*1.2) 2px calc(var(--radius)*1.2)'
                      : 'calc(var(--radius)*1.2) calc(var(--radius)*1.2) calc(var(--radius)*1.2) 2px',
                    fontSize: '13px', lineHeight: 1.6,
                    background: m.role === 'user' ? 'var(--sf-chip-bg-on)' : 'var(--white)',
                    color: m.role === 'user' ? 'white' : 'var(--text-dark)',
                    border: m.role === 'user' ? '1px solid var(--sf-chip-border-on)' : '1px solid rgba(255,255,255,0.18)',
                    backdropFilter: m.role === 'assistant' ? 'blur(6px)' : 'none',
                  }}>
                    {m.role === 'assistant' ? renderFormattedMessage(m.content) : m.content}
                  </div>
                </div>
              ))}

              {sending && (
                <div style={{
                  alignSelf: 'flex-start', display: 'flex', gap: '5px', padding: '10px 14px',
                  background: 'var(--glassy-white)', borderRadius: 'calc(var(--radius)*1.2) calc(var(--radius)*1.2) calc(var(--radius)*1.2) 2px',
                  border: '1px solid rgba(255,255,255,0.18)',
                }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-secondary)',
                      display: 'inline-block', animation: `scBounce 1.3s ease ${i * 0.18}s infinite`,
                    }} />
                  ))}
                </div>
              )}

              {hasError && (
                <div style={{
                  alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '88%',
                  padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)',
                  borderRadius: 'calc(var(--radius)*1.2)',
                }}>
                  <span style={{ color: 'var(--error)', fontSize: '12.5px', lineHeight: 1.5 }}>{errorMessage}</span>
                  <button className="sc-retry-btn" onClick={handleRetry} style={{
                    alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '5px',
                    background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)',
                    borderRadius: 'var(--radius)', padding: '4px 10px', fontSize: '11.5px', cursor: 'pointer',
                  }}>
                    <RotateCcw size={12} /> Retry
                  </button>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Quota banner — replaces the input entirely so nothing gets typed into a dead end */}
            {quotaExceeded ? (
              <div style={{
                padding: '14px 16px', borderTop: '1px solid var(--opaque-primary)',
                background: 'var(--deeper-opaque-secondary)', flexShrink: 0,
              }}>
                <div style={{
                  display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '10px 12px',
                  background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 'var(--radius)',
                }}>
                  <AlertTriangle size={15} color="var(--warning)" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '12px', lineHeight: 1.5 }}>
                    {errorMessage}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ padding: '12px 14px', borderTop: '1px solid var(--opaque-primary)', background: 'var(--deeper-opaque-secondary)', flexShrink: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)', borderRadius: 'calc(var(--radius) * 1.2)', padding: '4px 4px 4px 12px',
                }}>
                  <input
                    ref={inputRef}
                    className="sc-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Ask a question…"
                    disabled={sending}
                    style={{ flex: 1, border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '13px', outline: 'none', padding: '6px 0' }}
                  />
                  <button
                    className="sc-send-btn"
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    aria-label="Send"
                    style={{
                      border: 'none', background: 'var(--sf-chip-bg-on)', color: 'white', borderRadius: 'calc(var(--radius) * 1)',
                      width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
                      opacity: sending || !input.trim() ? 0.4 : 1, transition: 'var(--transition-default)', flexShrink: 0,
                    }}
                  >
                    <Send size={14} strokeWidth={2.5} />
                  </button>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '10.5px', textAlign: 'center', margin: '8px 0 0 0' }}>
                  Powered by Voicebip AI · SpringsCircle
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

const iconBtnStyle = {
  background: 'transparent', border: '1px solid transparent', color: 'var(--text-secondary)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '5px', borderRadius: 'var(--radius)', transition: 'var(--transition-default)',
};