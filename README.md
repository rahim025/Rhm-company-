# RHM Base

Une plateforme backend-as-a-service open-source, inspirée de Supabase — développée
entièrement par [Batchabi Rahim](https://github.com/). Créez un projet, obtenez une
base PostgreSQL, une authentification, une API REST auto-générée et un dashboard,
en quelques minutes, sur votre propre infrastructure.

> **Statut** : MVP fonctionnel. Voir [Roadmap](#roadmap) pour les fonctionnalités avancées à venir.

## Fonctionnalités

- **Authentification** — inscription, connexion, vérification d'email, réinitialisation de mot de passe, JWT
- **Projets** — chaque projet provisionne son propre schéma PostgreSQL isolé
- **Database Studio** — créer/modifier/supprimer tables et colonnes sans écrire de SQL
- **SQL Editor** — exécuter des requêtes PostgreSQL directement depuis le dashboard
- **API REST automatique** — chaque table expose immédiatement `GET/POST/PATCH/DELETE` avec pagination, tri, recherche et filtres
- **Clés API** — clés publiques (lecture seule) et secrètes (lecture/écriture), révocables et "rotatables"
- **Permissions** — rôles `OWNER`, `ADMIN`, `MEMBER`, `VIEWER` par projet
- **Logs** — historique des requêtes API, authentifications et erreurs
- **Documentation** — générée automatiquement pour chaque table/projet
- **Stockage de fichiers** — buckets publics/privés, upload, URLs signées
- **Temps réel** — notifications WebSocket sur INSERT/UPDATE/DELETE
- **Webhooks** — appelés sur les événements de données, avec retry automatique

## Architecture

```
rhm-base/
├── apps/
│   ├── api/          Backend Node.js + TypeScript + Express + Prisma
│   └── dashboard/     Frontend Next.js + TypeScript + Tailwind
├── docker/            Configuration Nginx (reverse proxy)
├── docs/              Documentation additionnelle
└── docker-compose.yml
```

Chaque **projet** créé par un utilisateur provisionne un schéma PostgreSQL dédié
(`proj_<slug>`), ce qui isole complètement les données d'un projet à l'autre sur
la même instance PostgreSQL. Les tables/colonnes créées via le Database Studio
sont du DDL réel exécuté sur ce schéma — RHM Base ne simule rien.

## Installation

### Prérequis
- Node.js 20+
- Docker et Docker Compose (recommandé)
- PostgreSQL 16+ (si vous ne passez pas par Docker)

### Avec Docker (recommandé)

```bash
git clone <votre-fork>
cd rhm-base
cp apps/api/.env.example apps/api/.env
cp apps/dashboard/.env.example apps/dashboard/.env
# Éditez apps/api/.env et changez au minimum JWT_SECRET

docker compose up -d
```

- Dashboard : http://localhost:3000 (ou http://localhost:8080 via Nginx)
- API : http://localhost:4000
- PostgreSQL : localhost:5432

### En local, sans Docker

```bash
# 1. Backend
cd apps/api
cp .env.example .env   # configurez DATABASE_URL vers votre PostgreSQL local
npm install
npx prisma migrate dev
npm run dev

# 2. Frontend (autre terminal)
cd apps/dashboard
cp .env.example .env
npm install
npm run dev
```

## Variables d'environnement

Voir `apps/api/.env.example` et `apps/dashboard/.env.example` pour la liste complète.
Les plus importantes :

| Variable | Description |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL (Prisma + requêtes dynamiques) |
| `JWT_SECRET` | Secret de signature des JWT et des URLs signées — **changez-le en production** |
| `CORS_ORIGIN` | Origine autorisée pour le dashboard |
| `NEXT_PUBLIC_API_URL` | URL de l'API utilisée par le dashboard |

Aucune clé secrète réelle n'est présente dans ce dépôt.

## Utilisation de l'API générée

Chaque table créée dans un projet expose automatiquement :

```
GET    /api/projects/:projectId/data/:table
GET    /api/projects/:projectId/data/:table/:id
POST   /api/projects/:projectId/data/:table
PATCH  /api/projects/:projectId/data/:table/:id
DELETE /api/projects/:projectId/data/:table/:id
```

Authentification via l'en-tête `x-api-key` (clé publique = lecture seule, clé
secrète = lecture/écriture). La pagination, le tri (`?sort=-createdAt`), la
recherche (`?search=...`) et les filtres (`?status=active`) sont supportés sur
les endpoints de liste. La documentation complète et interactive de chaque
projet est disponible dans l'onglet **Documentation** du dashboard.

## Sécurité

- Mots de passe hashés avec Argon2id
- JWT signés, expiration configurable
- Clés API jamais stockées en clair (hash SHA-256), affichées une seule fois
- Tous les noms de table/colonne sont validés contre une liste blanche stricte
  avant d'être utilisés dans du DDL dynamique (protection contre l'injection SQL)
- Toutes les valeurs de données passent par des requêtes paramétrées
- Rate limiting global et renforcé sur les routes d'authentification
- `helmet` pour les en-têtes HTTP de sécurité

## Tests

```bash
cd apps/api
npm test
```

## Déploiement

Le projet est conçu pour être déployé sur VPS, Render, Railway, Fly.io ou tout
environnement supportant Docker. Chaque app (`api`, `dashboard`) a son propre
`Dockerfile` et peut être déployée indépendamment ; pointez simplement
`NEXT_PUBLIC_API_URL` du dashboard vers l'URL publique de l'API déployée.

## Roadmap

Le MVP couvre l'authentification, les projets, le Database Studio, l'API REST
auto-générée, les clés API et le dashboard. Prochaines étapes :
- Interface tableur complète pour éditer les données ligne par ligne
- CLI (`rhm init`, `rhm login`, `rhm deploy`)
- Compatibilité S3 complète pour le stockage (actuellement backend disque local)
- Vraie invalidation de session côté serveur

## Contribution

Voir [CONTRIBUTING.md](./CONTRIBUTING.md).

## Licence

MIT — voir [LICENSE](./LICENSE).
