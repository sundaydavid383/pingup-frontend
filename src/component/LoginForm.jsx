import React, { useState } from "react";
import CustomAlert from "./shared/CustomAlert";
import Loading from "./shared/Loading";
import { useAuth } from "../context/AuthContext";
import location from "../utils/location"

const LoginForm = ({ onSwitchToSignUp }) => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [alert, setAlert] = useState({ show: false, message: "", type: "error" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!formData.email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "Enter a valid email";
    if (!formData.password.trim()) return "Password is required";
    if (formData.password.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setAlert({ show: true, message: error, type: "error" });
      return;
    }

    setLoading(true);

    try {
      const locationData = await location();
      const body = {...locationData, ...formData}
      const res = await fetch(`${import.meta.env.VITE_SERVER}api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setAlert({ show: true, message: data.message || "Login failed wrong email or password", type: "error" });
        return;
      }

      // Login user into context and localStorage
      login(data.user, data.token);

      setAlert({ show: true, message: "Login successful!", type: "success" });
    } catch (err) {
      setLoading(false);
      setAlert({ show: true, message: "Server error. Try again later.", type: "error" });
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto mt-8">
      <div
        className="absolute inset-0 backdrop-blur-2xl rounded-3xl shadow-2xl"
        style={{ backgroundColor: "var(--form-bg)" }}
      ></div>

      {loading && <Loading />}
      {alert.show && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ ...alert, show: false })}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className=" relative z-10 p-2 sm:p-4 text-[var(--text-main)] space-y-6"
      >
        <h2 className="text-2xl font-bold text-center" style={{ color: "var(--color-text)" }}>
          Log In
        </h2>

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-3 rounded-xl bg-[var(--input-bg)] text-[var(--input-text)] shadow-[var(--input-shadow)] placeholder-white/70 focus:outline-none"
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="off"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-[var(--input-bg)] text-[var(--input-text)] shadow-[var(--input-shadow)] placeholder-white/70 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 transform bg-[var(--accent)] px-3 py-1 rounded-full text-white text-sm hover:bg-opacity-90 transition"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>


        <button
          type="submit"
          className="w-full py-3 bg-[var(--accent)] hover:bg-indigo-700 text-white font-semibold rounded-xl transition"
        >
          Login
        </button>

        <p className="text-center text-sm text-white/70">
          Don’t have an account?{" "}
          <button
            type="button"
            className="text-[var(--text-main)] font-medium underline"
            onClick={onSwitchToSignUp}
          >
            Sign up here
          </button>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;