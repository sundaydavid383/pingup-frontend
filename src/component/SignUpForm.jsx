import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Loading from './shared/Loading';
import '../styles/ui.css';
import '../styles/signupform.css';
import axios from 'axios';
import { useAuth } from "../context/AuthContext";
import location from "../utils/location";
import { Eye, EyeOff, MapPin, ChevronDown, Check } from "lucide-react";
import ProfileAvatar from './shared/ProfileAvatar';
import LocationDropdown from './shared/LocationDropdown';

const steps = ['Basic Info', 'Profile Details', 'Interests', 'Bio'];

const ValidationItem = ({ isValid, label }) => (
  <div className={`sf-val-item ${isValid ? 'sf-val-valid' : 'sf-val-invalid'}`}>
    <span className="sf-val-icon">{isValid ? '✓' : '✗'}</span>
    <span>{label}</span>
  </div>
);

<LocationDropdown/>

const GenderSelect = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const options = ['Male', 'Female', 'Prefer not to say'];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="sf-select-wrap" ref={ref}>
      <button type="button" className="sf-select-btn" onClick={() => setOpen(!open)}>
        <span className={value ? 'sf-select-value' : 'sf-select-placeholder'}>
          {value || 'Gender'}
        </span>
        <ChevronDown size={15} className={`sf-loc-chevron ${open ? 'sf-loc-chevron-open' : ''}`} />
      </button>
      {open && (
        <div className="sf-loc-dropdown">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`sf-loc-option ${value === opt ? 'sf-loc-option-selected' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); onChange(opt); setOpen(false); }}
            >
              <span>{opt}</span>
              {value === opt && <Check size={12} className="sf-loc-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const INTERESTS = [
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'tech', label: 'Tech & Innovation', emoji: '💻' },
  { id: 'art', label: 'Art & Design', emoji: '🎨' },
  { id: 'fitness', label: 'Fitness & Health', emoji: '🏋️' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'reading', label: 'Books & Reading', emoji: '📚' },
  { id: 'cooking', label: 'Cooking & Food', emoji: '🍳' },
  { id: 'photography', label: 'Photography', emoji: '📷' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'volunteering', label: 'Volunteering', emoji: '🤝' },
  { id: 'entrepreneurship', label: 'Entrepreneurship', emoji: '🚀' },
  { id: 'nature', label: 'Nature & Outdoors', emoji: '🌿' },
  { id: 'mental_health', label: 'Mental Wellness', emoji: '🧘' },
  { id: 'movies', label: 'Movies & TV', emoji: '🎬' },
  { id: 'fashion', label: 'Fashion & Style', emoji: '👗' },
];

const InterestChips = ({ value, onChange }) => {
  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  const toggle = (id) => {
    const current = new Set(selected);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    onChange([...current].join(', '));
  };

  return (
    <div className="sf-chips-wrap">
      <p className="sf-chips-hint">Pick what excites you — connect with people who share your passions</p>
      <div className="sf-chips-grid">
        {INTERESTS.map((interest) => {
          const isOn = selected.includes(interest.id);
          return (
            <button
              key={interest.id}
              type="button"
              onClick={() => toggle(interest.id)}
              className={`sf-chip ${isOn ? 'sf-chip-on' : 'sf-chip-off'}`}
            >
              <span className="sf-chip-emoji">{interest.emoji}</span>
              <span>{interest.label}</span>
              {isOn && <span className="sf-chip-check"><Check size={10} /></span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const SignUpForm = ({ onSwitchToLogin, showAlert }) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState('');
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '', username: '', email: '', password: '', confirmPassword: '',
    occupation: '', dob: '', gender: '', location: '',
    churchName: '', prayerRequest: '', interests: '', bio: '', profilePicUrl: '',
  });

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleBack = () => {
    if (step > 0) { setDirection(-1); setStep(step - 1); }
  };

  const checkIfUserNameExist = async (username) => {
    try {
      setLoading(true); setLoadingText("Checking username…");
      const response = await axios.get(`${import.meta.env.VITE_SERVER}api/auth/check-username/${username}`);
      return response.data.exists;
    } catch { return true; }
    finally { setLoading(false); }
  };

  const checkIfEmailExists = async (email) => {
    try {
      setLoading(true); setLoadingText("Verifying email…");
      const response = await axios.post(`${import.meta.env.VITE_SERVER}api/auth/check-email`, { email: email.trim().toLowerCase() });
      return !response.data.success;
    } catch { return true; }
    finally { setLoading(false); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('profilePic', file);
    try {
      setLoading(true); setLoadingText('Uploading image…');
      const res = await axios.post(`${import.meta.env.VITE_SERVER}api/auth/upload-image`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, profilePicUrl: res.data.url }));
      showAlert('Profile picture uploaded!', 'success');
    } catch {
      showAlert('Failed to upload image.', 'error');
    } finally { setLoading(false); }
  };

  const validateStep = async () => {
    const { name, username, email, password, confirmPassword, dob, gender, occupation, interests, bio } = formData;
    if (step === 0) {
      if (!/^[A-Za-z\s]+$/.test(name.trim())) return 'Name must contain only letters and spaces';
      if (!name.trim().includes(' ') || name.trim().split(/\s+/).length < 2) return 'Please enter both first and last name';
      if (name.trim().length < 3 || name.trim().length > 50) return 'Name must be 3–50 characters long';
      if (!email.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address';
      const emailTaken = await checkIfEmailExists(email);
      if (emailTaken) return "This email is already registered.";
      if (!password) return 'Password is required';
      if (password.length < 6) return 'Password must be at least 6 characters';
      if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one letter';
      if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
      if (password !== confirmPassword) return 'Passwords do not match';
    }
    if (step === 1) {
      if (!dob.trim()) return 'Date of Birth is required';
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      if (isNaN(age)) return 'Date of Birth must be a valid date';
      if (age < 13) return 'You must be at least 13 years old';
      if (!gender) return 'Please select a gender';
      if (occupation?.trim()) {
        if (occupation.trim().length < 2 || occupation.trim().length > 50) return 'Occupation must be 2–50 characters';
      }
    }
    if (step === 2) {
      if (interests?.trim() && interests.trim().length < 3) return 'Please share more about your interests';
    }
    if (step === 3) {
      if (!username || username.length < 3 || username.length > 15) return "Username must be 3–15 characters";
      const isTaken = await checkIfUserNameExist(formData.username);
      if (isTaken) return "Username already taken. Please choose another.";
      if (bio?.trim() && bio.trim().length < 10) return 'Bio must be at least 10 characters';
      if (bio?.trim() && bio.trim().length > 500) return 'Bio must be under 500 characters';
    }
    return null;
  };

  const handleNext = async () => {
    const error = await validateStep();
    if (error) {
      showAlert(error, 'error');
      return;
    }
    if (step < steps.length - 1) {
      setDirection(1); setStep(step + 1);
    } else {
      setLoading(true); setLoadingText("Creating your account…");
      try {
        const { latitude, longitude, city, country } = await location();
        const response = await axios.post(`${import.meta.env.VITE_SERVER}api/auth/register`, {
          ...formData, currentCity: city, country, latitude, longitude
        });
        setLoading(false);
        showAlert(response.data.message || "Registration successful! Check your email for the OTP.", 'success');
        setUserId(response.data.userId);
        setShowOtpInput(true);
      } catch (err) {
        setLoading(false);
        const serverErrors = err.response?.data?.errors;
        showAlert(
          serverErrors ? Object.values(serverErrors).join('\n') : err.response?.data?.message || "Something went wrong",
          'error'
        );
      }
    }
  };

  const pwChecks = [
    { isValid: formData.password.length >= 8, label: "Minimum 8 characters" },
    { isValid: /[A-Z]/.test(formData.password), label: "At least 1 uppercase" },
    { isValid: /[a-z]/.test(formData.password), label: "At least 1 lowercase" },
    { isValid: /\d/.test(formData.password), label: "At least 1 number" },
    { isValid: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password), label: "At least 1 special character" },
  ];

  return (
    <div className="sf-root">
      {loading && <Loading text={loadingText} />}

      <div className="sf-spine">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className={`sf-spine-node ${i < step ? 'sf-spine-done' : i === step ? 'sf-spine-active' : 'sf-spine-pending'}`}>
              {i < step ? <Check size={11} /> : <span>{i + 1}</span>}
            </div>
            {i < steps.length - 1 && (
              <div className={`sf-spine-bar ${i < step ? 'sf-spine-bar-done' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="sf-step-label">{steps[step]}</div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.form
          key={step}
          custom={direction}
          initial={{ x: direction > 0 ? 60 : -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction > 0 ? -60 : 60, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          onSubmit={(e) => e.preventDefault()}
          className="sf-form"
        >
          {step === 0 && (
            <div className="sf-fields">
              <div className="sf-field-group">
                <label className="sf-label">Full Name</label>
                <input type="text" name="name" placeholder="e.g. Amara Johnson"
                  value={formData.name} onChange={handleChange} className="sf-input" required />
              </div>
              <div className="sf-field-group">
                <label className="sf-label">Email Address</label>
                <input type="email" name="email" placeholder="you@example.com"
                  value={formData.email} onChange={handleChange} className="sf-input" autoComplete="email" required />
              </div>
              <div className="sf-field-group">
                <label className="sf-label">Password</label>
                <div className="sf-pw-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password" placeholder="Create a strong password"
                    value={formData.password} onChange={handleChange}
                    className="sf-input sf-input-pw" autoComplete="off"
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="sf-pw-toggle">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {formData.password.length > 0 && (
                  <div className="sf-pw-checks">
                    {pwChecks.map((c, i) => <ValidationItem key={i} isValid={c.isValid} label={c.label} />)}
                  </div>
                )}
              </div>
              <div className="sf-field-group">
                <label className="sf-label">Confirm Password</label>
                <input type="password" name="confirmPassword" placeholder="Repeat your password"
                  value={formData.confirmPassword} onChange={handleChange} className="sf-input" required />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="sf-fields">
              <div className="sf-field-group">
                <label className="sf-label">Profile Picture <span className="sf-optional">(optional)</span></label>
                {!formData.profilePicUrl ? (
                  <div className="sf-upload-zone" onClick={() => document.getElementById('profilePicInput').click()}>
                    <div className="sf-upload-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <span className="sf-upload-label">Tap to upload</span>
                    <span className="sf-upload-sub">PNG, JPG, GIF — max 5MB</span>
                    <input id="profilePicInput" type="file" accept="image/*" onChange={handleImageUpload} className="sf-upload-input" />
                  </div>
                ) : (
                  <div className="sf-avatar-preview">
                    <ProfileAvatar user={{ profilePicUrl: formData.profilePicUrl }} size={80} />
                    <button type="button" onClick={() => setFormData(p => ({ ...p, profilePicUrl: '' }))} className="sf-avatar-remove">×</button>
                  </div>
                )}
              </div>
              <div className="sf-field-group">
                <label className="sf-label">Date of Birth</label>
                <input name="dob" type="date" value={formData.dob}
                  onChange={handleChange} required className="sf-input sf-input-date" />
              </div>
              <div className="sf-field-group">
                <label className="sf-label">Gender</label>
                <GenderSelect value={formData.gender} onChange={(val) => setFormData(p => ({ ...p, gender: val }))} />
              </div>
              <div className="sf-field-group">
                <label className="sf-label">Occupation <span className="sf-optional">(optional)</span></label>
                <input name="occupation" placeholder="e.g. Software Engineer"
                  value={formData.occupation} onChange={handleChange} className="sf-input" />
              </div>
              <div className="sf-field-group">
                <label className="sf-label">Location <span className="sf-optional">(optional)</span></label>
                <LocationDropdown value={formData.location} onChange={(val) => setFormData(p => ({ ...p, location: val }))} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="sf-fields">
              <div className="sf-field-group">
                <label className="sf-label">Your Interests <span className="sf-optional">(optional)</span></label>
                <InterestChips value={formData.interests} onChange={(val) => setFormData(p => ({ ...p, interests: val }))} />
              </div>
            </div>
          )}

          {step === 3 && !showOtpInput && (
            <div className="sf-fields">
              <div className="sf-field-group">
                <label className="sf-label">Username</label>
                <div className="sf-username-wrap">
                  <span className="sf-username-prefix">@</span>
                  <input type="text" name="username" placeholder="yourhandle"
                    value={formData.username} onChange={handleChange}
                    className="sf-input sf-input-username" required />
                </div>
                <p className="sf-field-hint">3–15 characters, no spaces</p>
              </div>
              <div className="sf-field-group">
                <label className="sf-label">Bio <span className="sf-optional">(optional)</span></label>
                <textarea name="bio" placeholder="Tell people a little about yourself…"
                  value={formData.bio} onChange={handleChange} rows={4} className="sf-textarea" />
                <p className="sf-char-count">{formData.bio.length}/500</p>
              </div>
            </div>
          )}

          {step === 3 && showOtpInput && (
            <div className="sf-otp-section">
              <div className="sf-otp-icon">✉️</div>
              <p className="sf-otp-title">Check your email</p>
              <p className="sf-otp-sub">We sent a 6-digit code to <strong>{formData.email}</strong></p>
              <div className="sf-otp-inputs">
                <input type="text" name="otp" value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP" className="sf-input sf-input-otp" maxLength={6} />
              </div>
              <button
                type="button" className="sf-btn sf-btn-primary"
                onClick={async () => {
                  try {
                    setLoading(true); setLoadingText("Verifying OTP…");
                    const res = await axios.post(`${import.meta.env.VITE_SERVER}api/auth/verify-otp`, { userId, otp });
                    if (res.data.success) {
                      showAlert(res.data.message, 'success');
                      login(res.data.user, res.data.token);
                    } else {
                      showAlert(res.data.message || 'OTP verification failed', 'error');
                    }
                  } catch (err) {
                    showAlert(err.response?.data?.message || 'OTP verification failed', 'error');
                  } finally { setLoading(false); }
                }}
              >
                Verify & Continue
              </button>
              <button
                type="button" className="sf-resend-btn"
                onClick={async () => {
                  try {
                    setLoading(true); setLoadingText("Resending OTP…");
                    const res = await axios.post(`${import.meta.env.VITE_SERVER}api/auth/resend-otp`, { userId });
                    showAlert(res.data.message || "OTP resent.", 'success');
                  } catch (err) {
                    showAlert(err.response?.data?.message || "Failed to resend OTP.", 'error');
                  } finally { setLoading(false); }
                }}
              >
                Didn't receive it? Resend OTP
              </button>
            </div>
          )}

          {!(step === 3 && showOtpInput) && (
            <div className="sf-nav">
              {step > 0 && (
                <button type="button" onClick={handleBack} className="sf-btn sf-btn-back">← Back</button>
              )}
              <button
                type="button" onClick={handleNext}
                className={`sf-btn sf-btn-primary ${step === 0 ? 'sf-btn-full' : ''}`}
              >
                {step < steps.length - 1 ? 'Continue →' : 'Create Account'}
              </button>
            </div>
          )}

          <p className="sf-switch">
            Already have an account?{" "}
            <button type="button" className="sf-switch-btn" onClick={onSwitchToLogin}>Log in</button>
          </p>
        </motion.form>
      </AnimatePresence>
    </div>
  );
};

export default SignUpForm;