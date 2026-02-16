# Blog Companion PWA (Next.js + Supabase)

Mini web-app mobile-first (PWA) avec une home publique et un admin privé.

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase (Postgres + Storage)
- Déploiement recommandé: Vercel

## Fonctionnalités MVP

- Home `/`
- Bloc **Now Playing** (titre + artiste + embed Spotify)
- Carousel d'images (jusqu'à 10)
- Phrase du jour
- Extrait du dernier article (auto via flux RSS/Atom ou fallback manuel)

- Admin `/admin`
- Login par mot de passe simple
- Mise à jour contenu Home
- Réorganisation de l'ordre des sections de la home
- Upload/suppression images carousel

## Structure

- `app/page.tsx`: home publique
- `app/admin/login/page.tsx`: login admin
- `app/admin/page.tsx`: dashboard admin
- `app/api/admin/*`: endpoints admin
- `app/api/revalidate/editorial`: webhook de refresh immédiat feed
- `components/*`: composants UI
- `lib/*`: auth, data, supabase
- `supabase/schema.sql`: schéma DB + bucket storage

## Variables d'environnement

Copier `.env.example` vers `.env.local`:

```bash
cp .env.example .env.local
```

Variables requises:

- `NEXT_PUBLIC_APP_URL` (ex: `http://localhost:3000`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `EDITORIAL_WEBHOOK_SECRET`

## Setup local

1. Installer les dépendances

```bash
npm install
```

2. Appliquer le SQL Supabase

- Ouvrir Supabase SQL Editor
- Exécuter `supabase/schema.sql`
- Si la DB existe déjà, exécuter aussi `supabase/migrations/002_add_section_order.sql` puis `supabase/migrations/003_add_editorial_feed.sql`

3. Lancer l'app

```bash
npm run dev
```

4. Ouvrir:

- Home: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

## Déploiement Vercel

1. Push du repo Git
2. Import projet dans Vercel
3. Ajouter toutes les variables d'environnement
4. Redéployer

## Notes de sécurité MVP

- Auth admin par mot de passe unique + cookie httpOnly signé
- Pour la phase suivante: migrer vers Supabase Auth (users/roles)

## Check rapide de validation

- Home affiche les 4 sections
- `/admin` redirige vers `/admin/login` si non connecté
- Update settings admin reflété sur Home
- Upload image visible dans carousel

## Flux éditorial auto (publication -> refresh)

1. Dans `/admin`, renseigne `URL flux éditorial RSS/Atom (auto)`.
2. Configure ton blog/CMS pour appeler ce webhook à chaque publication:

```bash
POST /api/revalidate/editorial?secret=EDITORIAL_WEBHOOK_SECRET
```

Exemple URL en production:

```text
https://ton-domaine.com/api/revalidate/editorial?secret=TON_SECRET
```

Tu peux aussi envoyer le secret dans le header `x-webhook-secret`.
