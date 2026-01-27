import React, { useState, useEffect } from "react";
import assets from "../assets/assets";
import { StarIcon } from "lucide-react";
import SignUpForm from "../component/SignUpForm";
import LoginForm from "../component/LoginForm";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import CustomAlert from "../component/shared/CustomAlert";
import Loading from "../component/shared/Loading";
import UserStats from "../component/UserStats";

const AuthContainer = ({ initialError }) => {
  const [error, setError] = useState(initialError || null);
  // Reverted back to 2-way toggle state
  const [activeTab, setActiveTab] = useState("login");

  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [alert, setAlert] = useState({ show: false, message: "", type: "error" });

  useEffect(() => {
    if (!initialError) return;
    const timer = setTimeout(() => {
      setError(null);
      window.history.replaceState({}, "", "/");
    }, 3000);
    return () => clearTimeout(timer);
  }, [initialError]);

  // Social login component for reusability
  const SocialLoginSection = () => (
    <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center animate-in fade-in duration-500">
      <p className="text-gray-400 text-xs mb-4 uppercase tracking-widest font-semibold">Or connect with</p>
      <a
        href={`${import.meta.env.VITE_SERVER}api/auth/google/login`}
        className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl border border-[#dadce0] shadow-sm transition hover:bg-[#f7f8f8] active:scale-[0.95]"
        title="Continue with Google"
      >
        <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" className="w-6 h-6" />
      </a>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--bg-main)] intro-background">
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

      {/* -------- LEFT SIDE -------- */}
      <div className="flex-1 flex flex-col justify-center items-center text-center bg-[var(--inverse-dark-indigo-gradient)] text-white relative overflow-hidden p-6 sm:p-10 md:p-12 lg:p-20 min-h-[50vh] md:min-h-screen order-1">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--radial-highlight)] to-transparent pointer-events-none"></div>
        <img src={assets.logo} alt="Logo" className="h-14 w-[205px] mb-6" />
        <div className="flex justify-center items-center gap-3 mb-5">
          <div className="flex -space-x-3">
            {[assets.user2, assets.user1, assets.user3].map((src, i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
                <img src={src} alt="user" className="w-full h-full story-image-fill" />
              </div>
            ))}
          </div>
          <UserStats />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight bg-gradient-to-r from-[var(--primary)] via-[var(--hover-dark)] to-[var(--primary)] bg-clip-text text-transparent">
          More than just friends, truly connect
        </h1>
      </div>

      {/* -------- RIGHT SIDE: UPDATED TAB SYSTEM -------- */}
      <div className="flex-1 flex justify-center items-center p-3 sm:p-8 md:p-6 min-h-[50vh] md:min-h-screen order-2 relative">
        <div className="w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 border border-[var(--input-border)] bg-white/10 backdrop-blur-xl">
          
          {/* TWO TABS (Login & Register) */}
          <div className="flex p-1 bg-black/20 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "login" ? "bg-[var(--accent)] text-white shadow-md" : "text-gray-300 hover:text-white"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "signup" ? "bg-[var(--accent)] text-white shadow-md" : "text-gray-300 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          {/* TAB CONTENT */}
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

            {/* Social Section always at the bottom of the active form */}
            <SocialLoginSection />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthContainer;