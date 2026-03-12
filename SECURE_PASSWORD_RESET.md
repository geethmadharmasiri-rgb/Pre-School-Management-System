# Secure Password Reset Flow - Two-Step Email Verification

## Overview
The password reset system now implements a **secure two-step verification process** using email confirmation for Teachers and Parents, preventing unauthorized password resets.

## Security Improvements

### ❌ Old Insecure Flow (NIC-only):
1. User enters NIC
2. System immediately grants access to reset password
3. **Security Risk**: Anyone with someone's NIC could reset their password

### ✅ New Secure Flow (Email Verification):
1. User enters NIC/Email
2. System finds account and sends reset link to **registered email**
3. User must access their email to get the link
4. Link contains unique token (expires in 15 minutes)
5. User clicks link → Reset password
6. Token is invalidated after use

## Implementation Details

### For Teachers & Parents (NIC-based identification):

**Step 1: Request Password Reset**
- User goes to Teacher/Parent Login → "Forgot Password"
- Enters their NIC number
- System looks up account and sends email to registered address
- **Security**: Always shows success message (doesn't reveal if NIC exists)

**Step 2: Email Verification**
- User receives email with reset link
- Link format: `http://localhost:5173/reset-password?token=XXXXX`
- Token is valid for 15 minutes
- Token is stored in-memory on backend

**Step 3: Reset Password**
- User clicks link → Opens Reset Password page
- Enters new password (exactly 8 characters)
- Backend validates token and updates password
- Token is immediately invalidated
- User redirected to appropriate login page

### For Admins (Email-based identification):

**Step 1: Request Password Reset**
- Admin goes to Admin Login → "Forgot Password"
- Enters their email address
- System sends reset link to that email

**Step 2-3**: Same as Teachers/Parents

## API Endpoints

### POST `/api/auth/forgot-password-nic`
**Purpose**: Request password reset for Teacher/Parent using NIC
**Request Body**:
```json
{
  "nic": "123456789V",
  "role": "TEACHER" // or "PARENT"
}
```
**Response**: Always returns success message (security)
**Action**: Sends email with reset link if account exists

### POST `/api/auth/forgot-password`
**Purpose**: Request password reset for Admin using Email
**Request Body**:
```json
{
  "email": "admin@example.com",
  "role": "ADMIN"
}
```
**Response**: Success message
**Action**: Sends email with reset link

### POST `/api/auth/reset-password-email`
**Purpose**: Reset password using email token
**Request Body**:
```json
{
  "token": "abc123...",
  "newPassword": "NewPass1"
}
```
**Response**: Success + role (for redirect)
**Action**: Updates password, invalidates token

## Token Management

### Storage:
- Tokens stored in-memory Map: `resetTokens`
- Structure: `{ token: { email, role, userId, expiresAt } }`

### Security Features:
1. **Expiration**: 15 minutes
2. **One-time use**: Token deleted after successful reset
3. **Auto-cleanup**: Expired tokens cleaned every 30 minutes
4. **Secure generation**: Uses crypto.randomBytes(32)

### Token Lifecycle:
```
Generate → Store → Email → User Clicks → Validate → Use → Delete
                                    ↓
                            (15 min timeout)
                                    ↓
                              Auto-cleanup
```

## Email Template

The system sends a styled HTML email with:
- Role-specific branding (colors match portal)
- Clear reset button
- Plain text link (for email clients without HTML)
- Expiration warning (15 minutes)
- Security notice (ignore if not requested)
- Support contact information

## Frontend Flow

### ForgotPassword.jsx
- Detects user role (TEACHER, PARENT, ADMIN)
- Shows appropriate theme
- For non-admins: Sends NIC to `/api/auth/forgot-password-nic`
- Shows success message with email instructions
- **Does NOT navigate** to reset page (user must use email link)

### ResetPassword.jsx
- Receives token from URL query parameter
- Extracts role from token data
- Shows role-appropriate theme
- Validates password (8 characters)
- Submits to `/api/auth/reset-password-email`
- Redirects to correct login page based on role

## User Experience

### Teacher Password Reset Journey:

1. **Teacher Login** → Click "Forgot Password"
2. **Forgot Password Page** (Orange theme)
   - Enter NIC: `123456789V`
   - Click "Verify Identity"
3. **Success Message**:
   ```
   ✅ If an account exists with this NIC, you will receive 
      a password reset link at your registered email address.
   
   📧 Check your email
   • Click the reset link in the email
   • Link expires in 15 minutes
   • Check spam folder if not received
   ```
4. **Check Email** → Click reset link
5. **Reset Password Page** (Orange theme)
   - Enter new password (8 chars)
   - Confirm password
   - Click "Reset Password"
6. **Success** → Redirected to Teacher Login
7. **Login** with new password

## Security Benefits

1. ✅ **Email Ownership Verification**: Only person with access to registered email can reset
2. ✅ **Time-Limited Tokens**: 15-minute expiration prevents old links from working
3. ✅ **One-Time Use**: Token invalidated immediately after use
4. ✅ **No Information Disclosure**: System doesn't reveal if NIC/email exists
5. ✅ **Role Enforcement**: Token tied to specific role, can't cross-authenticate
6. ✅ **Secure Token Generation**: Cryptographically secure random tokens
7. ✅ **Audit Trail**: All reset attempts logged in console

## Testing the Flow

### Test Teacher Password Reset:
1. Register a teacher with a valid email address
2. Go to Teacher Login → "Forgot Password"
3. Enter teacher's NIC
4. Check the backend console for the reset link
5. Copy the token from console (or check email if configured)
6. Navigate to: `http://localhost:5173/reset-password?token=XXXXX`
7. Set new password
8. Verify redirect to Teacher Login
9. Login with new password

### Verify Security:
1. Try using an expired token (wait 15+ minutes)
2. Try using a token twice
3. Try entering wrong NIC (should still show success)
4. Try using a TEACHER token on PARENT login (should fail)

## Configuration

### Email Service Setup (.env):
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Token Settings (server.js):
```javascript
const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
```

## Future Enhancements

Potential improvements:
1. **SMS OTP**: Alternative to email for users without email access
2. **Rate Limiting**: Prevent brute force attempts
3. **Database Storage**: Persist tokens (currently in-memory)
4. **Multi-factor Auth**: Require additional verification
5. **Password History**: Prevent reusing recent passwords
6. **Account Lockout**: Temporary lock after multiple failed attempts

---

**Status**: ✅ Implemented and Secure
**Last Updated**: 2026-01-26
