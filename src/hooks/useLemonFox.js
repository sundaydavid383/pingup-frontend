import { useState, useCallback } from 'react';

const LEMONFOX_API_KEY = process.env.REACT_APP_LEMONFOX_API_KEY;
const API_URL = 'https://api.lemonfox.ai/v1/audio/transcriptions';

/**
 * Custom hook for handling speech-to-text transcription via the LemonFox API.
 * It encapsulates the API call logic, loading state, and error handling.
 */
export const useLemonFox = () => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState(null);

  const transcribe = useCallback(async (audioBlob) => {
    if (!audioBlob) {
      setError('No audio blob provided.');
      return null;
    }

    setIsTranscribing(true);
    setError(null);

    // FIX: A new FormData object is created for each transcription call.
    // This prevents data from previous requests from being carried over,
    // which was causing the API to fail after the second call.
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'lemonfox-1');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LEMONFOX_API_KEY}`,
          // 'Content-Type' is set automatically by fetch for FormData.
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(errorData.error?.message || 'Voice recognition failed.');
      }

      const result = await response.json();
      return result.text;
    } catch (err) {
      console.error('LemonFox API error:', err);
      setError(err.message || 'Voice recognition failed. Please try again.');
      return null;
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  return { transcribe, isTranscribing, error };
};