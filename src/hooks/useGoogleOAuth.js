import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // adjust path if needed
import axiosBase from "../utils/axiosBase";       // adjust path if needed

export const useGoogleOAuth = () => {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("[Google OAuth] Error:", error);
      navigate(location.pathname, { replace: true });
      return;
    }
a
    if (!code) return; // no OAuth attempt

    const fetchGoogleUser = async () => {
      try {
        const res = await axiosBase.get(`/api/auth/google/callback?code=${code}`);
        if (res.data.success && res.data.user && res.data.token) {
          login(res.data.user, res.data.token);

          // Clean URL to remove code param
          navigate(location.pathname, { replace: true });
        }
      } catch (err) {
        console.error("[Google OAuth] Failed:", err);
        navigate(location.pathname, { replace: true });
      }
    };

    fetchGoogleUser();
  }, [location.search, login, navigate, location.pathname]);
};
