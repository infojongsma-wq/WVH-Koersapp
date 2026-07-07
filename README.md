# WVH Koersapp 🚴

Een fietsritten-app voor Wielerclub Holten (WVH). Leden kunnen ritten aanmaken,
zich aanmelden, geïnteresseerd zijn, opmerkingen plaatsen en GPX-routes
downloaden. Inclusief automatische weer/wind-ophaal, kaartpreview en wachtlijst
bij volle ritten.

## Wat zit erin

- 🔐 **Magic-link login** (geen wachtwoorden), met whitelist op e-mailadres
- 🚴 **Ritten aanmaken** met soort (race/gravel/MTB/event), niveau (A t/m D + Vrouwen), km, gemiddelde snelheid, wegkapitein, koffiestop, GPX-upload, omschrijving en opmerkingen
- 🌤️ **Automatische weer-/windvoorspelling** via Open-Meteo, op basis van startlocatie en tijdstip (gratis, geen API-key)
- 🗺️ **Kaartpreview van GPX-route** in-app (Leaflet + OpenStreetMap)
- 👥 **Live deelnemers-teller** op de hoofdlijst, met **wachtlijst boven 14 deelnemers**
- 💬 **Reacties** per rit
- 🔍 **Filters** (niveau, soort) op hoofdlijst; **rittenbibliotheek** met filter op naam, km-range en windrichting
- 🛡️ **Admin** kan whitelist beheren en ritten verbergen/publiceren

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS**
- **Prisma** + **SQLite** (lokaal); later eenvoudig om te zetten naar Postgres (Supabase)
- **Leaflet** + **@tmcw/togeojson** voor GPX-rendering
- **Open-Meteo** voor weer & geocoding

## Eerste keer opstarten

```bash
# 1. Dependencies installeren
npm install

# 2. .env aanmaken (kopieer voorbeeld)
cp .env.example .env
# Pas ADMIN_EMAILS aan als je dat wil

# 3. Database aanmaken + seed
npm run db:push
npm run db:seed

# 4. Dev-server starten
npm run dev
```

App draait op http://localhost:3000.

## Inloggen (proof-of-concept)

In de PoC versturen we geen echte e-mails. Werkwijze:

1. Ga naar `/login` en vul je e-mailadres in (moet op de whitelist staan — `ADMIN_EMAILS` uit `.env` wordt automatisch whitelist + admin).
2. Er verschijnt direct een knop "Klik hier om in te loggen" — klik erop.

De whitelist is in deze fase de toegangspoort; echte e-mailverificatie komt
zodra er een mailprovider (bijv. Resend of Supabase Auth) wordt gekoppeld.

Eerste keer dat je inlogt word je naar `/profile` gestuurd om je naam en
niveau in te vullen.

## Belangrijke routes

| Route | Beschrijving |
|-------|--------------|
| `/` | Hoofdpagina met aankomende ritten, filters, live deelnemers-teller |
| `/library` | Rittenbibliotheek (alle ritten, met filters op naam/km/wind) |
| `/rides/new` | Nieuwe rit aanmaken |
| `/rides/[id]` | Detailpagina van een rit (aanmelden/comments/GPX/kaart) |
| `/profile` | Mijn profiel (naam + niveau) |
| `/admin` | Admin: whitelist + ritten modereren |
| `/api/diag` | Diagnose: env-variabelen, database, versie |

## Niveaus en snelheidsindicaties

| Niveau | Snelheid |
|--------|----------|
| A      | 33+ km/u |
| A/B    | 32–33 km/u |
| B      | 30–32 km/u |
| C      | 27–30 km/u |
| D      | 25 km/u |
| Vrouwen | 25–28 km/u |

## Migratie naar Supabase (vervolgstap)

De code is voorbereid op een soepele overstap naar Supabase Postgres:

1. Maak een gratis project op [supabase.com](https://supabase.com).
2. Verander in `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Zet `DATABASE_URL` in `.env` op de Supabase-pooler-URL.
4. Run `npx prisma db push`.
5. Vervang de file-uploads (`public/uploads/`) door **Supabase Storage** (één bucket `gpx`) en pas `src/app/api/rides/route.ts` aan om naar storage te uploaden in plaats van naar disk.
6. Vervang de magic-link logic door **Supabase Auth** (`signInWithOtp`) — Supabase stuurt dan automatisch e-mails. De whitelist-check kan je behouden als pre-check vóór `signInWithOtp`.

## Database-model

- `User` — e-mail (uniek), naam, niveau, rol (MEMBER/ADMIN)
- `WhitelistEntry` — e-mailadressen die mogen inloggen
- `Ride` — alle ritgegevens incl. GPX-bestand en gecachte weer/wind-data
- `Participation` — m:n koppeling user↔rit met status (GOING/INTERESTED/NOT_GOING)
- `Comment` — reactie op een rit
- `MagicLinkToken`, `Session` — auth state

## Wat nog niet in de PoC zit

- Echte e-mailverzending (gebeurt nu via dev-pagina; in productie: Supabase Auth of Resend/Postmark)
- Push-notificaties (geen webpush in PoC)
- Strava-koppeling
- Terugkerende/vaste ritten (zou je via een "duplicate ride" knop al kunnen oplossen)

## Bugs / suggesties

Issues openen op de repo of laat het Jan-Willem weten.
