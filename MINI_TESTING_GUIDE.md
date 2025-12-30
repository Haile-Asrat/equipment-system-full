# Mini Testing Guide - Equipment Borrowing System
**AASTU - Computer System Security Project Two**

---

## Setup
```bash
npm run dev          # Start application
npm run seed         # Create admin user
```

**Admin Login:** `admin@example.com` / `Admin@123`

---

## 1. Access Control (5 Types)

**MAC (Clearance Levels):**
- Employee (Public) borrows Confidential item → ❌ Denied

**DAC (Owner Permissions):**
- Manager edits own equipment → ✅ Success
- Manager edits other's equipment → ❌ Denied (unless admin)

**RBAC (Roles):**
- Employee sees "Add Equipment" → ❌ Hidden
- Manager sees "Pending Approvals" → ✅ Visible
- Admin sees "User Management" → ✅ Visible

**RuBAC (Time Rules):**
- Settings: Set approval hours to future time
- Manager tries to approve → ❌ "Approvals allowed [hours] only"

**ABAC (Multi-Attribute):**
- Unverified email tries login → ❌ "Email not verified"
- Locked account tries login → ❌ "Account locked"

---

## 2. Authentication

**Registration + Captcha:**
- Register with wrong math answer → ❌ "Captcha failed"
- Register with correct answer → ✅ Success

**Email Verification (OTP):**
- Login before verification → ❌ "Email not verified"
- Enter OTP from console → ✅ Verified

**Password Policies:**
- Password "123" → ❌ "Min 8 characters"
- Password "SecurePass123!" → ✅ Accepted

**Password Hashing:**
- Check DB User table → Passwords start with `$2b$...`

**Account Lockout:**
- 5 wrong passwords → ❌ "Account locked" (2 min)

**Token Auth (JWT):**
- Login → Check Local Storage → Token present

**MFA (OTP):**
- Login with password → OTP sent to email → Enter OTP → ✅ Success

**Password Change:**
- Settings → Change password → Logout → Login with new → ✅ Success

**Password Reset:**
- Forgot Password → Enter email → Enter OTP → New password → ✅ Success

---

## 3. Logging & Auditing

**Activity Logs:**
- Borrow equipment → Admin Logs tab → Entry with IP + timestamp

**System Logs:**
- Change user role → Admin Logs tab → "Updated user role to..."

**Log Encryption:**
- Prisma Studio → Log table → Encrypted hex strings
- Admin Logs tab → Decrypted readable text

**Centralized Logging:**
- Admin Logs tab → All activities in one place

**Alerts:**
- 5 failed logins → Admin Alerts tab → "Account Locked" alert

---

## 4. Role Management

**Role Change Request:**
- Employee → Request Role Change → Select Manager → Submit

**Role Change Approval:**
- Admin → Role Change Approvals → Approve/Reject

**Audit Trail:**
- Admin Logs → See all role change steps logged

---

## 5. Data Protection

**Backups:**
```bash
npm run backup       # Creates backup_[timestamp].json
```

**Password Storage:**
- Prisma Studio → User table → Bcrypt hashes

**Log Encryption:**
- Prisma Studio → Log table → AES-256 encrypted

---

## Quick Tests

### Test 1: Complete User Flow
Register → Verify Email → Login (MFA) → Borrow → Manager Approves → Success

### Test 2: Security Blocks
- Low clearance → High sensitivity equipment → ❌ Denied
- Employee → Admin features → ❌ Hidden
- Manager → Approve own request → ❌ Not visible

### Test 3: Admin Powers
- Admin edits any equipment → ✅ Success
- Admin deletes any equipment → ✅ Success
- Admin views all logs → ✅ Success

---

## Verification Scripts
```bash
node verify_hierarchy.js           # Test MAC
node verify_admin_permissions.js   # Test admin privileges
npx prisma studio                  # View database
```

---

## Coverage Checklist
- ✅ MAC, DAC, RBAC, RuBAC, ABAC
- ✅ Registration, Captcha, Email OTP
- ✅ Password policies, hashing, lockout
- ✅ JWT tokens, MFA, password change/reset
- ✅ Activity logs, encryption, alerts
- ✅ Role requests/approvals, audit trail
- ✅ Backups, secure storage

**30+ Security Features | 100% Requirements Coverage**
