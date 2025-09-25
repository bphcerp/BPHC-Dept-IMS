# Copilot Instructions for Erp Repository

## Repository Overview

This is a **Student Information Management System (ERP)** for BITS Pilani Hyderabad Campus. The repository is a full-stack web application with the following structure:

- **Type**: Full-stack web application
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Express.js + TypeScript + Drizzle ORM + PostgreSQL
- **Package Manager**: pnpm (workspaces)
- **Size**: ~3 packages, 1000+ files, heavy with dependencies
- **Target Runtime**: Node.js 22+ (server), Modern browsers (client)

## Architecture & Project Layout

### Workspace Structure
```
/
├── client/          # React frontend (Vite + TypeScript)
├── server/          # Express.js backend (TypeScript)
├── lib/             # Shared types and schemas (Zod)
├── pnpm-workspace.yaml
├── docker-compose.yml
└── .github/workflows/
```

### Key Directories
- **client/src/**: React components, views, hooks, utilities
  - `components/`: Reusable UI components (Radix UI + shadcn/ui)
  - `views/`: Page-level components
  - `lib/`: Axios instance, utilities, constants
- **server/src/**: Express application, API routes, database
  - `api/`: REST API routes organized by feature
  - `config/db/schema/`: Drizzle ORM database schemas
  - `middleware/`: Auth, validation, error handling
  - `scripts/`: Database seeding, maintenance scripts
- **lib/src/**: Shared schemas (Zod), types, permissions

### Database & Configuration
- **Database**: PostgreSQL with Drizzle ORM
- **Config Files**: 
  - `server/drizzle.config.ts` - Database configuration
  - `client/vite.config.ts` - Frontend build configuration
  - `client/tailwind.config.js` - Styling configuration
  - `.env.example` - Environment variables template

## Build & Development Instructions

### Prerequisites
- **Node.js**: 22+ (server requirement, though 20+ works with warnings)
- **pnpm**: 9.15.3+ (package manager)
- **PostgreSQL**: 15+ (for database)
- **Redis**: Latest (for caching/sessions)

### Initial Setup
```bash
# 1. Clone and install dependencies (ALWAYS run this first)
pnpm install

# 2. Copy environment variables
cp .env.example .env
# Edit .env with your database credentials and other settings

# 3. Setup database (requires running PostgreSQL)
pnpm --filter server db:generate  # Generate migrations
pnpm --filter server db:push      # Apply to database
pnpm --filter server db:seed      # Seed initial data
```

### Build Commands (Validated)
```bash
# Build server (TypeScript compilation) - ~10-15 seconds
pnpm --filter server run build

# Build client (TypeScript + Vite) - ~20-30 seconds
pnpm --filter client run build
```

### Development Commands
```bash
# Start client dev server (port 5173)
pnpm --filter client run dev

# Start server (port 9000) 
pnpm --filter server run start

# Docker development (includes database + Redis)
docker compose --profile dev up
# For production deployment
docker compose --profile prod up --build -d
```

### Linting & Code Quality
```bash
# Lint client (EXPECT 600+ errors currently - not blocking)
pnpm --filter client run lint

# Format client code
pnpm --filter client run format
```

**⚠️ IMPORTANT**: The codebase currently has 600+ ESLint errors. These are existing issues and should not block your changes. Only fix linting errors directly related to your modifications.

### Database Operations
```bash
# Database schema changes
pnpm --filter server db:generate   # Generate migration files
pnpm --filter server db:push       # Apply changes to database
pnpm --filter server db:migrate    # Run migrations (production)
pnpm --filter server db:studio     # Open Drizzle Studio (GUI)

# Data management
pnpm --filter server db:seed [email]  # Seed database (optional email for dev user)
```

**⚠️ NOTE**: Use `db:push` for development, `db:migrate` for production deployments.

## Continuous Integration

### GitHub Workflows
- **CI Workflow** (`.github/workflows/ci.yml`): Runs on PRs to main/production
  - TypeScript compilation for both client and server
  - Runs on `eee-ims` runner (custom)
  - Uses pnpm for dependency management
- **Production Deployment** (`.github/workflows/deploy-production.yml`): 
  - Deploys to production on push to `production` branch
  - Uses Docker Compose with `--profile prod`
  - Runs database migrations and seeding automatically

### Deployment Architecture
- **EEE Department**: Deployed on `eee-ims` runner
- **Mechanical Department**: Deployed on `mech-ims` runner  
- **Production**: Uses Docker containers with nginx reverse proxy

### Pre-commit Validation
To ensure your changes pass CI:
```bash
# Test what CI will run
pnpm install
pnpm --filter server run build
pnpm --filter client run build
```

## Common Issues & Solutions

### Node.js Version Warning
**Issue**: "Unsupported engine: wanted: {"node":">=22.0.0"}"
**Solution**: This is a warning only. Node 20+ works but 22+ is preferred for production.

### Build Failures
**Issue**: TypeScript compilation errors
**Solution**: 
- Always run `pnpm install` first after pulling changes
- Check if new environment variables are needed in `.env`
- Ensure all workspaces build: server first, then client

### Environment Variables
- **Required for development**: Database credentials, Google OAuth, department settings
- **Client variables**: Must be prefixed with `VITE_`
- **Missing variables**: Check `.env.example` for complete list
- **Department-specific**: `DEPARTMENT_NAME`, `VITE_DEPARTMENT_NAME`, `DEPARTMENT_EMAIL`
- **Key services**: PostgreSQL, Redis, Google OAuth, SERP API

### Package Manager Requirements
**⚠️ CRITICAL**: This project uses pnpm workspaces. Do NOT use npm or yarn:
```bash
# ✅ Correct
pnpm install
pnpm --filter client run build

# ❌ Wrong - will break workspaces
npm install
yarn install
```

### Database Issues
**Issue**: Database connection errors
**Solution**:
1. Ensure PostgreSQL is running (or use Docker)
2. Verify database credentials in `.env`
3. Run migrations: `pnpm --filter server db:push`

## Development Guidelines

### Code Structure
- **API routes**: Follow RESTful patterns in `server/src/api/`
- **Components**: Use Radix UI primitives with shadcn/ui styling
- **Database**: Use Drizzle ORM, schemas in `server/src/config/db/schema/`
- **Types**: Define in `lib/src/` for shared types

### Key Dependencies
- **Frontend**: React 18, Vite, TailwindCSS, Radix UI, React Query, React Hook Form
- **Backend**: Express, Drizzle ORM, Zod validation, JWT auth, PostgreSQL
- **Shared**: TypeScript, Zod schemas, ESLint, Prettier

### Testing Strategy
- No formal test suite currently implemented
- Manual testing required
- Always test both client and server builds before committing

## Quick Reference

### Essential Commands
```bash
# Fresh setup
pnpm install && cp .env.example .env

# Development
pnpm --filter client run dev    # Frontend (port 5173)
pnpm --filter server run start # Backend (port 9000)

# Production builds
pnpm --filter server run build && pnpm --filter client run build

# Database
pnpm --filter server db:push && pnpm --filter server db:seed
```

### File Structure Priority
1. **Configuration**: `pnpm-workspace.yaml`, `package.json` files, `.env.example`
2. **Database**: `server/src/config/db/schema/*`, `server/drizzle.config.ts`
3. **API**: `server/src/api/*` (organized by feature)
4. **Frontend**: `client/src/components/*`, `client/src/views/*`
5. **Shared**: `lib/src/*` (schemas, types, permissions)

---

**Trust these instructions** - they are validated and current. Only search for additional information if these instructions are incomplete or you encounter undocumented errors.