# Password Reset Flow - Role-Based Implementation

## Overview
The password reset flow now properly handles different user roles (ADMIN, TEACHER, PARENT) and redirects users to the correct login portal after password reset.

## Flow Diagram

### Teacher Password Reset Flow:
1. **Teacher Login Page** → Click "Forgot Password" → Passes `role: "TEACHER"` to ForgotPassword page
2. **ForgotPassword Page** → Shows Teacher theme (orange) → User enters NIC
3. **Backend Verification** → Returns token + role
4. **ResetPassword Page** → Shows Teacher theme → User sets new password
5. **Success** → Redirects to `/teacher-login` after 3 seconds

### Parent Password Reset Flow:
1. **Parent Login Page** → Click "Forgot Password" → Passes `role: "PARENT"` to ForgotPassword page
2. **ForgotPassword Page** → Shows Parent theme (green) → User enters NIC
3. **Backend Verification** → Returns token + role
4. **ResetPassword Page** → Shows Parent theme → User sets new password
5. **Success** → Redirects to `/parent-login` after 3 seconds

### Admin Password Reset Flow:
1. **Admin Login Page** → Click "Forgot Password" → Passes `role: "ADMIN"` to ForgotPassword page
2. **ForgotPassword Page** → Shows Admin theme (gray) → User enters Email
3. **Backend Email** → Sends reset link via email
4. **ResetPassword Page** → Shows Admin theme → User sets new password
5. **Success** → Redirects to `/admin-login` after 3 seconds

## Files Modified

### Frontend:
1. **TeacherLogin.jsx** - Passes `role: "TEACHER"` when navigating to forgot password
2. **ParentLogin.jsx** - Passes `role: "PARENT"` when navigating to forgot password
3. **ForgotPassword.jsx** - Detects role and applies appropriate theme, passes role to reset page
4. **ResetPassword.jsx** - Receives role, applies theme, redirects to correct login page

### Key Changes:

#### TeacherLogin.jsx (Line 136)
```javascript
onClick={() => navigate("/forgot-password", { state: { role: "TEACHER" } })}
```

#### ParentLogin.jsx (Line 139)
```javascript
onClick={() => navigate("/forgot-password", { state: { role: "PARENT" } })}
```

#### ForgotPassword.jsx
- Added `isTeacher` detection
- Added `userRole` tracking
- Passes role to ResetPassword page: `navigate("/reset-password", { state: { token: data.token, role: data.role || userRole } })`
- Applies teacher theme when `isTeacher === true`

#### ResetPassword.jsx
- Added `userRole` state to track user's role
- Extracts role from `location.state.role`
- Redirects based on role:
  - TEACHER → `/teacher-login`
  - ADMIN → `/admin-login`
  - PARENT → `/parent-login` (default)
- Applies appropriate theme based on role

## Visual Themes

- **Parent**: Green theme (default)
- **Teacher**: Orange theme
- **Admin**: Gray theme

Each role now has a consistent visual experience throughout the password reset flow.

## Testing

To test the flow:
1. Go to Teacher Login → Click "Forgot Password"
2. Enter a valid teacher NIC
3. Set new password (exactly 8 characters)
4. Verify redirect goes to Teacher Login page
5. Repeat for Parent and Admin roles
