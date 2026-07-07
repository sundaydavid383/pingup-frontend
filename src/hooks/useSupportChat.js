// src/hooks/useSupportChat.js
import { useReducer, useRef, useCallback, useEffect } from 'react';
import axiosBase from '../utils/axiosBase';

/**
 * @typedef {Object} ChatMessage
 * @property {'user'|'assistant'} role
 * @property {string} content
 * @property {boolean} [failed]
 */

/**
 * @typedef {'idle'|'sending'|'error'|'quota_exceeded'} ChatStatus
 */

const STORAGE_KEY = 'sc_support_chat_v1';
const BREAKER_KEY = 'sc_support_breaker_v1';
const BREAKER_COOLDOWN_MS = 30 * 60 * 1000; // 30 min — tune to your free-tier reset window
const MAX_RETRIES = 2;
const RETRY_BASE_MS = 700;

const initialState = {
  /** @type {ChatMessage[]} */
  messages: [],
  /** @type {ChatStatus} */
  status: 'idle',
  errorMessage: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'RESTORE':
      return { ...state, messages: action.messages };
    case 'SEND_START':
      return { ...state, messages: [...state.messages, action.userMsg], status: 'sending', errorMessage: null };
    case 'SEND_SUCCESS':
      return { ...state, messages: [...state.messages, action.assistantMsg], status: 'idle' };
    case 'SEND_ERROR':
      return { ...state, status: action.quota ? 'quota_exceeded' : 'error', errorMessage: action.message };
    case 'RESET_ERROR':
      return { ...state, status: 'idle', errorMessage: null };
    case 'BREAKER_TRIP':
      return { ...state, status: 'quota_exceeded', errorMessage: action.message };
    default:
      return state;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function useSupportChat() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef(null);

  // Restore conversation + circuit-breaker state on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) dispatch({ type: 'RESTORE', messages: JSON.parse(saved) });
    } catch {}

    try {
      const tripped = JSON.parse(sessionStorage.getItem(BREAKER_KEY) || 'null');
      if (tripped && Date.now() - tripped.at < BREAKER_COOLDOWN_MS) {
        dispatch({
          type: 'BREAKER_TRIP',
          message: "Our support assistant is temporarily unavailable — email us at support@springscircle.com and we'll help directly.",
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.messages)); } catch {}
  }, [state.messages]);

  const tripBreaker = (message) => {
    try { sessionStorage.setItem(BREAKER_KEY, JSON.stringify({ at: Date.now() })); } catch {}
    dispatch({ type: 'SEND_ERROR', quota: true, message });
  };

  const send = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || state.status === 'sending' || state.status === 'quota_exceeded') return;

    const userMsg = { role: 'user', content: trimmed };
    const historySnapshot = state.messages;
    dispatch({ type: 'SEND_START', userMsg });

    let attempt = 0;
    while (attempt <= MAX_RETRIES) {
      abortRef.current = new AbortController();
      try {
        const { data } = await axiosBase.post(
          '/api/voicebip/chat',
          { message: trimmed, history: historySnapshot },
          { signal: abortRef.current.signal }
        );
        dispatch({
          type: 'SEND_SUCCESS',
          assistantMsg: { role: 'assistant', content: data.reply || data.response || "Sorry, I couldn't get a response." },
        });
        return;
      } catch (err) {
        const code = err.response?.data?.code;
        const status = err.response?.status;

        // Quota/credits exhausted — stop immediately, remember it, never retry
        if (code === 'QUOTA_EXCEEDED' || status === 402) {
          tripBreaker(err.response?.data?.error || "Our support assistant has hit its usage limit for now — please email support@springscircle.com.");
          return;
        }

        const transient = !status || status >= 500 || status === 429;
        if (transient && attempt < MAX_RETRIES) {
          attempt += 1;
          await sleep(RETRY_BASE_MS * 2 ** (attempt - 1)); // 700ms, 1400ms
          continue;
        }

        dispatch({
          type: 'SEND_ERROR',
          quota: false,
          message: err.response?.data?.error || 'Unable to reach support right now. Please try again shortly.',
        });
        return;
      }
    }
  }, [state.messages, state.status]);

  const cancel = useCallback(() => abortRef.current?.abort(), []);
  const resetError = useCallback(() => dispatch({ type: 'RESET_ERROR' }), []);

  return { ...state, send, cancel, resetError };
}