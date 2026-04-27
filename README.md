# RentVago

RentVago is a full-stack web application for residential property search and management.
It includes authentication, role-aware access, advanced property filtering, saved search filters, favorites, and PDF export for search results.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Prisma 7 + PostgreSQL
- Zod for input validation
- JWT-based auth using secure HttpOnly cookies
- pdf-lib for report generation

## Core Features

- User registration and login
- JWT access and refresh token flow
- Role support (`ADMIN`, `EMPLOYEE`)
- Property search with filters and pagination
- PostgreSQL full-text search on properties
- Save, list, update, and delete search filters
- Favorite properties toggle and listing
- Download property search results as PDF

## Role Policy

- Public registration (`POST /api/auth/register`) always creates `EMPLOYEE` users.
- Role escalation from client input is blocked; role is assigned on the server.
- `ADMIN` accounts must be provisioned through controlled flows only (seed or manual promotion script).

## Project Structure

```text
src/
	app/
		(auth)/               # Auth pages (login/register)
		(dashboard)/          # Protected app pages
		api/                  # Route handlers
	services/               # Business logic
	lib/                    # Shared auth, validation, prisma, query helpers
	generated/prisma/       # Generated Prisma client output
prisma/
	schema.prisma
	migrations/
	seed.ts
```

## Requirements

- Bun
- PostgreSQL
- A configured `.env` file

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="your-very-long-random-secret-at-least-32-characters"
```

Notes:

- `DATABASE_URL` is required by Prisma and the PostgreSQL adapter.
- `JWT_SECRET` is required for signing/verifying access and refresh tokens.
- `JWT_SECRET` must be at least 32 characters.

## Installation

```bash
bun install
```

## Database Setup

Run migrations:

```bash
bunx prisma migrate dev
```

Generate Prisma client:

```bash
bunx prisma generate
```

Seed the database:

```bash
bunx prisma db seed
```

The seed creates default users, including one admin:

- `seed.owner@rentvago.com` (`ADMIN`)
- `seed.analyst@rentvago.com` (`EMPLOYEE`)
- `seed.agent1@rentvago.com` (`EMPLOYEE`)
- `seed.agent2@rentvago.com` (`EMPLOYEE`)

## Run the App

Development:

```bash
bun run dev
```

Production build:

```bash
bun run build
bun run start
```

Lint:

```bash
bun run lint
```

Tests:

```bash
bun run test
```

Promote an existing user role (manual controlled flow):

```bash
TARGET_EMAIL="usuario@dominio.com" TARGET_ROLE="ADMIN" bun run user:promote-admin
```

`TARGET_ROLE` accepts `ADMIN` or `EMPLOYEE` (defaults to `ADMIN`).

## Available Scripts

- `bun run dev`: start development server
- `bun run build`: create production build
- `bun run start`: run production server
- `bun run lint`: run ESLint
- `bun run test`: run test suite
- `bun run user:promote-admin`: update user role by email (controlled admin provisioning)

## Auth and Security Notes

- Auth tokens are stored in secure HttpOnly cookies:
	- `access_token`
	- `refresh_token`
- Middleware protects private routes and redirects unauthenticated users to `/login`.
- Access token expires quickly; refresh token is used to renew the session.
- `ADMIN`-only operations are protected in backend route handlers.

## API Overview

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`

Properties:

- `GET /api/properties/search`
- `GET /api/properties/search/pdf`

Favorites:

- `GET /api/favorites`
- `POST /api/favorites`

Saved Search Filters:

- `GET /api/search-filters`
- `POST /api/search-filters`
- `GET /api/search-filters/:id`
- `PATCH /api/search-filters/:id`
- `PUT /api/search-filters/:id`
- `DELETE /api/search-filters/:id`

## Prisma Notes

- The Prisma client is generated to `src/generated/prisma`.
- Full-text search support is implemented through SQL migrations on a generated `search_vector` field with GIN indexing.

## Troubleshooting

- If Prisma fails to connect, verify `DATABASE_URL` and that PostgreSQL is running.
- If auth endpoints fail, verify `JWT_SECRET` exists and has at least 32 characters.
- If generated client types are outdated, run `bunx prisma generate` again.
