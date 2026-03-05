# ☪ IHSAN — إحسان

**Transparent Charity. Preserved Dignity. Verified Impact.**

A full-stack production-ready platform for targeted, traceable, and privacy-preserving charitable donations. Built with React, Node.js/Express, PostgreSQL, and WebSockets.

---

## 📐 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │  Auth     │  │  Needs   │  │  Donor    │  │  Public      │  │
│  │  Context  │  │  Catalog │  │  Flow     │  │  Dashboard   │  │
│  └─────┬────┘  └────┬─────┘  └─────┬─────┘  └──────┬───────┘  │
│        │            │              │               │           │
│  ┌─────┴────────────┴──────────────┴───────────────┴────────┐  │
│  │              API Service Layer (Axios)                     │  │
│  │              Socket Service (socket.io-client)             │  │
│  └──────────────────────────┬────────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────┘
                              │ REST + WebSocket
┌─────────────────────────────┼───────────────────────────────────┐
│                     BACKEND (Node.js + Express)                  │
│  ┌──────────────────────────┴────────────────────────────────┐  │
│  │                    Routes Layer                            │  │
│  │  /auth  /needs  /donations  /impact-proofs  /restaurants  │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│  ┌──────────────────────────┴────────────────────────────────┐  │
│  │              Middleware Layer                               │  │
│  │  JWT Auth │ Role Guard │ Validators │ Error Handler        │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│  ┌──────────────────────────┴────────────────────────────────┐  │
│  │              Controllers Layer                             │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│  ┌──────────────────────────┴────────────────────────────────┐  │
│  │              Services Layer (Business Logic)               │  │
│  │  AuthService │ NeedService │ DonationService │ ProofSvc   │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│  ┌──────────────────────────┴────────────────────────────────┐  │
│  │              Repository Layer (Data Access)                │  │
│  │  UserRepo │ NeedRepo │ DonationRepo │ ImpactProofRepo     │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│  ┌──────────────────────────┴────────────────────────────────┐  │
│  │              WebSocket Layer (Socket.IO)                    │  │
│  │  Real-time events: donation:created, donation:confirmed,   │  │
│  │  need:funded, impact:proof, order:new                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                    PostgreSQL (via Prisma ORM)                    │
│  users │ needs │ donations │ impact_proofs │ restaurants │ etc.  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### 1. Clone & Install

```bash
git clone https://github.com/your-repo/ihsan.git
cd ihsan

# Backend
cd backend
npm install
cp .env.example .env  # Edit with your DB credentials

# Frontend
cd ../frontend
npm install
```

### 2. Database Setup

```bash
cd backend

# Create the database
createdb ihsan_db

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed demo data (including Ali Iftar scenario)
npm run db:seed
```

### 3. Start Development

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start
```

- **API**: http://localhost:5000/api
- **Frontend**: http://localhost:3000
- **Health Check**: http://localhost:5000/api/health

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | Token expiration | `24h` |
| `CORS_ORIGIN` | Frontend URL | `http://localhost:3000` |
| `BLOCKCHAIN_ENABLED` | Enable blockchain anchoring | `false` |

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Donor (Ali)** | `ali@donor.com` | `password123` |
| **Donor** | `mariam@donor.com` | `password123` |
| **Validator** | `sidi@ihsan.org` | `password123` |
| **Validator** | `fatima@ihsan.org` | `password123` |
| **Restaurant** | `albaraka@restaurant.com` | `password123` |
| **Restaurant** | `darnanoua@restaurant.com` | `password123` |
| **Admin** | `admin@ihsan.org` | `password123` |

---

## 🎬 Ali Iftar Scenario Walkthrough (3 minutes)

This is the central demo proving end-to-end functionality:

### Step 1: Validator Creates Need (~30s)
1. Login as **Sidi M.** (`sidi@ihsan.org`)
2. In Validator Panel → already seeded: "5 Iftar meals – Tevragh Zeina – 1,250 MRU"
3. Need is **OPEN**, assigned to restaurant **Al Baraka**

### Step 2: Donor Ali Pays (~45s)
1. Login as **Ali** (`ali@donor.com`)
2. Browse **Needs Catalog** → see map + cards
3. Click "5 Iftar meals" card → review donation details
4. Click **Pay 1,250 MRU** → mobile money simulation
5. Receive **digital receipt** with:
   - Unique transaction ID
   - SHA-256 hash
   - Timestamp
   - Amount

### Step 3: Restaurant Sees Order (~20s)
1. Login as **Al Baraka** (`albaraka@restaurant.com`)
2. See funded meal request in Restaurant Dashboard
3. Status: Awaiting preparation

### Step 4: Validator Confirms (~45s)
1. Login as **Sidi M.** again
2. Go to **Funded** tab → see Ali's donation
3. Click **Confirm Delivery**
4. Enter: "All 5 Iftar meals delivered successfully to families in Tevragh Zeina"
5. Submit → donation becomes **CONFIRMED** and **immutable**

### Step 5: Donor Gets Proof (~20s)
1. Login as **Ali** → My Donations
2. See ✅ Impact Proof with confirmation message
3. Transaction is immutable, hash is verifiable

### Step 6: Public Dashboard (~20s)
1. Visit **Dashboard** (no login needed)
2. See confirmed transaction: 1,250 MRU, Tevragh Zeina, CONFIRMED
3. No beneficiary identity displayed
4. Hash is publicly verifiable at `/verify`

---

## 🔒 Immutability Strategy

### How it works:

1. **On donation creation**: Generate `SHA-256(donor_id + need_id + amount + timestamp)`
2. **Transaction hash** stored in `donations.transaction_hash` (unique constraint)
3. **On confirmation**: Set `immutable = true`, `status = CONFIRMED`
4. **Lock mechanism**: Once immutable, no field can be modified
5. **Verification endpoint**: `GET /api/verify/:transactionHash` returns full proof

### Why SHA-256?
- Deterministic: same inputs → same hash
- Collision-resistant: practically impossible to forge
- One-way: cannot reverse-engineer donor/beneficiary data
- Standard: widely auditable

### Blockchain Extension (Optional)
When `BLOCKCHAIN_ENABLED=true`, confirmed hashes are anchored to Ethereum testnet/Polygon, creating an external immutability guarantee beyond our database.

---

## 🤝 Trust Model

```
  Validator (trusted)          Donor
       │                        │
       │  Creates Need          │  Browses Catalog
       │  (verified on ground)  │  (sees only public info)
       ▼                        ▼
    ┌──────┐              ┌──────────┐
    │ Need │◄─────────────│ Donation │
    │ OPEN │  funds →     │ PENDING  │
    └──┬───┘              └────┬─────┘
       │                       │
       │  Confirms delivery    │
       │  (anonymized proof)   │
       ▼                       ▼
    ┌──────────┐        ┌──────────┐
    │ Need     │        │ Donation │
    │ CONFIRMED│        │ CONFIRMED│ ← immutable
    └──────────┘        │ + proof  │
                        └──────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Public Dashboard │
                    │ (no PII exposed) │
                    └──────────────────┘
```

### Key Principles:
- **Privacy**: Beneficiary data is stored in a private table, never exposed via API
- **Targeted**: Donations go to specific needs, not pooled funds
- **Verified**: Validators have reputation scores; track record matters
- **Immutable**: Confirmed transactions cannot be altered
- **Transparent**: Public dashboard shows all transactions without PII

---

## ⚖️ Tradeoffs Made

| Decision | Tradeoff | Rationale |
|----------|----------|-----------|
| **SHA-256 in DB** vs full blockchain | Less decentralization | Faster, cheaper, sufficient for MVP trust |
| **Single validator** per need | Potential single point of failure | Simplicity; multi-sig planned for v2 |
| **Simulated payment** | No real money movement | Regulatory compliance; easy to plug in real PSP |
| **PostgreSQL** vs NoSQL | Less flexible schema | Better for relational data, ACID compliance |
| **Socket.IO** vs SSE | Heavier client dependency | Bidirectional, better DX, room support |
| **JWT** vs sessions | Stateless (no revocation) | Scalable, standard for SPAs |

---

## 📈 Future Scalability Plan

### Phase 1: National Rollout
- Multi-language support (Arabic, French)
- Real mobile money integration (Bankily, Sedad)
- Multi-validator confirmation (2-of-3)
- Photo upload for impact proofs

### Phase 2: Scale
- Redis caching layer
- PostgreSQL read replicas
- CDN for static assets
- Kubernetes deployment
- Rate limiting per user

### Phase 3: Decentralization
- Blockchain anchoring (Polygon)
- IPFS for proof photos
- Zero-knowledge proofs for privacy
- DAO governance for validators

### Phase 4: Ecosystem
- Mobile app (React Native)
- SMS notifications for low-connectivity areas
- Government reporting integration
- Tax receipt generation
- AI fraud detection

---

## 🧪 Running Tests

```bash
cd backend
npm test
```

Tests cover:
- **Unit**: Hash generation/verification, error classes
- **Middleware**: JWT authentication, role-based access
- **Integration**: Donation flow, edge cases
- **Edge cases**: Double confirmation, expired JWT, duplicate payment

---

## 📊 5-Slide Presentation Outline

### Slide 1: Problem
- 70% of donors don't trust where their money goes
- Beneficiary dignity is often compromised
- No verifiable proof of impact

### Slide 2: Solution — IHSAN
- Targeted donations (not pooled)
- Privacy-preserving (beneficiaries never exposed)
- Validator-confirmed delivery with proof
- SHA-256 immutable receipts

### Slide 3: Architecture
- React + Node.js + PostgreSQL
- Clean layered architecture
- WebSocket real-time updates
- SHA-256 transaction integrity

### Slide 4: Demo — Ali Iftar
- Ali donates 1,250 MRU for 5 Iftar meals
- Sidi M. confirms delivery
- Ali receives verifiable proof
- Public dashboard shows immutable record

### Slide 5: Impact & Future
- Scalable nationally
- Blockchain-ready
- Mobile money integration ready
- Preserves dignity at every step

---

## 📁 Project Structure

```
ihsan/
├── backend/
│   ├── config/          # App configuration
│   ├── controllers/     # Request handlers
│   ├── middlewares/      # Auth, validation, errors
│   ├── prisma/          # Schema + migrations + seed
│   ├── repositories/    # Data access layer
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── tests/           # Jest test suites
│   ├── utils/           # Helpers (hash, errors, etc.)
│   └── server.js        # Entry point
├── frontend/
│   ├── public/          # Static assets
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── context/     # Auth context (global state)
│       ├── hooks/       # Custom hooks (socket, etc.)
│       ├── pages/       # Page components
│       ├── services/    # API + socket services
│       ├── styles/      # Global CSS
│       └── App.js       # Root component + routing
└── README.md
```

---

## License

MIT

---

*Built with إحسان (excellence) — because every act of charity deserves trust, transparency, and dignity.*
