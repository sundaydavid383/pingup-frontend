import React, { useState } from "react";
import { X, Eye, EyeOff, Check } from "lucide-react";
import axiosBase from "../utils/axiosBase";

const PasswordSetupModal = ({ isOpen, onClose, token, onSuccess }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

 const getPasswordStrength = (pwd) => {
  if (pwd.length === 0) return { level: 0, text: "" };

  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /\d/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const isLongEnough = pwd.length >= 6;

  if (!isLongEnough) return { level: 1, text: "Too short (min 6 chars)" };

  const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  if (score === 4) return { level: 4, text: "Strong" };
  if (score === 3) return { level: 3, text: "Good" };
  if (score === 2) return { level: 2, text: "Weak" };

  return { level: 1, text: "Very weak" };
};

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Please fill out both fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    const hasUpper = /[A-Z]/.test(password);
const hasLower = /[a-z]/.test(password);
const hasNumber = /\d/.test(password);
const hasSpecial = /[^A-Za-z0-9]/.test(password);

if (!hasUpper) return setError("Add at least one uppercase letter.");
if (!hasLower) return setError("Add at least one lowercase letter.");
if (!hasNumber) return setError("Add at least one number.");
if (!hasSpecial) return setError("Add at least one special character.");
    try {
      setLoading(true);
      const response = await axiosBase.post(
        "/api/auth/set-initial-password",
        { password, confirmPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onSuccess();
    } catch (err) {
      const message = err.response?.data?.message
      console.error("Error setting password:", err);
      if (message === "Password already set") {
        onClose();
        return;
      }
      setError(message || "Unable to set your password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
<div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto ">
  
  <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col">

    {/* Header */}
    <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
      <h2 className="text-lg font-semibold text-gray-900 leading-snug">
        Complete Your Account Setup
      </h2>

      <button
        onClick={onClose}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <X size={18} className="text-gray-400" />
      </button>
    </div>

    {/* Content (SCROLL AREA) */}
    <div className="p-6 overflow-y-auto flex-1 space-y-4">

      <div className="space-y-4">

        <p className="text-sm text-gray-600 leading-relaxed">
          For stronger account security and easier access, set a password now.
        </p>

        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-700 mb-2">
            This will allow you to:
          </p>

          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex gap-2">
              <span>•</span>
              <span>Sign in directly with email and password anytime</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Change your password whenever you want</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Recover your account more easily</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Enjoy full authentication flexibility</span>
            </li>
          </ul>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          It only takes a moment and greatly improves your account flexibility.
        </p>

      </div>


          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter a secure password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {/* Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          strength.level === 1 ? "bg-red-400 w-1/4" :
                          strength.level === 2 ? "bg-orange-400 w-1/2" :
                          strength.level === 3 ? "bg-yellow-400 w-3/4" :
                          "bg-green-400 w-full"
                        }`}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      strength.level === 1 ? "text-red-600" :
                      strength.level === 2 ? "text-orange-600" :
                      strength.level === 3 ? "text-yellow-600" :
                      "text-green-600"
                    }`}>
                      {strength.text}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={loading || !password || !confirmPassword || password !== confirmPassword || password.length < 6}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Set Password</span>
                    <Check size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordSetupModal;