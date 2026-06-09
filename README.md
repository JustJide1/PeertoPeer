# Bowen P2P Learning

A web-based peer-to-peer learning system for the Computer Science department at Bowen
University. Students can discover study sessions, browse course subjects, and connect with
peers to learn together.

## Project overview

This is a TypeScript monorepo organized as npm workspaces:

```
.
├── client/   # React + Vite + TailwindCSS frontend
├── server/   # Node.js + Express REST API backend
└── shared/   # Shared TypeScript types used by both client and server
```

- **client** — Single-page application built with React, Vite, and Tailwind CSS. Talks to the
  backend over a JSON REST API (see `client/src/lib/api.ts`).
- **server** — Express REST API exposing endpoints for subjects and study sessions under
  `/api`. Built with TypeScript and run via `tsx` in development.
- **shared** — Common TypeScript types (e.g. `User`, `StudySession`, `Subject`) imported by
  both the client and server as `@bowen-p2p/shared`, keeping API contracts in sync.

## Prerequisites

- Node.js 18+ and npm 9+ (for npm workspaces support)

## Setup

1. Install dependencies for all workspaces from the repo root:

   ```bash
   npm install
   ```

2. Create environment files from the provided examples:

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

   Then update the values (database connection string, JWT secret, API URLs, etc.) as needed.
   `DATABASE_URL` must point at a running PostgreSQL instance, e.g.:

   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bowen_p2p_learning?schema=public"
   ```

3. Build the shared types package (the client and server import compiled output from it):

   ```bash
   npm run build:shared
   ```

4. Set up the database with Prisma (run from `server/`):

   ```bash
   npm run prisma:migrate   # creates the schema in PostgreSQL
   npm run prisma:seed      # populates sample courses, students and a lecturer
   ```

## Development

Run the backend and frontend in separate terminals:

```bash
npm run dev:server   # starts the Express API on http://localhost:5000
npm run dev:client   # starts the Vite dev server on http://localhost:5173
```

The client is configured to call the API at the URL set in `client/.env`
(`VITE_API_BASE_URL`, defaults to `http://localhost:5000/api`).

## Building for production

```bash
npm run build
```

This builds `shared`, then `server`, then `client` in order, producing compiled output in each
workspace's `dist/` directory.

## Database (Prisma + PostgreSQL)

The schema lives at `server/prisma/schema.prisma` and models the core domain:

- **User** — students and lecturers (`role`, `level`)
- **Course** — taught by a lecturer, has forums, resources and enrollments
- **Forum** — a discussion board scoped to a course
- **Post** / **Comment** — forum discussion content
- **Resource** — files shared within a course
- **Enrollment** — join table linking users to courses

Useful commands (run from `server/`):

```bash
npm run prisma:generate   # regenerate the Prisma client after schema changes
npm run prisma:migrate    # create/apply migrations against your local PostgreSQL database
npm run prisma:studio     # open Prisma Studio to browse data
npm run prisma:seed       # seed sample courses, students and a lecturer
```

The seed script (`server/prisma/seed.ts`) creates 4 CS courses (CSC101, CSC201, CSC301,
CSC401) each with a discussion forum, 1 lecturer, and 5 students spread across levels
100–400, then enrolls each student in a couple of courses.

## Linting and formatting

```bash
npm run lint           # run ESLint across the monorepo
npm run format         # format files with Prettier
npm run format:check   # check formatting without writing changes
```

## API overview

All endpoints are served under `/api` and return JSON in the consistent shape
`{ success, data, message }`. Routes other than `/health` and `/auth/*` (excluding
`/auth/me` and `/auth/logout`) require an `Authorization: Bearer <accessToken>` header.

| Method | Path                          | Description                              |
| ------ | ----------------------------- | ---------------------------------------- |
| GET    | `/health`                     | Health check                             |
| POST   | `/auth/register`              | Register a new user, returns tokens      |
| POST   | `/auth/login`                 | Authenticate, returns access + refresh token |
| POST   | `/auth/refresh`               | Exchange a refresh token for a new access token |
| POST   | `/auth/logout`                | Invalidate the current refresh token (protected) |
| GET    | `/auth/me`                    | Get the current user's profile (protected) |
| GET    | `/users`                      | List users                               |
| GET    | `/users/:id`                  | Get a user's profile and enrollments     |
| PATCH  | `/users/me`                   | Update the current user's name/level     |
| GET    | `/courses`                    | List courses                             |
| POST   | `/courses`                    | Create a course (lecturer only)          |
| GET    | `/courses/:id`                | Get a course with forums and resources   |
| POST   | `/courses/:id/enroll`         | Enroll the current user in a course      |
| GET    | `/forums/course/:courseId`    | List forums for a course                 |
| POST   | `/forums/course/:courseId`    | Create a forum (course lecturer only)    |
| GET    | `/forums/:id`                 | Get a forum with its posts               |
| POST   | `/posts/forum/:forumId`       | Create a post in a forum                 |
| GET    | `/posts/:id`                  | Get a post with its comments             |
| PATCH  | `/posts/:id`                  | Edit a post (author only)                |
| DELETE | `/posts/:id`                  | Delete a post (author only)              |
| POST   | `/posts/:id/comments`         | Comment on a post                        |
| GET    | `/resources/course/:courseId` | List resources for a course              |
| POST   | `/resources/course/:courseId` | Upload a resource to a course            |
| DELETE | `/resources/:id`              | Delete a resource (uploader only)        |

### Authentication rules

- **Email** must be a valid `@bowen.edu.ng` address.
- **Password** must be at least 8 characters and include at least one uppercase letter and
  one number.
- **Level** is required at registration and must be one of `100`, `200`, `300`, `400`.
- **Access tokens** expire after 15 minutes; **refresh tokens** expire after 7 days. The
  server stores a hash of the active refresh token per user so `/auth/logout` can invalidate
  it (subsequent `/auth/refresh` calls with that token will be rejected).
