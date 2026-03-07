<div align="center">

# ☪ IHSAN — إحسان

### *Charité Transparente. Dignité Préservée. Impact Vérifié.*

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://prisma.io)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)
[![Licence: MIT](https://img.shields.io/badge/Licence-MIT-yellow?style=flat-square)](LICENSE)

> **IHSAN** (إحسان) signifie *excellence* et *faire ce qui est beau* en arabe.  
> Une plateforme de production qui rend chaque acte de charité traçable, privé et véritablement prouvé.

</div>

---

## 🌍 Le Problème que Nous Résolvons

> *« 70 % des donateurs arrêtent de donner parce qu'ils ne savent pas où va leur argent. »*

Les plateformes de charité traditionnelles souffrent de trois échecs fondamentaux :

| ❌ Problème | Conséquence |
|---|---|
| **Fonds mutualisés** — l'argent disparaît dans une cagnotte générale | Les donateurs perdent confiance. Les dons s'arrêtent. |
| **Identités exposées** — les bénéficiaires sont nommés ou photographiés publiquement | La dignité humaine est violée. Les gens refusent l'aide. |
| **Affirmations invérifiables** — « votre don a aidé quelqu'un » | Aucune preuve. Aucune confiance. Aucune responsabilité. |

**IHSAN résout les trois — simultanément.**

---

## ✅ Ce que IHSAN Fait Différemment

```
Traditionnel :  Donateur → Cagnotte → « Faites-nous confiance » → Peut-être quelqu'un est aidé
IHSAN :         Donateur → Besoin Précis → Validateur confirme → Preuve cryptographique → Donateur la voit
```

Chaque don sur IHSAN est :
- 🎯 **Ciblé** — lié à un besoin précis, vérifié sur le terrain (jamais mutualisé)
- 🔒 **Privé** — le nom des bénéficiaires n'est jamais affiché, nulle part, à personne
- ✅ **Confirmé** — un validateur de terrain atteste la livraison
- 🔗 **Immuable** — enregistrement en chaîne SHA-256, détection de falsification intégrée
- 📡 **Temps réel** — événements WebSocket qui tiennent chaque partie informée instantanément

---

## 🏗️ Architecture du Système

```
┌────────────────────────────────────────────────────────────────────┐
│                      FRONTEND  (React 18)                           │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │   Auth   │  │ Catalogue│  │  Flux    │  │ Tableau de bord   │  │
│  │ Contexte │  │ Besoins  │  │ Donateur │  │ Public (sans auth)│  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       └─────────────┴─────────────┴─────────────────┘             │
│                     Client API Axios                               │
│                  + Socket.IO-client (temps réel)                   │
└──────────────────────────────┬─────────────────────────────────────┘
                               │  REST  +  WebSocket
┌──────────────────────────────┴─────────────────────────────────────┐
│                   BACKEND  (Node.js + Express)                       │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Routes : /auth  /needs  /donations  /wallet  /impact-proofs │   │
│  └─────────────────────────┬───────────────────────────────────┘   │
│  ┌─────────────────────────┴───────────────────────────────────┐   │
│  │  Middleware : Auth JWT │ Garde Rôle │ Validateurs │ Limiteur │   │
│  └─────────────────────────┬───────────────────────────────────┘   │
│  ┌─────────────────────────┴───────────────────────────────────┐   │
│  │  Services : AuthSvc │ BesoinSvc │ DonSvc │ PortefeuilleSvc  │   │
│  └─────────────────────────┬───────────────────────────────────┘   │
│  ┌─────────────────────────┴───────────────────────────────────┐   │
│  │  Dépôts : UtilisateurRepo │ BesoinRepo │ DonRepo │ PreuveRepo│  │
│  └─────────────────────────┬───────────────────────────────────┘   │
│  ┌─────────────────────────┴───────────────────────────────────┐   │
│  │  Socket.IO : don:créé │ don:confirmé │ besoin:financé        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬─────────────────────────────────────┘
                               │
┌──────────────────────────────┴─────────────────────────────────────┐
│                  PostgreSQL 14+  (via Prisma ORM)                    │
│  utilisateurs │ besoins │ dons │ portefeuilles │ preuves │ audits   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 👥 Modèle de Rôles

IHSAN fonctionne sur une **architecture de confiance à quatre rôles**. Chaque rôle dispose de permissions strictement délimitées :

| Rôle | Qui | Peut faire |
|---|---|---|
| **🧑‍🤝‍🧑 DONATEUR** | Grand public | Parcourir les besoins, donner, suivre ses dons, vérifier les preuves |
| **🏅 VALIDATEUR** | Agents de terrain de confiance | Créer des besoins, confirmer les livraisons, construire un score de réputation |
| **🍽️ RESTAURANT** | Prestataires alimentaires | Recevoir les commandes financées, confirmer la préparation des repas |
| **👑 ADMIN** | Personnel de la plateforme | Créer des validateurs et admins, consulter les journaux d'audit, gérer la plateforme |

> **Note de sécurité :** Les comptes VALIDATEUR et ADMIN ne peuvent être créés que par un admin existant — ils ne peuvent pas s'inscrire publiquement.

---

## 🔗 La Chaîne d'Immuabilité

Chaque don crée un enregistrement permanent et inaltérable grâce au chaînage SHA-256 :

```
Don #1 :  hash = SHA256(donateurId || besoinId || montant || horodatage)
                 ↓ stocké comme hashPrecedent
Don #2 :  hash = SHA256(donateurId || besoinId || montant || horodatage)
                 ↓ stocké comme hashPrecedent
Don #3 :  hash = SHA256(...) → lié au #2 → détecte si le #2 a été falsifié
```

**À la confirmation :**
1. `statut` → `CONFIRMED`
2. Drapeau `immuable` → `true`
3. Base de données : aucune modification ultérieure autorisée sur cet enregistrement
4. Endpoint public : `GET /api/verify/:transactionHash` retourne la preuve cryptographique

**Pourquoi pas une blockchain complète ?**  
À l'échelle actuelle, le chaînage SHA-256 dans PostgreSQL offre les mêmes garanties de détection de falsification sans complexité opérationnelle. L'ancrage blockchain sur Polygon est architecturé comme un module optionnel pour la Phase 3.

---

## 🔐 Architecture de Sécurité

| Couche | Mécanisme |
|---|---|
| **Authentification** | Jetons JWT d'accès (15 min) + jetons de rafraîchissement rotatifs (7 j) |
| **Stockage des mots de passe** | bcrypt avec facteur de coût 12 |
| **Limitation de taux** | Stricte sur `/auth` (anti brute-force) + limite générale sur l'API |
| **Contrôle des rôles** | Middleware appliqué sur chaque route protégée |
| **Journal d'audit** | Chaque action modificatrice est journalisée avec acteur + IP |
| **Détection d'anomalies** | Signalement automatique si un validateur donne à et confirme son propre besoin |
| **Sécurité des conditions de course** | Les déductions du portefeuille utilisent des blocs `$transaction` atomiques Prisma |
| **Validation des entrées** | Règles `express-validator` sur tous les endpoints de mutation |
| **En-têtes HTTP** | En-têtes de sécurité Helmet.js sur toutes les réponses |

---

## 🗂️ Structure du Projet

```
ihsan/
├── backend/
│   ├── config/              # Configuration de l'application (env, JWT, limiteurs)
│   ├── controllers/         # Gestionnaires de requêtes/réponses HTTP
│   ├── middlewares/         # Auth JWT, garde de rôle, validateurs, gestionnaire d'erreurs
│   ├── prisma/              # Schéma, migrations, données de démo
│   ├── repositories/        # Couche d'accès aux données (toutes les requêtes DB ici)
│   ├── routes/              # Définitions des routes API
│   ├── services/            # Logique métier (flux de dons, portefeuille, etc.)
│   ├── tests/               # Suites de tests Jest
│   ├── utils/               # Génération de hash, classes d'erreurs, journalisation
│   └── server.js            # Point d'entrée Express + Socket.IO
│
└── frontend/
    └── src/
        ├── components/      # Composants UI réutilisables (Navbar, Cartes, etc.)
        ├── context/         # Contexte Auth (état de session global)
        ├── hooks/           # Hooks personnalisés (événements socket, fetch)
        ├── pages/           # Composants de page (niveau route)
        ├── services/        # Client Axios + fonctions d'endpoint
        ├── styles/          # CSS global
        └── App.js           # Composant racine + configuration React Router
```

---

## 🚀 Démarrage Rapide

### Prérequis

- **Node.js** 18+
- **PostgreSQL** 14+
- **npm** ou **yarn**

### 1. Cloner & Installer

```bash
git clone https://github.com/SidA7MD/Defi2.git
cd Defi2

# Installer les dépendances du backend
cd backend && npm install

# Installer les dépendances du frontend
cd ../frontend && npm install
```

### 2. Configurer l'Environnement

```bash
cd backend
cp .env.example .env
```

Renseigner le fichier `.env` :

| Variable | Description | Requis |
|---|---|---|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL | ✅ |
| `JWT_SECRET` | Chaîne aléatoire longue (32+ caractères) | ✅ |
| `PORT` | Port de l'API | Défaut : `5000` |
| `JWT_ACCESS_EXPIRES_IN` | Durée de vie du jeton d'accès | Défaut : `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Durée de vie du jeton de rafraîchissement | Défaut : `7d` |
| `CORS_ORIGIN` | URL du frontend | Défaut : `http://localhost:3000` |

### 3. Base de Données

```bash
cd backend

# Exécuter les migrations
npx prisma migrate dev --name init

# Générer le client Prisma
npx prisma generate

# Insérer les données de démonstration (inclut le scénario Ali Iftar)
npm run db:seed
```

### 4. Lancer en Développement

```bash
# Terminal 1 — Serveur API
cd backend && npm run dev

# Terminal 2 — Serveur de développement React
cd frontend && npm start
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:5000/api/v1 |
| Vérification de santé | http://localhost:5000/api/v1/health |
| Prisma Studio | `npm run prisma:studio` |

---

## 🎬 Démo Complète — Le Scénario Ali Iftar

Ce parcours prouve le fonctionnement de bout en bout de la plateforme en moins de 3 minutes.

### 1️⃣ Le Validateur Crée un Besoin *(~30s)*
- Se connecter en tant que **Sidi M.** (`sidi@ihsan.org` / `password123`)
- Naviguer vers le Panneau Validateur
- Un besoin est déjà créé : *« 5 repas Iftar – Tevragh Zeina – 1 250 MRU »*
- Statut : **OUVERT** · Restaurant assigné : Al Baraka

### 2️⃣ Le Donateur Ali Fait un Don *(~45s)*
- Se connecter en tant que **Ali** (`ali@donor.com` / `password123`)
- Parcourir le Catalogue des Besoins → trouver la carte des repas Iftar
- Cliquer sur **Donner 1 250 MRU**
- Recevoir instantanément un **reçu cryptographique** contenant :
  - Identifiant de transaction unique
  - Hash SHA-256
  - Horodatage + montant
  - Description du besoin associé

### 3️⃣ Le Restaurant Reçoit la Commande *(~20s)*
- Se connecter en tant que **Al Baraka** (`albaraka@restaurant.com` / `password123`)
- Voir la commande financée apparaître dans le Tableau de Bord Restaurant (via WebSocket)
- Statut : *En attente de préparation*

### 4️⃣ Le Validateur Confirme la Livraison *(~45s)*
- Se reconnecter en tant que **Sidi M.**
- Ouvrir l'onglet Financé → trouver le don d'Ali
- Cliquer sur **Confirmer la Livraison**
- Ajouter le message : *« Les 5 repas Iftar ont bien été livrés aux familles de Tevragh Zeina »*
- Le don devient **CONFIRMÉ** et **immuable** — aucune modification ultérieure possible

### 5️⃣ Le Donateur Voit la Preuve *(~20s)*
- Se connecter en tant qu'Ali → aller dans Mes Dons
- Voir le statut ✅ confirmé + le message d'impact
- Le hash SHA-256 est vérifiable publiquement via `/api/verify/:hash`

### 6️⃣ Tableau de Bord Public *(~20s)*
- Visiter le Tableau de Bord sans se connecter
- Voir la transaction confirmée : 1 250 MRU · Tevragh Zeina · CONFIRMÉ
- **Aucune donnée personnelle exposée** — seulement le quartier et le type de besoin

---

## 🧪 Lancer les Tests

```bash
cd backend
npm test
```

| Suite | Ce qui est testé |
|---|---|
| **Unitaires** | Génération et vérification de hash, classes d'erreurs, parseur de durée |
| **Middleware** | Authentification JWT, expiration de jeton, garde de rôle |
| **Intégration** | Cycle de vie complet d'un don, déduction atomique du portefeuille |
| **Cas limites** | Double confirmation, prévention de découvert, signalement d'auto-don |

---

## 🌐 Référence API (endpoints principaux)

### Authentification
| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | — | Créer un compte DONATEUR ou RESTAURANT |
| `POST` | `/api/v1/auth/login` | — | Obtenir les jetons d'accès et de rafraîchissement |
| `POST` | `/api/v1/auth/refresh` | — | Rotation du jeton de rafraîchissement |
| `GET` | `/api/v1/auth/profile` | JWT | Obtenir le profil de l'utilisateur courant |

### Besoins
| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/needs` | — | Parcourir tous les besoins ouverts |
| `POST` | `/api/v1/needs` | VALIDATEUR | Créer un besoin vérifié |
| `PATCH` | `/api/v1/needs/:id/status` | VALIDATEUR | Mettre à jour le statut d'un besoin |
| `PATCH` | `/api/v1/needs/:id/confirm` | RESTAURANT | Confirmer la livraison du repas |

### Dons
| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/donations` | DONATEUR | Créer un don |
| `GET` | `/api/v1/donations/dashboard` | — | Flux de dons public |
| `GET` | `/api/v1/donations/verify/:hash` | — | Vérifier un hash de transaction |
| `GET` | `/api/v1/donations/mine` | DONATEUR | Historique de mes dons |

### Portefeuille
| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/wallet` | JWT | Portefeuille + historique de transactions |
| `POST` | `/api/v1/wallet/deposit` | JWT | Ajouter des fonds virtuels |
| `POST` | `/api/v1/wallet/withdraw` | JWT | Retirer des fonds virtuels |

---

## 🤝 Architecture de Confiance

```
  VALIDATEUR (vérifié sur le terrain)        DONATEUR (anonyme)
         │                                          │
         │  Crée un Besoin                          │  Parcourt le catalogue
         │  (GPS + quartier attachés)               │  (aucune info personnelle visible)
         ▼                                          ▼
      ┌──────┐   ──── finance ──────►   ┌──────────────┐
      │Besoin│                          │     Don      │
      │OUVERT│◄────── verrouillé ─────  │   EN ATTENTE │
      └──┬───┘                          └──────┬───────┘
         │                                     │
         │  Validateur confirme la livraison   │  Donateur notifié (WebSocket)
         │  (aucun nom de bénéficiaire exposé) │
         ▼                                     ▼
      ┌──────────┐                  ┌──────────────────┐
      │  Besoin  │                  │      Don         │
      │ CONFIRMÉ │                  │    CONFIRMÉ      │ ← immuable = vrai
      └──────────┘                  │ + Preuve Impact  │
                                    └────────┬─────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │Tableau de Bord  │
                                    │    Public       │
                                    │ (zéro donnée    │
                                    │  personnelle)   │
                                    └─────────────────┘
```

### Principes Fondamentaux
- 🛡️ **Vie privée des bénéficiaires** — noms stockés dans une table privée verrouillée, jamais exposés par aucune API
- 🎯 **Don ciblé** — chaque centime va à un besoin spécifique, vérifié sur le terrain
- 🏅 **Responsabilité des validateurs** — les scores de réputation suivent l'historique des livraisons ; les anomalies sont signalées automatiquement
- 🔒 **Immuabilité** — les dons confirmés ne peuvent être modifiés par personne, même les admins
- 👁️ **Transparence radicale** — toutes les transactions visibles sur le tableau de bord public, sans aucune donnée personnelle

---

## ⚖️ Décisions Techniques & Compromis

| Décision | Alternative | Pourquoi ce choix |
|---|---|---|
| Chaînage SHA-256 | Blockchain complète | Mêmes garanties de détection de falsification, zéro surcharge opérationnelle pour le MVP |
| Validateur unique par besoin | Multi-signature (2-sur-3) | Simplicité ; le multi-sig est prévu pour la v2 |
| Portefeuille simulé | Argent mobile réel | Conformité réglementaire ; l'intégration PSP est un échange, pas une refonte |
| PostgreSQL | NoSQL | La conformité ACID est non négociable pour les données financières |
| Socket.IO | Server-Sent Events | Notifications privées ciblées par salle (par utilisateur) |
| JWT (sans état) | Sessions | Scalabilité horizontale ; la rotation des jetons de rafraîchissement comble la lacune de révocation |
| `$transaction` atomique Prisma | Vérification du solde côté application | Élimine les conditions de course sur les tentatives de dons concurrentes |

---

## 📈 Feuille de Route

### Phase 1 — Mise en Production
- [ ] Intégration réelle de l'argent mobile (Bankily, Sedad)
- [ ] Téléchargement de photos pour les preuves d'impact (Cloudinary / S3)
- [ ] Interface multilingue (arabe RTL + français)
- [ ] Notifications push (Web Push API)

### Phase 2 — Passage à l'Échelle
- [ ] Couche de cache Redis pour le catalogue et les statistiques
- [ ] Réplicas de lecture PostgreSQL
- [ ] CDN pour les ressources statiques
- [ ] Déploiement Kubernetes avec auto-scaling
- [ ] Observabilité complète (OpenTelemetry + Grafana)

### Phase 3 — Décentralisation
- [ ] Ancrage blockchain (testnet Polygon → mainnet)
- [ ] Stockage IPFS pour les photos de preuves d'impact
- [ ] Confirmation multi-validateurs (seuil 2-sur-3)
- [ ] Gouvernance DAO pour l'intégration des validateurs

### Phase 4 — Écosystème
- [ ] Application mobile React Native
- [ ] Notifications SMS pour les zones à faible connectivité
- [ ] Tableau de bord de rapport d'impact gouvernemental
- [ ] Génération de reçus fiscaux déductibles
- [ ] Détection de fraude assistée par IA

---

## 🪪 Identifiants de Démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| 🧑‍🤝‍🧑 Donateur (Ali) | `ali@donor.com` | `password123` |
| 🧑‍🤝‍🧑 Donateur | `mariam@donor.com` | `password123` |
| 🏅 Validateur | `sidi@ihsan.org` | `password123` |
| 🏅 Validateur | `fatima@ihsan.org` | `password123` |
| 🍽️ Restaurant | `albaraka@restaurant.com` | `password123` |
| 🍽️ Restaurant | `darnanoua@restaurant.com` | `password123` |
| 👑 Admin | `admin@ihsan.org` | `password123` |

---

## 🛠️ Stack Technique

| Couche | Technologie | Pourquoi |
|---|---|---|
| **Frontend** | React 18 + React Router | Modèle composant, hooks, écosystème riche |
| **État global** | React Context + hooks personnalisés | Evite Redux pour cette portée |
| **Client HTTP** | Axios + intercepteurs | Auto-rafraîchissement du jeton, normalisation des erreurs |
| **Temps réel** | Socket.IO | Notifications privées ciblées par salle |
| **Backend** | Node.js + Express | Non-bloquant, rapide, JavaScript isomorphe |
| **ORM** | Prisma | Requêtes typées, migrations, natif PostgreSQL |
| **Base de données** | PostgreSQL 14 | ACID, requêtes riches, éprouvé à grande échelle |
| **Auth** | JWT + bcrypt + jetons de rafraîchissement | Sans état, sécurisé, révocable |
| **Hachage** | SHA-256 (Node crypto) | Résistant aux collisions, comparaison en temps constant |
| **Sécurité** | Helmet + express-rate-limit | Durcissement standard de l'industrie |
| **Tests** | Jest + Supertest | Couverture intégration + unitaire complète |
| **Déploiement** | Render.com (via `render.yaml`) | Zéro configuration, PostgreSQL géré |

---


---

<div align="center">

*Construit avec **إحسان** — parce que chaque acte de charité mérite confiance, transparence et dignité.*

**IHSAN** · إحسان · L'excellence dans le don

</div>
