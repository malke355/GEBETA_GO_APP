# GebetaGo

Food delivery for Addis Ababa. Customers browse kitchens and order, restaurants manage menus and incoming orders, couriers take deliveries, and admins oversee the platform.

This repo is the Expo mobile app plus the Express API. Sign-up, login, restaurants, and orders are stored in MongoDB.

## Features

- **Customers:** browse restaurants, build carts (up to 5 kitchens), checkout, track orders, rate kitchens
- **Kitchens:** create a restaurant profile, manage the menu, accept orders, confirm payment
- **Couriers:** claim jobs and complete deliveries
- **Admins:** review users, restaurants, and orders; suspend accounts
- Live order updates over Socket.IO
- English / Amharic language toggle
- Offline screen when the phone has no internet

## Stack

| Layer | Tech |
| --- | --- |
| App | Expo SDK 57, React Native 0.86, Expo Router, TypeScript |
| API | Node.js, Express, Socket.IO |
| Database | MongoDB (local or Atlas) |
| Builds | EAS (`preview` profile outputs an Android APK) |

## Repository layout

```
src/                 Expo app (screens, API client, theme)
server/              REST API and Socket.IO
assets/              App icons and splash
eas.json             EAS Build profiles
```

## Prerequisites

- Node.js 20+
- npm
- MongoDB locally, or a MongoDB Atlas cluster
- Expo Go for device preview, or [EAS](https://docs.expo.dev/build/introduction/) for a standalone APK

On Windows, this project uses `legacy-peer-deps` (see `.npmrc`).

## Run locally

### 1. API

```bash
cd server
cp .env.example .env
```

Fill in `JWT_SECRET` (at least 32 characters) and `MONGO_URI`, then:

```bash
npm install
npm run seed
npm run dev
```

The API listens on `http://localhost:5000`. Health check: `GET /health`.

### 2. App

From the repo root:

```bash
cp .env.example .env
npm install
npx expo start
```

Point the app at your API in `.env`:

```
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:5000
EXPO_PUBLIC_API_TIMEOUT_MS=15000
EXPO_PUBLIC_USE_MOCK_API=false
```

`localhost` on a physical phone is the phone itself, not your PC. Use your computer’s LAN IP (for example `http://192.168.1.20:5000`) or a hosted API URL.

To try the UI without a server, set `EXPO_PUBLIC_USE_MOCK_API=true`.

New sign-ups need an Ethiopian phone: `+2519` followed by 8 digits.

## Live backend

Production API: [https://gebeta-go-app.onrender.com](https://gebeta-go-app.onrender.com)

- `GET /health` — process health
- `GET /api/restaurants` — public restaurant list

The preview APK is built against this URL. A free Render instance sleeps when idle; the first request can take 30–60 seconds.

## API surface

| Prefix | Purpose |
| --- | --- |
| `/api/auth` | Register, login, profile, favorites |
| `/api/restaurants` | Public list, kitchen profile, menu |
| `/api/orders` | Place, list, track, kitchen and driver actions |
| `/api/admin` | Users, restaurants, orders, suspend |

## Android APK (EAS)

```bash
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

The `preview` profile produces an installable APK wired to the live API (`EXPO_PUBLIC_USE_MOCK_API=false`). Download the artifact on a computer and copy it to the phone (USB, Drive, or Nearby Share). A tiny download from the Expo website in the phone browser is usually an HTML page, not the APK, and Android will say it cannot parse the package.

## Scripts

| Command | What it does |
| --- | --- |
| `npx expo start` | Metro bundler |
| `npm run server` | API in watch mode |
| `npm run seed` | Seed restaurants into the database |
| `npm run typecheck` | TypeScript check |

## License

Private project. All rights reserved.
