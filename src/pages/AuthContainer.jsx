import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import assets from "../assets/assets";
import SignUpForm from "../component/SignUpForm";
import LoginForm from "../component/LoginForm";
import { useAuth } from "../context/AuthContext";
import CustomAlert from "../component/shared/CustomAlert";
import Loading from "../component/shared/Loading";
import "../styles/authcontainer.css";

const AuthContainer = ({ initialError, initialTab = 'login', onClose, isModal = false }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(initialTab || location.state?.activeTab || "login");
  const [alert, setAlert] = useState({ show: false, message: "", type: "error" });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // ✅ This is the ONE function passed down to LoginForm and SignUpForm
  const showAlert = (message, type = "error") => {
    setAlert({ show: true, message, type });
  };

  useEffect(() => {
    if (!initialError) return;
    setAlert({ show: true, message: initialError, type: "error" });
    const timer = setTimeout(() => {
      setAlert({ show: false, message: "", type: "error" });
      window.history.replaceState({}, "", "/");
    }, 3000);
    return () => clearTimeout(timer);
  }, [initialError]);

  const AnimatedChatPreview = () => {
    const [visibleMessages, setVisibleMessages] = useState([]);
    const chatMessages = [
      { id: 1, text: "Good morning! Who's staying accountable with their goals today? 🙌", isMine: false, time: "11:42" },
      { id: 2, text: "Just finished my morning routine. Feeling great! 🔥", isMine: true, time: "11:43" },
      { id: 3, text: "Let's keep each other on track this week. Check-in at 8pm?", isMine: false, time: "11:44" },
      { id: 4, text: "I'm in! See you all there 👏", isMine: true, time: "11:45" },
    ];
    useEffect(() => {
      let timeout;
      const showNext = (index) => {
        if (index >= chatMessages.length) return;
        setVisibleMessages((prev) => [...prev, chatMessages[index]]);
        timeout = setTimeout(() => showNext(index + 1), 1100);
      };
      timeout = setTimeout(() => showNext(0), 600);
      return () => clearTimeout(timeout);
    }, []);
    return (
      <div className="ac-chat-preview">
        <div className="ac-chat-card">
          <div className="ac-chat-header">
            <img src={assets.logo} alt="SpringsCircle Logo" className="ac-chat-logo" />
            <div className="ac-chat-header-text">
              <div className="ac-chat-name">SpringsCircle</div>
              <div className="ac-chat-status"><span className="ac-chat-dot" />online</div>
            </div>
          </div>
          <div className="ac-chat-body">
            {visibleMessages.map((msg) => (
              <div key={msg.id} className={`ac-msg-row ${msg.isMine ? "ac-msg-mine" : "ac-msg-theirs"}`}>
                <div className={`ac-bubble ${msg.isMine ? "ac-bubble-mine" : "ac-bubble-theirs"}`}>
                  {msg.text}
                  <div className="ac-bubble-time">{msg.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const SocialLoginSection = () => {
    const handleGoogleLogin = () => {
      sessionStorage.setItem("oauth_loading", "true");
      sessionStorage.setItem("oauth_text", "Connecting to Google…");
      window.location.href = `${import.meta.env.VITE_SERVER}api/auth/google/login?origin=${window.location.origin}`;
    };
    return (
      <div className="ac-social-section">
        <div className="ac-social-divider">
          <span className="ac-social-line" />
          <span className="ac-social-label">or continue with</span>
          <span className="ac-social-line" />
        </div>
        <button onClick={handleGoogleLogin} className="ac-google-btn" title="Sign in with Google">
          <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" className="ac-google-icon" />
          <span>Google</span>
        </button>
      </div>
    );
  };

  const TabSwitcher = ({ light = false }) => (
    <div className={`ac-tabs ${light ? "ac-tabs-light" : "ac-tabs-dark"}`}>
      <button onClick={() => setActiveTab("login")} className={`ac-tab ${activeTab === "login" ? "ac-tab-active" : ""}`}>
        Log in
      </button>
      <button onClick={() => setActiveTab("signup")} className={`ac-tab ${activeTab === "signup" ? "ac-tab-active" : ""}`}>
        Sign up
      </button>
      <div className={`ac-tab-indicator ${activeTab === "signup" ? "ac-tab-indicator-right" : ""}`} />
    </div>
  );

  return (
    <>
      {/* ✅ THE ONLY CustomAlert for the entire auth flow */}
      {alert.show && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ show: false, message: "", type: "error" })}
        />
      )}

      <div className={isModal ? "ac-modal-mode" : "ac-page-mode"}>
        {isModal ? (
          <div className="ac-modal-inner">
            <div className="ac-modal-header">
              <div className="ac-modal-brand">
                <div className="ac-modal-brand-icon">
                  <img src={assets.logo} alt="Logo" className="ac-modal-logo" />
                </div>
                <div>
                  <div className="ac-modal-brand-name">SpringsCircle</div>
                  <div className="ac-modal-brand-sub">Connect • Grow • Stay Accountable</div>
                </div>
              </div>
            </div>

            <TabSwitcher />

            <div className="ac-form-area">
              {/* ✅ showAlert passed as prop — no CustomAlert inside these components anymore */}
              {activeTab === "login" && (
                <LoginForm onSwitchToSignUp={() => setActiveTab("signup")} showAlert={showAlert} />
              )}
              {activeTab === "signup" && (
                <SignUpForm onSwitchToLogin={() => setActiveTab("login")} showAlert={showAlert} />
              )}
            </div>

            <SocialLoginSection />
          </div>
        ) : (
          <>
            <div className="ac-hero">
              <div className="ac-hero-inner">
                <div className="ac-hero-left">
                  <div className="ac-hero-brand">
                    <img src={assets.logo} alt="SpringsCircle Logo" className="ac-hero-logo" />
                    <div>
                      <h2 className="ac-hero-brand-name">SpringsCircle</h2>
                      <p className="ac-hero-brand-sub">Connect • Grow • Stay Accountable</p>
                    </div>
                  </div>
                  <h1 className="ac-hero-headline">Stay accountable.<br />Grow together.</h1>
                  <p className="ac-hero-copy">A private space to connect, share, encourage one another, and walk with real accountability.</p>
                  <div className="ac-hero-badges">
                    <span className="ac-hero-badge"><span className="ac-hero-badge-dot" />End-to-end encrypted</span>
                    <span className="ac-hero-badge"><span className="ac-hero-badge-dot" />Purpose-first community</span>
                    <span className="ac-hero-badge"><span className="ac-hero-badge-dot" />Real accountability</span>
                  </div>
                </div>
                <div className="ac-hero-right">
                  <AnimatedChatPreview />
                </div>
              </div>
            </div>

            <div className="ac-form-section">
              <div className="ac-form-section-inner">
                <div className="ac-form-section-brand">
                  <img src={assets.logo} alt="Logo" className="ac-form-section-logo" />
                  <h2 className="ac-form-section-title">Welcome to SpringsCircle</h2>
                  <p className="ac-form-section-sub">Connect with purpose. Grow with accountability.</p>
                </div>
                <div className="ac-form-card">
                  <TabSwitcher light />
                  <div className="ac-form-area">
                    {activeTab === "login" && (
                      <LoginForm onSwitchToSignUp={() => setActiveTab("signup")} showAlert={showAlert} />
                    )}
                    {activeTab === "signup" && (
                      <SignUpForm onSwitchToLogin={() => setActiveTab("login")} showAlert={showAlert} />
                    )}
                  </div>
                  <SocialLoginSection />
                </div>
                <p className="ac-form-footer-note">Your conversations are private • Secure • Purpose-focused</p>
              </div>
            </div>
          </>
        )}
        {loading && <Loading text="Connecting…" />}
      </div>
    </>
  );
};

export default AuthContainer;