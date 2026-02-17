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
- Sauvegarde instantanée d'un "moment du jour" (rituel quotidien)
- Quote of the Day Social: like public, partage natif, carte story PNG

- Archive `/archive`
- Liste des moments sauvegardés (du plus récent au plus ancien)
- Détail d'un moment `/archive/[id]`

- Saved `/saved`
- Liste des phrases sauvegardées
- Retrait d'une phrase en un tap

- Moodboard `/moodboard`
- Toutes tes interactions likees (phrases, chansons, images)

- Focus `/focus`
- Session respiration minimaliste
- Ambiance audio optionnelle

- Admin `/admin`
- Login par mot de passe simple
- Mise à jour contenu Home
- Réorganisation de l'ordre des sections de la home
- Upload/suppression images carousel
- Upload/suppression sons Focus
- Bouton admin pour rafraîchir manuellement le flux éditorial

## Structure

- `app/page.tsx`: home publique
- `app/archive/page.tsx`: archive des moments
- `app/archive/[id]/page.tsx`: détail d'un moment
- `app/saved/page.tsx`: phrases sauvegardées
- `app/focus/page.tsx`: mode focus/respiration
- `app/admin/login/page.tsx`: login admin
- `app/admin/page.tsx`: dashboard admin
- `app/api/admin/*`: endpoints admin
- `app/api/moments/*`: endpoints moments
- `app/api/phrases/*`: endpoints phrases sauvegardées
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
- Si la DB existe déjà, exécuter aussi:
  - `supabase/migrations/002_add_section_order.sql`
  - `supabase/migrations/003_add_editorial_feed.sql`
  - `supabase/migrations/004_add_moments_and_saved_phrases.sql`
  - `supabase/migrations/005_quote_likes_and_shares.sql`
  - `supabase/migrations/006_song_and_image_likes.sql`
  - `supabase/migrations/007_add_focus_audio_tracks.sql`
  - `supabase/migrations/008_song_likes_metadata.sql`

3. Lancer l'app

```bash
npm run dev
```

4. Ouvrir:

- Home: `http://localhost:3000`
- Archive: `http://localhost:3000/archive`
- Saved: `http://localhost:3000/saved`
- Focus: `http://localhost:3000/focus`
- Moodboard: `http://localhost:3000/moodboard`
- Admin: `http://localhost:3000/admin`

## API endpoints

- `POST /api/moments/save-today`
- `GET /api/moments`
- `GET /api/moments/[id]`
- `POST /api/phrases/toggle`
- `GET /api/phrases`
- `GET /api/quote/likes?quote=...`
- `POST /api/quote/likes/toggle`
- `POST /api/quote/share-event`
- `GET /api/now-playing/likes?songKey=...`
- `POST /api/now-playing/likes/toggle`
- `GET /api/images/likes?imageId=...`
- `POST /api/images/likes/toggle`
- `GET /api/moodboard`

## Usage (Rituel quotidien)

1. Depuis la Home, appuie sur `Sauvegarder ce moment`.
   - L'app enregistre automatiquement la date du jour (Europe/Paris), now playing, phrase du jour, cover (1re image du carousel si dispo) et URL article.
2. Consulte `/archive` pour retrouver tous tes moments.
3. Appuie sur `♡` dans la phrase du jour pour la sauvegarder/retirer.
4. Consulte `/saved` pour gérer toutes les phrases sauvegardées.

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

## Déploiement Vercel

1. Push du repo Git
2. Import projet dans Vercel
3. Ajouter toutes les variables d'environnement
4. Redéployer

## Notes de sécurité MVP

- Auth admin par mot de passe unique + cookie httpOnly signé
- Pour la phase suivante: migrer vers Supabase Auth (users/roles)

## Mode Focus (/focus)

Le mode Focus est local (pas de backend) et propose:

- animation respiration (Simple / Calm 4-2-6-2 / Box 4-4-4-4)
- presets de session (1 min / 3 min / 5 min)
- player audio optionnel (Play/Pause, choix de piste, volume)
- persistance locale du son selectionne + volume via `localStorage`

### Audio files

Tu peux maintenant gérer les sons directement depuis `/admin` (section **Sons Focus**):

- upload d'un fichier audio
- label du son
- ordre d'affichage
- suppression

Fallback: si aucun son n'est uploadé, l'app utilise les 3 fichiers de `public/audio/`.

### Test rapide

1. Ouvrir `http://localhost:3000/focus`
2. Cliquer `Start` pour lancer la respiration puis `Pause`
3. Tester les presets 1/3/5 min
4. Ouvrir les parametres et changer le pattern
5. Lancer l'audio, changer de piste, ajuster le volume
6. Recharger la page: piste et volume doivent etre conserves

## Quote of the Day Social

La card phrase du jour supporte maintenant:

- Like public (compteur global par phrase)
- Toggle like anonyme via fingerprint localStorage
- Partage natif via Web Share API quand disponible
- Generation d'une image Story 1080x1920 (PNG)

### Partage et fallback

- `Share`: ouvre la feuille de partage native quand possible.
- Si indisponible: copie du lien dans le presse-papiers.
- `Story`: genere une image PNG.
- Si `navigator.share` supporte les fichiers: partage direct de l'image.
- Sinon: telechargement de l'image pour ajout manuel en story.

