# PolarisTech — Travel Agency Management System

> Where Vision Meets Direction

A full-stack web application for managing travel agency operations. Customers browse and book travel packages, agents manage bookings and packages, and administrators oversee the entire system.

**Live Demo:** https://polaris-tech-travel-agency-manageme.vercel.app  
**GitHub Repository:** https://github.com/leaouslati/PolarisTech-TravelAgencyManagementSystem

---

## Team Members
Lea Ouslati:  Auth · Booking Frontend · Base Setup · Notification
Reem Nassif: Packages · Browse · Wishlist · Recommendations 
Intissar Soulaiman: Booking & Payment · Wizard · Cancellation
Reem Antar: Agent Dashboard · Package Management · Messaging 
Mayar Kassar: Admin Dashboard · Users · Reports . Package Updates

**Course:** CSC490 — Software Engineering  
**Instructor:** Dr. Ramzi Haraty  
**Institution:** Lebanese American University

---

## Tech Stack

| Frontend | React 18 + Vite + Tailwind CSS v4 |
| Backend | Node.js + Express.js |
| Database | MySQL (hosted on Railway) |
| Authentication | JWT + bcrypt |
| Email | Nodemailer + Gmail SMTP |
| Deployment — Frontend | Vercel |
| Deployment — Backend | Render |
| Deployment — Database | Railway |

---

## Features

### Customer
- Register and log in with secure authentication (MFA, OTP, password expiry)
- Browse travel packages with filters by destination, price, date, and mood
- Trip Mood Selector — filter packages by Adventure, Relaxation, Cultural, Family, or Romantic
- View full package details including hotels, flights, tours, and add-ons
- Save packages to a personal Wishlist
- Personalized package recommendations based on booking history and wishlist
- 3-step booking wizard with add-on selection
- Secure simulated payment with Transaction ID generation
- View, modify, and cancel bookings
- In-app notifications for booking updates

### Travel Agent
- Create, update, and delete travel packages
- Package updates go through admin approval workflow
- View and approve or decline customer booking requests
- Handle cancellation requests with refund processing
- Message customers directly per booking thread
- Receive notifications for new bookings and cancellations

### Administrator
- View, edit roles, and deactivate user accounts
- Monitor all bookings and packages across the system
- Generate revenue reports by date range
- Review and approve or reject agent package update requests
- Full notification system oversight

---

## System Architecture

The system follows three architectural patterns working together:

- **Client–Server Architecture** — React frontend communicates with Express backend via REST API
- **Layered Architecture** — UI layer → Authentication layer → Business logic layer → Data layer
- **Repository Architecture** — Centralized MySQL database accessed by all system components

---

## Getting Started (Local Development)

### Prerequisites
- Node.js v18 or higher
- MySQL 8.0
- Git

### 1. Clone the repository


git clone [https://github.com/leaouslati/PolarisTech-TravelAgencyManagementSystem.git
cd PolarisTech-TravelAgencyManagementSystem]


### 2. Set up the database

Open MySQL Workbench and run these two files in order:

backend/db/schema.sql
backend/db/seed.sql


### 3. Configure environment variables

Create a file called `.env` inside the `backend/` folder:
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=polaris_db
JWT_SECRET=polaris_super_secret_jwt_key_2026
PORT=5000
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

### 4. Install dependencies and run the backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on: `http://localhost:5000`

### 5. Install dependencies and run the frontend

Open a new terminal:

cd frontend
npm install
npm run dev


Frontend runs on: `http://localhost:5173`

---

## Test Accounts

All test accounts use the password: `Test@1234`

| Role | Email |
|------|-------|
| Customer | customer1@test.com |
| Customer | customer2@test.com |
| Travel Agent | agent1@test.com |
| Travel Agent | agent2@test.com |
| Administrator | admin@test.com |

---

## Usage Guide

### As a Customer
1. Register a new account or log in with a test customer account
2. Browse packages on the Browse page — use filters or mood chips to narrow results
3. Click a package to view full details, then click Book Now
4. Complete the 3-step booking wizard — select dates, add-ons, and confirm
5. Proceed to payment — use a card number starting with 4 for a successful payment
6. View your bookings on the My Bookings page

### As a Travel Agent
1. Log in with a test agent account
2. Go to Manage Packages to create or edit packages
3. Go to Booking Requests to approve or decline customer bookings
4. Go to Cancellations to handle cancellation requests
5. Use Messages to communicate with customers

### As an Administrator
1. Log in with the admin test account
2. Go to Manage Users to view and manage all accounts
3. Go to Monitoring to view all bookings and packages
4. Go to Reports to generate revenue reports by date range
5. Go to Package Updates to approve or reject agent-submitted changes

---

---

## Security Features

- Passwords hashed with bcrypt (never stored as plain text)
- JWT tokens for session management
- Automatic session expiry after 15 minutes of inactivity
- Account lockout after 5 failed login attempts for 15 minutes
- Password expiry every 90 days with forced reset
- Cannot reuse last 5 passwords
- Multi-Factor Authentication (MFA) via email OTP
- Role-Based Access Control (RBAC) — users can only access their role's pages
- Rate limiting on all authentication routes
- HTTPS enforced via Helmet.js

---

## Non-Functional Requirements Met

- Pages load within 3 seconds for 95% of requests
- System responds to user actions within 1 second
- Fully responsive — works on mobile, tablet, and desktop
- Dark mode and light mode with persistent preference
- Key functions accessible within 3 clicks
- Real-time form validation with helpful error messages
- Cross-browser compatible — Chrome, Firefox, Edge


## License

This project is developed for educational purposes as part of CSC490 — Software Engineering at the Lebanese American University.