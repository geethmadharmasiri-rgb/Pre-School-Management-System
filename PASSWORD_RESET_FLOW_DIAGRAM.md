# Teacher Password Reset - Secure Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SECURE PASSWORD RESET FLOW                        │
│                     (Two-Step Email Verification)                    │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Teacher    │
│  Login Page  │
└──────┬───────┘
       │
       │ Clicks "Forgot Password?"
       ↓
┌──────────────────────┐
│  Forgot Password     │
│  (Orange Theme)      │
│                      │
│  Enter NIC:          │
│  [123456789V]        │
│                      │
│  [Verify Identity]   │
└──────┬───────────────┘
       │
       │ POST /api/auth/forgot-password-nic
       │ { nic: "123456789V", role: "TEACHER" }
       ↓
┌──────────────────────────────────────────┐
│         Backend Processing               │
│                                          │
│  1. Find teacher by NIC                  │
│  2. Get registered email                 │
│  3. Generate secure token (15 min)       │
│  4. Store token in memory                │
│  5. Send email to teacher                │
│                                          │
│  ✅ Always return success message        │
│     (security - don't reveal if exists)  │
└──────┬───────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────┐
│     Success Message Displayed            │
│                                          │
│  ✅ If an account exists with this NIC,  │
│     you will receive a password reset    │
│     link at your registered email.       │
│                                          │
│  📧 Check your email                     │
│  • Click the reset link                  │
│  • Link expires in 15 minutes            │
│  • Check spam folder                     │
└──────────────────────────────────────────┘

       ┌─────────────────────────────────┐
       │  Teacher checks email inbox     │
       │                                 │
       │  📧 Email Received:             │
       │  ┌─────────────────────────┐   │
       │  │ ILA Kids Campus         │   │
       │  │ Teacher Portal          │   │
       │  │                         │   │
       │  │ Hello [Teacher Name],   │   │
       │  │                         │   │
       │  │ Click to reset:         │   │
       │  │ [Reset Password]        │   │
       │  │                         │   │
       │  │ ⚠️ Expires in 15 min    │   │
       │  └─────────────────────────┘   │
       └────────┬────────────────────────┘
                │
                │ Clicks reset link
                ↓
       ┌─────────────────────────────────┐
       │  Reset Password Page            │
       │  (Orange Theme)                 │
       │                                 │
       │  URL: /reset-password?token=XXX │
       │                                 │
       │  New Password:                  │
       │  [********]                     │
       │                                 │
       │  Confirm Password:              │
       │  [********]                     │
       │                                 │
       │  [Reset Password]               │
       └────────┬────────────────────────┘
                │
                │ POST /api/auth/reset-password-email
                │ { token: "XXX", newPassword: "NewPass1" }
                ↓
       ┌─────────────────────────────────┐
       │    Backend Validation            │
       │                                 │
       │  1. Check token exists          │
       │  2. Check not expired           │
       │  3. Validate password (8 chars) │
       │  4. Hash new password           │
       │  5. Update in database          │
       │  6. DELETE token (one-time use) │
       │  7. Return success + role       │
       └────────┬────────────────────────┘
                │
                ↓
       ┌─────────────────────────────────┐
       │  ✅ Success Message              │
       │                                 │
       │  Password reset successful!     │
       │  You can now login with your    │
       │  new password.                  │
       │                                 │
       │  Redirecting to login page...   │
       └────────┬────────────────────────┘
                │
                │ (3 seconds delay)
                ↓
       ┌─────────────────────────────────┐
       │   Teacher Login Page            │
       │   (Orange Theme)                │
       │                                 │
       │   Email/NIC/EmpID:              │
       │   [teacher@example.com]         │
       │                                 │
       │   Password:                     │
       │   [NewPass1]                    │
       │                                 │
       │   [Sign In]                     │
       └────────┬────────────────────────┘
                │
                │ Login with new password
                ↓
       ┌─────────────────────────────────┐
       │   Teacher Dashboard             │
       │   ✅ Successfully logged in      │
       └─────────────────────────────────┘


═══════════════════════════════════════════════════════════════
                        SECURITY FEATURES
═══════════════════════════════════════════════════════════════

🔒 Email Ownership Verification
   → Only person with email access can reset

⏰ Time-Limited Tokens (15 minutes)
   → Prevents old links from working

🎫 One-Time Use Tokens
   → Token deleted immediately after use

🤐 No Information Disclosure
   → Doesn't reveal if NIC/email exists

🎭 Role Enforcement
   → Token tied to specific role

🔐 Secure Token Generation
   → Cryptographically random (32 bytes)

📝 Audit Trail
   → All attempts logged

═══════════════════════════════════════════════════════════════
