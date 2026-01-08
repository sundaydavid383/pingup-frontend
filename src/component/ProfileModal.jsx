import React, { useState, useMemo, useEffect } from "react";
import { Pencil, X} from "lucide-react";
import axios from "axios";
import assets from "../assets/assets";
import CustomAlert from "./shared/CustomAlert";
import axiosBase from "../utils/axiosBase";
import ActionNotifier from "./shared/ActionNotifier"; // adjust path if needed
import ProfileAvatar from  "./shared/ProfileAvatar"



const RELATIONSHIP_OPTIONS = ["Single", "Married", "Prefer not to say"];
const CHURCH_ROLE_OPTIONS = [
  "Member", "Usher", "Choir", "Elder", "Pastor", "Leader",
  "Prayer Team", "Youth Leader", "Other"
];
const INTEREST_OPTIONS = [
  "Music", "Sports", "Bible Study", "Tech and Media",
  "Youth Programs", "Volunteering", "Prayer & Counseling",
  "I'm just exploring"
];

const ProfileModal = ({ setShowEdit }) => {
  const stored = typeof window !== "undefined" ? localStorage.getItem("springsConnectUser") : null;
  const parsed = stored ? JSON.parse(stored) : {};
  const baseUser = Object.keys(parsed).length ? parsed : assets?.currentUser || {};

  const [formData, setFormData] = useState({ ...baseUser });
  const [preview, setPreview] = useState(baseUser.profilePicUrl || "");
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  


  // Phone validation UX state
  const [phoneInput, setPhoneInput] = useState( baseUser.phoneNumber || baseUser.phone || "");
  const [phoneError, setPhoneError] = useState(""); // empty => no error
  const [phoneSuggested, setPhoneSuggested] = useState(""); // suggestion when we can auto-format

  // Keep formData.phone in sync if baseUser changes later (safety)
useEffect(() => {
  const phoneValue = baseUser.phoneNumber || baseUser.phone || "";
  setFormData((p) => ({ ...p, phone: phoneValue }));
  setPhoneInput(phoneValue);
}, [baseUser.phone, baseUser.phoneNumber]);


  // 🟢 Handle alert message
  const setMsg = (message, type) => setAlert({ show: true, message, type });

  // -------------------------
  // Phone helpers (E.164)
  // -------------------------
  const isValidE164 = (num) => {
    if (!num || typeof num !== "string") return false;
    return /^\+[1-9]\d{7,14}$/.test(num);
  };

  // Clean input but keep leading plus if present
  const cleanInput = (raw) => {
    if (!raw || typeof raw !== "string") return "";
    const trimmed = raw.trim();
    if (trimmed.startsWith("+")) {
      return "+" + trimmed.slice(1).replace(/\D+/g, "");
    }
    return trimmed.replace(/\D+/g, "");
  };

  // Format to international E.164 according to your rules:
  // - If starts with 0 and is Nigerian local (11 digits) -> +234...
  // - If starts with 234 (no plus) -> +234...
  // - If already + and valid -> keep
  // - Otherwise return null (do not guess)
  const formatToInternational = (raw) => {
    if (!raw && raw !== "") return null;
    const cleaned = cleanInput(raw || "");
    if (!cleaned) return null;

    // Already provided with plus
    if ((raw || "").trim().startsWith("+")) {
      const asIs = "+" + cleaned.slice(1); // cleaned begins with '+' so slice(1)
      return isValidE164(asIs) ? asIs : null;
    }

    // Nigerian local like 08012345678 (0 + 10 digits)
    if (/^0\d{10}$/.test(cleaned)) {
      const converted = "+234" + cleaned.slice(1);
      return isValidE164(converted) ? converted : null;
    }

    // Starts with 234 and 13 digits total like 2348012345678
    if (/^234\d{10}$/.test(cleaned)) {
      const converted = "+" + cleaned;
      return isValidE164(converted) ? converted : null;
    }

    // Can't safely guess for other local formats
    return null;
  };

  // -------------------------
  // File upload handler
  // -------------------------
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) return setMsg("Please select a valid image.", "error");
    if (file.size > 3 * 1024 * 1024) return setMsg("Image too large (max 3MB).", "error");

    const fd = new FormData();
    fd.append("profilePic", file);

    try {
      setUploading(true);
      const { data } = await axiosBase.post("/api/auth/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = data?.url || data?.imageUrl || data?.imageUrlFull || "";
      if (!url) throw new Error("No image URL returned from server.");

      setFormData((p) => ({ ...p, profilePicUrl: url }));
      setPreview(url);
      setMsg("Image uploaded.", "success");
    } catch (err) {
      setMsg(err?.response?.data?.message || err.message || "Image upload failed.", "error");
    } finally {
      setUploading(false);
    }
  };

  // -------------------------
  // Phone input handlers (real-time feedback)
  // -------------------------
  const handlePhoneChange = (value) => {
    setPhoneInput(value);
    setPhoneError("");
    setPhoneSuggested("");

    // Try to detect a suggestion (Nigerian local pattern or 234 without +)
    const suggestion = formatToInternational(value);
    if (suggestion) {
      // If suggestion is valid but not exactly what user typed, show it
      if (suggestion !== value.trim()) {
        setPhoneSuggested(suggestion);
      } else {
        setPhoneSuggested("");
      }
    } else {
      const cleaned = cleanInput(value);
      if (cleaned && !value.trim().startsWith("+")) {
        setPhoneError("Please include the country code (e.g. +234 for Nigeria).");
      } else {
        setPhoneError("");
      }
    }
    // Update formData with raw phone while typing
    setFormData((p) => ({ ...p, phone: value }));
  };

  const handlePhoneBlur = () => {
    const formatted = formatToInternational(phoneInput);
    if (formatted) {
      setPhoneInput(formatted);
      setFormData((p) => ({ ...p, phone: formatted }));
      setPhoneError("");
      setPhoneSuggested("");
    } else {
      if (phoneInput.trim().startsWith("+") && isValidE164(phoneInput.trim())) {
        setPhoneInput(phoneInput.trim());
        setFormData((p) => ({ ...p, phone: phoneInput.trim() }));
        setPhoneError("");
      } else {
        setPhoneError("Invalid phone. Please enter an international number like +2348012345678.");
      }
    }
  };


  // ------------------------------------
   // Delete profile picture
    // ------------------------------------
    const handleDeleteUser = async () => {
  if (!formData._id) return setMsg("User ID not found.", "error");

  try {
    setLoading(true);
    await axiosBase.delete(`/api/auth/delete-user/${formData._id}`);
    setMsg("Account deleted successfully.", "success");
     setShowDeleteConfirm(false)
    // Clear local storage and redirect
    localStorage.removeItem("springsConnectUser");
    window.location.href = "/"; // redirect to homepage or signin
  } catch (err) {
    setMsg(err?.response?.data?.message || "Failed to delete user.", "error");
  } finally {
    setLoading(false);
  }
};


  // -------------------------
  // Save profile
  // -------------------------
  const handleSaveProfile = async (e) => {
    e.preventDefault();

    // Final phone validation & formatting before sending
    const finalFormatted =
      formatToInternational(formData.phone || "") ||
      (isValidE164(formData.phone || "") ? formData.phone : null);

    if (!finalFormatted) {
      setPhoneError("Please provide a valid international phone number (e.g. +2348012345678).");
      setMsg("Please provide a valid phone number.", "error");
      return;
    }

    try {
      setLoading(true);
      const userId = formData._id || baseUser._id;
      const payload = {
        ...formData,
        username: formData.username?.trim(),
        name: formData.name?.trim(),
        email: formData.email?.trim(),
        phone: finalFormatted,
      };

      const { data } = await axiosBase.put(`/api/auth/update/user/${userId}`, payload);
      setMsg(data?.message || "Profile updated!", "success");

      const updatedUser = data.user;
      localStorage.setItem("springsConnectUser", JSON.stringify(updatedUser));
      setFormData(updatedUser);
      setPhoneInput(updatedUser.phone || "");

      setTimeout(() => setShowEdit(false), 900);
    } catch (err) {
      setMsg(err?.response?.data?.message || "Update failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const initials = useMemo(() => {
    const n = (formData.name || "").trim();
    if (!n) return "DP";
    const parts = n.split(/\s+/);
    return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  }, [formData.name]);

  return (
    <div className="fixed inset-0 z-[51110] h-screen overflow-y-auto bg-black/50">
      <div className="max-w-2xl sm:py-6 mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
              <button
 className="fixed top-4 right-4 text-xl bg-[var(--primary)] text-[var(--white)] hover:bg-gray-200/50 px-3 py-1 rounded-full z-[51120] backdrop-blur-sm"
      onClick={() => setShowEdit(false)}
    >
      ✕
    </button>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Edit Profile</h1>

          {alert.show && (
            <CustomAlert
              message={alert.message}
              type={alert.type}
              onClose={() => setAlert({ show: false, message: "", type: "" })}
            />
          )}

          <form className="space-y-4" onSubmit={handleSaveProfile}>
            {/* Profile Picture */}
            <div className="flex flex-col items-center">
              
           <label className="group/profile relative cursor-pointer">
  <ProfileAvatar
    user={{
      name: formData.name || "?", // use the name to generate initials
      profilePicUrl: preview || formData.profilePicUrl || "", // show uploaded preview first
      profilePicBackground: formData.profilePicBackground || "#b3b3b3",
    }}
    size={96} // 24 * 4px (matches w-24 h-24)
  />

  {uploading && (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs text-white">
      Uploading...
    </div>
  )}

  <input
    type="file"
    accept="image/*"
    onChange={handleUpload}
    className="hidden"
  />

  <div className="absolute hidden group-hover/profile:flex top-2 left-2 right-2 bottom-2 bg-black/25 rounded-full items-center justify-center">
    <Pencil className="w-5 h-5 text-white" />
  </div>
</label>

            </div>

            {/* Editable fields */}
            {[
              { key: "username", label: "Username" },
              { key: "name", label: "Full Name" },
              { key: "email", label: "Email" },
              // phone handled below
              { key: "bio", label: "Bio", textarea: true },
              { key: "occupation", label: "Occupation" },
              { key: "location", label: "Location" },
              { key: "homeTown", label: "Home Town" },
              { key: "currentCity", label: "Current City" },
              { key: "relationshipStatus", label: "Relationship Status", select: RELATIONSHIP_OPTIONS },
              { key: "workplace", label: "Workplace" },
              { key: "churchName", label: "Church Name" },
              { key: "churchRole", label: "Church Role", select: CHURCH_ROLE_OPTIONS },
              { key: "interests", label: "Interests", select: INTEREST_OPTIONS },
            ].map(({ key, label, textarea, select }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                </label>
                {textarea ? (
                  <textarea
                    rows={2}
                    className="w-full p-3 border border-gray-200 rounded-lg"
                    value={formData[key] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                  />
                ) : select ? (
                  <select
                    className="w-full p-3 border border-gray-200 rounded-lg"
                    value={formData[key] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                  >
                    <option value="">Select {label.toLowerCase()}</option>
                    {select.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-200 rounded-lg"
                    value={formData[key] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                  />
                )}
              </div>
            ))}

            {/* Phone (custom handling) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tel number
              </label>
              <input
                type="text"
                inputMode="tel"
                className={`w-full p-3 border rounded-lg ${phoneError ? "border-red-400" : "border-gray-200"}`}
                value={phoneInput}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onBlur={handlePhoneBlur}
                placeholder="+2348012345678 or 08012345678"
                aria-invalid={!!phoneError}
                aria-describedby="phone-help"
              />

              <div id="phone-help" className="mt-1">
                {phoneSuggested && !phoneError && (
                  <p className="text-xs text-slate-600">
                    Suggestion: <strong>{phoneSuggested}</strong> — it will be saved as international.
                  </p>
                )}
                {phoneError && (
                  <p className="text-xs text-red-600">{phoneError}</p>
                )}
                {!phoneError && !phoneSuggested && phoneInput && isValidE164(phoneInput) && (
                  <p className="text-xs text-green-600">Valid international number</p>
                )}
              </div>
            </div>

            {/* Actions */}

<button
  type="button"
  className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50"
  onClick={() => setShowDeleteConfirm(true)}
>
  Delete Account
</button>

{showDeleteConfirm && (
  <ActionNotifier
    action="delete your account"
    onConfirm={handleDeleteUser}
    onCancel={() => setShowDeleteConfirm(false)}
  />
)}



            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn"
                disabled={loading || uploading}
              >
                {loading ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
