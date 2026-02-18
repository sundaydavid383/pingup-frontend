## WhatsApp-Style Chat Input Implementation Guide

This guide explains the complete implementation of a WhatsApp-like chat input section with all required features.

### Components Overview

#### 1. **ChatboxInput.jsx** (Wrapper Container)
The main container that positions the input section at the bottom of the viewport with proper constraints.

**Key Features:**
- Fixed positioning at bottom with `bottom: 0`
- Expands upward when content grows (not downward)
- Respects max-height (60vh) with scrolling when exceeded
- Custom scrollbar styling
- Safe area inset support for mobile devices (notches, home bar)
- Performance optimizations (backfaceVisibility, willChange)
- Responsive max-height adjustments for different screen sizes

**Props:**
- `sidebarOpen`: Boolean indicating sidebar state
- `sidebarWidth`: Width of sidebar (240px default)
- `children`: React nodes (reply bar, input field, controls)
- `style`: Additional inline styles override

---

#### 2. **ReplyBar.jsx** (Reply Indication)
Displays when replying to a message with message preview and close button.

**Features:**
- Blurred background with backdrop-filter
- Unblurred text and SVG icons
- Icons based on message type (image, audio, video, text)
- Shows sender name or "yourself" if self-reply
- Smooth slide-down animation on appearance
- Close button to cancel reply

**Props:**
- `replyTo`: Object with reply message data
- `onClose`: Callback to clear reply
- `user`: Current user object for self-detection

**Example Usage:**
```jsx
<ReplyBar replyTo={replyTo} onClose={() => setReplyTo(null)} user={user} />
```

---

#### 3. **MediaControls.jsx** (File Upload)
Unified media upload button with dropdown menu.

**Features:**
- Single button opens dropdown with 3 options
- Upload Image, File, Video
- Click-outside handler to close dropdown
- Prevents dropdown from overflowing viewport
- Accessible ARIA labels and roles
- Icon feedback for each upload type

**Props:**
- `showMediaDropdown`: Boolean state
- `onToggleDropdown`: Opens/closes dropdown
- `onMediaSelect`: Callback when file selected
- `mediaDropdownRef`: Ref to dropdown element
- `imageInputRef`, `fileInputRef`, `videoInputRef`: File input refs

**Example Usage:**
```jsx
<MediaControls
  showMediaDropdown={showMediaDropdown}
  onToggleDropdown={() => setShowMediaDropdown(prev => !prev)}
  onMediaSelect={(file) => setImage(file)}
  mediaDropdownRef={mediaDropdownRef}
  {...inputRefs}
/>
```

---

#### 4. **ImagePreview.jsx** (Selected Image Display)
Shows preview of selected image with remove button.

**Features:**
- Displays thumbnail (max 120x120px)
- Remove button with hover state
- Prevents re-rendering with useMemo
- Smooth fade-in animation
- Lazy loading attribute

**Props:**
- `image`: File object
- `onRemove`: Callback to clear image

---

#### 5. **RecordingIndicator.jsx** (Voice Recording UI)
Shows progress bar and time during audio recording.

**Features:**
- Visual progress bar (red fill animates from left)
- Time display (e.g., "15s / 60s")
- Stop button to end recording
- Accessible with aria-live updates
- Responsive size

**Props:**
- `recordTime`: Current recording seconds
- `maxRecordTime`: Maximum allowed seconds (60)
- `onStop`: Callback to stop recording

---

### CSS Classes Reference

#### Core Classes:
- `.chatbox-input`: Main container (fixed position)
- `.input-container`: Flex wrapper for all input elements
- `.input-field`: Textarea (expands upward)
- `.input-controls`: Horizontal flex row for buttons

#### Reply Bar:
- `.reply-bar`: Main container (blurred background)
- `.reply-bar-content`: Text and label wrapper
- `.reply-bar-label`: "Replying to X" text
- `.reply-bar-text`: Message preview
- `.reply-bar-close`: Close button

#### Media:
- `.media-button`: Attachment button
- `.media-dropdown`: Dropdown menu (fixed position)
- `.image-preview`: Image thumbnail container
- `.image-preview-remove`: X button on image

#### Recording:
- `.recording-container`: Main wrapper
- `.recording-controls`: Flex row with progress
- `.recording-progress`: Progress bar wrapper
- `.recording-time`: Time display

### Layout Behavior

#### Textarea Growth:
```
Before text: 40px (min-height)
↓ As user types ↓
After text: expands up to 100px
↓ Stops at max-height ↓
With scrolling: scrolls internally

IMPORTANT: Grows UPWARD (flex direction column + justify-flex-end)
NOT downward (container pushes up from bottom)
```

#### Responsive Breakpoints:

**Desktop (641px+):**
- Buttons: 40x40px
- Input: Full width with constraints
- Dropdown: 220px max-width

**Tablet (641px - 480px):**
- Buttons: 36x36px
- Input: Adjusted padding
- Dropdown: 200px max-width

**Mobile (480px and below):**
- Buttons: 32x32px
- Input: 16px font to prevent iOS zoom
- Dropdown: 160px max-width
- Tighter spacing

**Landscape (max-height 600px):**
- Reduced max-heights
- Smaller image previews
- Compact reply bar

### Integration Example

```jsx
import ChatboxInput from "./ChatboxInput";
import ReplyBar from "./ReplyBar";
import MediaControls from "./MediaControls";
import ImagePreview from "./ImagePreview";
import RecordingIndicator from "./RecordingIndicator";

function ChatBox() {
  const [replyTo, setReplyTo] = useState(null);
  const [image, setImage] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [showMediaDropdown, setShowMediaDropdown] = useState(false);

  return (
    <ChatboxInput>
      {/* Step 1: Show reply bar if replying */}
      <ReplyBar replyTo={replyTo} onClose={() => setReplyTo(null)} user={user} />

      <div className="input-container">
        {/* Step 2: Show textarea if not recording/audio */}
        {!recording && !audioURL && !(image instanceof File) && (
          <textarea className="input-field" value={text} onChange={handleChange} />
        )}

        {/* Step 3: Show image preview above controls */}
        <ImagePreview image={image} onRemove={() => setImage(null)} />

        {/* Step 4: Show input controls (buttons, recording bar) */}
        <div className="input-controls">
          <MediaControls
            showMediaDropdown={showMediaDropdown}
            onToggleDropdown={() => setShowMediaDropdown(prev => !prev)}
            onMediaSelect={setImage}
            {...refs}
          />

          {recording && (
            <RecordingIndicator
              recordTime={recordTime}
              maxRecordTime={60}
              onStop={stopRecording}
            />
          )}

          {/* Send/Record buttons */}
          {text || image || audioURL ? (
            <button onClick={sendMessage} className="send-button">
              <SendIcon />
            </button>
          ) : (
            <button onClick={startRecording} className="record-button">
              <MicIcon />
            </button>
          )}
        </div>
      </div>
    </ChatboxInput>
  );
}
```

### Styling Principles

1. **Upward Growth**: Flex with `flex-direction: column` + `justify-flex-end` + `position: fixed`
2. **No Overflow**: Fixed positioning + proper max-heights + `overflow: hidden`
3. **Blur Effect**: `backdrop-filter: blur(10px)` + `-webkit-backdrop-filter` for cross-browser
4. **Smooth Animations**: All transitions use `0.2s ease` or `0.25s ease-out`
5. **Responsive**: Mobile-first with breakpoints at 640px, 480px, landscape
6. **Accessibility**: ARIA labels, focus-visible states, readable text

### Performance Optimizations

1. **Memoization**: Use `useMemo` for image URLs to prevent re-creation
2. **Backface Visibility**: Hidden for fixed containers
3. **Will-Change**: Applied to fixed elements
4. **Webkit Scrolling**: Touch-based scrolling smooth on iOS
5. **Lazy Loading**: Images use `loading="lazy"`

### Browser Support

- Chrome/Edge: Full support
- Firefox: Full support (scrollbar-width)
- Safari: Full support (webkit prefixes)
- Mobile browsers: Full support (safe-area-inset)

### Troubleshooting

**Issue: Input overflows bottom**
→ Check `position: fixed`, `bottom: 0`, parent doesn't have `position: relative`

**Issue: Dropdown appears off-screen**
→ Check `.media-dropdown` positioning, ensure parent has `position: relative`

**Issue: Textarea grows downward**
→ Check flex direction and order: should be `flex-direction: column` + `justify-flex-end`

**Issue: Content scrolls when shouldn't**
→ Check `max-height` values, ensure proper overflow handling

### CSS Variables Used

```css
--input-bg-color: #ffffff
--input-text-color: #000000
--input-placeholder: #999999
--primary: #0099ff
--primary-hover: #0088dd
```

Can be customized in your CSS root or theme system.
