import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import assets from "../assets/assets";
import { StarIcon } from "lucide-react";
import SignUpForm from "../component/SignUpForm";
import LoginForm from "../component/LoginForm";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import CustomAlert from "../component/shared/CustomAlert";
import Loading from "../component/shared/Loading";
import UserStats from "../component/UserStats";
import LeftHero from "../component/shared/LeftHero";

const AuthContainer = ({ initialError, initialTab = 'login', onClose, isModal = false }) => {
  const location = useLocation();
  const [error, setError] = useState(initialError || null);
  // Reverted back to 2-way toggle state
  const [activeTab, setActiveTab] = useState(initialTab || location.state?.activeTab || "login");

  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [alert, setAlert] = useState({ show: false, message: "", type: "error" });
useEffect(() => {
  const oauthLoading = sessionStorage.getItem("oauth_loading");
  const oauthText = sessionStorage.getItem("oauth_text");

  if (oauthLoading === "true") {
    setLoading(true);
    setLoadingText(oauthText || "Loading…");
  }
}, []);

  useEffect(() => {
    if (!initialError) return;
    const timer = setTimeout(() => {
      setError(null);
      window.history.replaceState({}, "", "/");
    }, 3000);
    return () => clearTimeout(timer);
  }, [initialError]);

  // Social login component for reusability
const SocialLoginSection = () => {
  const handleGoogleLogin = () => {
    // 1️⃣ Persist loading across reload
    sessionStorage.setItem("oauth_loading", "true");
    sessionStorage.setItem("oauth_text", "Connecting to Google…");

    // 2️⃣ Optional: show instantly in current session
    setLoading(true);
    setLoadingText("Connecting to Google…");

    // 3️⃣ Redirect (full navigation)
    window.location.href = `${import.meta.env.VITE_SERVER}api/auth/google/login?origin=${window.location.origin}`;
  };

  return (
    <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center animate-in fade-in duration-500">
      <p className="text-gray-400 text-xs mb-4 uppercase tracking-widest font-semibold">
        Or connect with
      </p>

      <button
        onClick={handleGoogleLogin}
        className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl border border-[#dadce0] shadow-sm transition hover:bg-[#f7f8f8] active:scale-[0.95]"
        title="Continue with Google"
      >
        <img
          src="https://www.svgrepo.com/show/355037/google.svg"
          alt="Google"
          className="w-6 h-6"
        />
      </button>
    </div>
  );
};


  return (
    <div
  className={
    isModal
      ? "w-full"
      : "min-h-screen flex flex-col md:flex-row bg-[var(--bg-main)] intro-background"
  }
>

      {loading && <Loading text={loadingText} />}
      {alert.show && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ ...alert, show: false })}
        />
      )}
      {error && (
        <CustomAlert type="error" message={error} onClose={() => setError(null)} />
      )}


      {/* -------- LEFT SIDE (Hidden in Modal) -------- */}
    {!isModal && (
      <div className="w-[55%] bg-[bue]">
  <LeftHero />
  </div>
)}


      

            {/* User avatars + stats */}
   {/* ================= BRAND STRIP ================= */}
  <div
      className={
        isModal
          ? "w-full p-6"
          : "flex-1 flex justify-center items-center p-4 sm:p-8"
      }
    >
      <div
        className={
          isModal
            ? "w-full"
            : "w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 border border-[var(--input-border)] bg-white/10 backdrop-blur-xl"
        }
      >
        {/* Back Button */}
        {!isModal && onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm font-medium mb-4 flex items-center gap-1 transition"
          >
            ← Back to Landing
          </button>
        )}

        {/* Tabs */}
        <div className="flex p-1 bg-black/20 rounded-xl mb-6">
          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "login"
                ? "bg-[var(--accent)] text-white shadow-md"
                : "text-gray-300 hover:text-white"
            }`}
          >
            Login
          </button>

          <button
            onClick={() => setActiveTab("signup")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "signup"
                ? "bg-[var(--accent)] text-white shadow-md"
                : "text-gray-300 hover:text-white"
            }`}
          >
            Register
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px] flex flex-col justify-between">
          <div>
            {activeTab === "login" && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <LoginForm onSwitchToSignUp={() => setActiveTab("signup")} />
              </div>
            )}

            {activeTab === "signup" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <SignUpForm onSwitchToLogin={() => setActiveTab("login")} />
              </div>
            )}
          </div>

          <SocialLoginSection />
        </div>
      </div>
    </div>

    </div>
  );  
};

export default AuthContainer;