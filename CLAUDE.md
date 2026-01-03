# Groceries List Monorepo

pnpm workspace monorepo for a grocery list application.

## Workspace Structure

```
packages/
├── frontend/    # Angular 21 web application
└── functions/   # Firebase Cloud Functions
```

## pnpm Workspace Commands

```bash
# Install all dependencies
pnpm install

# Run command in specific package
pnpm --filter frontend <command>
pnpm --filter functions <command>

# Run command in all packages
pnpm -r <command>

# Add dependency to specific package
pnpm --filter frontend add <package>
pnpm --filter functions add <package>

# Add dev dependency to specific package
pnpm --filter frontend add -D <package>

# Add dependency to root (shared tooling)
pnpm add -w <package>
```

## Package Scripts

Run scripts defined in individual package.json files:

```bash
pnpm --filter frontend dev      # Start frontend dev server
pnpm --filter frontend build    # Build frontend
pnpm --filter frontend test     # Run frontend tests
pnpm --filter functions build   # Build functions
```

## Workspace Configuration

Defined in `pnpm-workspace.yaml`:
```yaml
packages:
  - 'packages/*'
```
