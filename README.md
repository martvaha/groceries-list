# Groceries List

A grocery list application built with Angular and Firebase.

## Tech Stack

- **Frontend**: Angular 21 with NgRx, Angular Material
- **Backend**: Firebase Cloud Functions
- **Database**: Firestore
- **Hosting**: Firebase Hosting

## Prerequisites

- Node.js v22
- pnpm
- Firebase CLI (for local development with emulators)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start frontend dev server (http://localhost:4200)
pnpm dev

# Start Firebase emulators for local backend development
pnpm emulators
```

## Project Structure

```
packages/
├── frontend/    # Angular 21 web application
└── functions/   # Firebase Cloud Functions
```

## Frontend

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build with i18n |
| `pnpm test` | Run unit tests (Jasmine/Karma) |
| `pnpm lint` | Run ESLint |

## Backend (Functions)

| Command | Description |
|---------|-------------|
| `pnpm --filter functions build` | Build functions |
| `pnpm --filter functions watch` | Watch mode for development |
| `pnpm emulators` | Run Firebase emulators locally |

## Deployment

Deployment is automated via GitHub Actions:

| Branch | Environment | Firebase Project |
|--------|-------------|------------------|
| `main` | Production | `groceries-list-production` |
| `test` | Test | `com-groceries-list` |

Push to the appropriate branch to trigger deployment.

### Manual Deployment

If needed, you can deploy manually:

```bash
pnpm deploy           # Deploy everything (hosting + functions)
pnpm deploy:frontend  # Deploy hosting only
pnpm deploy:functions # Deploy functions only
```
