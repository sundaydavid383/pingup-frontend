import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axiosBase from '../../utils/axiosBase';
import toast from 'react-hot-toast';

const ContentPreferences = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(false);

  // All available interests
  const availableInterests = [
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
    'food'
  ];

  // Load user interests on mount
  useEffect(() => {
    if (user?.interests) {
      setInterests(user.interests);
    }
  }, [user]);

  const toggleInterest = (interest) => {
    setInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axiosBase.put('/api/settings/content-preferences', {
        interests
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
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
              Content Preferences
            </h1>
          </div>
        </div>
      )}
      <div className={!isEmbedded ? 'max-w-2xl mx-auto p-4 md:p-6' : ''}>
        {/* Interests */}
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-main)' }}>
            Your Interests
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {availableInterests.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`p-4 rounded-lg font-medium transition text-center capitalize ${
                  interests.includes(interest)
                    ? 'custom-gradient text-white'
                    : 'border'
                }`}
                style={
                  !interests.includes(interest)
                    ? {
                      backgroundColor: 'var(--form-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-main)'
                    }
                    : {}
                }
              >
                <div className="flex items-center justify-center gap-2">
                  {interests.includes(interest) && <Check className="w-4 h-4" style={{ color: 'white' }} />}
                  <span>{interest}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3 px-6 rounded-lg font-semibold custom-gradient text-white hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentPreferences;
