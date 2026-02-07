# Dashboard ChainLab - Attendance dApp

A decentralized attendance tracking application built with Next.js and Web3 technology. This application enables organizations to manage attendance records using blockchain wallet authentication, providing a secure and transparent attendance system.

## Features

- 🔐 **Web3 Authentication** - Wallet-based authentication using WalletConnect
- 📊 **Attendance Management** - Create and manage attendance rooms
- 🎫 **QR Code Check-in** - Quick attendance taking via QR codes
- 👥 **Attendant Management** - Track and manage attendant records
- 🔒 **Role-based Access Control** - Admin and user roles with protected routes
- 📱 **Responsive Design** - Mobile-friendly interface
- ⚡ **Real-time Updates** - WebSocket support for live attendance updates
- 🎨 **Modern UI** - Built with shadcn/ui and Tailwind CSS

## Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **React**: React 19
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Caching**: Redis (via Upstash)
- **Authentication**: Web3 with [ethers.js](https://docs.ethers.org/) and JWT
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **Testing**: Playwright for E2E tests
- **Type Safety**: TypeScript

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 20.x or higher
- pnpm (recommended) or npm
- Docker and Docker Compose (for local database and Redis)
- A Web3 wallet (MetaMask, WalletConnect, etc.)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/rxtech-lab/dashboard-chainlab.git
cd dashboard-chainlab
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```bash
# WalletConnect Project ID (get from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/attendance

# Redis/KV Store
KV_REST_API_TOKEN=token
KV_REST_API_URL=http://localhost:8079

# JWT Secret (use a strong random string in production)
JWT_SECRET=your_jwt_secret_here

# Environment
VERCEL_GIT_COMMIT_REF=main
```

### 4. Start the database services

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- Serverless Redis HTTP on port 8079

### 5. Set up the database

Run Prisma migrations to set up the database schema:

```bash
pnpm migrate:dev
```

### 6. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Available Scripts

- `pnpm dev` - Start the development server with Turbopack
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint to check code quality
- `pnpm test:e2e` - Run end-to-end tests with Playwright
- `pnpm migrate:dev` - Run database migrations for development
- `pnpm migrate:test` - Run database migrations for test environment
- `pnpm generate` - Generate Prisma client

## Project Structure

```
dashboard-chainlab/
├── prisma/              # Database schema and migrations
├── public/              # Static assets
├── src/
│   ├── app/            # Next.js app router pages
│   │   ├── (internal)/ # Protected routes (dashboard)
│   │   └── (public)/   # Public routes (attendance taking)
│   ├── components/     # React components
│   ├── config/         # Configuration files
│   ├── context/        # React context providers
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utility libraries
├── tests/              # E2E tests
└── docker-compose.yaml # Docker services configuration
```

## Testing

Run the end-to-end test suite:

```bash
# Make sure the test database is running
docker-compose up -d

# Run migrations for test environment
pnpm migrate:test

# Run tests
pnpm test:e2e
```

## Deployment

The application can be deployed to [Vercel](https://vercel.com), which provides first-class support for Next.js applications.

1. Push your code to a Git repository
2. Import the project on Vercel
3. Configure environment variables in the Vercel dashboard
4. Deploy!

Make sure to set up a production PostgreSQL database (e.g., Neon, Supabase) and Redis instance (e.g., Upstash) for production use.

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [ethers.js Documentation](https://docs.ethers.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

## License

This project is private and proprietary.
