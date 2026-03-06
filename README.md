<div align="center">

# ☪ IHSAN — إحسان

### *Transparent Charity. Preserved Dignity. Verified Impact.*

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://prisma.io)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

> **IHSAN** (إحسان) means *excellence* and *doing what is beautiful* in Arabic.  
> A production-grade platform that makes every charitable act traceable, private, and provably real.

</div>

---

## 🌍 The Problem We Solve

> *"70% of donors stop giving because they don't know where their money went."*

Traditional charity platforms suffer from three fundamental failures:

| ❌ Problem | Impact |
|---|---|
| **Pooled funds** — money goes & disappears into a general fund | Donors lose trust. Contributions stop. |
| **Exposed identities** — beneficiaries publicly named or photographed | Human dignity is violated. People refuse help. |
| **Unverifiable claims** — "your donation helped someone" | No proof. No trust. No accountability. |

**IHSAN solves all three** — simultaneously.

---

## ✅ What IHSAN Does Differently

```
Traditional:  Donor → Pool → "Trust us" → Maybe someone helped
IHSAN:        Donor → Specific Need → Validator confirms → Cryptographic proof → Donor sees it
```

Every donation on IHSAN is:
- 🎯 **Targeted** — linked to a specific, field-verified need (not a pool)
- 🔒 **Private** — beneficiary names are never shown, anywhere, to anyone
- ✅ **Confirmed** — a trusted ground validator attests to delivery
- 🔗 **Immutable** — SHA-256 hash-chained, tamper-detectable record
- 📡 **Real-time** — WebSocket events keep every party updated instantly

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         FRONTEND  (React 18)                        │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │   Auth   │  │  Needs   │  │  Donor   │  │  Public Dashboard  │  │
│  │ Context  │  │ Catalog  │  │   Flow   │  │  (no login needed) │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       └─────────────┴─────────────┴─────────────────┘             │
│                        Axios API Client                             │
│                    + Socket.IO-client (real-time)                  │
└──────────────────────────────┬─────────────────────────────────────┘
                               │  REST  +  WebSocket
┌──────────────────────────────┴─────────────────────────────────────┐
│                    BACKEND  (Node.js + Express)                      │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Routes:  /auth  /needs  /donations  /wallet  /impact-proofs │   │
│  └─────────────────────────┬───────────────────────────────────┘   │
│  ┌─────────────────────────┴───────────────────────────────────┐   │
│  │  Middleware:  JWT Auth │ Role Guard │ Validators │ Rate Limit│   │
│  └─────────────────────────┬───────────────────────────────────┘   │
│  ┌─────────────────────────┴───────────────────────────────────┐   │
│  │  Services:   AuthSvc │ NeedSvc │ DonationSvc │ WalletSvc    │   │
│  └─────────────────────────┬───────────────────────────────────┘   │
│  ┌─────────────────────────┴───────────────────────────────────┐   │
│  │  Repositories:  UserRepo │ NeedRepo │ DonationRepo │ ProofRepo│  │
│  └─────────────────────────┬───────────────────────────────────┘   │
│  ┌─────────────────────────┴───────────────────────────────────┐   │
│  │  Socket.IO:  donation:created │ donation:confirmed │ need:funded│ │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬─────────────────────────────────────┘
                               │
┌──────────────────────────────┴─────────────────────────────────────┐
│                  PostgreSQL 14+  (via Prisma ORM)                    │
│   users │ needs │ donations │ wallets │ impact_proofs │ audit_logs  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 👥 Role Model

IHSAN operates on a **four-role trust architecture**. Each role has strictly scoped permissions:

| Role | Who | Can Do |
|---|---|---|
| **🧑‍🤝‍🧑 DONOR** | Anyone | Browse needs, donate, track own donations, verify proofs |
| **🏅 VALIDATOR** | Trusted field workers | Create needs, confirm delivery, build reputation score |
| **🍽️ RESTAURANT** | Food providers | Receive funded orders, confirm meal preparation |
| **👑 ADMIN** | Platform staff | Create validators & admins, view audit logs, manage platform |

> **Security note:** VALIDATOR and ADMIN accounts can only be created by an existing admin — they cannot self-register.

---

## 🔗 The Immutability Chain

Every donation creates a permanent, tamper-detectable record using SHA-256 chaining:

```
Donation #1:  hash = SHA256(donor_id || need_id || amount || timestamp)
                     ↓ stored as previousHash
Donation #2:  hash = SHA256(donor_id || need_id || amount || timestamp)
                     ↓ stored as previousHash
Donation #3:  hash = SHA256(...) → links to #2 → detects if #2 was altered
```

**On confirmation:**
1. `status` → `CONFIRMED`
2. `immutable` flag → `true`
3. Database-level: no further writes allowed on this record
4. Public endpoint: `GET /api/verify/:transactionHash` returns cryptographic proof

**Why not full blockchain?**  
For the current scale, SHA-256 chaining in PostgreSQL provides the same tamper-detection guarantees without the operational complexity. Blockchain anchoring to Polygon is architected as a plug-in for Phase 3.

---

## 🔐 Security Design

| Layer | Mechanism |
|---|---|
| **Authentication** | JWT access tokens (15min) + rotating refresh tokens (7d) |
| **Password storage** | bcrypt with cost factor 12 |
| **Rate limiting** | Strict on `/auth` (brute-force prevention) + general API limit |
| **Role enforcement** | Middleware-level on every protected route |
| **Audit logging** | Every state-changing action is immutably logged with actor + IP |
| **Anomaly detection** | Auto-flags if a validator donates to and confirms their own need |
| **Race condition safety** | Wallet deductions use atomic `$transaction` blocks in Prisma |
| **Input validation** | `express-validator` rules on all mutation endpoints |
| **Headers** | Helmet.js security headers on all responses |

---

## 🗂️ Project Structure

```
ihsan/
├── backend/
│   ├── config/              # App configuration (env, JWT, rate limits)
│   ├── controllers/         # HTTP request/response handlers
│   ├── middlewares/         # JWT auth, role guard, validators, error handler
│   ├── prisma/              # Schema, migrations, seed data
│   ├── repositories/        # Data access layer (all DB queries here)
│   ├── routes/              # API route definitions
│   ├── services/            # Business logic (donation flow, wallet, etc.)
│   ├── tests/               # Jest integration & unit tests
│   ├── utils/               # Hash generation, error classes, logger
│   └── server.js            # Express + Socket.IO entry point
│
└── frontend/
    └── src/
        ├── components/      # Reusable UI components (Navbar, Cards, etc.)
        ├── context/         # Auth context (global session state)
        ├── hooks/           # Custom hooks (socket events, data fetching)
        ├── pages/           # Route-level page components
        ├── services/        # Axios API client + endpoint functions
        ├── styles/          # Global CSS
        └── App.js           # Root component + React Router setup
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+
- **npm** or **yarn**

### 1. Clone & Install

```bash
git clone https://github.com/your-repo/ihsan.git
cd ihsan

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your values:

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | Long random string (32+ chars) | ✅ |
| `PORT` | API port | Default: `5000` |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifetime | Default: `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime | Default: `7d` |
| `CORS_ORIGIN` | Frontend URL | Default: `http://localhost:3000` |

### 3. Database Setup

```bash
cd backend

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed demo data (includes the Ali Iftar scenario)
npm run db:seed
```

### 4. Run in Development

```bash
# Terminal 1 — API server
cd backend && npm run dev

# Terminal 2 — React dev server
cd frontend && npm start
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:5000/api/v1 |
| Health check | http://localhost:5000/api/v1/health |
| Prisma Studio | `npm run prisma:studio` |

---

## 🎬 End-to-End Demo — The Ali Iftar Scenario

This walkthrough proves the entire platform works end-to-end in under 3 minutes.

### 1️⃣ Validator Creates a Need *(~30s)*
- Login as **Sidi M.** (`sidi@ihsan.org` / `password123`)
- Navigate to Validator Panel
- A need already exists: *"5 Iftar meals – Tevragh Zeina – 1,250 MRU"*
- Status: **OPEN** · Assigned restaurant: Al Baraka

### 2️⃣ Donor Ali Donates *(~45s)*
- Login as **Ali** (`ali@donor.com` / `password123`)
- Browse the Needs Catalog → find the Iftar meals card
- Click **Donate 1,250 MRU**
- Instantly receive a **cryptographic receipt** containing:
  - Unique transaction ID
  - SHA-256 hash
  - Timestamp + amount
  - Linked need description

### 3️⃣ Restaurant Receives the Order *(~20s)*
- Login as **Al Baraka** (`albaraka@restaurant.com` / `password123`)
- See the funded order appear in the Restaurant Dashboard (via WebSocket)
- Status: *Awaiting preparation*

### 4️⃣ Validator Confirms Delivery *(~45s)*
- Login again as **Sidi M.**
- Open Funded tab → find Ali's donation
- Click **Confirm Delivery**
- Add message: *"All 5 Iftar meals delivered to families in Tevragh Zeina"*
- Donation becomes **CONFIRMED** and **immutable** — no further edits possible

### 5️⃣ Donor Sees the Proof *(~20s)*
- Login as Ali → go to My Donations
- See ✅ confirmed status + impact message
- The SHA-256 hash is publicly verifiable at `/api/verify/:hash`

### 6️⃣ Public Dashboard *(~20s)*
- Visit the Dashboard without logging in
- See the confirmed transaction: 1,250 MRU · Tevragh Zeina · CONFIRMED
- **Zero beneficiary data exposed** — only neighborhood and type

---

## 🧪 Running Tests

```bash
cd backend
npm test
```

Test coverage includes:

| Suite | What's tested |
|---|---|
| **Unit** | Hash generation & verification, error classes, duration parser |
| **Middleware** | JWT authentication, token expiration, role guard |
| **Integration** | Full donation lifecycle, wallet atomic deduction |
| **Edge cases** | Double confirmation attempt, overdraft prevention, self-donate anomaly flag |

---

## 🌐 API Reference (key endpoints)

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | — | Create DONOR or RESTAURANT account |
| `POST` | `/api/v1/auth/login` | — | Get access + refresh tokens |
| `POST` | `/api/v1/auth/refresh` | — | Rotate refresh token |
| `GET` | `/api/v1/auth/profile` | JWT | Get current user profile |

### Needs
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/needs` | — | Browse all open needs |
| `POST` | `/api/v1/needs` | VALIDATOR | Create a verified need |
| `PATCH` | `/api/v1/needs/:id/status` | VALIDATOR | Update need status |
| `PATCH` | `/api/v1/needs/:id/confirm` | RESTAURANT | Confirm meal delivery |

### Donations
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/donations` | DONOR | Create a donation |
| `GET` | `/api/v1/donations/dashboard` | — | Public donation feed |
| `GET` | `/api/v1/donations/verify/:hash` | — | Verify a transaction hash |
| `GET` | `/api/v1/donations/mine` | DONOR | My donation history |

### Wallet
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/wallet` | JWT | Get wallet + transaction history |
| `POST` | `/api/v1/wallet/deposit` | JWT | Add virtual funds |
| `POST` | `/api/v1/wallet/withdraw` | JWT | Withdraw virtual funds |

---

## 🤝 Trust Architecture

```
  VALIDATOR (field-verified)              DONOR (anonymous)
        │                                        │
        │  Creates Need                          │  Browses catalog
        │  (GPS + neighborhood attached)         │  (sees no PII)
        ▼                                        ▼
     ┌──────┐   ──── funds ──────►   ┌──────────────┐
     │ Need │                        │   Donation    │
     │ OPEN │◄────── locked ─────    │   PENDING     │
     └──┬───┘                        └──────┬────────┘
        │                                   │
        │  Validator confirms delivery       │  Donor notified (WebSocket)
        │  (no beneficiary name exposed)    │
        ▼                                   ▼
     ┌──────────┐                 ┌─────────────────┐
     │   Need   │                 │    Donation      │
     │ CONFIRMED│                 │    CONFIRMED     │ ← immutable = true
     └──────────┘                 │  + Impact Proof  │
                                  └────────┬─────────┘
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │ Public Dashboard │
                                  │  (zero PII)      │
                                  └─────────────────┘
```

### Core Principles
- 🛡️ **Beneficiary privacy** — names stored in a locked private table, never surfaced by any API
- 🎯 **Targeted giving** — every coin goes to one specific, field-verified need
- 🏅 **Validator accountability** — reputation scores track delivery history; anomalies are auto-flagged
- 🔒 **Immutability** — confirmed donations cannot be edited by anyone, including admins
- 👁️ **Radical transparency** — all transactions visible on public dashboard, minus any PII

---

## ⚖️ Design Decisions & Tradeoffs

| Decision | Alternative | Why we chose this |
|---|---|---|
| SHA-256 hash chaining | Full blockchain | Same tamper-detection; zero operational overhead for MVP |
| Single validator per need | Multi-sig (2-of-3) | Simplicity; multi-sig is scheduled for v2 |
| Simulated wallet | Real mobile money | Regulatory compliance; PSP integration is a swap, not a redesign |
| PostgreSQL | NoSQL | ACID compliance is non-negotiable for financial records |
| Socket.IO | Server-Sent Events | Room-based targeting (private notifications per user) |
| JWT (stateless) | Sessions | Horizontal scalability; refresh token rotation mitigates the revocation gap |
| Atomic Prisma `$transaction` | App-level balance check | Eliminates race conditions on concurrent donation attempts |

---

## 📈 Roadmap

### Phase 1 — Production Hardening
- [ ] Real mobile money integration (Bankily, Sedad)
- [ ] Photo upload for impact proofs (Cloudinary / S3)
- [ ] Multi-language UI (Arabic RTL + French)
- [ ] Push notifications (Web Push API)

### Phase 2 — Scale
- [ ] Redis caching layer for catalog & stats
- [ ] PostgreSQL read replicas
- [ ] CDN for static assets
- [ ] Kubernetes deployment with auto-scaling
- [ ] Full observability (OpenTelemetry + Grafana)

### Phase 3 — Decentralization
- [ ] Blockchain anchoring (Polygon testnet → mainnet)
- [ ] IPFS storage for impact proof photos
- [ ] Multi-validator confirmation (2-of-3 threshold)
- [ ] DAO governance for validator onboarding

### Phase 4 — Ecosystem
- [ ] React Native mobile app
- [ ] SMS notifications for low-connectivity areas
- [ ] Government impact reporting dashboard
- [ ] Tax-deductible receipt generation
- [ ] AI-assisted fraud detection on validator patterns

---

## 🪪 Demo Credentials

| Role | Email | Password |
|---|---|---|
| 🧑‍🤝‍🧑 Donor (Ali) | `ali@donor.com` | `password123` |
| 🧑‍🤝‍🧑 Donor | `mariam@donor.com` | `password123` |
| 🏅 Validator | `sidi@ihsan.org` | `password123` |
| 🏅 Validator | `fatima@ihsan.org` | `password123` |
| 🍽️ Restaurant | `albaraka@restaurant.com` | `password123` |
| 🍽️ Restaurant | `darnanoua@restaurant.com` | `password123` |
| 👑 Admin | `admin@ihsan.org` | `password123` |

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 18 + React Router | Component model, hooks, ecosystem |
| **State** | React Context + custom hooks | Avoids Redux for this scope |
| **HTTP client** | Axios + interceptors | Auto token refresh, error normalization |
| **Real-time** | Socket.IO | Room-based private notifications |
| **Backend** | Node.js + Express | Fast, non-blocking, JavaScript isomorphism |
| **ORM** | Prisma | Type-safe queries, migrations, Postgres-native |
| **Database** | PostgreSQL 14 | ACID, rich querying, proven at scale |
| **Auth** | JWT + bcrypt + refresh tokens | Stateless, secure, rotatable |
| **Hashing** | SHA-256 (Node crypto) | Timing-safe, collision-resistant, standard |
| **Security** | Helmet + express-rate-limit | Industry-standard hardening |
| **Testing** | Jest + Supertest | Full integration + unit coverage |
| **Deploy** | Render.com (via `render.yaml`) | Zero-config, PostgreSQL managed |

---

## 📜 License

MIT — see [LICENSE](LICENSE)

---

<div align="center">

*Built with **إحسان** — because every act of charity deserves trust, transparency, and dignity.*

**IHSAN** · إحسان · Excellence in giving

</div>
