import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, MapPin } from 'lucide-react';

const PersonalInfo = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const [personalInfo, setPersonalInfo] = useState({
    dateOfBirth: '1995-01-15',
    gender: 'prefer-not-to-say',
    location: 'New York, USA'
  });

  const handleInputChange = (field, value) => {
    setPersonalInfo({ ...personalInfo, [field]: value });
  };

  const handleSave = () => {
    console.log('Saving personal info:', personalInfo);
    alert('Personal information updated successfully');
  };

  const handleDownloadData = () => {
    alert('Your data download will begin shortly. Check your email for the link.');
  };

  return (
    <div>
      {!isEmbedded && (
        <div className="max-w-2xl mx-auto p-4 md:p-6">
          {/* Header */}
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
      <div className={!isEmbedded ? 'max-w-2xl mx-auto p-4 md:p-6' : ''}>
        {/* Personal Information Form */}
        <div className="mb-8 space-y-6">
          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-main)' }}>
              Date of Birth
            </label>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5" style={{ color: 'white' }} />
              <input
                type="date"
                value={personalInfo.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--form-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-main)'
                }}
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-main)' }}>
              Gender (Optional)
            </label>
            <div className="space-y-2">
              {[
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Non-binary', value: 'non-binary' },
                { label: 'Prefer not to say', value: 'prefer-not-to-say' }
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:opacity-80 transition"
                  style={{ backgroundColor: 'var(--form-bg)', border: '1px solid var(--input-border)' }}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={option.value}
                    checked={personalInfo.gender === option.value}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-4 h-4"
                  />
                  <span style={{ color: 'var(--text-main)' }}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-main)' }}>
              Location
            </label>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5" style={{ color: 'white' }} />
              <input
                type="text"
                value={personalInfo.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, Country"
                className="flex-1 px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--form-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-main)'
                }}
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full px-4 py-2 rounded-lg custom-gradient text-white font-semibold hover:opacity-90 transition"
          >
            Save Changes
          </button>
        </div>

        {/* Data Download */}
        <div className="border-t pt-8" style={{ borderColor: 'var(--input-border)' }}>
          <h2 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-main)' }}>
            Data & Privacy
          </h2>
          <button
            onClick={handleDownloadData}
            className="w-full px-4 py-2 rounded-lg font-semibold transition"
            style={{
              backgroundColor: 'var(--form-bg)',
              border: '1px solid var(--input-border)',
              color: 'var(--text-main)'
            }}
          >
            Download My Data
          </button>
          <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
            Request a copy of all your personal data in a standard format.
          </p>
        </div>
      </div>
    </div>
  );
};
export default PersonalInfo;
