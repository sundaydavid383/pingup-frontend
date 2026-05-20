import React, { useState, useMemo, useEffect } from "react";
import { Pencil, X, Camera, User, Phone, Globe, MapPin, Heart, Church, Sparkles, Trash2, Save, ChevronDown, AlertTriangle } from "lucide-react";
import axios from "axios";
import assets from "../assets/assets";
import CustomAlert from "./shared/CustomAlert";
import axiosBase from "../utils/axiosBase";
import ActionNotifier from "./shared/ActionNotifier";
import ProfileAvatar from "./shared/ProfileAvatar";
import { useAuth } from "../context/AuthContext";
import CoverPhotoEditor from "./shared/CoverPhotoEditor";
import ProfileAvatarSkeleton from "./skeleton/ProfileAvatarSkeleton";

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

const SECTIONS = [
  {
    id: "basic",
    label: "Identity",
    icon: User,
    fields: [
      { key: "username", label: "Username", placeholder: "@yourhandle" },
      { key: "name", label: "Full Name", placeholder: "Your full name" },
      { key: "email", label: "Email", placeholder: "you@example.com" },
      { key: "bio", label: "Bio", textarea: true, placeholder: "Tell the world who you are…" },
      { key: "occupation", label: "Occupation", placeholder: "What do you do?" },
    ],
  },
  {
    id: "location",
    label: "Location",
    icon: MapPin,
    fields: [
      { key: "country", label: "Country", placeholder: "Country" },
      { key: "currentCity", label: "Current City", placeholder: "Where you live now" },
      { key: "homeTown", label: "Home Town", placeholder: "Where you're from" },
    ],
  },
  {
    id: "personal",
    label: "Personal",
    icon: Heart,
    fields: [
      { key: "relationshipStatus", label: "Relationship Status", select: RELATIONSHIP_OPTIONS },
      { key: "website", label: "Website", placeholder: "https://yoursite.com" },
      { key: "interests", label: "Interests", select: INTEREST_OPTIONS },
    ],
  },
  {
    id: "church",
    label: "Faith",
    icon: Church,
    fields: [
      { key: "churchName", label: "Church Name", placeholder: "Your church" },
      { key: "churchRole", label: "Church Role", select: CHURCH_ROLE_OPTIONS },
    ],
  },
];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=Instrument+Serif:ital@0;1&display=swap');

  .pm-overlay {
    position: fixed;
    inset: 0;
    z-index: 51110;
    overflow-y: auto;
    background: rgba(5, 13, 58, 0.72);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    font-family: 'DM Sans', sans-serif;
  }

  .pm-close-btn {
    position: fixed;
    top: 1.25rem;
    right: 1.25rem;
    z-index: 51120;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(12px);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .pm-close-btn:hover {
    background: rgba(255,255,255,0.18);
    transform: rotate(90deg);
  }

  .pm-shell {
    max-width: 680px;
    margin: 2rem auto;
    padding: 0 1rem 3rem;
  }

  .pm-card {
    background: #fff;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 32px 80px rgba(5,13,58,0.28), 0 8px 24px rgba(5,13,58,0.12);
  }

  /* ── Hero zone ── */
  .pm-hero {
    position: relative;
    height: 180px;
    background: linear-gradient(135deg, var(--secondary) 0%, var(--primary) 60%, #5b7ff5 100%);
    overflow: hidden;
  }
  .pm-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 80% at 80% 20%, rgba(91,127,245,0.35) 0%, transparent 70%),
      radial-gradient(ellipse 40% 60% at 10% 80%, rgba(48,85,209,0.4) 0%, transparent 60%);
  }
  .pm-hero-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 32px 32px;
  }
  .pm-cover-wrapper {
    position: absolute;
    inset: 0;
    z-index: 2;
  }

  /* ── Avatar ring ── */
  .pm-avatar-zone {
    position: absolute;
    bottom: -52px;
    left: 2rem;
    z-index: 10;
  }
  .pm-avatar-ring {
    width: 104px;
    height: 104px;
    border-radius: 50%;
    border: 4px solid #fff;
    box-shadow: 0 4px 20px rgba(5,13,58,0.2);
    overflow: hidden;
    position: relative;
    background: var(--ob-surface);
    cursor: pointer;
  }
  .pm-avatar-overlay {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(5,13,58,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .pm-avatar-ring:hover .pm-avatar-overlay { opacity: 1; }
  .pm-avatar-ring input { display: none; }

  /* ── Header pad ── */
  .pm-header-pad {
    padding: 4rem 2rem 1.25rem;
    border-bottom: 1px solid #f0f2f8;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
  }
  .pm-header-name {
    font-family: 'Instrument Serif', serif;
    font-size: 1.6rem;
    color: var(--secondary);
    line-height: 1.1;
    margin: 0;
  }
  .pm-header-sub {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin: 0.2rem 0 0;
    font-weight: 400;
  }

  /* ── Tabs ── */
  .pm-tabs {
    display: flex;
    gap: 0;
    padding: 0 2rem;
    border-bottom: 1px solid #f0f2f8;
    overflow-x: auto;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .pm-tabs::-webkit-scrollbar { display: none; }
  .pm-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0.85rem 1rem;
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--text-muted);
    border-bottom: 2px solid transparent;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;
    background: none;
    border-top: none;
    border-left: none;
    border-right: none;
    letter-spacing: 0.01em;
  }
  .pm-tab:hover { color: var(--primary); }
  .pm-tab.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
  }
  .pm-tab svg { width: 14px; height: 14px; }

  /* ── Body ── */
  .pm-body {
    padding: 2rem;
  }

  /* ── Field groups ── */
  .pm-fields { display: flex; flex-direction: column; gap: 1.25rem; }

  .pm-field-label {
    display: block;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 0.4rem;
  }

  .pm-input {
    width: 100%;
    padding: 0.7rem 1rem;
    border: 1.5px solid #e8ecf5;
    border-radius: 10px;
    font-size: 0.9rem;
    font-family: 'DM Sans', sans-serif;
    color: var(--secondary);
    background: #fafbff;
    transition: all 0.2s ease;
    outline: none;
    box-sizing: border-box;
  }
  .pm-input:focus {
    border-color: var(--primary-color);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(59,92,203,0.1);
  }
  .pm-input::placeholder { color: #bcc3d6; }
  .pm-input.error { border-color: var(--red); box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }

  .pm-textarea {
    resize: vertical;
    min-height: 80px;
    line-height: 1.6;
  }

  .pm-select-wrap {
    position: relative;
  }
  .pm-select-wrap svg.chevron {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: #bcc3d6;
    width: 16px;
    height: 16px;
  }
  .pm-select {
    appearance: none;
    -webkit-appearance: none;
    padding-right: 2.5rem;
    cursor: pointer;
  }

  /* ── Phone helpers ── */
  .pm-phone-hint {
    font-size: 0.72rem;
    margin-top: 0.35rem;
  }
  .pm-phone-hint.suggest { color: var(--primary); }
  .pm-phone-hint.ok { color: var(--success); }
  .pm-phone-hint.err { color: var(--red); }

  /* ── Section divider ── */
  .pm-section-tag {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 1.25rem;
  }
  .pm-section-tag span {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--primary);
  }
  .pm-section-tag::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, rgba(59,92,203,0.2), transparent);
    border-radius: 1px;
  }

  /* ── Footer actions ── */
  .pm-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 2rem;
    border-top: 1px solid #f0f2f8;
    background: #fafbff;
    gap: 1rem;
  }

  .pm-btn-ghost {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0.6rem 1.1rem;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.18s ease;
    border: none;
    background: none;
    color: var(--text-muted);
  }
  .pm-btn-ghost:hover { background: #f0f2f8; color: var(--secondary); }

  .pm-btn-danger {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0.6rem 1.1rem;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.18s ease;
    border: 1.5px solid #fecaca;
    background: #fef2f2;
    color: #dc2626;
  }
  .pm-btn-danger:hover { background: #fee2e2; border-color: #fca5a5; }

  .pm-btn-save {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0.65rem 1.5rem;
    border-radius: 10px;
    font-size: 0.88rem;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    background: var(--primary);
    color: #fff;
    letter-spacing: 0.01em;
    box-shadow: 0 4px 12px rgba(48,85,209,0.3);
  }
  .pm-btn-save:hover { background: var(--secondary); box-shadow: 0 6px 18px rgba(26,41,74,0.35); transform: translateY(-1px); }
  .pm-btn-save:active { transform: translateY(0); }
  .pm-btn-save:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .pm-btn-save svg { width: 16px; height: 16px; }

  /* ── Delete confirm overlay ── */
  .pm-confirm-banner {
    margin: 0 2rem 1.5rem;
    padding: 1rem 1.25rem;
    background: #fef2f2;
    border: 1.5px solid #fecaca;
    border-radius: 12px;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .pm-confirm-banner svg { color: #dc2626; flex-shrink: 0; margin-top: 2px; }
  .pm-confirm-banner p { font-size: 0.82rem; color: #7f1d1d; margin: 0 0 0.75rem; line-height: 1.5; }
  .pm-confirm-actions { display: flex; gap: 0.5rem; }
  .pm-confirm-yes {
    padding: 0.4rem 1rem;
    border-radius: 7px;
    font-size: 0.78rem;
    font-weight: 600;
    border: none;
    background: #dc2626;
    color: #fff;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: background 0.15s;
  }
  .pm-confirm-yes:hover { background: #b91c1c; }
  .pm-confirm-no {
    padding: 0.4rem 1rem;
    border-radius: 7px;
    font-size: 0.78rem;
    font-weight: 500;
    border: 1px solid #fecaca;
    background: #fff;
    color: #dc2626;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.15s;
  }
  .pm-confirm-no:hover { background: #fef2f2; }

  /* ── Uploading shimmer ── */
  @keyframes pm-shimmer {
    0% { opacity: 0.4; }
    50% { opacity: 0.9; }
    100% { opacity: 0.4; }
  }
  .pm-uploading { animation: pm-shimmer 1.2s ease-in-out infinite; }
`;

const ProfileModal = ({ setShowEdit }) => {
  const { user, updateUser } = useAuth();
  const baseUser = Object.keys(user).length ? user : {};

  const [formData, setFormData] = useState({ ...baseUser });
  const [preview, setPreview] = useState(baseUser.profilePicUrl || "");
  const [coverPreview, setCoverPreview] = useState(baseUser.coverPhotoUrl || user.coverPhotoUrl || "");
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const [phoneInput, setPhoneInput] = useState(baseUser.phoneNumber || baseUser.phone || "");
  const [phoneError, setPhoneError] = useState("");
  const [phoneSuggested, setPhoneSuggested] = useState("");

  useEffect(() => {
    const phoneValue = baseUser.phoneNumber || baseUser.phone || "";
    setFormData((p) => ({ ...p, phone: phoneValue }));
    setPhoneInput(phoneValue);
  }, [baseUser.phone, baseUser.phoneNumber]);

  const handleCancel = () => {
    setPreview(baseUser.profilePicUrl || "");
    setCoverPreview(baseUser.coverPhotoUrl || "");
    setShowEdit(false);
  };

  const setMsg = (message, type) => setAlert({ show: true, message, type });

  const isValidE164 = (num) => {
    if (!num || typeof num !== "string") return false;
    return /^\+[1-9]\d{7,14}$/.test(num);
  };

  const cleanInput = (raw) => {
    if (!raw || typeof raw !== "string") return "";
    const trimmed = raw.trim();
    if (trimmed.startsWith("+")) return "+" + trimmed.slice(1).replace(/\D+/g, "");
    return trimmed.replace(/\D+/g, "");
  };

  const formatToInternational = (raw) => {
    if (!raw && raw !== "") return null;
    const cleaned = cleanInput(raw || "");
    if (!cleaned) return null;
    if ((raw || "").trim().startsWith("+")) {
      const asIs = "+" + cleaned.slice(1);
      return isValidE164(asIs) ? asIs : null;
    }
    if (/^0\d{10}$/.test(cleaned)) {
      const converted = "+234" + cleaned.slice(1);
      return isValidE164(converted) ? converted : null;
    }
    if (/^234\d{10}$/.test(cleaned)) {
      const converted = "+" + cleaned;
      return isValidE164(converted) ? converted : null;
    }
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
      setUploadingProfile(true);
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
      setUploadingProfile(false);
    }
  };

  const handlePhoneChange = (value) => {
    setPhoneInput(value);
    setPhoneError("");
    setPhoneSuggested("");
    const suggestion = formatToInternational(value);
    if (suggestion) {
      if (suggestion !== value.trim()) setPhoneSuggested(suggestion);
      else setPhoneSuggested("");
    } else {
      const cleaned = cleanInput(value);
      if (cleaned && !value.trim().startsWith("+"))
        setPhoneError("Please include the country code (e.g. +234 for Nigeria).");
    }
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

  const handleDeleteUser = async () => {
    if (!formData._id) return setMsg("User ID not found.", "error");
    try {
      setLoading(true);
      await axiosBase.delete(`/api/auth/delete-user/${formData._id}`);
      setMsg("Account deleted successfully.", "success");
      setShowDeleteConfirm(false);
      localStorage.removeItem("springsCircleUser");
      window.location.href = "/";
    } catch (err) {
      setMsg(err?.response?.data?.message || "Failed to delete user.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
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
      localStorage.setItem("springsCircleUser", JSON.stringify(updatedUser));
      updateUser(updatedUser);
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

  const activeSection = SECTIONS.find((s) => s.id === activeTab);

  const renderField = ({ key, label, textarea, select, placeholder }) => {
    if (key === "phone") return null;
    return (
      <div key={key}>
        <label className="pm-field-label">{label}</label>
        {textarea ? (
          <textarea
            className="pm-input pm-textarea"
            placeholder={placeholder}
            value={formData[key] || ""}
            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          />
        ) : select ? (
          <div className="pm-select-wrap">
            <select
              className="pm-input pm-select"
              value={formData[key] || ""}
              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
            >
              <option value="">Select {label.toLowerCase()}</option>
              {select.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown className="chevron" />
          </div>
        ) : (
          <input
            type="text"
            className="pm-input"
            placeholder={placeholder}
            value={formData[key] || ""}
            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          />
        )}
      </div>
    );
  };

  return (
    <>
      <style>{styles}</style>

      {alert.show && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ show: false, message: "", type: "" })}
        />
      )}

      <button className="pm-close-btn" onClick={handleCancel} aria-label="Close">
        <X size={18} />
      </button>

      <div className="pm-overlay">
        <div className="pm-shell">
          <div className="pm-card">

            {/* ── Hero / Cover ── */}
            <div className="pm-hero">
              <div className="pm-hero-grid" />
              <div className="pm-cover-wrapper">
                <CoverPhotoEditor
                  coverPreview={coverPreview}
                  setCoverPreview={(url) => setFormData((p) => ({ ...p, coverPhotoUrl: url }))}
                  uploadingCover={uploadingCover}
                  setFormData={setFormData}
                  setUploadingCover={setUploadingCover}
                  setMsg={setMsg}
                />
              </div>

              {/* Avatar */}
              <div className="pm-avatar-zone">
                <label className="pm-avatar-ring">
                  <div className={uploadingProfile ? "pm-uploading" : ""}>
                    <ProfileAvatar
                      user={{
                        name: formData.name || "?",
                        profilePicUrl: preview || formData.profilePicUrl || "",
                        profilePicBackground: formData.profilePicBackground || "#b3b3b3",
                      }}
                      size={96}
                    />
                  </div>
                  {uploadingProfile && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "rgba(255,255,255,0.5)" }}>
                      <ProfileAvatarSkeleton size={96} />
                    </div>
                  )}
                  <div className="pm-avatar-overlay">
                    <Camera size={20} color="#fff" />
                  </div>
                  <input type="file" accept="image/*" onChange={handleUpload} />
                </label>
              </div>
            </div>

            {/* ── Name + username strip ── */}
            <div className="pm-header-pad">
              <div>
                <h2 className="pm-header-name">{formData.name || "Your Name"}</h2>
                <p className="pm-header-sub">
                  {formData.username ? `@${formData.username}` : "Set your username below"}
                </p>
              </div>
            </div>

            {/* ── Section Tabs ── */}
            <div className="pm-tabs">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`pm-tab ${activeTab === id ? "active" : ""}`}
                  onClick={() => setActiveTab(id)}
                >
                  <Icon />
                  {label}
                </button>
              ))}
              <button
                type="button"
                className={`pm-tab ${activeTab === "phone" ? "active" : ""}`}
                onClick={() => setActiveTab("phone")}
              >
                <Phone size={14} />
                Contact
              </button>
            </div>

            {/* ── Body ── */}
            <form onSubmit={handleSaveProfile}>
              <div className="pm-body">

                {/* Section header tag */}
                {activeSection && (
                  <div className="pm-section-tag">
                    <span>{activeSection.label}</span>
                  </div>
                )}
                {activeTab === "phone" && (
                  <div className="pm-section-tag">
                    <span>Contact</span>
                  </div>
                )}

                {/* Section fields */}
                {activeSection && (
                  <div className="pm-fields">
                    {activeSection.fields.map(renderField)}
                  </div>
                )}

                {/* Phone tab */}
                {activeTab === "phone" && (
                  <div className="pm-fields">
                    <div>
                      <label className="pm-field-label">Phone number</label>
                      <input
                        type="text"
                        inputMode="tel"
                        className={`pm-input ${phoneError ? "error" : ""}`}
                        value={phoneInput}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        onBlur={handlePhoneBlur}
                        placeholder="+2348012345678 or 08012345678"
                        aria-invalid={!!phoneError}
                      />
                      {phoneSuggested && !phoneError && (
                        <p className="pm-phone-hint suggest">
                          Suggested: <strong>{phoneSuggested}</strong> — will be saved in international format
                        </p>
                      )}
                      {phoneError && <p className="pm-phone-hint err">{phoneError}</p>}
                      {!phoneError && !phoneSuggested && phoneInput && isValidE164(phoneInput) && (
                        <p className="pm-phone-hint ok">✓ Valid international number</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Delete confirm banner ── */}
              {showDeleteConfirm && (
                <div className="pm-confirm-banner">
                  <AlertTriangle size={18} />
                  <div>
                    <p>This will permanently delete your account and all associated data. This action cannot be undone.</p>
                    <div className="pm-confirm-actions">
                      <button type="button" className="pm-confirm-yes" onClick={handleDeleteUser} disabled={loading}>
                        {loading ? "Deleting…" : "Yes, delete my account"}
                      </button>
                      <button type="button" className="pm-confirm-no" onClick={() => setShowDeleteConfirm(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Footer ── */}
              <div className="pm-footer">
                <button
                  type="button"
                  className="pm-btn-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 size={14} />
                  Delete account
                </button>

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <button type="button" className="pm-btn-ghost" onClick={handleCancel}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="pm-btn-save"
                    disabled={loading || uploadingProfile || uploadingCover}
                  >
                    <Save size={16} />
                    {loading ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileModal;