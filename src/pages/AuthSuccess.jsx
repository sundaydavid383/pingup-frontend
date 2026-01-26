import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loading from "../component/shared/Loading";
import CustomAlert from "../component/shared/CustomAlert";

const AuthSuccess = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRun = useRef(false)
  const [alert, setAlert] = useState({ show: false, message: "", type: "error" });

 useEffect(() => {
  if(hasRun.current)return;
  hasRun.current = true
  const searchParams = new URLSearchParams(location.search);

  const token = searchParams.get("token");
  const userId = searchParams.get("userId");
  const name = searchParams.get("name");
  const email = searchParams.get("email");
  const profilePicUrl = searchParams.get("profilePicUrl");

  // 1️⃣ Validate required data
  if (!token || !userId || !email) {
    setAlert({
      show: true,
      message: "Google login failed. Missing credentials.",
      type: "error",
    });

    // Redirect after showing error
    setTimeout(() => {
      navigate("/?error=GoogleLoginFailed", { replace: true });
    }, 2000);

    return;
  }

  // 2️⃣ Build user object (must match AuthContext expectations)
  const user = {
    _id: userId,
    name,
    email,
    profilePicUrl,
  };

  // 3️⃣ Login + redirect
  login(user, token);
  navigate("/", { replace: true });

}, [location.search, login, navigate]);

  return (
    <div className="min-h-screen flex justify-center items-center bg-[var(--bg-main)]">
      {alert.show ? <CustomAlert message={alert.message} type={alert.type} /> : <Loading text="Logging you in..." />}
    </div>
  );
};

export default AuthSuccess;
