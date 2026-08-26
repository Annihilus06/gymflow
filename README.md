# GymFlow 🏋️‍♂️

> Production-grade, mobile-first workout tracking and fitness planning platform built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL, Prisma, and PWA capabilities.

[![Live Demo](https://img.shields.io/badge/Live_Demo-gymflow--p9jx.vercel.app-2ea44f?style=for-the-badge&logo=vercel)](https://gymflow-p9jx.vercel.app)
[![Build Status](https://img.shields.io/badge/Status-Live%20in%20Production-success?style=for-the-badge)](https://gymflow-p9jx.vercel.app)

🔗 **Live App**: [https://gymflow-p9jx.vercel.app](https://gymflow-p9jx.vercel.app)  
🔑 **Demo Credentials**: `demo@gymflow.app` / `Password123!`

---

## 📖 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture & Layer Separation](#architecture--layer-separation)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Database Setup & Prisma](#database-setup--prisma)
- [Testing Guide](#testing-guide)
- [Coding Conventions for Agents](#coding-conventions-for-agents)

---

## Overview

GymFlow is designed to provide a fast, offline-capable, distraction-free workout logging and routine planning experience. All health and fitness calculations (BMI, BMR, TDEE, Calorie targets, Protein targets, Volume, Workout Frequency) are computed deterministically in pure code functions. AI serves as an advisory assistant for routine optimization and exercise recommendations, always requiring explicit user approval before database persistence.

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 14+ (App Router, Server Components & Route Handlers) |
| **Language** | TypeScript (Strict Mode with `noUncheckedIndexedAccess`) |
| **Styling** | Tailwind CSS + `tailwindcss-animate` |
| **UI Components** | shadcn/ui + Radix UI primitives |
| **Database & ORM** | PostgreSQL + Prisma ORM |
| **Validation** | Zod (Runtime validation for env, API input, schemas) |
| **Unit Testing** | Vitest + React Testing Library + jsdom |
| **E2E Testing** | Playwright (Mobile & Desktop browser profiles) |
| **Formatting & Linting** | ESLint + Prettier + Prettier Tailwind Plugin |
| **PWA** | Web App Manifest + Service Worker foundation |

---

## Architecture & Layer Separation

GymFlow enforces a strict 4-layer architecture:

1. **Presentation Layer (`src/components/`, `src/app/`)**:
   - Clean React components using shadcn/ui.
   - Client components handle UI state; Server Components handle data fetching.
   - **No direct business logic or Prisma calls in components.**

2. **API Layer (`src/app/api/`)**:
   - Next.js Route Handlers.
   - Responsible for: (1) Session authentication check, (2) Zod payload validation, (3) Service layer invocation passing session `userId`, (4) Unified JSON response formatting.
   - Handled via `handleApiError()`.

3. **Service Layer (`src/lib/services/`)**:
   - Contains all domain logic, orchestration, and Prisma database transactions.
   - Always scopes queries by `userId`.

4. **Pure Utilities & Validations (`src/lib/utils/`, `src/lib/validations/`)**:
   - Deterministic calculations (BMI, Calories, Protein, Frequency, Volume).
   - Zero side-effects; 100% test branch coverage target.

---

## Folder Structure

```
GymFlow/
├── docs/                   # Architecture, Database, API, and Testing Specs
├── prisma/
│   └── schema.prisma       # Prisma models, enums, and relations
├── public/
│   ├── manifest.json       # PWA Web App Manifest
│   ├── sw.js               # Service Worker for offline support
│   └── icons/              # PWA app icons
├── src/
│   ├── app/                # App Router routes and layouts
│   │   ├── (auth)/         # Unauthenticated route group (login, register)
│   │   ├── (app)/          # Authenticated app shell (dashboard, workout, etc.)
│   │   ├── api/            # Next.js Route Handlers
│   │   ├── globals.css     # Tailwind and theme styles
│   │   └── layout.tsx      # Root HTML layout with PWA metadata
│   ├── components/
│   │   ├── ui/             # shadcn/ui primitives (button, card, progress, etc.)
│   │   └── layout/         # Shell, header, mobile-nav, desktop sidebar
│   ├── constants/          # Named constants (activity factors, muscle groups, etc.)
│   ├── hooks/              # Reusable React hooks
│   ├── lib/
│   │   ├── db/             # Singleton Prisma client (prisma.ts)
│   │   ├── env.ts          # Zod environment variable validator
│   │   ├── errors/         # AppError class and handleApiError utility
│   │   ├── services/       # Service layer modules
│   │   ├── utils/          # Pure functions and calculations
│   │   └── validations/    # Zod schemas (common, profile, routines, etc.)
│   └── types/              # Global TypeScript types (API, database, etc.)
├── tests/
│   ├── unit/               # Vitest unit tests for utils and components
│   ├── integration/        # Route handler and service integration tests
│   ├── e2e/                # Playwright end-to-end browser tests
│   └── setup.ts            # Vitest setup with jest-dom matchers
├── .env.example            # Environment variables template
├── .env.local              # Local environment variables
├── next.config.mjs         # Next.js configuration with security headers
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # Strict TypeScript configuration
├── vitest.config.ts        # Vitest configuration
├── playwright.config.ts    # Playwright configuration
├── AGENTS.md               # Mandatory agent rules and guidelines
└── package.json            # Dependencies and scripts
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.18+ or v20+
- **PostgreSQL**: PostgreSQL 15+ instance running locally or hosted (e.g. Neon, Supabase)

### 2. Installation
```bash
# Clone the repository
git clone <repository-url>
cd GymFlow

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env.local
```

### 3. Database Initialization
```bash
# Generate Prisma Client
npm run db:generate

# Run migrations (when PostgreSQL is configured)
npm run db:migrate
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Starts Next.js development server |
| `npm run build` | Builds the production application |
| `npm run start` | Starts Next.js in production mode |
| `npm run lint` | Runs Next.js ESLint checks |
| `npm run typecheck` | Runs TypeScript compiler checks (`tsc --noEmit`) |
| `npm run test` | Runs all unit and integration tests with Vitest |
| `npm run test:unit` | Runs unit tests |
| `npm run test:integration` | Runs integration tests |
| `npm run test:e2e` | Runs Playwright end-to-end browser tests |
| `npm run test:coverage` | Runs Vitest with v8 code coverage reporting |
| `npm run format` | Formats codebase with Prettier |
| `npm run format:check` | Checks formatting with Prettier |
| `npm run db:generate` | Generates Prisma client types |
| `npm run db:migrate` | Runs database migrations in development |
| `npm run db:studio` | Opens Prisma Studio GUI |

---

## Testing Guide

### Unit Tests
Unit tests use **Vitest** with `@testing-library/react` and `jsdom`. All pure utility calculation functions must maintain 100% branch coverage.
```bash
npm run test
```

### E2E Tests
E2E tests use **Playwright** with preconfigured mobile browser emulation (iPhone 14, Pixel 5) and desktop Chrome.
```bash
npm run test:e2e
```

---

## Coding Conventions for Agents

1. **Strict Types**: Never use `any` without documented justification.
2. **Deterministic Calculations**: Keep calculations in `src/lib/utils/`. AI must never be the source of truth for metrics.
3. **User Isolation**: All database queries must include `userId` derived from the validated server session.
4. **Error Handling**: Throw `AppError` in services and use `handleApiError()` in route handlers.
5. **Mobile-First CSS**: Use Tailwind classes that build up from mobile (`text-sm sm:text-base lg:text-lg`).
