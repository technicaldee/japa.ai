# JAPA — Your AI Scholarship Agent

> **An autonomous agent that discovers, evaluates, and applies to international scholarships on your behalf.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Built with Google ADK](https://img.shields.io/badge/Built%20with-Google%20ADK-4285F4)](https://google.github.io/adk-docs/)
[![Gemini](https://img.shields.io/badge/Powered%20by-Gemini%202.5-8E75B2)](https://deepmind.google/technologies/gemini/)
[![MongoDB](https://img.shields.io/badge/MCP-MongoDB-47A248)](https://www.mongodb.com/docs/mcp-server/)
[![Cloud Run](https://img.shields.io/badge/Deployed-Cloud%20Run-4285F4)](https://cloud.google.com/run)

---

## 🏆 For the Google Cloud Rapid Agent Hackathon

**Track:** MongoDB Partner Bucket  
**Problem:** International students waste hundreds of hours manually searching for scholarships, cross-referencing eligibility, gathering documents, and tracking deadlines across dozens of websites.  
**Solution:** An autonomous AI agent that does all of it — continuously.

### What Makes This Agent Different

| Requirement | How JAPA Delivers |
|---|---|
| **Beyond Chat** | Not a Q&A bot. The agent autonomously visits scholarship pages, extracts requirements, cross-references user profiles, and generates applications — all without human intervention. |
| **Multi-Step Mission** | Agent orchestrates a 5-step pipeline: match → visit → analyze → apply → email — planning each step and using tools to execute. |
| **Partner Power** | Deep **MongoDB MCP** integration for scholarship storage, user profiles, and real-time stats — the agent reads/writes MongoDB directly as part of its workflow. |
| **Gemini Brain** | Powered by **Gemini 2.5 Flash** for reasoning, eligibility analysis, page understanding, and match scoring. |

---

## ✨ Core Features

### 🤖 Autonomous Agent Pipeline
The Google ADK agent runs a scheduled daily pipeline:

1. **Match** — Gemini scores all scholarships against the user's academic profile (GPA, field, nationality, target countries)
2. **Visit** — Agent uses `visit_page_tool` to fetch each scholarship's URL and extract application requirements
3. **Analyze** — Agent uses `analyze_application_tool` with Gemini to determine what's needed (transcripts, essays, references, etc.)
4. **Apply** — Agent checks if auto-application is possible; if not, flags missing documents
5. **Email** — Sends a personalized match report and document request via Resend

### 📊 Full-Stack Dashboard
- **Discovery Dashboard** — Browse and filter matched scholarships with AI-predicted match scores
- **Application Engine** — Track application progress per scholarship (Applied / Docs Needed / Manual Review)
- **Document Checklist** — See exactly what documents each scholarship requires
- **Auto Agent Control** — View agent run history, match counts, and application results
- **Weekly Digest** — Summary of new matches and pending actions

### 🔌 MongoDB MCP Integration
The agent connects to MongoDB through a custom MCP server (`mcp_mongodb.py`) with these tools:
- `search_scholarships` — Query the scholarship database
- `get_scholarship_by_id` — Get full details
- `get_user_profile` — Fetch user academic data
- `save_user_profile` — Update user profiles
- `get_scholarship_stats` — Aggregate statistics

---

## 🧠 Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                      │
│  Discovery Dashboard | Applications | Documents | Auto Agent View   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼──────────────────────────────────────────┐
│                        BACKEND (Express + Prisma)                    │
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────┐  │
│  │  Matching    │  │  Scheduler   │  │ Email      │  │ Auth      │  │
│  │  Service     │─▶│  (cron 8AM)  │─▶│ Service    │  │ Service   │  │
│  └──────┬──────┘  └──────┬───────┘  └────────────┘  └───────────┘  │
│         │                │                                           │
│         │    ┌───────────▼───────────┐                               │
│         │    │  browserAgent.js      │  Routes through ADK Agent     │
│         │    │  (proxies to ADK)     │◀──────────────┐               │
│         │    └───────────┬───────────┘               │               │
└─────────┼────────────────┼───────────────────────────┼───────────────┘
          │                │                           │
┌─────────▼────────────────▼───────────────────────────▼───────────────┐
│              GOOGLE CLOUD RUN — ADK AGENT                            │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Google ADK Agent (Python)                        │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │   │
│  │  │ visit_page   │  │analyze_      │  │ MCP Tools          │  │   │
│  │  │ _tool        │  │application   │  │ (search, profile,  │  │   │
│  │  │              │  │_tool         │  │  stats, save)      │  │   │
│  │  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘  │   │
│  └─────────┼─────────────────┼────────────────────┼──────────────┘   │
│            │                 │                    │                   │
│         Gemini 2.5 Flash  Gemini 2.5 Flash    MongoDB Atlas          │
│            │                 │                    │                   │
│            ▼                 ▼                    ▼                   │
│       External URLs    External URLs         Scholarships/Profiles   │
└──────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Agent Framework** | Google ADK (Agent Development Kit) with `InMemorySessionService` |
| **LLM** | Gemini 2.5 Flash (reasoning, analysis, matching) |
| **Deployment** | Google Cloud Run (serverless container) |
| **MCP Server** | MongoDB MCP (custom `mcp_mongodb.py`) |
| **Database** | MongoDB Atlas (scholarships + profiles) + PostgreSQL via Prisma (applications + users) |
| **Backend** | Node.js / Express |
| **Frontend** | React 19 + Vite + Tailwind CSS |
| **Email** | Resend API |
| **Auth** | JWT with bcrypt |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Python 3.12+
- MongoDB Atlas cluster
- PostgreSQL database (Neon recommended)
- Google Cloud SDK
- Gemini API key

### 1. Clone & Install

```bash
git clone https://github.com/technicaldee/japa.ai.git
cd japa.ai

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install

# Agent
cd ../agent && pip install -r requirements.txt
```

### 2. Environment Variables

```bash
# backend/.env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
GEMINI_API_KEY="your-key"
RESEND_API_KEY="re_..."
AGENT_URL="https://japa-agent-...-uc.a.run.app"
```

### 3. Run Locally

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Agent (for local dev)
cd agent && python server.py
```

### 4. Deploy Agent to Cloud Run

```bash
cd agent
./deploy.sh
```

---

## 📹 Demo & Walkthrough

[![JAPA Demo Video](https://img.shields.io/badge/Watch-Demo%20Video-FF0000?logo=youtube)](https://youtu.be/your-video-link)

> **Live demo:** [japa-frontend-11121208510.us-central1.run.app](https://japa-frontend-11121208510.us-central1.run.app)

The demo walkthrough covers:
1. User signup & profile setup
2. Autonomous agent matching scholarships
3. Agent visiting + analyzing external scholarship websites
4. Application tracking dashboard
5. Email report delivery

---

## 📁 Project Structure

```
japa/
├── agent/                    # Google ADK Agent (Python)
│   ├── server.py            # Flask server with 7 agent tools + endpoints
│   ├── mcp_mongodb.py       # MongoDB MCP server implementation
│   ├── agent.py             # CLI version of the ADK agent
│   ├── Dockerfile           # Cloud Run container
│   ├── cloudbuild.yaml      # CI/CD pipeline
│   └── requirements.txt     # Python dependencies
│
├── backend/                  # Express API Server
│   ├── src/
│   │   ├── controllers/     # Route handlers (agent, auth, scholarships, etc.)
│   │   ├── services/        # Core business logic
│   │   │   ├── matching.js        # Gemini-powered scholarship ranking
│   │   │   ├── browserAgent.js    # Proxies requests to ADK agent
│   │   │   ├── agentScheduler.js  # Daily cron orchestrator
│   │   │   └── email.js           # Resend email templates
│   │   ├── routes/          # Express route definitions
│   │   ├── middleware/      # Auth, error handling
│   │   └── utils/           # Prisma client, config
│   ├── prisma/              # Database schema and migrations
│   └── package.json
│
├── frontend/                 # React SPA (Vite)
│   ├── src/
│   │   ├── pages/           # DiscoveryDashboard, ApplicationEngine, AiAgent, etc.
│   │   ├── components/      # Sidebar, shared components
│   │   ├── api/             # API client modules
│   │   └── context/         # Auth context
│   └── package.json
│
├── README.md
├── LICENSE
└── CONTRIBUTORS.md
```

---

## 🧪 How the Agent Judges Applications

When the agent encounters a scholarship URL, it:

1. **Fetches** the page using `urllib` with a browser User-Agent
2. **Strips HTML** to extract readable text
3. **Sends to Gemini** with a structured prompt asking for:
   - Required application fields
   - Missing documents
   - Auto-fillable data from user profile
   - `canApply` boolean decision
4. **Returns** structured JSON to the backend

```json
{
  "canApply": true,
  "missingDocs": ["transcript", "essay"],
  "instructions": "Prepare transcript and essay for submission. Deadline: July 15.",
  "scholarshipName": "Mongolia Scholars Program",
  "applicationFields": ["fullName", "email", "gpa", "essay"],
  "prefilledData": { "fullName": "Jane Doe", "email": "jane@example.com" }
}
```

---

## 👥 Contributors

- **Edidiong Udoh** — Lead Developer, ADK Agent, Backend, Architecture
- **Boluwatife Adegoke** — Frontend Design System, UI/UX Components

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

## 🙏 Acknowledgements

- **Google ADK** team for the agent development framework
- **MongoDB** for the MCP server and Atlas platform
- **Google Cloud** for Cloud Run hosting
- **Resend** for email delivery
- **Neon** for PostgreSQL
