
# DevPilot

**Your Career Operating System**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=flat&logo=google&logoColor=white)](https://ai.google.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

*Track applications. Manage resumes. Master DSA. Land the offer.*

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)

---

## Overview

**DevPilot** is a full-stack placement and career management platform built for students and early-career developers. Instead of juggling spreadsheets, PDFs, and sticky notes, DevPilot brings the entire placement journey into a single, focused dashboard.

From tracking job applications to analyzing resumes with AI, DevPilot helps you stay organized, measure progress, and focus on what matters: landing the role.

## Features

### Dashboard

- Personalized greeting with time-based context.
- Live placement statistics: applications, interviews, offers, and DSA problems solved.
- Quick actions to add jobs, interviews, goals, and resumes.
- Upcoming deadlines and recent activity feed.

### Job Tracker

- Full application pipeline: Wishlist, Applied, OA, Interview, HR, Offer, and Rejected.
- Search, filter, and sort by status, company, or date.
- Archive completed applications without losing history.
- Detailed side panel with notes, referral information, and job links.

### Resume Manager

- Upload, preview, and download PDF resumes.
- Support for personal and third-party resumes.
- Tag-based organization.
- Inline PDF preview directly in the browser.

### AI Resume Analyzer

- Powered by Google Gemini.
- Scores your resume out of 100.
- Highlights strengths, weaknesses, detected skills, and actionable suggestions.
- Caches analysis results to avoid redundant API calls.

### AI Job-Resume Matcher

- Paste job descriptions from LinkedIn, company websites, or messages.
- Select one of your uploaded resumes.
- Get a match score with strong matches, weak areas, and recommendations.
- Operates independently of the Job Tracker. Confirm the data-handling behavior against your implementation.

### DSA Progress

- Log solved problems with topic, difficulty, and platform.
- Visualize progress with charts and topic breakdowns.
- Set targets and track streaks.
- Sync with LeetCode and Codeforces.

### Interviews

- Log upcoming and past interviews.
- Track company, role, date, time, and status.

### Goals

- Create short-term and long-term placement goals.
- Track progress with deadlines and priorities.
- Mark goals as active or completed.

### Analytics

- Visual insights into application trends.
- Interview conversion rates.
- DSA topic distribution.

### Profile

- Editable profile with name, bio, location, and target role.
- Skills with smart suggestions.
- Social links for GitHub, LinkedIn, portfolio, and Twitter/X.
- Education and experience sections.
- Profile picture uploads using Supabase Storage.
- Dynamic profile completion meter.

### Settings

- Light and dark theme toggle.
- Notification preferences.
- Privacy controls.
- Password management.

### Authentication

- Email and password login.
- Google OAuth sign-in.
- Automatic account linking when the same email is used.
- Google-only users can set a password through the registration page to enable password login.

---

## Tech Stack

### Frontend

- **React 18** with Vite
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **Axios** for API calls
- **React Hook Form** for forms
- **Recharts** for data visualization
- **Lucide React** and **React Icons** for icons

### Backend

- **Node.js** with Express
- **MongoDB Atlas** with Mongoose
- **JWT** for authentication
- **bcrypt** for password hashing
- **Passport.js** with Google OAuth 2.0
- **Multer** for file uploads
- **Supabase Storage** for resume and profile picture storage

### AI

- **Google Gemini** (`@google/genai`) for resume analysis and job matching.

---


| Page | Screenshot path |
|---|---|
| Dashboard | `docs/screenshots/dashboard.png` |
| Job Tracker | `docs/screenshots/jobs.png` |
| AI Matcher | `docs/screenshots/matcher.png` |
| Profile | `docs/screenshots/profile.png` |


---

## Getting Started

Follow these instructions to run DevPilot locally.

### Prerequisites

- [Node.js 18 or higher](https://nodejs.org/)
- npm
- A MongoDB Atlas account or local MongoDB installation
- A Supabase project for file storage
- A Google Cloud project with OAuth 2.0 credentials for Google login
- A Google Gemini API key

### 1. Clone the repository

Replace `your-username` with your GitHub username.

```bash
git clone https://github.com/your-username/devpilot.git
cd devpilot
```

### 2. Install dependencies

Install frontend dependencies:

```bash
cd client
npm install
```

Install backend dependencies in a separate terminal from the repository root:

```bash
cd server
npm install
```

### 3. Configure environment variables

Create a `.env` file in both the `server` and `client` directories.

See [Environment Variables](#environment-variables) for the required configuration.

### 4. Start the backend

From the `server` directory, run:

```bash
npm run dev
```

Ensure the `dev` script exists in `server/package.json`. Otherwise, use the appropriate start command for your project.

### 5. Start the frontend

Open a second terminal and run:

```bash
cd client
npm run dev
```

### 6. Open the application

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000

These URLs assume the default ports are configured in your application.

---

## Environment Variables

### Backend: `server/.env`

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/devpilot

JWT_SECRET=your_jwt_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

GEMINI_API_KEY=your_gemini_api_key

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Frontend: `client/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

### Environment configuration notes

- Replace every placeholder with the appropriate value from your provider.
- Configure the MongoDB connection string and ensure your database allows connections from your development environment.
- Generate a strong, random `JWT_SECRET`. Never commit real secrets to GitHub.
- Configure Google OAuth redirect URLs to match your local or production environment.
- Ensure Supabase Storage policies and permissions match your application's upload and download requirements.
- Keep your Gemini API key on the backend. Do not expose it through a `VITE_` environment variable.
- Add `.env` files to `.gitignore` and commit `.env.example` files containing placeholders instead.

---

## Project Structure

The project follows a client-server architecture.

```text
devpilot/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   └── layout/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   ├── package.json
│   └── .env.example
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── docs/
│   └── screenshots/
├── .gitignore
└── README.md
```

*Note: This structure is illustrative. Adjust it to match your actual repository.*

---

## API Overview

All API endpoints are prefixed with `/api`.

Protected endpoints require valid authentication through the mechanism configured by the application, such as a JWT in the `Authorization: Bearer <token>` header or an authenticated cookie.

The following endpoints describe the intended API surface. Verify the methods and paths against your backend implementation.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in with email and password |
| GET | `/api/auth/me` | Get the authenticated user |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | Handle the Google OAuth callback |

### Jobs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/jobs` | List active jobs |
| POST | `/api/jobs` | Create a job |
| PUT | `/api/jobs/:id` | Update a job |
| DELETE | `/api/jobs/:id` | Delete a job |
| PATCH | `/api/jobs/:id/archive` | Archive a job |
| GET | `/api/jobs/archived` | List archived jobs |
| PATCH | `/api/jobs/:id/restore` | Restore an archived job |

### Resumes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/resumes` | List user resumes |
| POST | `/api/resumes` | Upload a resume |
| GET | `/api/resumes/:id/preview` | Get a signed preview URL |
| GET | `/api/resumes/:id/download` | Download a resume |
| PUT | `/api/resumes/:id` | Update resume metadata |
| PATCH | `/api/resumes/:id/archive` | Archive a resume |
| DELETE | `/api/resumes/:id` | Delete a resume |
| POST | `/api/resumes/:id/analyze` | Analyze a resume with AI |
| POST | `/api/resumes/match` | Match a resume to a job description |

### Interviews

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/interviews` | List interviews |
| POST | `/api/interviews` | Create an interview |
| PUT | `/api/interviews/:id` | Update an interview |
| DELETE | `/api/interviews/:id` | Delete an interview |

### DSA Progress

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dsa` | List DSA problems |
| POST | `/api/dsa` | Add a problem |
| PUT | `/api/dsa/:id` | Update a problem |
| DELETE | `/api/dsa/:id` | Delete a problem |

### Goals

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/goals` | List goals |
| POST | `/api/goals` | Create a goal |
| PUT | `/api/goals/:id` | Update a goal |
| DELETE | `/api/goals/:id` | Delete a goal |

### Dashboard, Analytics, Profile, and Settings

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics` | Get analytics data |
| GET | `/api/dashboard` | Get dashboard summary |
| GET | `/api/profile` | Get the authenticated user's profile |
| PUT | `/api/profile` | Update the profile |
| POST | `/api/profile/upload-picture` | Upload a profile picture |
| DELETE | `/api/profile/upload-picture` | Remove the profile picture |
| GET | `/api/settings` | Get user settings |
| PUT | `/api/settings` | Update user settings |
| GET | `/api/notifications` | Get upcoming interviews and goals |

---