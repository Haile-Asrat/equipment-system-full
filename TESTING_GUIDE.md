# Computer System Security Project Two - Testing Guide

**Addis Ababa Science and Technology University**
**Department of Software Engineering**

This document outlines how to test the security features implemented in the Equipment Borrowing System, mapping directly to the project requirements.

---

## 1. Access Control and Authentication

### 1.1 Mandatory Access Control (MAC)
**Requirement:** Enforce strict access policies based on sensitivity levels (Public, Internal, Secret, Confidential, Top Secret).

**How to Test:**
1. **Login as an 'Employee'** (who has 'Public' clearance).
2. **Try to borrow 'Confidential' equipment.**
   - Navigate to the dashboard.
   - Find an item marked "Sensitivity: Confidential".
   - Click "Borrow".
   - **Result:** You should see an error: *"Not enough clearance"*.
3. **Login as an 'Admin'** (or user with 'Top Secret' clearance).
   - Try to borrow the same item.
   - **Result:** The request should succeed.

### 1.2 Discretionary Access Control (DAC)
**Requirement:** Allow resource owners to grant/revoke permissions.

**How to Test:**
1. **Login as a Manager.**
2. **Add new Equipment.**
   - Go to "Add Equipment".
   - Create a new item (e.g., "Team Laptop").
   - **Verification:** In the database, this item is now "owned" by you (`ownerId` matches your User ID).
3. **Edit Your Equipment:**
   - Click "Edit" on your equipment.
   - **Result:** Success.
4. **Try to Edit Someone Else's Equipment:**
   - Find equipment owned by another user.
   - Try to edit it.
   - **Result:** Error *"Access denied"* (unless you're admin).

**DAC Permission Logging:**
1. **Perform equipment operations** (create, edit, delete).
2. **Login as Admin.**
3. **Go to Logs tab.**
4. **Result:** See entries showing:
   - *"Created equipment [Name] (Owner: [Email])"*
   - *"Updated equipment [Name]"*
   - *"Deleted equipment ID [X]"*

### 1.3 Role-Based Access Control (RBAC)
**Requirement:** Access based on roles (Admin, Manager, Employee).

**How to Test:**
1. **Login as 'Employee':**
   - Check the navigation bar.
   - **Result:** You should **NOT** see "Add Equipment", "Pending Approvals", or "Logs".
2. **Login as 'Manager':**
   - Check the navigation bar.
   - **Result:** You **SHOULD** see "Pending Approvals" and "Add Equipment". You should **NOT** see "Logs" or "User Management".
3. **Login as 'Admin':**
   - Check the navigation bar.
   - **Result:** You should see **ALL** tabs, including "User Management", "Logs", and "Settings".

**Role Assignment and Modification:**
1. **Login as Admin.**
2. **Go to User Management.**
3. **Change a user's role:**
   - Select a user.
   - Change role from "Employee" to "Manager".
   - **Result:** User's permissions update immediately.

**Audit Trail for Role Changes:**
1. **After changing roles, go to Logs tab.**
2. **Result:** See log entry: *"Updated user [Email] role to [NewRole]"*.

### 1.4 Rule-Based Access Control (RuBAC)
**Requirement:** Restrict access based on conditions like time.

**How to Test:**
1. **Login as 'Admin'.**
2. **Configure Time Window:**
   - Go to the **Settings** tab.
   - Set "Start Hour" to a time *after* now (e.g., if it's 2 PM, set start to 16/4 PM).
   - Save.
3. **Login as 'Manager'.**
4. **Try to Approve a Request:**
   - Go to "Pending Approvals".
   - Click "Approve".
   - **Result:** You should see an error: *"Approvals allowed [Start]-[End] only"*.
5. **Reset:** Login as Admin and reset hours to include current time (e.g., 0-23) to allow approvals again.

### 1.5 Attribute-Based Access Control (ABAC)
**Requirement:** Fine-grained control using attributes (Role + Clearance + Status).

**How to Test:**
1. The system evaluates multiple attributes for every request:
   - **Role:** Checked for API access (e.g., `/api/admin/*`).
   - **Clearance:** Checked for equipment access (MAC).
   - **Account Status:** Checked during login (locked/unlocked).
   - **Email Verification:** Checked during login.
2. **Test Multi-Attribute Denial:**
   - Create a user with correct role but insufficient clearance.
   - Try to borrow high-sensitivity equipment.
   - **Result:** Access denied due to clearance attribute.

---

## 2. Audit Trails and Logging

### 2.1 User Activity & System Events Logging
**Requirement:** Log all activities (username, timestamp, IP, action).

**How to Test:**
1. **Perform Actions:**
   - Login.
   - Request an item.
   - Approve an item (as Manager).
   - Change password.
   - Logout.
2. **Verify Logs:**
   - Login as **Admin**.
   - Go to the **Logs** tab.
   - **Result:** You should see a chronological list of actions.
   - **Example:** *"User [Name] (ID: 1): Requested equipment [Item]"* with timestamp and IP.

### 2.2 Log Encryption
**Requirement:** Encrypt stored logs.

**How to Test:**
1. **View Database:**
   - Open the database using Prisma Studio: `npx prisma studio`
   - Navigate to the `Log` table.
   - **Result:** The `action` field contains encrypted hex strings.
2. **View Dashboard:**
   - Go to the Admin **Logs** tab.
   - **Result:** The logs are decrypted and readable.

### 2.3 Centralized Logging
**Requirement:** All logs in one location.

**How to Test:**
1. **Login as Admin.**
2. **Go to Logs tab.**
3. **Result:** All system activities (login, borrow, approve, role changes, equipment operations, etc.) are displayed in chronological order from a single centralized location.

### 2.4 Alerting Mechanisms
**Requirement:** Alert on critical events.

**How to Test:**
1. **Trigger an Alert:**
   - Try to login with a wrong password 5 times.
2. **Verify Alert:**
   - Login as **Admin**.
   - Go to the **Alerts** tab.
   - **Result:** You should see a high-severity alert: *"Account Locked: Multiple failed login attempts"*.

---

## 3. Data Backups

### 3.1 Regular Backups
**Requirement:** Routine data backups.

**How to Test:**
1. **Run Backup Command:**
   - Open a terminal in the project folder.
   - Run: `npm run backup`
2. **Verify:**
   - Check the project folder.
   - **Result:** A new file named `backup_[timestamp].json` is created containing all system data.
3. **Inspect Backup:**
   - Open the JSON file.
   - **Result:** Contains users, equipment, borrow requests, logs, etc.

---

## 4. Identification and Authentication

### 4.1 User Registration
**Requirement:** Secure registration collecting necessary information.

**How to Test:**
1. **Go to Register Page.**
2. **Fill Registration Form:**
   - Name, Email, Password, Department, Clearance.
   - **Result:** All required fields must be filled.

### 4.2 Bot Prevention (Captcha)
**Requirement:** Implement Captcha to prevent fake accounts.

**How to Test:**
1. **Go to Register Page.**
2. **Try with Wrong Captcha:**
   - Fill the form but answer the math question incorrectly.
   - Click Register.
   - **Result:** Error *"Captcha failed"*.
3. **Try with Correct Captcha:**
   - Answer correctly.
   - **Result:** Registration succeeds, and you are asked to verify your email.

### 4.3 Email Verification (OTP)
**Requirement:** Verify email to prevent fake accounts.

**How to Test:**
1. **Register** a new account.
2. **Try to Login immediately.**
   - **Result:** Error *"Email not verified"*.
3. **Find OTP:** Check the server console (simulated email) for the 6-digit code.
4. **Verify:** Enter the code in the verification page.
5. **Login:** Now you can login successfully.

### 4.4 User Profile Management
**Requirement:** Users can update and manage their profiles.

**How to Test:**
1. **Login as any user.**
2. **Go to Profile/Settings.**
3. **Update information:**
   - Change name, department, etc.
   - **Result:** Changes saved successfully.

---

## 5. Password Authentication

### 5.1 Password Policies
**Requirement:** Enforce minimum length and complexity.

**How to Test:**
1. **Try to register with weak password:**
   - Use password: "123"
   - **Result:** Error *"Password must be at least 8 characters"*.
2. **Use strong password:**
   - Use password: "SecurePass123!"
   - **Result:** Registration succeeds.

### 5.2 Password Hashing
**Requirement:** Securely store passwords using hashing.

**How to Test:**
1. **Check Database:**
   - Open Prisma Studio: `npx prisma studio`
   - Navigate to `User` table.
   - **Result:** Passwords are stored as hashes starting with `$2b$...` (Bcrypt), not plain text.

### 5.3 Account Lockout Policy
**Requirement:** Lock account after failed attempts.

**How to Test:**
1. **Fail Login:** Enter the wrong password 5 times in a row.
2. **Try again:** On the 6th attempt (even with correct password).
   - **Result:** Error *"Account locked"*. You must wait 2 minutes.
3. **Check Alert:**
   - Login as Admin.
   - Go to Alerts tab.
   - **Result:** Alert generated for account lockout.

### 5.4 Secure Password Transmission
**Requirement:** Transmit passwords securely.

**How to Test:**
1. **Check Network Tab:**
   - Open Browser DevTools (F12) > Network tab.
   - Login with credentials.
   - **Result:** In production, request uses HTTPS. Password is sent in request body, not URL.

### 5.5 Password Change
**Requirement:** Mechanism to change passwords.

**How to Test:**
1. **Login** as any user.
2. **Navigate to Settings/Profile.**
3. **Change Password:**
   - Enter current password.
   - Enter new password (must meet complexity requirements).
   - Confirm new password.
4. **Submit:**
   - **Result:** Success message displayed.
5. **Logout and Login:**
   - Try logging in with the old password.
   - **Result:** Login fails.
   - Try logging in with the new password.
   - **Result:** Login succeeds.

### 5.6 Password Reset
**Requirement:** Secure password recovery.

**How to Test:**
1. **Go to Login Page.**
2. **Click "Forgot Password".**
3. **Enter Email:** Provide your registered email.
4. **Check OTP:** Find the 6-digit code in server console.
5. **Enter OTP and New Password:**
   - Input the OTP.
   - Enter new password.
   - **Result:** Password reset successful.
6. **Login:** Use the new password to login.

---

## 6. Token-Based Authentication

### 6.1 JWT Token Authentication
**Requirement:** Implement token-based authentication.

**How to Test:**
1. **Login.**
2. **Inspect:** Open Browser Developer Tools (F12) > Application > Local Storage.
3. **Result:** You will see a `token` key containing a long JWT string.
4. **Token Usage:**
   - This token is sent with every API request in the Authorization header.
   - Verify by checking Network tab during any action.

### 6.2 Session Management
**Requirement:** Secure session handling.

**How to Test:**
1. **Login.**
2. **Token Expiration:**
   - Tokens expire after 8 hours.
   - Wait or manually clear token from Local Storage.
3. **Try to perform an action:**
   - **Result:** Session expired, redirected to login.

---

## 7. Multi-Factor Authentication (MFA)

### 7.1 OTP-Based MFA
**Requirement:** Implement username/password + OTP.

**How to Test:**
1. **Register** a new account.
2. **Verify Email:** Enter the 6-digit OTP sent to your email (check server console).
3. **Login:** 
   - Enter username and password.
   - **Result:** System sends a new OTP to your email.
4. **Enter OTP:** Input the 6-digit code.
   - **Result:** Successfully logged in with JWT token.
5. **Test Wrong OTP:** 
   - Try entering an incorrect code.
   - **Result:** Error *"Invalid OTP"*.
6. **Test Expired OTP:**
   - Wait 10 minutes.
   - Try to use old OTP.
   - **Result:** Error *"OTP expired"*.

---

## 8. Role Management

### 8.1 Role Change Requests
**Requirement:** Dynamic role changes with approval workflow.

**How to Test:**
1. **Login as Employee.**
2. **Request Role Change:**
   - Go to "Request Role Change" section.
   - Select desired role (e.g., "Manager").
   - Provide justification.
   - Submit request.
   - **Result:** Request submitted successfully.

### 8.2 Role Change Approvals
**Requirement:** Approval workflow for role changes.

**How to Test:**
1. **Login as Admin.**
2. **View Pending Role Changes:**
   - Go to "Role Change Approvals" tab.
   - **Result:** See the pending request with user details and justification.
3. **Approve Request:**
   - Click "Approve".
   - **Result:** Request status updated, user's role changed.
4. **Verify Change:**
   - Login as that employee.
   - **Result:** New role permissions are active (can see Manager features).

### 8.3 Role Change Rejection
**How to Test:**
1. **Login as Admin.**
2. **Go to Role Change Approvals.**
3. **Reject Request:**
   - Click "Reject" on a pending request.
   - **Result:** Request status updated to rejected, user's role unchanged.

### 8.4 Audit Trail for Role Changes
**Requirement:** Maintain audit trail for role assignments and changes.

**How to Test:**
1. **Perform role change** (as described above).
2. **Login as Admin.**
3. **Go to Logs tab.**
4. **Search for role-related logs:**
   - **Result:** See entries like:
     - *"Role change request: Employee -> Manager"*
     - *"Role change approved by Admin"*
     - *"User role updated to Manager"*

---

## 9. Additional Security Features

### 9.1 Manager Self-Approval Prevention
**Requirement:** Managers cannot approve their own requests.

**How to Test:**
1. **Login as Manager.**
2. **Borrow Equipment:**
   - Request to borrow an item.
3. **Go to Pending Approvals:**
   - **Result:** Your own request is NOT visible in the list.
4. **Login as different Manager:**
   - **Result:** Can see and approve the first manager's request.

### 9.2 Admin Permissions for All Equipment
**Requirement:** Admins can edit/delete any equipment.

**How to Test:**
1. **Login as Manager A.**
2. **Create Equipment:** Add "Manager A's Laptop".
3. **Logout and Login as Admin.**
4. **Edit Manager A's Equipment:**
   - **Result:** Success (admins bypass owner-only restrictions).
5. **Delete Equipment:**
   - **Result:** Success.
6. **Check Logs:**
   - **Result:** Admin's actions are logged.

---

## Quick Test Checklist

### Access Control (5 types)
- [ ] **MAC:** Clearance-based access (Public/Internal/Secret/Confidential/Top Secret)
- [ ] **DAC:** Owner can edit/delete their equipment, admins can edit/delete any
- [ ] **RBAC:** Role-based features (Admin/Manager/Employee)
- [ ] **RuBAC:** Time-based approval restrictions
- [ ] **ABAC:** Multi-attribute evaluation (role + clearance + status + verification)

### Authentication (9 features)
- [ ] User registration with required information
- [ ] Bot prevention (Captcha)
- [ ] Email verification (OTP)
- [ ] Password policies (min 8 chars, complexity)
- [ ] Password hashing (Bcrypt with salt)
- [ ] Account lockout (5 failed attempts, 2-minute lock)
- [ ] Token-based authentication (JWT)
- [ ] Multi-Factor Authentication (Password + OTP)
- [ ] Password change mechanism
- [ ] Password reset with OTP

### Logging & Auditing (5 features)
- [ ] User activity logging (with IP, timestamp, user details)
- [ ] System events logging (role changes, equipment operations)
- [ ] Log encryption (AES-256)
- [ ] Centralized logging (single location)
- [ ] Alerting mechanisms (account lockout, suspicious activity)

### Role Management (4 features)
- [ ] Role definitions (Admin, Manager, Employee)
- [ ] Role assignment mechanism
- [ ] Role change requests
- [ ] Role change approvals
- [ ] Audit trail for role changes

### DAC Features (3 features)
- [ ] Owner-based permissions (edit/delete own equipment)
- [ ] Admin override (admins can manage all equipment)
- [ ] Permission logs (who created, modified, deleted resources)

### Data Protection (3 features)
- [ ] Regular backups (JSON export)
- [ ] Secure password storage (hashed)
- [ ] Encrypted logs

---

## Test Accounts

**Admin:**
- Email: `admin@example.com`
- Password: `Admin@123`
- Role: Admin
- Clearance: Top Secret

**Create additional test users** through registration to test different roles and clearances.

---

## Running Verification Scripts

The project includes automated verification scripts:

```bash
# Test MAC hierarchy (Top Secret can access Secret)
node verify_hierarchy.js

# Test admin permissions for Top Secret equipment
node verify_admin_permissions.js
```

---

## Testing Tools

1. **Prisma Studio:** View database directly
   ```bash
   npx prisma studio
   ```

2. **Browser DevTools:** 
   - Network tab: Monitor API requests
   - Application tab: View Local Storage (tokens)
   - Console tab: Check for errors

3. **Server Console:** Check terminal output for:
   - Simulated emails (OTP codes)
   - Error messages
   - System logs

---

## Notes

- **Server Console:** Check terminal output for simulated emails (OTP codes).
- **Database:** Use Prisma Studio (`npx prisma studio`) to inspect data directly.
- **Logs:** All actions are logged - check the Logs tab as Admin.
- **Time-based rules:** Adjust system time or settings to test RuBAC features.
- **IP Addresses:** Logged for all user actions for security auditing.

---

**End of Testing Guide**
