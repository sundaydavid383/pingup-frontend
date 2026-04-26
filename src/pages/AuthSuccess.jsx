import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loading from "../component/shared/Loading";
import CustomAlert from "../component/shared/CustomAlert";

const AuthSuccess = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRun = useRef(false);

  const [alert, setAlert] = useState({ show: false, message: "", type: "error" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get("token");
    const userId = searchParams.get("userId");
    const name = searchParams.get("name");
    const email = searchParams.get("email");
    const profilePicUrl = searchParams.get("profilePicUrl");
    const passwordFlag = searchParams.get("needsPasswordSetup") === "true";

    if (!token || !userId || !email) {
      setAlert({
        show: true,
        message: "Google login failed. Missing credentials.",
        type: "error",
      });
      setLoading(false);

      setTimeout(() => {
        navigate("/?error=GoogleLoginFailed", { replace: true });
      }, 2000);

      return;
    }

    const user = {
      _id: userId,
      name,
      email,
      profilePicUrl,
    };

    sessionStorage.removeItem("oauth_loading");
    sessionStorage.removeItem("oauth_text");

    login(user, token, { needsPasswordSetup: passwordFlag });

    navigate("/", { replace: true });
  }, [location.search, login, navigate]);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] px-4 py-16 text-white">
      {alert.show && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ show: false, message: "", type: "error" })}
        />
      )}

      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-[rgba(10,10,10,0.9)] p-8 shadow-xl shadow-black/40">
        {loading ? (
          <div className="space-y-4 text-center">
            <h1 className="text-3xl font-semibold">Finalizing Google sign-in...</h1>
            <p className="text-sm text-[var(--text-muted)]">Hang tight while we complete your login.</p>
            <div className="mt-8">
              <Loading text="Signing in" />
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <h1 className="text-3xl font-semibold">Signing you in...</h1>
            <p className="text-sm text-[var(--text-muted)]">You are being redirected to your dashboard.</p>
            <div className="mt-8">
              <Loading text="Redirecting" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthSuccess;