# 📖 Trust Edge Bank - User & Admin Guide

## 👤 User Guide

### 1️⃣ Creating an Account

**Step 1: Sign Up**

1. Visit the homepage and click **"Open Account"**
2. Fill in your details:
   - Full Name
   - Email Address
   - Password (minimum 8 characters)
3. Click **"Create Account"**
4. Check your email for a verification link
5. Click the link to verify your email address

**Step 2: Complete KYC Verification**

1. After login, you'll be prompted to complete KYC
2. Navigate to **KYC** from the dashboard menu
3. Provide required information:
   - Personal details (Date of Birth, Phone, Address)
   - Identity document (Driver's License, Passport, or State ID)
   - Take/upload a selfie for verification
4. Submit your application
5. Wait for admin approval (you'll receive an email notification)
6. Once approved, your checking and savings accounts are automatically created

---

### 2️⃣ Managing Refunds from Dashboard

**Viewing Your Refunds:**

1. Login to your account
2. Click **"Refunds"** in the dashboard navigation menu
3. You'll see all your refund requests with:
   - Amount
   - Status (Pending, Approved, Completed, Failed, Cancelled)
   - Reason
   - Date submitted

**Understanding Refund Statuses:**

- **Pending**: Your refund is under review
- **Approved**: Admin approved your refund (you'll receive an email)
- **Completed**: Refund amount has been credited to your checking account
- **Failed**: Refund processing failed
- **Cancelled**: Refund request was cancelled

**Dashboard Overview - Pending Balance:**

- Your dashboard shows "Pending Balance" which includes all approved and pending refunds
- This amount will be added to your checking account once the refund status changes to "Completed"

**Email Notifications:**

- You'll receive emails when:
  - Your refund is created
  - Your refund is approved by admin
  - Your refund status changes

---

## 🛡️ Admin Guide

### Admin Dashboard Overview

Access the admin panel at `/admin` after logging in with an admin account.

---

### 📊 Dashboard (Home)

**Path:** `/admin`

**What You See:**

- Total number of users
- Total transaction volume
- Active accounts
- Pending KYC applications
- Recent activity feed

**Actions:**

- Quick overview of system health
- Navigate to specific management pages

---

### 👥 Users Management

**Path:** `/admin/users`

**What You Can Do:**

- View all registered users
- See user details (name, email, KYC status, account status)
- Approve/Reject KYC applications directly from this page
- Search and filter users
- View user account balances

**Key Actions:**

- **Approve KYC**: Creates checking and savings accounts, sends approval email
- **Reject KYC**: Notifies user via email with rejection reason
- **View Details**: Check complete user profile

---

### 📋 KYC Management

**Path:** `/admin/kyc`

**What You Can Do:**

- Review all KYC submissions
- View submitted documents and selfies
- See personal information (DOB, address, phone, ID details)
- Approve or reject applications with notes

**Workflow:**

1. Click on a pending KYC submission
2. Review all submitted information and documents
3. Click **"Approve"** or **"Reject"**
4. User receives email notification automatically
5. Upon approval, checking and savings accounts are created

---

### 💰 Refunds Management

**Path:** `/admin/refunds`

**What You Can Do:**

- View all refund requests from users
- Filter by status (Pending, Approved, Completed, etc.)
- See refund details (amount, reason, user information)
- Approve or reject refund requests
- Edit refund amounts
- Mark refunds as completed

**Workflow:**

1. Review refund request details
2. Click **✓ (Approve)** or **✗ (Reject)**
3. When approved, user receives email notification
4. Change status to **"Completed"** to credit user's checking account
5. User's checking account is automatically updated

**Important Notes:**

- **Approve**: Sends approval email to user
- **Completed**: Transfers refund amount to user's checking account
- **Edit Amount**: Change refund amount without sending email
- Mobile-responsive table with scrolling for smaller screens

---

### 💳 Accounts Management

**Path:** `/admin/accounts`

**What You Can Do:**

- View all bank accounts (checking and savings)
- See account balances and types
- Filter by account type or user
- Search for specific accounts
- Monitor account activity

---

### 💸 Transactions Management

**Path:** `/admin/transactions`

**What You Can Do:**

- View all system transactions
- Filter by type (transfer, payment, refund, deposit, etc.)
- Filter by status (posted, pending, failed, etc.)
- Search transactions by reference or description
- Export transaction data
- Monitor transaction volumes

---

### 🔔 Notifications Management

**Path:** `/admin/notifications`

**What You Can Do:**

- Send system-wide notifications
- Create user-specific alerts
- View notification history
- Manage notification templates

---

### 📈 Reports & Analytics

**Path:** `/admin/reports`

**What You Can Do:**

- View transaction analytics
- See user growth charts
- Monitor account balances
- Export financial reports
- Track KYC approval rates

---

### ⚙️ Settings

**Path:** `/admin/settings`

**What You Can Do:**

- Configure system settings
- Manage admin users
- Update email templates
- Set business rules and limits

---

## 🔐 Security Notes

**For Users:**

- Keep your password secure
- Never share your account credentials
- Log out after each session on shared devices

**For Admins:**

- Admin access is role-based
- All actions are logged for audit purposes
- Review KYC documents carefully before approval
- Verify refund requests before approving

---

## 📧 Email Notifications

**Users Receive Emails For:**

- Account creation (welcome email)
- KYC submission confirmation
- KYC approval/rejection
- Card requests
- Transfer confirmations
- Bill payment confirmations
- Refund creation
- Refund approval
- Refund status updates

**Admins Receive Emails For:**

- New KYC submissions
- New refund requests
- Contact form submissions
- Newsletter subscriptions

All emails are sent from: **contact@trustedgeb.com**

---

## 💡 Quick Tips

**For Users:**

- Complete KYC as soon as possible to access all features
- Check the "Refunds" page regularly for status updates
- Your pending refunds are shown in the dashboard pending balance

**For Admins:**

- Process KYC applications promptly for better user experience
- Review refund requests within 24-48 hours
- Use the search and filter features to find specific records quickly
- Check the dashboard daily for pending actions

---

## 🆘 Support

**Need Help?**

- Email: contact@trustedgeb.com
- Phone: +1 (804) 973-0278
- Visit any branch location

---

**Last Updated:** October 2025
**Version:** 1.0
