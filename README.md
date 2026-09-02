# 🚀 Placeonix – Smart Placement & Career Management Portal

**Placeonix** is a centralized, end-to-end campus recruitment platform engineered with:
- **Frontend**: Pure HTML5, CSS3, and JavaScript (Vanilla JS).
- **Backend**: Node.js & Express.js.
- **Database**: MongoDB (Mongoose ODM).

---

## 🏗️ System Architecture & Roles

Placeonix supports 3 key user roles with dedicated portals and role-based access control:

1. **🎓 Student Module**:
   - Academic profile setup (Roll No, Department/Branch, CGPA, Backlogs, Passing Year, Skills, Social links).
   - Resume management with instant upload (PDF, DOC, DOCX) & verification.
   - Live job opening board with **automated eligibility evaluation** (checks Student CGPA, Branch, Backlogs against job criteria).
   - 1-Click job application submission with duplicate prevention.
   - Real-time application tracking timeline (**Applied ➔ Shortlisted ➔ Interview Scheduled ➔ Selected / Offered**).
   - In-app notification alerts for interview schedules and offers.

2. **🏢 Recruiter Module**:
   - Organization registration & company profile verification workflow.
   - Job creation with an interactive **Eligibility Criteria Builder** (min CGPA, allowed backlogs, eligible engineering branches, CTC package, application deadlines).
   - Application Review Board with candidate filtering by branch, CGPA, and status.
   - 1-Click Candidate Shortlisting, Interview Scheduling (with date, time, and interview mode/link), Selection / Offer, or Rejection.
   - Recruiter dashboard metrics (Total Jobs, Active Openings, Applicants, Hired Candidates).

3. **👑 Administrator Module**:
   - Institutional placement analytics (Placement %, Total Placed Students, Branch-wise distribution, Average CGPA).
   - Company verification console: Approve or reject recruiter organizations with custom remarks.
   - Campus recruitment drive manager: Announce placement drives with automated broadcasts to students.
   - User stakeholder directory: Activate or deactivate accounts.
   - **Placement Report Exporter**: Instant download of complete placement statistics in **CSV format** for accreditation & presentations.

---

## 🛠️ Step-by-Step Setup Guide

### 1. Database Setup (MongoDB)

You can run MongoDB **locally** or use **MongoDB Atlas** (Free Cloud Database):

#### Option A: Local MongoDB (Community Server)
1. Download and install [MongoDB Community Server](https://www.mongodb.com/try/download/community) for Windows.
2. Start the MongoDB service:
   ```powershell
   # If installed as a Windows service, it runs automatically in background.
   # Or start manually:
   mongod --dbpath "C:\data\db"
   ```
3. Your local connection URI will be:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/placeonix
   ```

#### Option B: MongoDB Atlas (Cloud)
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Get your connection string and set it in `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/placeonix?retryWrites=true&w=majority
   ```

---

### 2. Backend Setup (Node.js)

1. Open a terminal and navigate to the `backend` folder:
   ```powershell
   cd backend
   ```

2. Install the required Node.js packages:
   ```powershell
   npm install
   ```

3. Ensure your `backend/.env` file is present (or copy from `.env.example`):
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/placeonix
   JWT_SECRET=placeonix_super_secret_jwt_key_2026
   JWT_EXPIRE=7d
   NODE_ENV=development
   ```

4. **Seed Sample Demo Data** (Initializes admin, recruiters, companies, jobs, drives, students, and applications):
   ```powershell
   npm run seed
   ```

5. Start the backend API server:
   ```powershell
   npm start
   ```
   *The backend will run on `http://localhost:5000`.*

---

### 3. Frontend Setup (HTML / CSS / JS)

The frontend is built with pure HTML, CSS, and JavaScript. You can run it in any of the following ways:

#### Method A: VS Code Live Server
- Open `frontend/index.html` in VS Code.
- Right-click and select **"Open with Live Server"**.

#### Method B: Python Simple HTTP Server
Open a terminal in the `frontend` folder and run:
```powershell
cd frontend
python -m http.server 3000
```
Then visit `http://localhost:3000` in your browser.

#### Method C: Direct Browser Opening
Simply double-click `frontend/index.html` to open it in Chrome, Edge, or Firefox.

---

## 🔑 Pre-Seeded Demo Logins

After running `npm run seed`, you can immediately test all 3 roles using these credentials:

| Role | Email | Password | Details |
|---|---|---|---|
| 👑 **Administrator** | `admin@placeonix.edu` | `admin123` | Placement Cell Officer |
| 🏢 **Recruiter** (Google) | `recruiter.google@placeonix.com` | `recruiter123` | Talent Lead, Google India |
| 🏢 **Recruiter** (Microsoft) | `recruiter.msft@placeonix.com` | `recruiter123` | Senior Recruiter, Microsoft |
| 🎓 **Student** (CSE - 8.85 CGPA) | `rahul.sharma@placeonix.edu` | `student123` | CSE Student (Offer received) |
| 🎓 **Student** (IT - 8.20 CGPA) | `priya.patel@placeonix.edu` | `student123` | IT Student (Shortlisted) |
| 🎓 **Student** (ECE - 6.80 CGPA) | `arjun.kumar@placeonix.edu` | `student123` | ECE Student (Applied) |

---

## 📡 REST API Reference Summary

### Authentication (`/api/auth`)
- `POST /api/auth/register` – Register new student, recruiter, or admin account.
- `POST /api/auth/login` – Authenticate user and receive JWT.
- `GET /api/auth/me` – Retrieve profile of current logged-in user.

### Student Endpoints (`/api/student`)
- `GET /api/student/profile` – Fetch academic profile.
- `PUT /api/student/profile` – Update academic data (CGPA, roll no, branch, skills).
- `POST /api/student/resume` – Upload resume file (PDF/DOC).
- `GET /api/student/jobs` – Get job openings with personalized eligibility indicators.
- `POST /api/student/apply/:jobId` – Apply for a job opening.
- `GET /api/student/applications` – View student's applications & status progression.
- `DELETE /api/student/applications/:id` – Withdraw application.
- `GET /api/student/dashboard-summary` – Get student placement metrics.

### Recruiter Endpoints (`/api/recruiter`)
- `GET /api/recruiter/profile` – Fetch recruiter & company details.
- `PUT /api/recruiter/profile` – Update recruiter & company information.
- `POST /api/recruiter/jobs` – Publish a new job with eligibility criteria.
- `GET /api/recruiter/jobs` – List recruiter's posted jobs with applicant metrics.
- `GET /api/recruiter/jobs/:jobId/applicants` – View applicants for a specific job.
- `PUT /api/recruiter/applications/:applicationId/status` – Shortlist, schedule interview, offer, or reject applicant.
- `PUT /api/recruiter/jobs/:jobId/status` – Toggle active/closed job status.
- `GET /api/recruiter/dashboard-summary` – Recruiter summary metrics.

### Administrator Endpoints (`/api/admin`)
- `GET /api/admin/analytics` – Complete placement metrics and branch distribution.
- `GET /api/admin/companies` – List all companies with verification status filter.
- `PUT /api/admin/companies/:id/verify` – Approve or reject company verification.
- `GET /api/admin/users` – List all students and recruiters.
- `PUT /api/admin/users/:id/toggle-status` – Activate/Deactivate user access.
- `POST /api/admin/drives` – Announce and create campus recruitment drive.
- `GET /api/admin/drives` – List campus recruitment drives.
- `GET /api/admin/reports/placement` – Structured data of all student placements for CSV export.

---

## 🎯 Verification & Testing Checklist

- [x] Student registration & profile management.
- [x] Resume upload handling via Multer.
- [x] Automated eligibility checking for job postings.
- [x] Duplicate application prevention.
- [x] Recruiter job posting with multi-criteria builder.
- [x] Recruiter applicant review, shortlisting, and interview scheduler.
- [x] Real-time application status progression timeline.
- [x] Admin company approval/rejection workflow.
- [x] Admin campus drive broadcasting & student notifications.
- [x] Admin placement report generation and CSV export.
