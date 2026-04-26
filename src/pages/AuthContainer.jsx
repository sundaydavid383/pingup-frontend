import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import assets from "../assets/assets";
import SignUpForm from "../component/SignUpForm";
import LoginForm from "../component/LoginForm";
import { useAuth } from "../context/AuthContext";
import CustomAlert from "../component/shared/CustomAlert";
import Loading from "../component/shared/Loading";

const AuthContainer = ({ initialError, initialTab = 'login', onClose, isModal = false }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(initialTab || location.state?.activeTab || "login");
  const [error, setError] = useState(initialError || null);
  const [alert, setAlert] = useState({ show: false, message: "", type: "error" });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const primary = "var(--primary)";

  useEffect(() => {
    if (!initialError) return;
    const timer = setTimeout(() => {
      setError(null);
      window.history.replaceState({}, "", "/");
    }, 3000);
  }, [initialError]);

  // ======================== WHATSAPP-STYLE ANIMATED CHAT PREVIEW ========================
  const AnimatedChatPreview = () => {
    const [visibleMessages, setVisibleMessages] = useState([]);

    const chatMessages = [
      {
        id: 1,
        text: "Good morning family! Who’s staying accountable with their devotion today? 🙌",
        isMine: false,
        time: "11:42",
      },
      {
        id: 2,
        text: "Just finished mine. Psalm 23 really hit different this morning 🔥",
        isMine: true,
        time: "11:43",
      },
      {
        id: 3,
        text: "Same here! Let’s keep each other accountable this week. Prayer chain at 8pm?",
        isMine: false,
        time: "11:44",
      },
      {
        id: 4,
        text: "I’m in! See you all there 👏",
        isMine: true,
        time: "11:45",
      },
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
      <div className="relative w-full max-w-[340px]">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Chat header */}
          <div
            className="px-4 py-3 flex items-center gap-3"
            style={{ backgroundColor: primary }}
          >
            <img
              src={assets.logo}
              alt="SpringsConnect Logo"
              className="w-9 h-9 bg-white/20 rounded-2xl"
            />
            <div className="flex-1">
              <div className="text-white font-semibold text-lg tracking-tight">SpringsConnect Youth</div>
              <div className="text-white/75 text-xs flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                online
              </div>
            </div>
          </div>

          {/* Chat body */}
          <div className="bg-[#e5ded8] h-[420px] p-4 flex flex-col gap-3 overflow-hidden">
            {visibleMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isMine ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-500`}
                style={{ animationDelay: `${visibleMessages.indexOf(msg) * 80}ms` }}
              >
                <div
                  className={`max-w-[78%] px-4 py-2.5 rounded-3xl text-[15px] leading-snug shadow-sm ${
                    msg.isMine
                      ? "rounded-br-none"
                      : "rounded-bl-none bg-white"
                  }`}
                  style={
                    msg.isMine
                      ? { backgroundColor: primary, color: "#fff" }
                      : {}
                  }
                >
                  {msg.text}
                  <div className="text-[10px] mt-1 opacity-70 text-right">{msg.time}</div>
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
      <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col items-center">
        <p className="text-gray-500 text-sm mb-4 uppercase tracking-wider font-medium">
          Or continue with
        </p>
        <button
          onClick={handleGoogleLogin}
          className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl border border-gray-300 shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" className="w-6 h-6" />
        </button>
      </div>
    );
  };

  return (
    <div className={isModal ? "w-full" : "min-h-screen bg-[#f0f2f5] flex flex-col"}>
      {alert.show && <CustomAlert message={alert.message} type={alert.type} onClose={() => setAlert({ ...alert, show: false })} />}
      {error && <CustomAlert type="error" message={error} onClose={() => setError(null)} />}

      {isModal ? (
        <div className="w-full px-0 py-0">
          <div className="max-w-md mx-auto">
              <div className="flex bg-gray-100 rounded-2xl p-0 mb-8">
                <button
                  onClick={() => setActiveTab("login")}
                  className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
                    activeTab === "login" ? "bg-[var(--secondary)] text-white border border-white/30" : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Log in
                </button>
                <button
                  onClick={() => setActiveTab("signup")}
                  className={`flex-1 py-3 text-sm font-semibold border-white rounded-xl transition-all ${
                    activeTab === "signup" ? "bg-[var(--secondary)] text-white border border-white/30" : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Sign up
                </button>
              </div>

              <div className="min-h-[280px]">
                {activeTab === "login" && <LoginForm onSwitchToSignUp={() => setActiveTab("signup")} />}
                {activeTab === "signup" && <SignUpForm onSwitchToLogin={() => setActiveTab("login")} />}
              </div>

              <SocialLoginSection />
            </div>
        </div>
      ) : (
        <>
          {/* ======================== FIRST ROW: WHATSAPP HERO (with your PNG perfectly aligned) ======================== */}
          <div className="flex-1 max-w-screen-2xl mx-auto px-6 lg:px-12 pt-12 lg:pt-20 pb-16">
            <div className="flex flex-col lg:flex-row lg:justify-between items-center gap-16 lg:gap-20">

              {/* LEFT: Text */}
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
                  <img
                    src={assets.logo}
                    alt="SpringsConnect Logo"
                    className="w-25 h-25"
                  />
                  <div>
                    <h2 className="text-4xl font-semibold text-gray-900 tracking-tighter">SpringsConnect</h2>
                    <p className="text-sm text-gray-600 -mt-1">Connect • Grow • Stay Accountable</p>
                  </div>
                </div>

                <h1 className="text-[52px] lg:text-[68px] leading-[1.05] font-bold text-gray-900 tracking-[-2px] mb-6">
                  Stay accountable.<br />Grow together.
                </h1>

                <p className="text-xl lg:text-2xl text-gray-700 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  A private space for believers to connect, share scripture, encourage one another, and walk in faith with real accountability.
                </p>

                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-x-8 gap-y-3 mt-12 text-sm font-medium text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    End-to-end encrypted
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    Faith-first community
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    Real accountability
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE - Chat as main focus + small woman at bottom-right */}
              <div className="relative flex justify-center lg:justify-end">
                <div className="relative w-full max-w-[520px] lg:max-w-[620px]">
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white/50 to-transparent rounded-[3rem] -rotate-2 scale-105"
                    style={{ filter: "blur(50px)" }}
                  />
                  <img
                    src={assets.heroHuman}
                    alt="Young woman smiling while using phone"
                    className="absolute -left-12 lg:-left-20 bottom-12 lg:bottom-16 w-64 lg:w-[290px] h-auto z-30 drop-shadow-2xl rounded-3xl object-cover"
                    style={{
                      transform: "rotate(-8deg)",
                      filter: "drop-shadow(30px 40px 35px rgba(0, 0, 0, 0.28))"
                    }}
                  />

                  <div className="relative z-20 ml-auto lg:ml-0 lg:translate-x-8 w-full max-w-[340px] lg:max-w-[360px]">
                    <AnimatedChatPreview />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ======================== SECOND ROW: FORM ======================== */}
          <div className="bg-white py-16 px-6">
            <div className="max-w-md mx-auto">
              <div className="flex justify-center mb-8">
                <img
                  src={assets.logo}
                  alt="SpringsConnect Logo"
                  className="w-25 h-25"
                />
              </div>

              <div className="text-center mb-10">
                <h2 className="text-3xl font-semibold text-gray-900">Welcome to SpringsConnect</h2>
                <p className="text-gray-600 mt-1">Connect with purpose. Grow with accountability.</p>
              </div>

              <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
                <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
                  <button
                    onClick={() => setActiveTab("login")}
                    className={`flex-1 py-3.5 text-sm font-semibold rounded-xl transition-all ${
                      activeTab === "login" ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => setActiveTab("signup")}
                    className={`flex-1 py-3.5 text-sm font-semibold rounded-xl transition-all ${
                      activeTab === "signup" ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Sign up
                  </button>
                </div>

                <div className="min-h-[340px]">
                  {activeTab === "login" && <LoginForm onSwitchToSignUp={() => setActiveTab("signup")} />}
                  {activeTab === "signup" && <SignUpForm onSwitchToLogin={() => setActiveTab("login")} />}
                </div>

                <SocialLoginSection />
              </div>

              <p className="text-center text-xs text-gray-500 mt-8">
                Your conversations are private • Secure • Faith-focused
              </p>
            </div>
          </div>
        </>
      )}

      {loading && <Loading text="Connecting…" />}
    </div>
  );
};

export default AuthContainer;