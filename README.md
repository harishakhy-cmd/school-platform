# CBT & Digital Classroom Learning Management Platform

A unified, full-stack **Educational Management, Digital Classroom, Learning, and Computer-Based Testing (CBT) Platform** built on **Node.js**, **Express**, and **MySQL**, designed with academic elegance, responsive UX, and examination security.

## Deployment editions

The existing application remains the shared Express/MySQL source. The Vercel
edition is being implemented first as an adapter around that application;
Firebase has not yet been ported and neither edition currently meets complete
feature-parity acceptance.

- [Vercel edition setup](./apps/vercel-edition/README.md)
- [Firebase readiness and blockers](./docs/deployment/firebase-deployment.md)
- [Vercel deployment limitations](./docs/vercel-deployment.md)
- [Current architecture audit](./docs/architecture/current-state-audit.md)

From the repository root, the Vercel CLI scripts are `npm run dev:vercel`,
`npm run build:vercel`, `npm run test:vercel`, and `npm run deploy:vercel`.
Deploying requires a linked Vercel project and separately provisioned MySQL
and Blob services. These commands do not make the Firebase edition deployable.

---

## 🏛️ Platform Architecture & Features

```mermaid
graph TD
    subgraph Client Layer
        StudentPortal["Student Portal (/portal.html & /classroom.html)"]
        TutorPortal["Tutor Console (/classroom.html)"]
        AdminConsole["Admin Console (/admin.html)"]
        ExamEngine["CBT Exam Engine (/exam.html & /result.html)"]
    end

    subgraph Service & API Gateway
        AuthGuard["Role & Session Guards (adminAuthMiddleware, authMiddleware)"]
        ClassroomAPI["Classroom & LMS Controller (/api/classrooms)"]
        CBTAPI["CBT Engine Controller (/api/exams)"]
        LMSAPI["LMS Feature Sub-Routers (Lessons, Materials, Assignments, Quizzes)"]
        LiveAPI["Live Sessions, Whiteboard & AI Assistant"]
    end

    subgraph Data & Persistence (MySQL cbt_db)
        AcademicCore[("Academic Core: Terms, Classes, Subjects, Classrooms, Enrollments")]
        LMSData[("LMS Content: Lessons, Materials, Assignments, Quizzes, Attendance")]
        CBTData[("CBT Engine: Exams, Questions, Attempts, Responses, Scores")]
    end

    StudentPortal --> AuthGuard
    TutorPortal --> AuthGuard
    AdminConsole --> AuthGuard
    ExamEngine --> AuthGuard

    AuthGuard --> ClassroomAPI & CBTAPI & LMSAPI & LiveAPI
    ClassroomAPI & LMSAPI --> AcademicCore & LMSData
    CBTAPI --> CBTData
    CBTData -.->|"Automatic Sync"| LMSData
```

---

## 🌟 Core Modules

### 1. Unified Student Academic Identity
- The **Registration Number** (e.g. `2026/ICT/001`, `STO1-001A`) is the student's immutable identity across Login, Classroom Enrollment, Lessons, Attendance, Assignments, Quizzes, CBT Examinations, and Gradebook reports.

### 2. Digital Classrooms (11 Integrated Tabs)
1. **Stream**: Real-time classroom activity, notices, and tutor announcements.
2. **Lessons**: Curriculum topics, learning objectives, rich text/KaTeX scientific notation, and student progress completion tracking (`Not Started`, `In Progress`, `Completed`).
3. **Materials**: Multi-format learning material organizer (PDF, Word, Slides, Videos, Links).
4. **Assignments**: Homework authoring with deadlines, student submissions (text/files), late submission policies, and tutor grading with feedback.
5. **Quizzes**: Lightweight self-assessments with instant auto-grading and score percentages.
6. **CBT Examinations**: Deeply integrated official testing with countdown timers, randomized questions, autosaved responses, and single-attempt lockout.
7. **Attendance**: Classroom attendance register (Present, Absent, Late, Excused) with automated percentage tracking.
8. **Discussions**: Threaded question-and-answer forums between students and tutors.
9. **Academic Calendar**: Aggregated schedule of lectures, assignment deadlines, quizzes, CBT exams, and live classes.
10. **Gradebook**: Composite academic performance calculator combining Assignments, Quizzes, and CBT Exams into normalized averages and letter grades ($A, B, C, D, F$).
11. **Live Classroom & Whiteboard**: Virtual live classroom sessions with collaborative HTML5 Canvas whiteboard (Pen, Highlighter, Eraser, Math tools, Real-time Sync).

### 3. Examination Security & Integrity
- **One Attempt Enforcement**: Guaranteed single attempt per student per examination.
- **Session Protection**: Cryptographic UUID `session_token` prevents duplicate logins or browser hijacking.
- **AI Anti-Cheating Lockout**: AI Study Assistant is automatically disabled during active CBT exams.
- **Server-Side Grading**: Answers are never exposed in student-facing APIs; auto-graded server-side.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (>= 18.0.0)
- **MySQL Server** (8.0+ or 8.4+)

### 2. Environment Configuration
Create or configure `.env` in the root directory:
```env
PORT=3000
HOST=0.0.0.0
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=cbt_db
SESSION_SECRET=your-secure-session-secret
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=replace_with_a_unique_strong_password
```

Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` before `npm run init-db` when the
database does not yet contain an admin account. The initializer no longer
creates an account with a built-in password.

### 3. Database Setup & Migrations
Initialize the schema and execute the LMS migrations:
```bash
# 1. Initialize core database
npm run init-db

# 2. Run LMS & Classroom migrations
node scripts/migrateLmsAndClassroom.js
```

### 4. Running the Application
```bash
# Start the server
npm start
```
- **Student & Classroom Portal**: `http://localhost:3000/portal.html` or `http://localhost:3000/login.html`
- **Admin & Tutor Console**: `http://localhost:3000/admin-login.html`

---

## 🧪 Automated Testing
Run the end-to-end integration and security test suite:
```bash
node scripts/testFullPlatform.js
```
Runs 44 automated assertions verifying identity formatting, classroom creation, enrollment, lessons, materials, assignments, quizzes, CBT attempts, one-attempt lockout, attendance, discussions, gradebook aggregation, live sessions, and whiteboard state.

---

## 🎨 Design System
- **Primary Blue**: `#1E40AF`
- **Secondary Orange-Red**: `#FF4500`
- **Tertiary Saffron**: `#F4C430`
- **Neutrals**: Slate Dark (`#0F172A`) & Crisp Slate Light (`#F8FAFC`, `#FFFFFF`, `#E2E8F0`)
- **Typography**: Inter (Body) & Outfit (Headers)
- **Scientific Rendering**: KaTeX $\KaTeX$
