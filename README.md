# 🚀 AI-Powered HR Management System (HRMS)

![HRMS Banner](https://via.placeholder.com/1200x300.png?text=Next-Gen+HR+Management+System)

A modern, scalable, and intelligent Human Resources Management System designed to streamline the entire employee lifecycle. Built with a high-performance stack (Next.js & FastAPI), this platform features cutting-edge AI integrations to automate recruitment, predict attrition risks, and handle routine HR tasks seamlessly.

---

## ✨ Key Features

### 🏢 Core HR Capabilities
- **Employee Directory & Profiles:** Centralized database for all employee records and interactive organizational charts.
- **Attendance & Leave Management:** Clock-in/out tracking, attendance heatmaps, and automated leave balance tracking.
- **Payroll System:** Automated, scheduled payroll processing with downloadable PDF payslips.
- **Performance Management:** Goal setting, tracking, and streamlined performance review cycles.
- **Recruitment Pipeline:** Job requisition creation, career portal, and Kanban-style applicant tracking.

### 🤖 AI & Automation ("Wow" Features)
- **🎙️ Voice Interview Bot:** Fully automated AI interviewer that converses with candidates, assesses their responses, and generates feedback transcripts.
- **📄 AI Resume Screener:** Automatically parses and ranks candidate resumes against job descriptions based on suitability.
- **🔮 Attrition Risk Predictor:** Analyzes attendance, performance, and leave data to proactively flag employees at risk of leaving.
- **📝 Job Description Generator:** Automatically drafts professional job postings based on a simple one-line prompt from HR.
- **💬 HR Chatbot:** A 24/7 intelligent assistant embedded in the dashboard to answer employee policy queries instantly.

---

## 🛠️ Technology Stack

### Frontend (`/hr-management`)
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI (shadcn/ui) for accessible, beautiful components.
- **State Management:** Zustand
- **Data Visualization:** Recharts
- **Animations:** Framer Motion

### Backend (`/hrms-backend`)
- **Framework:** FastAPI (Python)
- **Database ORM:** SQLAlchemy & Alembic (Migrations)
- **Background Tasks:** APScheduler
- **Authentication:** JWT, Passlib, Bcrypt
- **AI Integrations:** Google Generative AI (Gemini) & Groq APIs

### Infrastructure
- **Database & Storage:** Supabase (PostgreSQL)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL (or a Supabase project)

### 1. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd hrms-backend
pip install -r requirements.txt
```
Set up your environment variables by copying the example file:
```bash
cp .env.example .env
# Edit .env with your Supabase DB URI and AI API keys
```
Run the FastAPI development server:
```bash
python run.py
```

### 2. Frontend Setup
Navigate to the frontend directory and install dependencies:
```bash
cd hr-management
npm install
```
Set up your environment variables:
```bash
cp .env.local.example .env
# Edit .env with your Supabase project URL and anon key
```
Run the Next.js development server:
```bash
npm run dev
```

### 3. Access the Application
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🏗️ Project Structure Overview

Detailed summaries of the architecture can be found in our internal documentation:
- [allinfo_hrms.md](./allinfo_hrms.md): Comprehensive 1-line breakdown of every file and folder.
- [summary.md](./summary.md): Detailed overview of the tech stack choices and feature highlights.
- [script.md](./script.md): The demo video walkthrough script.

---

## 📄 License
This project is proprietary and confidential. All rights reserved.
