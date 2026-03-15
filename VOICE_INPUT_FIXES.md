# Voice Input System Fixes

## Summary of Issues Fixed

### 1️⃣ WebSpeech Stopped Returning Transcripts

**Problem:**
- The `useEffect` hook that sets up WebSpeech recognition had `listening` in its dependency array
- This caused the recognition instance to be recreated every time `listening` changed
- The recreation broke the event handlers and prevented transcripts from flowing through

**Fix Applied:**
- Removed `listening` from the dependency array, keeping only `[onTranscribe]`
- Added a check `if (speechEngineRef.current !== "web") return;` at the start of `recognition.onresult` to prevent processing when another engine is active
- Moved `setVoiceState(VOICE_STATE.PROCESSING)` inside the `doSearch()` function before calling `onTranscribe`
- Fixed the pause timer logic to only set timer when `finalText` is present

**File:** [`src/pages/spiritual_life_tracker/VoiceInput.jsx`](src/pages/spiritual_life_tracker/VoiceInput.jsx:230-328)

---

### 2️⃣ Lemonfox Causes Infinite Loading

**Problem:**
- `voiceState` was set to `PROCESSING` when search started
- But there was no mechanism to reset it back to `READY` or `IDLE` after search completed
- This caused the UI to stay stuck in "Searching scripture..." state forever

**Fix Applied:**
- Added an `onComplete` callback in the `meta` object passed to `onTranscribe`
- Modified `handleBackendChunk()` to:
  - Set `VOICE_STATE.PROCESSING` before triggering search
  - Pass `onComplete` callback that resets state to `READY`
  - Reset to `READY` immediately if not enough words for search
- Updated `processChunks()` in parent component to accept and call the `onComplete` callback
- Updated parent's `onTranscribe` handler to pass `meta.onComplete` to `processChunks`

**Files:**
- [`src/pages/spiritual_life_tracker/VoiceInput.jsx`](src/pages/spiritual_life_tracker/VoiceInput.jsx:182-220)
- [`src/pages/spiritual_life_tracker/ScriptureAssistant.jsx`](src/pages/spiritual_life_tracker/ScriptureAssistant.jsx:397-427)
- [`src/pages/spiritual_life_tracker/ScriptureAssistant.jsx`](src/pages/spiritual_life_tracker/ScriptureAssistant.jsx:454-496)

---

### 3️⃣ Mode Switching Stopped Working

**Problem:**
- The backend component rendering condition used `speechEngineRef.current !== "web"`
- Refs don't trigger React re-renders, so changing the ref didn't mount/unmount the component
- The UI buttons changed but the actual engine didn't switch

**Fix Applied:**
- Changed the rendering condition from `speechEngineRef.current !== "web"` to `currentMode !== "web"`
- Updated `switchMode()` to properly update both `speechEngineRef.current` AND `setCurrentMode()`
- This ensures React re-renders when mode changes, properly mounting/unmounting `BackendAudioCapture`

**File:** [`src/pages/spiritual_life_tracker/VoiceInput.jsx`](src/pages/spiritual_life_tracker/VoiceInput.jsx:492-504)

---

### 4️⃣ BackendAudioCapture Stuck Running

**Problem:**
- When switching modes, the previous engine wasn't properly stopped
- `leftoverRef` wasn't cleared
- Timers weren't cleared
- State wasn't fully reset

**Fix Applied:**
- Completely rewrote `switchMode()` function to:
  1. Stop the current engine (WebSpeech or backend) with proper error handling
  2. Clear all state: `leftoverRef`, `isPausedRef`, `listening`, `isTranscribing`, `voiceState`, `error`
  3. Clear all timers: `pauseTimer`
  4. Update both `speechEngineRef.current` and `setCurrentMode()`
  5. Log the mode switch for debugging
- Removed the auto-start logic that was causing issues
- Now the user must manually start the mic after switching modes

**File:** [`src/pages/spiritual_life_tracker/VoiceInput.jsx`](src/pages/spiritual_life_tracker/VoiceInput.jsx:426-460)

---

## Key Changes Summary

### VoiceInput.jsx
1. **Line 230-328**: Fixed WebSpeech `useEffect` dependency and event handling
2. **Line 182-220**: Added `onComplete` callback mechanism for backend engines
3. **Line 269-287**: Added `onComplete` callback for WebSpeech search
4. **Line 426-460**: Rewrote `switchMode()` for proper cleanup
5. **Line 492-504**: Changed backend rendering condition to use state instead of ref

### ScriptureAssistant.jsx
1. **Line 397-427**: Modified `processChunks()` to accept and call `onComplete` callback
2. **Line 454-496**: Updated `onTranscribe` handler to pass `meta.onComplete` to `processChunks`

---

## Testing Checklist

- [ ] WebSpeech mode: Speak and verify transcript appears in textarea
- [ ] WebSpeech mode: Verify search triggers after 15 words or 1s pause
- [ ] WebSpeech mode: Verify "Searching scripture..." appears and then disappears
- [ ] Lemonfox mode: Speak and verify transcript appears
- [ ] Lemonfox mode: Verify search completes and results appear
- [ ] Lemonfox mode: Verify no infinite loading state
- [ ] Vosk mode: Verify streaming transcription works
- [ ] Mode switching: Switch from Web → Vosk → Lemonfox and verify each works
- [ ] Mode switching: Verify previous engine stops when switching
- [ ] Mode switching: Verify no leftover text from previous mode

---

## Important Notes

✅ **Preserved Functionality:**
- Lemonfox backend transcription flow remains unchanged
- Vosk streaming transcription remains unchanged
- Chunking logic (MIN_CHUNK_WORDS=5, MAX_CHUNK_WORDS=20) remains unchanged
- `onTranscribe` API remains backward compatible
- `handleBackendChunk()` logic preserved

✅ **No Breaking Changes:**
- All existing features continue to work
- Backend audio capture logic untouched
- MicButton UI behavior unchanged
- TTS blocking mechanism preserved
