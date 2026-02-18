# WhatsApp-Style ChatBox - Visual Layout Reference

## Component Hierarchy

```
ChatboxInput (Fixed Container)
│
├── ReplyBar (if replying)
│   ├── reply-bar-label
│   │   ├── SVG Icon (message type)
│   │   └── "Replying to X"
│   ├── reply-bar-text
│   │   └── Message preview (max 2 lines)
│   └── reply-bar-close
│       └── X button
│
├── input-container
│   ├── textarea.input-field (if not recording)
│   │   └── Grows upward (40px → 100px max)
│   │
│   ├── ImagePreview (if image selected)
│   │   ├── img (thumbnail)
│   │   └── .image-preview-remove button
│   │
│   └── input-controls (Flex row, horizontal)
│       ├── MediaControls
│       │   ├── .media-button
│       │   └── .media-dropdown (absolute position)
│       │       ├── label (Image)
│       │       ├── label (File)
│       │       └── label (Video)
│       │
│       ├── RecordingIndicator (if recording)
│       │   ├── Progress bar
│       │   ├── Time display
│       │   └── Stop button
│       │
│       ├── send-button (if message/image/audio)
│       │   └── Icon or spinner
│       │
│       └── record-button (if empty)
│           └── Mic icon
```

## Layout Dimensions

### Desktop View (> 1024px)
```
┌─────────────────────────────────────────────────┐
│                   CHATBOX HEADER                │ Height: 60px
├─────────────────────────────────────────────────┤
│                                                 │
│             MESSAGES AREA                       │
│           (scrollable)                          │ Height: calc(100vh - 60px - input-height)
│                                                 │
├─────────────────────────────────────────────────┤
│  REPLY BAR (if replying)                        │ Height: 50px
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────┐  ┌──┐ ┌──┐   │
│  │         TEXTAREA            │  │🔗│ │📎│   │ Height: 40-100px
│  │ (grows upward)              │  │  │ │  │   │
│  └─────────────────────────────┘  └──┘ └──┘   │
│  Padding: 12px 16px                            │
└─────────────────────────────────────────────────┘
  400px max content width (typically full)
```

### Mobile View (< 480px)
```
┌──────────────────────────────┐
│     CHATBOX HEADER           │ Height: 56px
├──────────────────────────────┤
│                              │
│    MESSAGES AREA             │ Height: auto
│   (more compact)             │
│                              │
├──────────────────────────────┤
│ REPLY BAR (hidden on small)  │ Height: 44px
├──────────────────────────────┤
│┌────────────────┐  ┌┐┌┐┌┐   │
││   TEXTAREA    │  ││││││   │ Height: 36-80px
└┴────────────────┘  └┘└┘└┘   │
  Padding: 8px 6px            │
└──────────────────────────────┘
  100% width
```

### Landscape View (max-height < 600px)
```
┌────────────────────────────────────────────────┐
│  HEADER    REPLY (compact)  INPUT     │ ┌──┐  │
│  40px      40px              50px     │ │⏹ │  │
│                                       │ └──┘  │
│            MESSAGES (minimal)         │────── │
├────────────────────────────────────────────────┤
```

## CSS Box Model

### ChatboxInput Container
```
        ┌─────────────────────────┐ Top
        │   safe-area-inset       │ (top: 0)
        │                         │
        │                         │
        │                         │
        ├─────────────────────────┤
        │   CONTENT AREA          │
        │   (max 60vh)            │
        │   (scrollable-y)        │
        ├─────────────────────────┤
        │    Padding Bottom       │ 12px +
        │  safe-area-inset-bottom │
        └─────────────────────────┘
        Bottom: 0 (pinned to edge)
```

### Reply Bar
```
        ┌──────────────────────────┐
        │ ↓ Slides down (animation)│ Mar-bottom: 6px
        ├──────────────────────────┤ Padding: 10px 12px
        │ 🔄 Replying to Someone  │ Min-height: 50px
        │ Message preview text...  │ Border-left: 3px
        │ (max 2 lines, wrap)      │
        │                        ✕ │ Close button
        └──────────────────────────┘
        Background: Blurred
        Foreground: Sharp text
```

### Textarea Growth
```
BEFORE typing:
┌──────────────────────────┐
│                          │ 40px (min-height)
└──────────────────────────┘

AFTER typing:
┌──────────────────────────┐
│ This is my message that  │ 
│ takes multiple          │ ~60px
│ lines                   │
└──────────────────────────┘

WITH LONG MESSAGE (max-height: 100px):
┌──────────────────────────┐
│ This is a very long      │
│ message that exceeds     │ 100px
│ the max height and will  │ ↕ scrolls internally
│ scroll within the input  │
└──────────────────────────┘
```

### Input Controls Row (Flex Layout)
```
┌────────────────────────────────────────────┐
│  ┌──┐  ┌────────────────────────┐  ┌──┐   │
│  │📎│  │                        │  │  │   │
│  │  │  │                    🔴 │  │  │   │
│  └──┘  │ Textarea 1 line    ⏹ │  │  │   │
│        │                        │  │  │   │
│        └────────────────────────┘  └──┘   │
│         ↑                            ↑     │
│    Media button                Send/Rec btn │
│      (40x40)                      (40x40)  │
│                                            │
│  Gap between: 8px                          │
└────────────────────────────────────────────┘
```

### Image Preview
```
┌────────────────┐
│  ┌──────────┐  │ Padding: 10px
│  │          │  │
│  │  Image   │✕ │
│  │ Thumb    │  │
│  │120x120   │  │
│  └──────────┘  │ Border-radius: 12px
└────────────────┘ Box-shadow applied
                  ✕ = remove button
```

### Media Dropdown
```
                    (above button)
                        ↑
    ┌───────────────────────────┐
    │  MEDIA UPLOAD OPTIONS     │
    ├───────────────────────────┤
    │  📷 Upload Image          │
    │  📄 Upload File           │
    │  🎬 Upload Video          │
    └───────────────────────────┘
    ↓ (48px from button)
    ┌──┐
    │📎│  Media button
    └──┘
    
Width: 180-220px
Z-index: 100 (above everything)
Position: absolute (relative to parent)
Backdrop: Blur 20px
```

### Audio Recording Progress
```
┌──────────────────────────────────────┐
│ ├─────●──────────────────┤ 15s / 60s  │ ⏹
│ 0%      25% progress             100% │
│ ├─────●──────────────────┤            │
│ RED color fills left                  │
└──────────────────────────────────────┘
 └─────────────────────────────────┬──┘
                                   │
                              Stop button
                                40x40px
```

## Spacing Reference

### Padding
```
Container Level:    12px (top/bottom) × 16px (left/right)
Reply Bar:          10px (top/bottom) × 12px (left/right)
Input Field:        12px (top/bottom) × 16px (left/right)
Buttons:            40px × 40px (icon centered)
```

### Gap (between flex items)
```
Between input elements: 6-8px
Between container rows: 8px (reply bar to input)
```

### Min/Max Heights
```
Textarea:           40px (min) → 100px (max)
Container:          60vh (max)
Reply Bar:          50px (min)
Buttons:            40px (desktop) → 32px (mobile)
```

## Color Reference

### Default Light Theme
```
Background:         #ffffff (white)
Text:               #000000 (black)
Primary:            #0099ff (blue)
Primary Hover:      #0088dd (darker blue)
Button Hover:       #0077cc (even darker)
Placeholder:        #999999 (gray)
Reply Background:   rgba(0,153,255,0.08) (light blue)
Shadow:             rgba(0,0,0,0.1-0.15)
```

### Dark Theme
```
Background:         #2c2c2c (dark gray)
Text:               #ffffff (white)
Primary:            #0099ff (blue)
Reply Background:   rgba(0,153,255,0.15) (darker blue)
```

## Animation Timings

```
Reply Bar:          slideDownIn 0.25s ease-out (appears)
Image Preview:      scaleIn 0.25s ease-out (appears)
Dropdown:           slideUpDropdown 0.2s ease-out (appears)
Button Hover:       0.2s ease (background change)
Button Active:      scale 0.95 (press effect)
Transitions:        all 0.2s ease (general)
```

## Responsive Breakpoints

```
Mobile              max-width: 480px
├── Buttons:        32×32px
├── Input:          0.85rem font
└── Padding:        8px 6px

Tablet              481px - 1024px
├── Buttons:        36×36px
├── Input:          0.9rem font
└── Padding:        10px 12px

Desktop             1024px+
├── Buttons:        40×40px
├── Input:          0.95rem font
├── Padding:        12px 16px
└── Max-content:    900px (optional)

Landscape           max-height: 600px
├── Max heights:    Reduced
├── Images:         80px max
└── Spacing:        Tighter
```

## Z-Index Stacking Context

```
200+ ─────┬───────────────── Modals, Dialogs
          │
100+ ─────┼───────────────── Media Dropdown (100)
          │
  40 ─────┼───────────────── ChatboxInput Container (fixed)
          │
 1-30 ────┼───────────────── Messages Area, Header
          │
  0 ──────┴───────────────── Rest of page
```

## Touch/Mobile Optimizations

### Hit Area Sizes
```
Minimum recommended: 44×44px
Actual buttons:     40-36px (exceeds minimum slightly)
Spacing between:    8-12px (avoids accidental taps)
```

### Safe Area Accounting
```
Top:        env(safe-area-inset-top)
Right:      env(safe-area-inset-right)
Bottom:     max(12px, env(safe-area-inset-bottom))
Left:       env(safe-area-inset-left)
```

### iOS-Specific
```
Input font-size:    16px (prevents zoom on focus)
Viewport scale:     User-scalable=yes
-webkit-appearance: none (remove iOS defaults)
```

## Accessibility Focus States

```
Normal:     outline: none
Focused:    outline: 2px solid var(--primary)
            outline-offset: 2px
            
On Input:   outline-offset: 1px
```

## Performance Considerations

```
Fixed positioning:
  └─ backfaceVisibility: hidden
  └─ WebkitBackfaceVisibility: hidden
  └─ willChange: transform

Smooth scrolling:
  └─ WebkitOverflowScrolling: touch
  └─ scrollBehavior: smooth

Image rendering:
  └─ loading: lazy
  └─ decoding: async
```

---

This visual reference helps understand the spatial relationships and dimensions of all components in the WhatsApp-style chat input system.
