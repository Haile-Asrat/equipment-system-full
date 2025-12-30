# Secure Equipment Borrowing System - Full Version

This project is a complete implementation of the Secure Equipment Borrowing & Return Management System with a full web UI.

## Features

- **Access Control Models:**
  - MAC (Mandatory Access Control) - Sensitivity-based clearance checks
  - DAC (Discretionary Access Control) - Owner-based equipment access
  - RBAC (Role-Based Access Control) - Admin, Manager, Employee roles
  - RuBAC (Rule-Based Access Control) - Time-based approval rules (8 AM - 6 PM)
  - ABAC (Attribute-Based Access Control) - Department-based checks

- **Security Features:**
  - Password hashing with bcrypt
  - Account lockout after 5 failed login attempts (15-minute lockout)
  - Email verification with OTP codes
  - Simple math-based CAPTCHA in registration
  - Encrypted logs (AES-256-GCM) stored in database
  - JWT-based authentication

- **Functionality:**
  - User registration and login
  - Equipment management (add, view, borrow)
  - Borrow request workflow (request → approve → return)
  - Admin dashboard with system logs
  - Backup script to export data as JSON

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- (Optional) SMTP server credentials for email verification

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/equipment_db?schema=public"

# JWT Secret (use a strong random string in production)
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# Email Configuration (for OTP verification)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="your-email@gmail.com"

# Log Encryption Key (must be 64 hex characters = 32 bytes for AES-256-GCM)
# Generate with: openssl rand -hex 32
LOG_ENCRYPTION_KEY="your-64-character-hex-key-here"
```

**Generating the encryption key:**
```bash
openssl rand -hex 32
```

**Note:** Email configuration is optional. If not configured, registration will still work but email verification codes won't be sent. You can manually verify accounts via the database if needed.

### 3. Set Up Database

```bash
# Run Prisma migrations to create database schema
npx prisma migrate dev --name init

# Seed the database with admin user
npm run seed
```

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 5. Login

Use the default admin account:
- **Email:** `admin@example.com`
- **Password:** `Admin@123`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run seed` - Seed admin user
- `npm run backup` - Export database as JSON backup

## Project Structure

```
equipment_system_full/
├── app/
│   ├── api/              # API routes
│   ├── components/       # React components
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── src/
│   └── lib/              # Utility libraries
│       ├── prisma.ts     # Prisma client
│       ├── token.ts      # JWT utilities
│       ├── logger.ts     # Logging with encryption
│       ├── crypto.ts     # Encryption utilities
│       └── email.ts      # Email sending
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeding
└── scripts/
    └── backup.js         # Backup script
```

## User Roles

- **Admin:** Full access including equipment management, approvals, and system logs
- **Manager:** Can approve/deny borrow requests (during business hours 8 AM - 6 PM)
- **Employee:** Can view equipment and submit borrow requests

## Security Notes

⚠️ **This is an educational implementation.** For production use:

- Use HTTPS
- Implement rate limiting
- Use a proper CAPTCHA service (reCAPTCHA, hCaptcha)
- Secure environment variables (use secrets management)
- Add input validation and sanitization
- Implement CSRF protection
- Add request logging and monitoring
- Use a production-grade email service
- Regular security audits

## Troubleshooting

**Database connection errors:**
- Ensure PostgreSQL is running
- Verify DATABASE_URL is correct
- Check database exists: `createdb equipment_db`

**Email not sending:**
- Check SMTP credentials
- For Gmail, use an App Password (not regular password)
- Email verification is optional - accounts can be manually verified in database

**Import errors:**
- Run `npm install` to ensure all dependencies are installed
- Check that `tsconfig.json` exists and has correct path aliases

## License

Educational use only.
