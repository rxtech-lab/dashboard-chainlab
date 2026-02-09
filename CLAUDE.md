# ChainLab Dashboard

Web3 attendance management dapp built with Next.js, Ethereum wallet authentication, and on-chain identity.

## Tech Stack

- **Framework**: Next.js 16 (App Router, RSC)
- **Runtime**: React 19
- **Styling**: Tailwind CSS v4 with CSS variables
- **UI Components**: shadcn/ui (new-york style, neutral base, lucide icons)
- **Database**: Drizzle ORM + SQLite via Turso/LibSQL
- **Auth**: Wallet signature verification (ethers.js) with JWT sessions (jose)
- **Web3**: web3-connect-react, @web3modal/ethers
- **Package Manager**: bun

## Commands

```bash
bun run dev          # Start development server
bun run build        # Run migrations + build for production
bun run build:test   # Build with test environment (IS_TEST=true)
bun run start        # Start production server
bun run lint         # ESLint
bun run test:e2e     # Playwright e2e tests

bun db:push          # Push schema changes to database
bun db:generate      # Generate migration files
bun db:migrate       # Run migrations
bun db:studio        # Open Drizzle Studio
```

## Architecture

### Route Groups

```
src/app/
├── (internal)/                    # Admin/authenticated routes
│   ├── layout.tsx                 # Providers, fonts, global styles
│   ├── (auth)/auth/               # Wallet sign-in page
│   └── (protected)/               # Session guard (redirects to /auth)
│       └── (sidebar)/             # SidebarProvider + SiteHeader layout
│           ├── page.tsx           # Dashboard home (attendance rooms)
│           └── attendance/[id]/   # Room detail + QR code
├── (public)/                      # Public-facing routes
│   └── attendance/[id]/take/      # Public attendance-taking page
└── globals.css
```

### Layout Hierarchy

1. `(internal)/layout.tsx` — Providers (wallet, query client), Toaster, fonts
2. `(protected)/layout.tsx` — Session validation, redirect to `/auth` if unauthenticated
3. `(sidebar)/layout.tsx` — SidebarProvider (inset variant), AppSidebar, SiteHeader

### Auth Flow

1. User connects wallet (MetaMask / WalletConnect)
2. Server generates nonce, stores in Redis
3. User signs message containing nonce
4. Server verifies signature, checks admin role in DB
5. JWT session stored in httpOnly cookie

## File Organization

```
src/
├── app/                           # Next.js app router pages and layouts
├── components/
│   ├── ui/                        # shadcn/ui primitives (button, card, dialog, etc.)
│   ├── header/                    # Navigation (sidebar, site-header, user dropdown)
│   ├── pages/                     # Page-specific components
│   │   ├── auth/                  # Authentication modal and wallet options
│   │   ├── attendance/            # Room list, detail view, room actions
│   │   └── attendance-take/       # Public attendance-taking components
│   ├── attendance/                # Shared attendance UI (QR panel, record list, avatars)
│   └── error/                     # Error display component
├── config/                        # App config, sidebar items, chain config
├── context/                       # React providers (wallet, environment)
├── hooks/                         # Custom hooks (useAvatar, useAttendanceRecord, etc.)
└── lib/                           # Core utilities
    ├── auth.ts                    # Session management, signature verification
    ├── database.ts                # Drizzle client connection
    ├── schema.ts                  # Database schema (Drizzle ORM)
    ├── redis.ts                   # Upstash Redis client
    └── utils.ts                   # cn() utility for classnames
```

## Patterns

- **Server actions over REST API** for all CRUD operations
- **Server components by default** — use `"use client"` only when needed (interactivity, hooks, browser APIs)
- **Dynamic imports** with `ssr: false` for client-only components (e.g., CreateRoomDialog)
- **SWR** for client-side data fetching with auto-refresh
- **React Hook Form + Zod** for form validation
- **Motion** (framer-motion) for animations

## Environment Variables

### Development (`.env`)

- `DATABASE_URL` — LibSQL/Turso database URL
- `DATABASE_AUTH_TOKEN` — Database auth token
- `JWT_SECRET` — Secret for JWT signing
- `KV_REST_API_URL` — Upstash Redis URL
- `KV_REST_API_TOKEN` — Upstash Redis token
- `NEXT_PUBLIC_URL` — App URL (used for WalletConnect metadata)
- `NEXT_PUBLIC_WEB3_PROJECT_ID` — WalletConnect project ID

### Test (`.env.test`)

- `NEXT_PUBLIC_IS_TEST=true` — Enables test mode (MetaMask mock provider)
- Uses local SQLite file and local Redis (docker-compose)

## Database

Schema defined in `src/lib/schema.ts` using Drizzle ORM with SQLite:

- `user` — Admin users (walletAddress, role, name)
- `attendanceRoom` — Rooms with alias, open/closed status
- `attendant` — Registered attendants (firstName, lastName, userId, walletAddress)
- `attendantOnRoom` — Many-to-many: attendants assigned to rooms
- `attendanceRecord` — Attendance records with timestamps

Timestamps use SQLite's `CURRENT_TIMESTAMP` (text format: "YYYY-MM-DD HH:MM:SS").

## E2E Tests

- **Runner**: Playwright with Chromium
- **Config**: `playwright.config.ts` (single worker on CI)
- **Global setup**: `tests/global-setup.ts` (pushes schema to test DB)
- **Docker**: `docker-compose.yaml` for local Redis (serverless-redis-http)
- Tests use MetaMask mock provider for wallet interactions
