import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axiosBase from '../../utils/axiosBase';
import toast from 'react-hot-toast';

const ALL_INTERESTS = [
  'spirituality',
  'technology',
  'sports',
  'entertainment',
  'news',
  'health',
  'education',
  'business',
  'music',
  'art',
  'travel',
  'food',
];

const ContentPreferences = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load user interests on mount
  useEffect(() => {
    if (user?.interests) {
      setInterests(user.interests);
    }
  }, [user]);

  const toggleInterest = (interest) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axiosBase.put(
        '/api/settings/content-preferences',
        { interests },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success('Content preferences updated successfully');
      } else {
        toast.error(res.data.message || 'Error saving preferences');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving preferences');
    } finally {
      setLoading(false);
    }
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
            <h1
              className="text-3xl font-bold"
              style={{ color: 'var(--text-main)' }}
            >
              Content Preferences
            </h1>
          </div>
        </div>
      )}

      <div className={!isEmbedded ? 'max-w-2xl mx-auto p-4 md:p-6' : 'sr-page'}>
        {/* Section heading */}
        <p className="sr-section-heading">Your Interests</p>
        <p
          style={{
            fontSize: '.8rem',
            color: 'var(--text-secondary)',
            marginBottom: 16,
          }}
        >
          Select topics that interest you for a personalised feed.
        </p>

        {/* Interest grid */}
        <div
          className="sr-interest-grid sr-stagger"
          style={{ marginBottom: 24 }}
        >
          {ALL_INTERESTS.map((interest) => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`sr-interest-btn${
                interests.includes(interest)
                  ? ' sr-interest-active custom-gradient'
                  : ''
              }`}
              style={
                !interests.includes(interest)
                  ? {
                      backgroundColor: 'var(--form-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-main)',
                    }
                  : {}
              }
            >
              {interests.includes(interest) && (
                <Check size={12} style={{ color: '#fff' }} />
              )}
              {interest}
            </button>
          ))}
        </div>

        {/* Save button */}
        <button
          className="sr-btn-primary custom-gradient"
          disabled={loading}
          onClick={handleSave}
        >
          {loading ? 'Saving…' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

export default ContentPreferences;