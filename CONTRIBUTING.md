# Contribuer à RHM Base

Merci de vouloir contribuer ! Ce document explique comment mettre en place
l'environnement de développement et les conventions du projet.

## Mise en place

```bash
git clone <votre-fork>
cd rhm-base
docker compose up -d postgres redis   # seulement les dépendances d'infra
cd apps/api && npm install && cp .env.example .env && npx prisma migrate dev
cd ../dashboard && npm install && cp .env.example .env
```

Lancez ensuite `npm run dev` dans `apps/api` et `apps/dashboard` (deux terminaux).

## Structure du code

- `apps/api/src/routes` — définition des routes Express
- `apps/api/src/controllers` — validation des entrées (zod) + orchestration
- `apps/api/src/services` — logique métier réutilisable (DDL dynamique, CRUD, storage, webhooks, realtime)
- `apps/api/src/middleware` — auth JWT, auth par clé API, rate limiting, logs, erreurs
- `apps/api/src/utils` — fonctions pures (hash, JWT, validation d'identifiants SQL)
- `apps/dashboard/app` — pages Next.js (App Router)

## Règles de sécurité non négociables

- Un nom de table/colonne/schéma ne doit **jamais** être injecté dans une
  requête SQL sans passer par `assertValidIdentifier` / `quoteIdent`
  (voir `apps/api/src/utils/identifiers.ts`).
- Les valeurs de données doivent **toujours** passer par des requêtes
  paramétrées (`$1`, `$2`, ...), jamais par concaténation de chaînes.
- Aucune clé secrète, mot de passe ou token ne doit être commité. Utilisez
  `.env` (ignoré par git) et mettez à jour `.env.example` si vous ajoutez une
  variable.

## Avant d'ouvrir une Pull Request

1. `npm run build` dans `apps/api` — le code doit compiler sans erreur.
2. `npm test` dans `apps/api` — les tests doivent passer.
3. Documentez toute nouvelle route dans le README si elle est publique.
4. Gardez les commits atomiques et les messages en français ou en anglais,
   au choix, mais clairs.

## Rapporter un bug

Ouvrez une issue avec : ce que vous avez fait, ce que vous attendiez, ce qui
s'est passé, et si possible les logs pertinents (`apps/api` tourne avec
`NODE_ENV=development` pour des logs plus verbeux).
