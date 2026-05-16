import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axiosBase from '../../utils/axiosBase';
import toast from 'react-hot-toast';

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Non-binary', value: 'non-binary' },
  { label: 'Prefer not to say', value: 'prefer-not-to-say' },
];

const PersonalInfo = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [personalInfo, setPersonalInfo] = useState({
    dateOfBirth: '',
    gender: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setPersonalInfo({
        dateOfBirth: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
        gender: user.gender || '',
        location: user.location || '',
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setPersonalInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axiosBase.put(
        '/api/settings/personal-info',
        {
          dob: personalInfo.dateOfBirth,
          gender: personalInfo.gender,
          location: personalInfo.location,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success('Personal information updated successfully');
      } else {
        toast.error(res.data.message || 'Error saving personal info');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving personal info');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadData = () => {
    alert('Your data download will begin shortly. Check your email for the link.');
  };

  return (
    <div>
      {!isEmbedded && (
        <div className="max-w-2xl mx-auto p-4 md:p-6">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:opacity-70 transition"
              style={{ backgroundColor: 'var(--form-bg)' }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: 'white' }} />
            </button>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-main)' }}>
              Personal Info
            </h1>
          </div>
        </div>
      )}

      <div className={!isEmbedded ? 'max-w-2xl mx-auto p-4 md:p-6' : 'sr-page sr-stagger'}>
        <p className="sr-section-heading">Personal Information</p>

        {/* Date of Birth */}
        <div className="sr-card" style={{ marginBottom: 10 }}>
          <label className="sr-label">
            <Calendar size={12} style={{ display: 'inline', marginRight: 5 }} />
            Date of Birth
          </label>
          <input
            type="date"
            className="sr-input"
            value={personalInfo.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
          />
        </div>

        {/* Gender */}
        <div className="sr-card" style={{ marginBottom: 10 }}>
          <label className="sr-label">Gender (Optional)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {GENDER_OPTIONS.map((option) => (
              <label key={option.value} className="sr-radio-card">
                <input
                  type="radio"
                  name="gender"
                  value={option.value}
                  checked={personalInfo.gender === option.value}
                  onChange={() => handleInputChange('gender', option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="sr-card" style={{ marginBottom: 16 }}>
          <label className="sr-label">
            <MapPin size={12} style={{ display: 'inline', marginRight: 5 }} />
            Location
          </label>
          <input
            type="text"
            className="sr-input"
            value={personalInfo.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="City, Country"
          />
        </div>

        {/* Save Button */}
        <button
          className="sr-btn-primary custom-gradient"
          disabled={loading}
          onClick={handleSave}
        >
          {loading ? 'Saving…' : 'Save Changes'}
        </button>

        {/* Data & Privacy */}
        <div className="sr-divider" />
        <p className="sr-section-heading">Data & Privacy</p>
        <button className="sr-btn-secondary" onClick={handleDownloadData}>
          Download My Data
        </button>
        <p style={{ fontSize: '.73rem', color: 'var(--text-secondary)', marginTop: 8 }}>
          Request a copy of all your personal data in a standard format.
        </p>
      </div>
    </div>
  );
};

export default PersonalInfo;