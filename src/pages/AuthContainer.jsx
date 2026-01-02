import React, { useState, useEffect } from "react";
import assets from "../assets/assets";
import { StarIcon } from "lucide-react";
import SignUpForm from "../component/SignUpForm";
import LoginForm from "../component/LoginForm";
import { signInWithGoogle, logout, auth, provider } from "../firebase";
import {
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import CustomAlert from "../component/shared/CustomAlert";
import Loading from "../component/shared/Loading";
import UserStats from "../component/UserStats";

const AuthContainer = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [alert, setAlert] = useState({ show: false, message: "", type: "error" });
  const [popupBlocked, setPopupBlocked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const registerOrLogin = async (firebaseUser) => {
    try {
      const username = firebaseUser?.email?.split("@")[0] || "unknown";
      const res = await axios.post(
        `${import.meta.env.VITE_SERVER}api/auth/google-register`,
        {
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          username,
          profilePicUrl: firebaseUser.photoURL,
          googleId: firebaseUser.uid,
        }
      );

      login(res.data.user, res.data.token);

      setAlert({
        show: true,
        message: "Google signup successful! 🎉",
        type: "success",
      });
    }
    catch (error) {
      console.error("Server registration error:", error);
      setAlert({
        show: true,
        message: "Registration failed. Please try again.",
        type: "error",
      });
    }
  };
  const handleGoogleSignup = async () => {
    setLoading(true);
    setLoadingText("Signing in with Google...");

    try {
      // Attempt popup first
      const { user } = await signInWithGoogle();
      await registerOrLogin(user);

    } catch (err) {
      console.error("Google sign-in error:", err);

      // Popup blocked? fallback to redirect
      if (err?.message?.includes("popup") || err?.code === "auth/popup-blocked") {
        setPopupBlocked(true);
        try {
          await signInWithRedirect(auth, provider);
          return; // wait for redirect result on next load
        } catch (redirectErr) {
          console.error("Redirect sign-in failed:", redirectErr);
          setAlert({
            show: true,
            message: redirectErr?.message || "Google sign-in failed via redirect.",
            type: "error",
          });
          return;
        }
      }

      // All other errors
      setAlert({
        show: true,
        message: err?.message || "Google sign-in failed. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
      setLoadingText("");
    }
  };

  // Handle redirect result when the page loads
  useEffect(() => {
    const fetchRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          await registerOrLogin(result.user);
        }
      } catch (err) {
        console.error("Redirect sign-in error:", err);
        setAlert({
          show: true,
          message: err?.message || "Google sign-in failed after redirect.",
          type: "error",
        });
      }
    };

    fetchRedirectResult();
  }, []);





  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--bg-main)]">
      {loading && <Loading text={loadingText} />}
      {alert.show && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ ...alert, show: false })}
        />
      )}

      {popupBlocked && (
        <div className="w-full bg-yellow-200 text-yellow-900 p-3 sm:p-4 text-center text-sm font-medium border-b border-yellow-400">
          ⚠️ Your browser blocked the Google sign-in popup.
          <br className="hidden sm:block" />
          Don’t worry — we’ll redirect you automatically.
          <br />
          <span className="text-xs text-gray-700">
            To fix this permanently: click the 🔒 icon beside your address bar → “Site
            settings” → allow <strong>Pop-ups and redirects</strong>.
          </span>
        </div>
      )}
      {/* -------- LEFT: GRADIENT SECTION -------- */}
      <div
        className="
          flex-1 flex flex-col justify-center items-center text-center 
          bg-[var(--inverse-dark-indigo-gradient)] text-white relative overflow-hidden
          p-6 sm:p-10 md:p-12 lg:p-20
          min-h-[50vh] md:min-h-screen
          order-1
        "
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--radial-highlight)] to-transparent pointer-events-none"></div>

        <img src={assets.logo} alt="Logo" className="h-14 w-[205px] sm:h-16 md:h-20 mb-6" />

        <div className="flex justify-center items-center gap-3 mb-5">
          <div className="flex -space-x-3">
         {[assets.user2, assets.user1, assets.user3].map((src, i) => (
  <div
    key={i}
    className="w-10 sm:w-12 h-10 sm:h-12 rounded-full border-2 border-white overflow-hidden"
  >
    <img
      src={src}
      alt="user"
      className="w-full h-full object-cover block"
    />
  </div>
))}

          </div>
          <div className="flex flex-col items-start">
            <div className="flex">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <StarIcon
                    key={i}
                    className="w-4 h-4 text-yellow-400 fill-yellow-500"
                  />
                ))}
            </div>
            <UserStats />
          </div>
        </div>

        <h1
          className="
            text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight 
            bg-gradient-to-r from-[var(--primary)] via-[var(--hover-dark)] to-[var(--primary)] 
            bg-clip-text text-transparent max-w-lg
          "
        >
          More than just friends, truly connect
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[var(--gold)] max-w-md">
          Connect with a global community on{" "}
          <span className="font-semibold text-[var(--hover-dark)]">Springs Connect</span>.
        </p>
      </div>

      {/* -------- RIGHT: AUTH FORM -------- */}
      <div
        className="
          flex-1 flex justify-center items-center 
          bg-[var(--bg-main)] 
          p-6 sm:p-8 md:p-10 
          min-h-[50vh] md:min-h-screen
          order-2
        "
      >
        <div className="w-full max-w-md bg-[var(--form-bg)] backdrop-blur-lg rounded-2xl shadow-2xl p-6 sm:p-8 border border-[var(--input-border)]">
          {isLogin ? (
            <LoginForm onSwitchToSignUp={() => setIsLogin(false)} />
          ) : (
            <SignUpForm onSwitchToLogin={() => setIsLogin(true)} />
          )}

          <div className="mt-6 text-center">
            <button
              onClick={handleGoogleSignup}
              type="button"
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 px-4 py-2.5 rounded-lg shadow-md border hover:bg-gray-100 transition"
            >
              <img
                src="https://www.svgrepo.com/show/355037/google.svg"
                alt="Google"
                className="w-5 h-5"
              />
              <span className="font-medium">Sign up with Google account</span>
            </button>
            <p className="mt-2 text-xs text-gray-300">
              ⚠️ If popups are blocked, we’ll automatically redirect you instead.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthContainer;
