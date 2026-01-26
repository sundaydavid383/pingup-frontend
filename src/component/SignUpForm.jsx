// SignUpForm.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomAlert from './shared/CustomAlert';
import Loading from './shared/Loading';
import '../styles/ui.css';
import './signUpForm.css';
import axios from 'axios';
import { useAuth } from "../context/AuthContext";
import location from "../utils/location"


const steps = [
  'Basic Info',
  'Profile Details',
  // 'Spiritual Info',
  'Interests',
  'Bio',
];

const ValidationItem = ({ isValid, label }) => (
  <div style={{ color: isValid ? '#2fdf2f' : '#f14b4b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <span>{isValid ? '✔️' : '❌'}</span>
    <span>{label}</span>
  </div>
);

const SignUpForm = ({ onSwitchToLogin }) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("")
  const [alert, setAlert] = useState({ show: false, message: '', type: 'error' });
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState('');
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username:'',
    email: '',
    password: '',
    confirmPassword: '',
    occupation: '',
    dob: '',
    gender: '',
    location: '',
    churchName: '',
    prayerRequest: '',
    interests: '',
    bio: '',
    profilePicUrl: '',
  });

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

const checkIfUserNameExist = async (username) => {
  try {
    setLoading(true);
    setLoadingText("Verifing if username has not been used...");
    const response = await axios.get(`${import.meta.env.VITE_SERVER}api/auth/check-username/${username}`);
    return response.data.exists; // true if taken, false if available
  } catch (error) {
    console.error("Error checking username:", error);
    return true; // assume taken if error, to be safe
  }
  finally{
    setLoading(false)
  }
};

const checkIfEmailExists = async (email) => {
  try {
    setLoading(true);
    setLoadingText("Verifying email...");

    const response = await axios.post(
      `${import.meta.env.VITE_SERVER}api/auth/check-email`,
      { email: email.trim().toLowerCase() }
    );

    // Backend returns success: false when email EXISTS
    const emailExists = !response.data.success;

    return emailExists;
  } catch (error) {
    console.error("Email check error:", error.response?.data || error);
    return true; // treat as exists if error
  } finally {
    setLoading(false);
  }
};


   
  const handleImageUpload = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const form = new FormData();
            form.append('profilePic', file);

            try {
              setLoading(true);
              setLoadingText('Uploading image...');
              const res = await axios.post(`${import.meta.env.VITE_SERVER}api/auth/upload-image`, form, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });

              setFormData(prev => ({
                ...prev,
                profilePicUrl: res.data.url
              }));

              setAlert({
                show: true,
                message: 'Profile picture uploaded successfully!',
                type: 'success'
              });
            } catch (err) {
              console.error(err);
              setAlert({
                show: true,
                message: 'Failed to upload image.',
                type: 'error'
              });
            } finally {
              setLoading(false);
            }
          };

  const validateStep = async () => {
    const {
      name,
      username,
      email,
      password,
      confirmPassword,
      dob,
      gender,
      occupation,
      location,
      churchName,
      interests,
      bio,
      prayerRequest,
      
    } = formData;

    // STEP 0: BASIC INFO
    if (step === 0) {
     if (!/^[A-Za-z\s]+$/.test(name.trim()))
        return 'Name must contain only letters and spaces';

      if (!name.trim().includes(' ') || name.trim().split(/\s+/).length < 2)
        return 'Please enter both first and last name';

      if (name.trim().length < 3 || name.trim().length > 50)
        return 'Name must be 3–50 characters long';
            if (!email.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        return 'Enter a valid email address';

      const emailTaken = await checkIfEmailExists(email);
      if (emailTaken) return "This email is already registered. Try another.";



   
    
      if (!password) return 'Password is required';
      if (password.length < 6)
        return 'Password must be at least 6 characters';
      if (password.length > 30)
        return 'Password must be 6–30 characters long';
      if (!/[a-zA-Z]/.test(password))
        return 'Password must contain at least one letter';
      if (!/[0-9]/.test(password))
        return 'Password must contain at least one number';
      if (password !== confirmPassword)
        return 'Passwords do not match';
    }

    // STEP 1: PROFILE DETAILS
if (step === 1) {
  if (!dob.trim()) return 'Date of Birth is required';

  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (isNaN(age)) return 'Date of Birth must be a valid date';
  
  // ✅ Enforce minimum age
  const MIN_AGE = 13; // standard minimum age to use websites
  if (age < MIN_AGE) return `You must be at least ${MIN_AGE} years old to register`;

  if (!gender) return 'Please select a gender';
  const validGenders = ['Male', 'Female', 'Prefer not to say'];
  if (!validGenders.includes(gender)) return 'Invalid gender selected';

 if (occupation && occupation.trim()) { 
  const occ = occupation.trim();

  if (occ.length < 2 || occ.length > 50)
    return 'Occupation must be 2–50 characters';
  if (!/^[a-zA-Z][a-zA-Z\s.'-]*$/.test(occ))
    return 'Occupation contains invalid characters';
}


 if (location && location.trim()) {
  const loc = location.trim();

  if (loc.length < 3 || loc.length > 100)
    return 'Location must be 3–100 characters long';

  // Same idea: must start with a letter
  if (!/^[a-zA-Z][a-zA-Z\s.'-]*$/.test(loc))
    return 'Location contains invalid characters';
}

}


    // STEP 2: SPIRITUAL INFO
    // if (step === 2) {
    //   if (churchName && churchName.trim()) {
    //     if (!/^[A-Za-z\s]+$/.test(churchName.trim()) || churchName.trim().length < 2)
    //       return 'Church name must be at least 2 letters and only contain letters and spaces';
    //   }

    //   if ( && .trim()) {
    //     if (!/^[a-zA-Z\s]{2,30}$/.test(churchRole.trim()))
    //       return 'Church role must be 2–30 characters and only letters/spaces';
    //   }

    //   if (prayerRequest && prayerRequest.trim()) {
    //     if (prayerRequest.trim().length < 5)
    //       return 'Prayer request must be at least 5 characters';
    //     if (prayerRequest.trim().length > 300)
    //       return 'Prayer request must be less than 300 characters';
    //   }
    // }

    // STEP 3: INTERESTS
    if (step === 2) {
      if (interests && interests.trim()) {
        if (interests.trim().length < 3)
          return 'Please share more about your interests';
        if (interests.trim().length > 300)
          return 'Interests must be less than 300 characters';
      }
    }

    // STEP 4: BIO
    if (step === 3) {
     if(!username || username.length < 3 || username.length > 15) return "Please enter a valid user name of more than 3 characters and less than 15 characters" 
    const isTaken = await checkIfUserNameExist(formData.username);
    if (isTaken) return "Username already exists. Please choose another.";
    
      if (bio && bio.trim()) {
        if (bio.trim().length < 10)
          return 'Bio must be at least 10 characters';
        if (bio.trim().length > 500)
          return 'Bio must be under 500 characters';
      }
    }

    return null;
  };


  const handleNext = async () => {
    const error = await validateStep();
    if (error) {
      setAlert({ show: true, message: error, type: 'error' });
      return;
    }

    if (step < steps.length - 1) {
      setDirection(1);
      setStep(step + 1);
    }
    else {
      setLoading(true);
      setLoadingText("registering user...")

      try {
        const {latitude, longitude, city, country} = await location();
        const response = await axios.post(`${import.meta.env.VITE_SERVER}api/auth/register`, {
          name: formData.name,
          email: formData.email,
          username: formData.username,   
          password: formData.password,
          dob: formData.dob,
          gender: formData.gender,
          occupation: formData.occupation,
          location: formData.location,
          churchName: formData.churchName,
          interests: formData.interests,
          bio: formData.bio,
          prayerRequest: formData.prayerRequest,
          profilePicUrl: formData.profilePicUrl,
          currentCity: city,
          country: country,
          latitude,
          longitude
        });


        setLoading(false);
        setAlert({
          show: true,
          message: response.data.message || "Registration successful! Please check your email for the OTP.",
          type: 'success',
        });
        setUserId(response.data.userId);
        setShowOtpInput(true);
        // Optional: reset form or redirect
        console.log("✅ Registered:", response.data.user);
      } catch (err) {
        setLoading(false);

        // Check if we got specific validation errors from the server
        const serverErrors = err.response?.data?.errors;

        if (serverErrors && typeof serverErrors === 'object') {
          const messages = Object.values(serverErrors).join('\n');

          setAlert({
            show: true,
            message: messages || "Validation failed.",
            type: 'error',
          });

          console.log("❌ Validation errors from server:", serverErrors);
        } else {
          setAlert({
            show: true,
            message: err.response?.data?.message || "Something went wrong",
            type: 'error',
          });

          console.log("❌ General error from server:", err.response?.data || err.message);
        }
      }
    }
  };

  return (
    <div className="relative w-full  mx-auto mt-8">
      <div
        className="absolute inset-0 backdrop-blur-2xl rounded-3xl shadow-2xl"
        style={{ backgroundColor: 'var(--form-bg)' }}
      ></div>

      {loading && <Loading text={loadingText} />}
      {alert.show && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ ...alert, show: false })}
        />
      )}

      <AnimatePresence mode="wait" custom={direction}>
        <motion.form
          key={step}
          custom={direction}
          initial={{ x: direction > 0 ? 100 : -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction > 0 ? -100 : 100, opacity: 0 }}
          transition={{ duration: 0.4 }}
          onSubmit={(e) => e.preventDefault()}
          className="relative z-10 w-full p-2 sm:p-3 text-[var(--text-main)] space-y-2"
        >
          <h2 className="text-2xl font-bold mt[-6] text-center" style={{ color: 'var(--color-text)' }}>
            {steps[step]}
          </h2>

          {/* Step 1: Basic Info */}
          {step === 0 && (
            <>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-xl bg-[var(--input-bg)] shadow-[var(--input-shadow)] placeholder-white/70 focus:outline-none"
              />
              <input
                autoComplete="email"
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-xl bg-[var(--input-bg)] shadow-[var(--input-shadow)] placeholder-white/70 focus:outline-none"
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
              <div className="password-validation" style={{ marginTop: '10px' }}>
                <ValidationItem
                  isValid={formData.password.length >= 8}
                  label="Minimum 8 characters"
                />
                <ValidationItem
                  isValid={/[A-Z]/.test(formData.password)}
                  label="At least 1 uppercase letter"
                />
                <ValidationItem
                  isValid={/[a-z]/.test(formData.password)}
                  label="At least 1 lowercase letter"
                />
                <ValidationItem
                  isValid={/\d/.test(formData.password)}
                  label="At least 1 number"
                />
                <ValidationItem
                  isValid={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)}
                  label="At least 1 special character"
                />
              </div>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-xl bg-[var(--input-bg)] shadow-[var(--input-shadow)] placeholder-white/70 focus:outline-none"
              />
            </>
          )}

          {/* Step 2: Profile Details */}
          {step === 1 && (
            <>
{/* ---------- Google-style File Upload with Reset ---------- */}
<div className="w-full mt-4">
  <label className="block mb-2 text-white/80 font-medium">
    Upload Profile Picture (optional)
  </label>

  {!formData.profilePicUrl ? (
    <div
      className="relative w-full cursor-pointer border-2 border-dashed border-white/50 rounded-xl
                 p-4 flex flex-col items-center justify-center
                 hover:border-blue-500 hover:bg-white/5 transition-colors duration-300"
      onClick={() => document.getElementById('profilePicInput').click()}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10 text-blue-500 mb-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v6m0-6l-3 3m3-3l3 3" />
      </svg>
      <span className="text-white/70 text-sm">Click to upload</span>
      <span className="text-white/50 text-xs mt-1">PNG, JPG, GIF (max 5MB)</span>

      <input
        id="profilePicInput"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  ) : (
    <div className="relative w-24 h-24 mx-auto mt-4">
      <img
        src={formData.profilePicUrl}
        alt="Preview"
        className="w-24 h-24 rounded-full object-cover shadow-md border-2 border-white"
      />
      <button
        type="button"
        onClick={() => setFormData(prev => ({ ...prev, profilePicUrl: '' }))}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-600 transition"
        title="Remove Image"
      >
        ×
      </button>
    </div>
  )}
</div>

              <input
                name="occupation"
                placeholder="Occupation (optional)"
                value={formData.occupation}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-[var(--input-bg)] shadow-[var(--input-shadow)] placeholder-white/70 focus:outline-none"
              />
<input
  name="dob"
  type="date"
  value={formData.dob}
  onChange={handleChange}
  required
  style={{
    color: '#fff',            // text color visible on dark bg
    backgroundColor: '#0c112b', // solid background to avoid transparency issues
    padding: '0.75rem 1rem',
    borderRadius: '1rem',
    border: '1px solid #555',
    boxShadow: 'inset 0 0 4px rgba(0,0,0,0.3)',
    fontSize: '1rem',
    width: '100%',
    WebkitAppearance: 'menulist-button', // forces proper dropdown rendering on Android
    appearance: 'auto',
  }}
/>


              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-white text-black shadow-[var(--input-shadow)] placeholder-gray-400 focus:outline-none"
              >
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              <input
                name="location"
                placeholder="Location (optional)"
                value={formData.location}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-[var(--input-bg)] shadow-[var(--input-shadow)] placeholder-white/70 focus:outline-none"
              />
            </>
          )}

          {/* Step 3: Spiritual Info */}
          {/* {step === 2 && (
            <>
              <input
                name="churchName"
                placeholder="Church Name (optional)"
                value={formData.churchName}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-[var(--input-bg)] shadow-[var(--input-shadow)] placeholder-white/70 focus:outline-none"
              />
              <input
                name="churchRole"
                placeholder="Role in Church (optional)"
                value={formData.churchRole}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-[var(--input-bg)] shadow-[var(--input-shadow)] placeholder-white/70 focus:outline-none"
              />
              <textarea
                name="prayerRequest"
                placeholder="Prayer Requests (optional)"
                value={formData.prayerRequest}
                onChange={handleChange}
                rows={3}
                className="w-full p-3 rounded-xl bg-[var(--input-bg)] shadow-[var(--input-shadow)] placeholder-white/70 focus:outline-none"
              />
            </>
          )} */}


          {step === 2 && (
            <div className="w-full">
              <label htmlFor="interests" className="block mb-2 text-white/80">
                Select your interests (optional)
              </label>
              <select
                name="interests"
                id="interests"
                value={formData.interests}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-[var(--input-bg)] text-[var(--input-text)] shadow-[var(--input-shadow)] placeholder-white/70 focus:outline-none appearance-none"
              >
                <option value="" className="text-black">Choose one</option>
                <option value="Music" className="text-black">Music</option>
                <option value="Volunteering" className="text-black">Volunteering</option>
                <option value="Bible Study" className="text-black">Bible Study</option>
                <option value="Tech & Media" className="text-black">Tech & Media</option>
                <option value="Sports" className="text-black">Sports</option>
                <option value="Youth Programs" className="text-black">Youth Programs</option>
                <option value="Prayer & Counseling" className="text-black">Prayer & Counseling</option>
                <option value="I'm just exploring" className="text-black">I'm just exploring</option>
              </select>
                
            </div>
          )}

          {step === 3 && (<>
            <textarea
              name="bio"
              placeholder="Short bio or testimony (optional)"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className="w-full p-3 rounded-xl bg-[var(--input-bg)] shadow-[var(--input-shadow)] placeholder-white/70 focus:outline-none"
            />
            <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full p-3 rounded-xl bg-[var(--input-bg)] shadow-[var(--input-shadow)] placeholder-white/70 focus:outline-none"
          />
          </>)}
          {step === 3 && showOtpInput ? (
            <div className="mt-6 space-y-3">
              <input
                type="text"
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="w-full p-3 rounded-xl bg-[var(--input-bg)] placeholder-white/70 focus:outline-none"
              />
              <button
                onClick={async () => {
                  try {
                    setLoading(true)
                    setLoadingText("verifing OTP..")
                    const res = await axios.post(`${import.meta.env.VITE_SERVER}api/auth/verify-otp`, {
                      userId,
                      otp
                    });
                    if (res.data.success) {
                      setAlert({
                        show: true,
                        message: res.data.message,
                        type: 'success',
                      });

                      // Login user into context and localStorage
                      login(res.data.user, res.data.token);

                    } else {
                      setAlert({
                        show: true,
                        message: res.data.message || 'OTP verification failed',
                        type: 'error',
                      });
                    }

                  } catch (err) {
                    setAlert({
                      show: true,
                      message: err.response?.data?.message || 'OTP verification failed',
                      type: 'error',
                    });
                  }
                  finally {
                    setLoading(false)
                  }
                }}
                className="btn w-full rounded-xl"
              >
                Verify OTP
              </button>
              <button
                type="button"
                className="w-full text-sm text-[var(--text-main)] underline hover:text-white transition"
                onClick={async () => {
                  try {
                    setLoading(true);
                    setLoadingText("Resending OTP...");

                    const res = await axios.post(`${import.meta.env.VITE_SERVER}api/auth/resend-otp`, {
                      userId,
                    });

                    setAlert({
                      show: true,
                      message: res.data.message || "OTP resent successfully.",
                      type: 'success',
                    });
                  } catch (err) {
                    setAlert({
                      show: true,
                      message: err.response?.data?.message || "Failed to resend OTP.",
                      type: 'error',
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Didn’t receive OTP? Resend it
              </button>

            </div>
          ) :

            <div className="flex justify-between items-center gap-4 mt-4">
              {step > 0 && (
                <button
                  onClick={handleBack}
                  type="button"
                  className="w-1/2 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-xl transition"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                type="button"
                className={`btn ${step > 0 ? 'w-1/2' : 'w-full'}`}
              >
                {step < steps.length - 1 ? 'Next' : 'Finish'}
              </button>
            </div>
          }

          <p className="text-sm text-center text-white/60">
            Step {step + 1} of {steps.length}
          </p>
          <p className="text-center text-sm text-white/70">
            Already have an account?{" "}
            <button
              type="button"
              className="text-[var(--text-main)] font-medium underline"
              onClick={onSwitchToLogin}
            >
              Log in here
            </button>
          </p>
        </motion.form>
      </AnimatePresence>
    </div>
  );
};

export default SignUpForm;