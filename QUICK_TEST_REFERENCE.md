# Quick Testing Reference - Equipment Borrowing System

## 🚀 Quick Start

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Login as Admin:**
   - Email: `admin@example.com`
   - Password: `Admin@123`

3. **Create test users** via registration page

---

## 📋 Feature Testing Summary

### 1. Access Control (5 Types)

| Type | What to Test | Expected Result |
|------|-------------|-----------------|
| **MAC** | Employee (Public) tries to borrow Confidential equipment | ❌ "Not enough clearance" |
| **DAC** | Manager edits their own equipment | ✅ Success |
| **DAC** | Manager edits someone else's equipment | ❌ "Access denied" |
| **RBAC** | Employee tries to access "Add Equipment" | ❌ Feature hidden |
| **RuBAC** | Manager approves outside time window | ❌ "Approvals allowed [hours] only" |
| **ABAC** | Unverified email tries to login | ❌ "Email not verified" |

### 2. Authentication (9 Features)

| Feature | Test | Pass Criteria |
|---------|------|---------------|
| **Registration** | Fill form with valid data | ✅ Account created |
| **Captcha** | Wrong math answer | ❌ "Captcha failed" |
| **Email OTP** | Login before verification | ❌ "Email not verified" |
| **Password Policy** | Password "123" | ❌ "Min 8 characters" |
| **Password Hash** | Check DB User table | ✅ Starts with `$2b$...` |
| **Account Lockout** | 5 wrong passwords | ❌ "Account locked" |
| **JWT Token** | Check Local Storage | ✅ Token present |
| **MFA** | Login with correct password | ✅ OTP sent to email |
| **Password Change** | Change password, logout, login with new | ✅ Success |

### 3. Logging & Auditing (5 Features)

| Feature | Test | Verification |
|---------|------|--------------|
| **Activity Logs** | Borrow equipment | ✅ Log entry with IP, timestamp |
| **System Logs** | Change user role | ✅ "Updated user role to..." |
| **Log Encryption** | View DB Log table | ✅ Encrypted hex strings |
| **Centralized** | Check Admin Logs tab | ✅ All logs in one place |
| **Alerts** | 5 failed logins | ✅ Alert in Alerts tab |

### 4. Role Management (4 Features)

| Feature | Test | Result |
|---------|------|--------|
| **Request** | Employee requests Manager role | ✅ Request submitted |
| **Approval** | Admin approves request | ✅ Role updated |
| **Rejection** | Admin rejects request | ✅ Role unchanged |
| **Audit** | Check Logs after role change | ✅ All steps logged |

### 5. Data Protection (3 Features)

| Feature | Command/Action | Result |
|---------|---------------|--------|
| **Backup** | `npm run backup` | ✅ JSON file created |
| **Password Storage** | Check DB | ✅ Bcrypt hashes |
| **Log Encryption** | Check DB Log table | ✅ AES-256 encrypted |

---

## 🎯 Critical Test Scenarios

### Scenario 1: Complete User Journey
1. Register new user → Solve Captcha → Verify email with OTP
2. Login → Enter OTP for MFA → Access dashboard
3. Request equipment → Manager approves → Borrow successful
4. Return equipment → Check logs

### Scenario 2: Security Enforcement
1. Employee tries to access Admin features → Denied
2. User with Public clearance tries Secret equipment → Denied
3. Manager tries to approve own request → Not visible
4. 5 failed logins → Account locked → Alert generated

### Scenario 3: Role Management
1. Employee requests Manager role → Admin sees request
2. Admin approves → Employee gains Manager permissions
3. Check logs → All steps recorded

### Scenario 4: Admin Privileges
1. Admin edits equipment owned by others → Success
2. Admin deletes any equipment → Success
3. Admin views all logs → Success
4. Admin manages all users → Success

---

## 🔍 Verification Commands

```bash
# Run MAC hierarchy test
node verify_hierarchy.js

# Run admin permissions test
node verify_admin_permissions.js

# Create database backup
npm run backup

# View database
npx prisma studio

# Seed admin user
npm run seed
```

---

## 📊 Test Coverage Matrix

### Access Control
- [x] MAC - Clearance levels (5 levels)
- [x] DAC - Owner permissions + logging
- [x] RBAC - 3 roles (Admin, Manager, Employee)
- [x] RuBAC - Time-based restrictions
- [x] ABAC - Multi-attribute (role + clearance + status + verification)

### Authentication & Identification
- [x] User registration
- [x] Captcha (bot prevention)
- [x] Email verification (OTP)
- [x] Password policies
- [x] Password hashing (Bcrypt)
- [x] Account lockout
- [x] Token-based auth (JWT)
- [x] MFA (Password + OTP)
- [x] Password change
- [x] Password reset

### Audit & Logging
- [x] User activity logs (IP + timestamp)
- [x] System event logs
- [x] Log encryption (AES-256)
- [x] Centralized logging
- [x] Alerting system

### Role Management
- [x] Role definitions
- [x] Role assignment
- [x] Role change requests
- [x] Role change approvals
- [x] Audit trail

### Data Protection
- [x] Regular backups
- [x] Secure password storage
- [x] Encrypted logs

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Can't find OTP | Check server console (terminal) |
| Account locked | Wait 2 minutes or check DB to unlock |
| Token expired | Clear Local Storage and login again |
| Approval fails | Check time window in Settings |
| Can't edit equipment | Verify you're the owner or admin |

---

## 📝 Test Data

### Default Admin
```
Email: admin@example.com
Password: Admin@123
Role: Admin
Clearance: Top Secret
```

### Sample Test Users (Create via Registration)
```
User 1: employee@test.com - Employee - Public
User 2: manager@test.com - Manager - Confidential
User 3: topsecret@test.com - Employee - Top Secret
```

### Sample Equipment (Create as Manager/Admin)
```
Equipment 1: Laptop - Public
Equipment 2: Server Access - Confidential
Equipment 3: Classified Device - Secret
Equipment 4: Top Secret Gadget - Top Secret
```

---

## ✅ Final Checklist

Before submitting, verify:

- [ ] All 5 access control types working
- [ ] Registration with Captcha functional
- [ ] Email verification (OTP) working
- [ ] MFA (Password + OTP) functional
- [ ] Password policies enforced
- [ ] Account lockout after 5 attempts
- [ ] Logs encrypted in database
- [ ] Logs decrypted in dashboard
- [ ] Alerts generated for critical events
- [ ] Backup command creates JSON file
- [ ] Role change workflow complete
- [ ] Admin can manage all resources
- [ ] Manager can't approve own requests
- [ ] Time-based restrictions work

---

**Total Features Implemented: 30+**

**Project Requirements Coverage: 100%**
