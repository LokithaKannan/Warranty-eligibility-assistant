# Product Warranty and Claim Eligibility Assistant

> **Wipro CPPE (Cloud Product & Platform Engineering) — Student Project**
>
> This application provides a **preliminary warranty eligibility check** for informational purposes only.
> It does not guarantee claim approval. Final eligibility must be confirmed by the manufacturer or
> authorized service provider.

---

## Problem Statement

Warranty policies contain lengthy terms, exclusions, and claim procedures that are difficult to
navigate manually. This application lets users upload a warranty PDF, extract its text, confirm
the policy details, enter product and issue information, and receive a preliminary eligibility
assessment backed by transparent, deterministic rules.

---

## Features

| Feature | Description |
|---------|-------------|
| PDF Upload & Extraction | Upload warranty PDFs; extract text page-by-page with PyMuPDF-equivalent Node.js library |
| Policy Clause Detection | Automatically detect duration, exclusions, proof requirements from extracted text |
| Reviewer Confirmation | Reviewers confirm/edit auto-detected clauses before they are used in eligibility checks |
| Claim Assessment | Deterministic 8-rule engine produces preliminary results with full rule explanations |
| Evidence Traceability | Every result links to the source clause and page number |
| Authentication & RBAC | JWT auth; Admin / Reviewer / Customer roles enforced on every endpoint |
| Audit Logging | All important actions recorded with timestamps and actor information |
| REST API + Swagger | Full OpenAPI documentation at `/api/docs` |
| Docker & CI/CD | Dockerfile, Docker Compose, and GitHub Actions workflow provided |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Pure CSS design system (no Tailwind dependency) |
| Backend | Node.js 20 + Express + TypeScript |
| Database | SQLite via Prisma ORM |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| PDF Extraction | pdf-parse |
| API Validation | Zod |
| API Documentation | Swagger / OpenAPI (swagger-jsdoc + swagger-ui-express) |
| Testing | Vitest + Supertest |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## Project Structure

```
warranty-eligibility-assistant/
├── backend/
│   ├── src/
│   │   ├── config/          # env, database, jwt
│   │   ├── controllers/     # auth, policy, claim, admin
│   │   ├── middleware/       # auth, validate, error, requestId
│   │   ├── routes/          # auth, policy, claim, admin
│   │   ├── services/        # auth, pdf, policyParser, eligibility, claim, audit
│   │   ├── types/           # shared TypeScript types
│   │   ├── utils/           # logger, response, crypto, params
│   │   ├── app.ts           # Express application
│   │   └── server.ts        # Entry point
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Demo data seeder
│   ├── tests/               # Vitest test suites
│   └── uploads/             # PDF storage (gitignored)
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API clients
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # useAuth context
│   │   ├── layouts/         # AppLayout with sidebar
│   │   ├── pages/           # All page components
│   │   ├── styles/          # Global CSS design system
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Date formatting
│   │   ├── App.tsx          # Router and providers
│   │   └── main.tsx         # Entry point
├── docs/                    # Architecture, AWS mapping, security docs
├── .github/workflows/       # CI/CD
├── docker-compose.yml
└── README.md
```

---

## Prerequisites

- **Node.js** 18+ (tested with v24)
- **npm** 8+
- **Git**

---

## Quick Start — Windows PowerShell

### 1. Navigate to project root

```powershell
cd warranty-eligibility-assistant
```

### 2. Install backend dependencies

```powershell
cd backend
npm install
```

### 3. Set up environment

```powershell
# .env already exists with development defaults
# Review and update secrets for any shared environment
notepad .env
```

### 4. Run database migrations

```powershell
.\node_modules\.bin\prisma migrate deploy
```

### 5. Seed sample data

```powershell
.\node_modules\.bin\tsx prisma/seed.ts
```

### 6. Start backend

```powershell
npm run dev
# Backend runs at http://localhost:3001
# API docs at http://localhost:3001/api/docs
```

### 7. Install & start frontend (new terminal)

```powershell
cd ..\frontend
npm install
npm run dev
# Frontend runs at http://localhost:5173
```

### 8. Open the application

- **Application**: http://localhost:5173
- **API Documentation**: http://localhost:3001/api/docs
- **Health check**: http://localhost:3001/api/health

---

## Demo Accounts

> ⚠️ **Development use only.** Change all passwords before any shared deployment.

| Role | Username | Password |
|------|----------|----------|
| Administrator | `admin` | `Admin@Demo2024!` |
| Reviewer | `reviewer` | `Reviewer@Demo2024!` |
| Customer | `customer` | `Customer@Demo2024!` |

---

## Running Tests

```powershell
cd backend
.\node_modules\.bin\vitest run
```

Expected output: **33 tests passing** across 4 test files.

---

## Docker (if Docker is installed)

```powershell
# From project root
docker-compose up --build

# Application: http://localhost:80
# API: http://localhost:3001
```

Set environment variables before running:
```powershell
$env:JWT_SECRET = "your-strong-random-secret-min-32-chars"
$env:ADMIN_SETUP_TOKEN = "your-setup-token"
```

---

## API Documentation

Interactive Swagger UI is available at: `http://localhost:3001/api/docs`

Key endpoints:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/setup` | One-time admin setup |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| POST | `/api/policies` | Upload warranty PDF |
| GET | `/api/policies` | List policies |
| POST | `/api/policies/:id/confirm` | Confirm policy (reviewer) |
| POST | `/api/claims/check` | Submit claim assessment |
| GET | `/api/claims` | List claims |
| GET | `/api/claims/:referenceCode` | Get claim details |
| PATCH | `/api/claims/:referenceCode/review` | Review claim |
| GET | `/api/admin/audit-logs` | View audit logs (admin) |
| GET | `/api/admin/users` | Manage users (admin) |

---

## Wipro CPPE Module Mapping

| Module | What Was Implemented |
|--------|---------------------|
| 1 — Cloud Product & Platform Engineering | Express REST API, modular architecture, Dockerfile, Docker Compose, GitHub Actions CI, health endpoint, Swagger documentation |
| 2 — Data Engineering & ML Insights | PDF ingestion pipeline (pdf-parse), page-level text extraction, text normalization, policy clause detection (keyword-based NLP), SQLite persistence, claim statistics and filtering |
| 3 — Generative AI & RAG | Evidence retrieval pipeline: keyword-based clause matching → structured rule results → source-grounded explanations. Every answer cites the policy clause and page. LLM extension documented but not required. |
| 4 — Cloud Security & Governance | bcryptjs password hashing, JWT auth, RBAC on every endpoint, file validation (magic bytes + MIME), random storage filenames, path traversal prevention, audit logging, Zod input validation, rate limiting, security headers (helmet), CORS configuration |

---

## Limitations

- PDF extraction works on text-based PDFs. Scanned PDFs require OCR (not implemented in MVP).
- The eligibility engine uses keyword-based rule matching; unusual policy wording may not be detected.
- JWT tokens are stateless; logout invalidates client-side token only (no server-side denylist in MVP).
- This is a local prototype, not production-grade software. See `docs/security.md` for details.
- Docker runtime not verified on this machine (Docker not installed); Dockerfile and Compose are provided.

---

## License

MIT — Educational/demonstration use only.
All sample data, company names, and product names are entirely fictional.
