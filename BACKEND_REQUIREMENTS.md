# Backend Requirements for Settings Feature

## Overview

This document outlines all backend changes needed to support the Settings feature implemented in the frontend.

---

## 1. User Model/Schema - Fields to Add

### Privacy Settings

```javascript
privacySettings: {
  viewPosts: { type: String, enum: ['everyone', 'followers', 'only-me'], default: 'everyone' },
  viewStories: { type: String, enum: ['everyone', 'followers', 'only-me'], default: 'everyone' },
  messageMe: { type: String, enum: ['everyone', 'followers', 'only-me'], default: 'everyone' },
  commentPosts: { type: String, enum: ['everyone', 'followers', 'only-me'], default: 'everyone' },
}
```

### Notification Settings

```javascript
notificationSettings: {
  pushNotifications: { type: Boolean, default: true },
  messageAlerts: { type: Boolean, default: true },
  commentAlerts: { type: Boolean, default: true },
  emailNotifications: { type: Boolean, default: false },
  muteAll: { type: Boolean, default: false },
}
```

### Appearance Preferences

```javascript
preferences: {
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  fontSize: { type: String, enum: ['small', 'medium', 'large', 'xlarge'], default: 'medium' },
  language: { type: String, default: 'english' },
}
```

### Personal Information

```javascript
dateOfBirth: Date,
gender: String,
location: String,
```

### Content Preferences

```javascript
contentPreferences: {
  interests: [String], // ['spirituality', 'technology', 'sports', 'entertainment', 'news', 'health', 'education', 'business']
  contentTypes: [String], // ['posts', 'stories', 'videos', 'articles', 'events']
}
```

### Account Status

```javascript
accountStatus: { type: String, enum: ['active', 'deactivated', 'deleted'], default: 'active' },
deactivatedAt: Date,
deletedAt: Date,
```

### Blocked & Muted Users

```javascript
blockedUsers: [{ type: ObjectId, ref: 'User' }],
mutedUsers: [{ type: ObjectId, ref: 'User' }],
```

---

## 2. New Collections/Models Required

### LoginActivity Model

```javascript
{
  userId: { type: ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true, unique: true },
  ipAddress: String,
  userAgent: String,
  deviceInfo: String, // e.g., "Chrome on Windows"
  loginTime: { type: Date, default: Date.now },
  lastActiveTime: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
}
```

### Report Model

```javascript
{
  submittedBy: { type: ObjectId, ref: 'User', required: true },
  reportedUser: { type: ObjectId, ref: 'User' },
  reportedPost: { type: ObjectId, ref: 'Post' },
  reason: String,
  description: String,
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
}
```

---

## 3. API Endpoints to Create

### Account Settings Endpoints

```
PATCH  /api/users/change-password
       Body: { currentPassword, newPassword, confirmPassword }
       Returns: { success, message }

PATCH  /api/users/email
       Body: { email }
       Returns: { success, message, user }

GET    /api/users/login-activity
       Returns: { loginHistory: [...] }

GET    /api/users/active-sessions
       Returns: { sessions: [...] }

DELETE /api/users/sessions/:sessionId
       Returns: { success, message }

POST   /api/users/deactivate
       Body: { password }
       Returns: { success, message }

DELETE /api/users/account
       Body: { password }
       Returns: { success, message }
```

### Privacy & Safety Endpoints

```
GET    /api/users/privacy-settings
       Returns: { privacySettings }

PATCH  /api/users/privacy-settings
       Body: { viewPosts?, viewStories?, messageMe?, commentPosts? }
       Returns: { success, message, privacySettings }

GET    /api/users/blocked-accounts
       Returns: { blockedUsers: [...] }

POST   /api/users/block/:userId
       Returns: { success, message }

DELETE /api/users/block/:userId
       Returns: { success, message }

GET    /api/users/muted-accounts
       Returns: { mutedUsers: [...] }

POST   /api/users/mute/:userId
       Returns: { success, message }

DELETE /api/users/mute/:userId
       Returns: { success, message }

GET    /api/users/report-history
       Returns: { reports: [...] }
```

### Appearance & Preferences Endpoints

```
PATCH  /api/users/preferences
       Body: { theme?, fontSize?, language? }
       Returns: { success, message, preferences }

GET    /api/users/notification-settings
       Returns: { notificationSettings }

PATCH  /api/users/notification-settings
       Body: { pushNotifications?, messageAlerts?, commentAlerts?, emailNotifications?, muteAll? }
       Returns: { success, message, notificationSettings }

PATCH  /api/users/personal-info
       Body: { dateOfBirth?, gender?, location? }
       Returns: { success, message, user }

GET    /api/users/export-data
       Returns: { downloadUrl } or { dataExport } (GDPR compliance)
```

### Content Preferences Endpoints

```
GET    /api/users/content-preferences
       Returns: { contentPreferences }

PATCH  /api/users/content-preferences
       Body: { interests?, contentTypes? }
       Returns: { success, message, contentPreferences }
```

---

## 4. Implementation Priority

### HIGH PRIORITY (Core Features)

- [ ] Change Password endpoint
- [ ] Update Email endpoint
- [ ] Privacy Settings endpoints (GET & PATCH)
- [ ] Notification Settings endpoints
- [ ] Personal Info endpoints
- [ ] User model updates for these fields

### MEDIUM PRIORITY (Important Features)

- [ ] Block/Unblock user endpoints
- [ ] Mute/Unmute user endpoints
- [ ] Content Preferences endpoints
- [ ] Account Deactivation endpoint
- [ ] LoginActivity model & endpoints

### LOW PRIORITY (Nice to Have)

- [ ] Login Activity endpoints
- [ ] Active Sessions management
- [ ] Report History endpoints
- [ ] Export Data endpoint (GDPR)
- [ ] Report model & submission endpoint

---

## 5. Security Considerations

- Verify password before allowing sensitive operations (email change, deactivation, deletion)
- Hash new passwords before storing
- Track all sensitive account changes in audit logs
- Validate all input data (dates, enums, etc.)
- Rate limit password change and deactivation endpoints
- Implement proper session management for devices endpoint
- Ensure users can only modify their own settings

---

## 6. Testing Endpoints

Test with sample requests:

```bash
# Change Password
curl -X PATCH http://localhost:5000/api/users/change-password \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"old123","newPassword":"new123","confirmPassword":"new123"}'

# Update Privacy Settings
curl -X PATCH http://localhost:5000/api/users/privacy-settings \
  -H "Content-Type: application/json" \
  -d '{"viewPosts":"followers","viewStories":"only-me"}'

# Get Notification Settings
curl -X GET http://localhost:5000/api/users/notification-settings
```

---

## 7. Database Indexes (Recommended)

```javascript
// User indexes
db.users.createIndex({ email: 1 });
db.users.createIndex({ blockedUsers: 1 });
db.users.createIndex({ mutedUsers: 1 });
db.users.createIndex({ accountStatus: 1 });

// LoginActivity indexes
db.loginactivities.createIndex({ userId: 1, createdAt: -1 });
db.loginactivities.createIndex({ sessionId: 1 });

// Report indexes
db.reports.createIndex({ submittedBy: 1, createdAt: -1 });
db.reports.createIndex({ reportedUser: 1 });
db.reports.createIndex({ status: 1 });
```

---

**Frontend Implementation**: `/src/pages/settings/*`  
**Last Updated**: 8 February 2026
