import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  UserRound, Mail, Users, Info, Briefcase, MapPin, Home, Heart, 
  GraduationCap, Building2, Sparkles, Church 
} from "lucide-react"; 
const ICONS = {
  username: UserRound, name: UserRound, email: Mail, gender: Users, bio: Info,
  occupation: Briefcase, location: MapPin, homeTown: Home, currentCity: MapPin,
  relationshipStatus: Heart, workplace: Building2,
  churchName: Church, churchRole: Users, interests: Sparkles,
};

const RELATIONSHIP_OPTIONS = [
  "Single", "Married", "Prefer not to say"
];

const CHURCH_ROLE_OPTIONS = [
  "Member", "Usher", "Choir", 'Elder', "Pastor", "Leader", 'Prayer Team', 'Youth Leader', "Other"
];

const INTEREST_OPTIONS = [
  "Music", "Sports", "Bible Study", "Tech and Media", "Youth Programs", "Volunteering", "Prayer & Counseling", "I'm just exploring" 
];
// Define this near the top of UserModal.jsx
const FIELDS = [
  { key: "username", label: "Username", icon: UserRound },
  { key: "name", label: "Full Name", icon: UserRound },
  { key: "email", label: "Email", icon: Mail },
  { key: "gender", label: "Gender", icon: Users },
  { key: "bio", label: "Bio", icon: Info, textarea: true },
  { key: "occupation", label: "Occupation", icon: Briefcase },
  { key: "location", label: "Location", icon: MapPin },
  { key: "homeTown", label: "Home Town", icon: Home },
  //{ key: "currentCity", label: "Current City", icon: MapPin },
  { key: "relationshipStatus", label: "Relationship Status", icon: Heart },
  { key: "workplace", label: "Workplace", icon: Building2 },
  { key: "churchName", label: "Church Name", icon: Church },
  { key: "churchRole", label: "Church Role", icon: Users },
  { key: "interests", label: "Interests", icon: Sparkles },
];

// Optional: central axios
import axiosBase from "axios";
const api = axiosBase.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
});
// if you use tokens:
// api.interceptors.request.use(cfg => { cfg.headers.Authorization = `Bearer ${token}`; return cfg; });

const UserModal = ({ user = {}, onClose }) => {
  const [formData, setFormData] = useState(() => ({ ...user }));
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const changePerformed = useMemo(() => {
    return FIELDS.some(({ key }) => formData[key] !== user[key]);
  }, [formData, user]);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(user.profilePicUrl || "");

  // 🔁 keep in sync if parent passes a different user later
  React.useEffect(() => {
    setFormData({ ...user });
    setPreview(user.profilePicUrl || "");
  }, [user]);

  const setMsg = (message, type) => setAlert({ show: true, message, type });

  const toTitleCase = (str) =>
    str?.trim()
      .toLowerCase()
      .split(/\s+/)
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
      .join(" ");

  const validateForm = () => {
    const data = {
      username: (formData.username || "").trim(),
      name: (formData.name || "").trim(),
      email: (formData.email || "").trim(),
    };
    if (data.username.length < 3) return "Username must be at least 3 characters.";
    if (data.name.length < 3) return "Name must be at least 3 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return "Invalid email address.";
    return null;
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) return setMsg("Please select a valid image.", "error");
    if (file.size > 3 * 1024 * 1024) return setMsg("Image too large (max 3MB).", "error");

    const fd = new FormData();
    fd.append("profilePic", file);
    try {
      setUploading(true);
      const { data } = await api.post("/api/auth/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = data?.url || data?.imageUrl || data?.imageUrlFull || "";
      if (!url) throw new Error("No image URL returned from server.");
      setFormData((p) => ({ ...p, profilePicUrl: url }));
      setPreview(url);
      setMsg("Image uploaded.", "success");
    } catch (err) {
      setMsg(err.response?.data?.message || "Image upload failed.", "error");
    } finally {
      setUploading(false);
    }
  };

const handleSave = async () => {
  // 1️⃣ Validate form before submitting
  const error = validateForm();
  if (error) {
    setMsg(error, "error");
    return;
  }

  try {
    setLoading(true);

    // 2️⃣ Safely resolve userId
    const userId = formData?._id || user?._id;
    if (!userId) {
      setMsg("User ID is missing. Cannot update profile.", "error");
      return;
    }

    // 3️⃣ Prepare payload (trim strings to avoid accidental spaces)
    const payload = {
      ...formData,
      ...(formData.username && { username: formData.username.trim() }),
      ...(formData.name && { name: formData.name.trim() }),
      ...(formData.email && { email: formData.email.trim() }),
    };

    // 4️⃣ Get token from localStorage
    if (!token) {
      setMsg("You must be logged in to update your profile.", "error");
      return;
    }

    // 5️⃣ Send update request with token in headers
    const { data } = await api.put(
      `/api/auth/update/user/${userId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // 6️⃣ Handle success
    const updatedUser = data?.user;
    if (updatedUser) {
      localStorage.setItem("springsConnectUser", JSON.stringify(updatedUser));
      setFormData(updatedUser); // Keep local state in sync
    }

    setMsg(data?.message || "Profile updated successfully!", "success");

    if (onClose) {
      setTimeout(() => onClose(), 900);
    }
    

  } catch (err) {
    // 7️⃣ Handle errors gracefully
    console.error("Profile update failed:", err);
    const msg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      "Update failed.";
    setMsg(msg, "error");
  } finally {
    setLoading(false);
  }
};

const getFirstLetterOfNameForFallbackAvatar  = (name) => {
  if (!name) return '?';

  const parts = name.trim().split(" "); // split by space
  if (parts.length === 1) {
    // only one name (e.g. "Sunday")
    return parts[0].charAt(0).toUpperCase();
  } else {
    // at least two parts (e.g. "Sunday David")
    const firstInitial = parts[0].charAt(0).toUpperCase();
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return firstInitial + lastInitial;
  }
};


const handleDeleteAccount =     async () => {
    if (!formData._id) return setMsg("User ID not found.", "error");
    if (!window.confirm("Are you sure you want to delete this account? This action cannot be undone.")) return;

    try {
      setLoading(true);
      await api.delete(`/api/auth/delete-user/${formData._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMsg("Account deleted successfully.", "success");

      // Clear local storage and redirect
      localStorage.removeItem("springsConnectUser");
      window.location.href = "/"; // redirect to homepage or login
    } catch (err) {
      setMsg(err?.response?.data?.message || "Failed to delete user.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="overflow-y-auto hidden_scrollbar fixed inset-0 bg-black bg-opacity-80 z-55550 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Edit profile"
    >
      <div
        className="relative bg-[var(--form-bg)] w-full max-w-3xl rounded-lg shadow-lg text-[var(--text-main)] flex flex-col"
        style={{ maxHeight: "90vh" }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 w-9 h-9 text-lg font-bold bg-[var(--input-bg)] hover:bg-[var(--error)] hover:text-white rounded-full flex items-center justify-center transition duration-200"
          title="Close"
          aria-label="Close"
        >
          ×
        </button>

        {alert.show && (
          <div
            className={`p-3 text-sm text-center ${
              alert.type === "success" ? "text-green-500" : "text-red-500"
            }`}
            role={alert.type === "error" ? "alert" : "status"}
          >
            {alert.message}
          </div>
        )}

        <div className="overflow-y-auto p-6 pb-32">
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[var(--input-border)] mb-2">
             {preview && preview.length > 0 ? (
                  <img
                    src={preview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--primary)] text-white font-semibold border border-[var(--input-border)]"
                  >
                    {getFirstLetterOfNameForFallbackAvatar(user?.name) || "?"}
                  </div>
                )}
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-xs text-white">
                  Uploading...
                </div>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleUpload} className="text-sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
{FIELDS.map(({ key, label, icon: Icon, textarea }) => (
  <div key={key} className="flex items-start gap-2">
    <Icon className="w-5 h-5 mt-3 text-gray-500" />
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>

      {textarea ? (
  <textarea
    rows={2}
    className="w-full p-3 border border-gray-200 rounded-lg"
    value={formData[key] || ""}
    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
  />
) : key === "relationshipStatus" ? (
  <select
    className="w-full p-3 border border-gray-200 rounded-lg "
    value={formData[key] || ""}
    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
  >
    <option value="">Select relationship status</option>
    {RELATIONSHIP_OPTIONS.map((opt) => (
      <option key={opt} value={opt}>{opt}</option>
    ))}
  </select>
) : key === "churchRole" ? (
  <select
    className="w-full p-3 border border-gray-200 rounded-lg"
    value={formData[key] || ""}
    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
  >
    <option value="">Select church role</option>
    {CHURCH_ROLE_OPTIONS.map((opt) => (
      <option key={opt} value={opt}>{opt}</option>
    ))}
  </select>
) : key === "interests" ? (
  <select
    className="w-full p-3 border border-gray-200 rounded-lg"
    value={formData[key] || ""}
    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
  >
    <option value="">Select interest</option>
    {INTEREST_OPTIONS.map((opt) => (
      <option key={opt} value={opt}>{opt}</option>
    ))}
  </select>
) : (
  <input
    type="text"
    className="w-full p-3 border border-gray-200 rounded-lg"
    value={formData[key] || ""}
    onChange={(e) => setFormData({ ...formData, [key]: key === "name" ? toTitleCase(e.target.value) : e.target.value })}
  />
)}
    </div>
  </div>
))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[var(--form-bg)] border-t border-[var(--input-border)]">
          {changePerformed && (
  <button
    className="btn w-full mb-2"
    onClick={handleSave}
    disabled={loading || uploading}
  >
    {loading ? "Saving..." : "Save Changes"}
  </button>
)}

{/* Delete user button */}
<button
  className="btn w-full bg-red-600 hover:bg-red-700 text-white mt-2"
  onClick={handleDeleteAccount}
  disabled={loading || uploading}
>
  Delete Account
</button>

        </div>
      </div>
    </div>
  );
};

export default UserModal;