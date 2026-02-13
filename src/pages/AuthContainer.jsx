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
import LeftHero from "../component/shared/LeftHero";

const AuthContainer = ({ initialError }) => {
  const [error, setError] = useState(initialError || null);
  // Reverted back to 2-way toggle state
  const [activeTab, setActiveTab] = useState("login");

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
    <div className="min-h-screen  bg-[var(--bg-main)] intro-background">
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
 <div className="hero_section flex flex-col md:flex-row">
<LeftHero />


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

            {/* User avatars + stats */}
   {/* ================= BRAND STRIP ================= */}
<section className="relative py-20 px-6 md:px-16 text-center overflow-hidden">

  {/* Soft radial glow using your root colors */}
  <div className="absolute inset-0 opacity-40 pointer-events-none"
    style={{
      background: `
        radial-gradient(circle at 20% 30%, var(--opaque-primary), transparent 50%),
        radial-gradient(circle at 80% 70%, var(--gold), transparent 55%)
      `
    }}
  />

  <div className="relative z-10 max-w-5xl mx-auto">

    {/* Logo */}
    <img
      src={assets.logo}
      alt="Newsprings"
      className="h-12 w-[120px] mx-auto mb-8 drop-shadow-lg"
    />

    {/* Avatars */}
    <div className="flex justify-center mb-6">
      <div className="flex -space-x-4">
        {[assets.user2, assets.user1, assets.user3].map((src, i) => (
          <div
            key={i}
            className="w-12 h-12 rounded-full border-2 border-[var(--bg-main)] shadow-md overflow-hidden"
          >
            <img src={src} alt="user" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>

    {/* Stats */}
    <div className="mb-8">
      <UserStats />
    </div>

    {/* Hero Text */}
    <h1
      className="text-4xl md:text-6xl font-extrabold leading-tight bg-clip-text text-transparent"
      style={{
        backgroundImage:
          "linear-gradient(to right, var(--primary), var(--hover-dark), var(--primary))"
      }}
    >
      More than just friends, truly connect.
    </h1>

    <p className="mt-6 text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
      Accountability. Growth. Real conversations.
      A peaceful space designed for daily reflection and meaningful connection.
    </p>

  </div>
</section>


    {/* ================= FEATURES SECTION ================= */}
<section className="py-28 px-6 md:px-16 bg-[var(--bg-light)] text-[var(--text-main)]">
  <div className="grid md:grid-cols-2 gap-20 items-center max-w-6xl mx-auto">

    <div>
      <h2 className="text-3xl md:text-4xl font-bold">
        Build Meaningful Daily Habits
      </h2>
      <p className="mt-6 text-[var(--text-secondary)] leading-relaxed text-lg">
        Stay consistent in journaling, reflection, and spiritual growth
        with accountability partners who truly care.
      </p>
    </div>

    <div className="p-10 rounded-3xl backdrop-blur-xl border border-white/10 shadow-xl"
      style={{ background: "var(--form-bg)" }}
    >
      <p className="text-[var(--text-main)] text-lg italic">
        “Today I’m grateful for small wins. Growth happens daily.”
      </p>
    </div>

  </div>
</section>

{/* ================= CONNECTION SECTION ================= */}
<section className="py-28 px-6 md:px-16 bg-[var(--bg-main)] text-[var(--text-main)]">
  <div className="grid md:grid-cols-2 gap-20 items-center max-w-6xl mx-auto">

    <div className="order-2 md:order-1 p-10 rounded-3xl backdrop-blur-xl border border-white/10 shadow-xl"
      style={{ background: "var(--form-bg)" }}
    >
      <p className="text-[var(--text-main)] text-lg">
        Voice reflections make conversations personal and real.
      </p>
    </div>

    <div className="order-1 md:order-2">
      <h2 className="text-3xl md:text-4xl font-bold">
        Express Beyond Text
      </h2>
      <p className="mt-6 text-[var(--text-secondary)] leading-relaxed text-lg">
        Share voice notes, reflections, and encouragement
        in a private, peaceful space.
      </p>
    </div>

  </div>
</section>

{/* ================= COMMUNITY SECTION ================= */}
<div className="mt-12 grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
  {[
    "Newsprings helped me stay consistent spiritually.",
    "It feels safe, private and meaningful.",
    "The daily reflections changed my routine."
  ].map((text, i) => (
    <div
      key={i}
      className="p-8 rounded-2xl backdrop-blur-xl border border-white/10 shadow-lg transition hover:-translate-y-2 duration-300"
      style={{ background: "var(--form-bg)" }}
    >
      <p className="text-[var(--text-secondary)] italic">
        “{text}”
      </p>
    </div>
  ))}
</div>

{/* ================= CTA SECTION ================= */}
<section className="py-28 px-6 md:px-16 text-center text-[var(--text-main)]"
  style={{ background: "var(--inverse-dark-indigo-gradient)" }}
>
  <h2 className="text-4xl md:text-6xl font-bold">
    Ready to Start Growing?
  </h2>

  <p className="mt-6 text-[var(--text-secondary)] text-lg max-w-xl mx-auto">
    Join Newsprings today and begin meaningful conversations that shape your life.
  </p>

  <button
    onClick={() =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
    className="mt-10 px-10 py-4 rounded-full font-semibold text-lg transition shadow-lg"
    style={{
      background: "var(--primary)",
      color: "var(--white)"
    }}
  >
    Create Your Account
  </button>
</section>

{/* ================= FOOTER ================= */}
<footer className="bg-[var(--secondary)] text-[var(--text-muted)] text-sm py-16 px-6 md:px-16">
  <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">

    <div className="text-center md:text-left">
      <img src={assets.logo} alt="Logo" className="h-8 mb-4 mx-auto md:mx-0" />
      <p>Meaningful connection. Real growth.</p>
    </div>

    <div className="flex gap-8">
      <span className="hover:text-white transition cursor-pointer">Privacy</span>
      <span className="hover:text-white transition cursor-pointer">Terms</span>
      <span className="hover:text-white transition cursor-pointer">Support</span>
    </div>

  </div>
</footer>


    </div>
  );
};

export default AuthContainer;