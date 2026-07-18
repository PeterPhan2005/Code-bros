# 04-database.md

> Read `AGENTS.md` before starting.

# Feature 04 — Database Foundation

## Objective

Establish the persistent data layer for Code Bros using PostgreSQL and Prisma.

This feature defines the initial domain model for:

* application users
* projects
* project ownership
* project membership
* project roles
* project visibility
* project lifecycle

The database created here will support future project management, collaboration, authorization, AI activity, snapshots, and execution history.

Do not build project dialogs, project pages, collaboration rooms, or API endpoints beyond what is required to verify the database integration.

---

## Dependencies

* `03-auth.md`

---

## Technology

Use:

* PostgreSQL
* Prisma ORM
* Prisma Client

Install the Prisma packages required by the repository’s current Prisma configuration.

Do not install another ORM.

Do not introduce a second database.

Use the Prisma setup appropriate for the installed Prisma version and the project’s existing runtime.

---

# Database Principles

## PostgreSQL Is the Source of Truth

PostgreSQL is the authoritative source for persistent application data.

Do not use:

* browser storage as permanent project storage
* Clerk metadata as the project database
* Liveblocks storage as the project database
* in-memory arrays as application persistence
* mock project data after project persistence is implemented

External systems may store specialized data later, but PostgreSQL owns the durable domain relationships.

## Clerk Owns Authentication

Clerk remains the source of truth for:

* credentials
* authentication
* active sessions
* account security
* identity verification

PostgreSQL stores only the application data required to associate a Clerk identity with Code Bros resources.

Do not store:

* passwords
* authentication tokens
* session tokens
* OAuth credentials
* Clerk secret keys

## The Database Does Not Grant Access by Itself

A record existing in the database does not automatically mean the current user may access it.

Every protected operation must eventually verify:

1. the authenticated Clerk user
2. the project membership
3. the member’s role
4. the required permission for the action

Authentication and authorization must remain separate concerns.

## Explicit Relationships Over Embedded State

Use relational models for ownership and membership.

Do not store collaborator lists as:

* JSON arrays
* comma-separated strings
* serialized objects
* Clerk metadata

Project membership must be queryable, constrained, and indexable.

## Destructive Actions Must Be Intentional

Deletion behavior must be explicitly defined.

Use cascading deletes only when child data cannot meaningfully exist without its parent.

Do not introduce broad cascade behavior without understanding which records will be removed.

## Server-Only Database Access

Prisma Client must only be used in trusted server environments.

Do not import Prisma into:

* Client Components
* browser utilities
* client hooks
* shared modules that are bundled for the browser

All database operations must pass through server-side services, Server Actions, Route Handlers, background jobs, or Server Components.

---

# Environment Variables

Use the existing database environment variables when already configured.

At minimum, the application requires a PostgreSQL connection string.

```text
DATABASE_URL
```

When the database provider requires separate application and migration connections, support:

```text
DATABASE_URL
DIRECT_URL
```

Use:

* the pooled connection for application traffic
* the direct connection for migrations and administrative operations when required by the provider

The exact connection strategy must follow the selected PostgreSQL provider.

Do not:

* commit real credentials
* expose database URLs through `NEXT_PUBLIC_*`
* log connection strings
* embed credentials in source files
* invent duplicate database variables without a provider requirement

Update:

```text
.env.example
```

with placeholders only when the required variables are not already documented.

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

Do not include production credentials in examples.

---

# Prisma Structure

Use the Prisma structure supported by the repository’s installed Prisma version.

Expected files may include:

```text
prisma/
  schema.prisma
  migrations/

prisma.config.ts
```

Keep database schema and migration history committed to source control.

Do not commit generated database credentials.

Do not manually edit generated Prisma Client output.

---

# Prisma Client

Create a reusable server-only Prisma client module.

Suggested location:

```text
lib/db/prisma.ts
```

The module must:

* export one shared Prisma Client instance
* prevent unnecessary client creation during development hot reloads
* remain server-only
* use the repository’s configured Prisma client output
* centralize Prisma initialization

Do not instantiate a new Prisma Client inside every:

* Server Action
* Route Handler
* service function
* Server Component
* background task

The rest of the application should import the shared instance from one location.

Suggested export:

```ts
export const prisma = /* shared Prisma client */
```

Do not add database queries directly to `lib/db/prisma.ts`.

This file initializes the client only.

---

# Initial Domain Model

Implement the following foundational models:

* `User`
* `Project`
* `ProjectMember`

Implement the following enums:

* `ProjectRole`
* `ProjectVisibility`
* `ProjectStatus`

Do not add speculative models for every future feature.

The following belong to later specifications:

* files
* file versions
* snapshots
* AI requests
* AI patches
* AI messages
* execution sessions
* terminal history
* activity events
* invitations
* comments
* notifications

---

# User Model

Create a `User` model representing the application-level profile associated with a Clerk identity.

The model should contain:

```prisma
model User {
  id            String   @id @default(cuid())
  clerkUserId   String   @unique
  email         String?
  displayName   String?
  imageUrl      String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  ownedProjects Project[]       @relation("ProjectOwner")
  memberships   ProjectMember[]
}
```

The exact field order may vary, but the relationships and constraints must remain equivalent.

## User Field Rules

### `id`

Use an application-owned internal identifier.

Do not use an email address as the primary key.

### `clerkUserId`

Store the corresponding Clerk user ID.

Requirements:

* required
* unique
* indexed through its unique constraint
* used for resolving the authenticated application user

This is the stable connection between Clerk identity and Code Bros data.

### `email`

Email may be stored as denormalized profile data for display and lookup.

It must not be treated as the permanent identity key.

A user may change their email address through Clerk.

### `displayName`

Store the user’s preferred display name when available.

Do not require it for database integrity.

### `imageUrl`

Store the current profile image URL when useful for collaborative interfaces.

Do not treat the image as permanent application-owned media.

---

# User Synchronization Strategy

Create application users lazily when authenticated users first require database-backed functionality.

Provide a server-only helper such as:

```text
lib/auth/get-or-create-user.ts
```

Suggested responsibility:

```ts
getOrCreateCurrentUser()
```

The helper must:

1. resolve the authenticated Clerk session
2. reject unauthenticated access
3. look up the user by `clerkUserId`
4. create the user when no matching record exists
5. return the application user record

Use an upsert or equivalent concurrency-safe operation.

Do not trust a Clerk user ID supplied through a form or request body.

The Clerk user ID must come from the verified server session.

## Webhooks

Do not require Clerk webhooks for this feature.

A later profile-synchronization feature may add verified Clerk webhooks for:

* user updates
* user deletion
* profile synchronization

Lazy provisioning is sufficient for the initial database foundation.

Do not build an unverified webhook endpoint.

---

# Project Model

Create a `Project` model representing a persistent Code Bros workspace.

The model should contain:

```prisma
model Project {
  id          String            @id @default(cuid())
  name        String
  slug        String
  description String?
  visibility  ProjectVisibility @default(PRIVATE)
  status      ProjectStatus     @default(ACTIVE)

  ownerId     String
  owner       User              @relation(
    "ProjectOwner",
    fields: [ownerId],
    references: [id],
    onDelete: Cascade
  )

  members     ProjectMember[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  @@unique([ownerId, slug])
  @@index([ownerId])
  @@index([status])
  @@index([updatedAt])
}
```

The exact formatting may vary, but the domain constraints must remain equivalent.

---

# Project Field Rules

## `id`

Use an internal application identifier.

Do not expose database implementation details as a permission mechanism.

## `name`

Requirements:

* required
* trimmed before persistence
* validated at the application boundary
* suitable for display in the project sidebar and navbar

Recommended application constraints:

* minimum length: 1 character after trimming
* maximum length: 80 characters

The database schema may use a standard string field while application validation enforces length.

## `slug`

The slug provides a stable URL-safe project identifier within an owner’s namespace.

Requirements:

* lowercase
* URL-safe
* generated from the project name
* unique per owner
* not globally unique
* persisted in the database

Use the compound uniqueness constraint:

```prisma
@@unique([ownerId, slug])
```

This allows different users to create projects with the same slug while preventing duplicate slugs for the same owner.

Slug generation and collision handling belong to `05-projects.md`.

## `description`

Optional project description.

Do not require a description when creating a project.

## `visibility`

Use a project visibility enum.

For the MVP, projects default to private.

Visibility does not replace membership authorization.

## `status`

Use an explicit lifecycle status.

This avoids treating deletion and archiving as ambiguous Boolean combinations.

## `ownerId`

References the application `User`, not the Clerk user ID directly.

This keeps domain relationships attached to the application-owned user record.

## `deletedAt`

Reserve this field for soft-deletion behavior.

The initial project feature may mark a project deleted rather than immediately destroying all associated records.

Queries that return normal project lists must exclude deleted projects.

Do not implement background cleanup in this feature.

---

# Project Visibility

Create:

```prisma
enum ProjectVisibility {
  PRIVATE
}
```

Only `PRIVATE` is required for the current MVP.

Do not add public discovery behavior.

Future specifications may extend the enum with values such as:

```text
UNLISTED
PUBLIC
```

Those values must not be added until their access semantics are defined.

---

# Project Status

Create:

```prisma
enum ProjectStatus {
  ACTIVE
  ARCHIVED
  DELETED
}
```

## `ACTIVE`

The project is available for normal work.

## `ARCHIVED`

The project is preserved but removed from the primary active-project workflow.

Archiving behavior is not implemented in this feature.

## `DELETED`

The project is soft-deleted and must not appear in ordinary project queries.

When status is `DELETED`, set `deletedAt`.

Do not treat `deletedAt` and `status` as independent contradictory values.

Application services must maintain their consistency.

---

# Project Member Model

Create a `ProjectMember` join model representing a user’s membership in a project.

The model should contain:

```prisma
model ProjectMember {
  id         String      @id @default(cuid())
  projectId  String
  userId     String
  role       ProjectRole @default(EDITOR)

  project    Project     @relation(
    fields: [projectId],
    references: [id],
    onDelete: Cascade
  )

  user       User        @relation(
    fields: [userId],
    references: [id],
    onDelete: Cascade
  )

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([projectId, userId])
  @@index([userId])
  @@index([projectId, role])
}
```

The exact formatting may vary, but the membership constraints must remain equivalent.

---

# Project Roles

Create:

```prisma
enum ProjectRole {
  OWNER
  EDITOR
  VIEWER
}
```

## `OWNER`

The owner has full control over the project.

Expected future permissions include:

* rename project
* delete project
* manage collaborators
* edit files
* run code
* request AI work
* approve AI patches
* change project settings

A project must have exactly one canonical owner through `Project.ownerId`.

Do not rely only on an `OWNER` membership row to determine canonical ownership.

## `EDITOR`

An editor may participate in project development.

Expected future permissions include:

* view project
* edit files
* collaborate in real time
* run code
* request AI work
* review AI patches

Editors must not automatically receive project-management permissions.

## `VIEWER`

A viewer has read-only access.

Expected future permissions include:

* view files
* observe collaboration activity
* inspect approved project state

Viewers must not:

* edit files
* run mutating operations
* approve AI changes
* rename the project
* delete the project
* manage members

The exact authorization matrix will be defined in a later permissions specification.

---

# Ownership and Membership Invariant

Every project must have:

* one `ownerId`
* one corresponding `ProjectMember` record for the owner
* the owner membership role set to `OWNER`

Project creation must eventually create both records in one transaction.

The database schema cannot fully enforce every cross-table role invariant by itself, so the project service must maintain it.

Do not:

* create a project without owner membership
* assign multiple canonical owners
* remove the owner membership independently
* downgrade the canonical owner to another role
* transfer ownership without a dedicated transaction

Ownership transfer is out of scope for the MVP.

---

# Relationship Behavior

## User Deletion

The initial schema may cascade projects and memberships when an application user is permanently removed.

However, normal Clerk account deletion must not automatically trigger unreviewed destructive database operations until verified webhook and retention behavior are explicitly implemented.

Do not add account-deletion synchronization in this feature.

## Project Deletion

Deleting a project record may cascade its membership records because memberships cannot exist without a project.

Normal application deletion should initially use the project lifecycle fields:

```text
status = DELETED
deletedAt = current timestamp
```

Hard deletion may be reserved for later cleanup or administrative workflows.

## Membership Deletion

Removing a member must remove only the relevant membership.

It must not delete:

* the user
* the project
* unrelated memberships

---

# Indexing Requirements

Add indexes that support expected access patterns.

Required access patterns include:

* find an application user by Clerk user ID
* list projects owned by a user
* list memberships for a user
* list members of a project
* resolve a project by owner and slug
* filter projects by lifecycle status
* order projects by recent updates

Avoid adding indexes without a known query pattern.

Do not duplicate indexes already created by:

* primary keys
* unique constraints
* compound unique constraints

---

# Migration

Create the initial database migration.

Use a descriptive migration name such as:

```text
init_code_bros_database
```

The migration must create:

* user table
* project table
* project-member table
* required enums
* primary keys
* foreign keys
* unique constraints
* indexes
* timestamps

Do not use schema push as the permanent production migration workflow.

Migration history must be reproducible from source control.

After creating the migration:

* inspect the generated SQL
* verify foreign-key behavior
* verify unique constraints
* verify enum values
* verify indexes

Do not edit an already-applied migration casually.

Create a new migration for later schema changes.

---

# Seed Data

Create a seed script only if the project already has a standard seed workflow or local development requires it.

A seed script may create:

* one local test user
* one owned project
* one editor membership
* one viewer membership

Do not seed:

* production credentials
* real Clerk identities
* fake authentication tokens
* large datasets
* AI activity
* execution history

The application must not depend on seed data to run.

Seed data is optional for this feature.

---

# Database Service Boundaries

Create a database service structure that future features can extend.

Suggested structure:

```text
lib/
  db/
    prisma.ts

  auth/
    get-or-create-user.ts

  projects/
    project.types.ts
```

Do not implement the full project service in this feature.

Future project database operations should be placed in a dedicated server-only module such as:

```text
lib/projects/project.service.ts
```

UI components must not query Prisma directly.

Do not place project queries inside:

* dialog components
* sidebar components
* client hooks
* form components

---

# Validation Boundary

Prisma schema constraints are not a replacement for application validation.

Future writes must validate:

* project name
* project slug
* identifiers
* role values
* authenticated identity
* permissions

A schema validation library may be introduced in `05-projects.md` when forms and mutations are implemented.

Do not add incomplete validation utilities with no consumers in this feature.

---

# Transactions

Use database transactions when an operation must preserve multiple related invariants.

Future project creation must create:

1. the project
2. the owner membership

as one atomic operation.

Future ownership transfer must update:

1. canonical owner
2. previous owner role
3. new owner role

as one atomic operation.

Do not use independent database writes for operations that would leave invalid partial state after failure.

---

# Query Conventions

Future database queries must follow these rules:

* select only required fields when practical
* avoid returning secrets or unnecessary profile data
* exclude soft-deleted projects by default
* include relationships intentionally
* avoid unbounded list queries
* define deterministic ordering
* paginate growing collections
* resolve authentication before protected queries
* perform authorization before mutations

Do not create a generic unrestricted data-access layer that bypasses domain rules.

---

# Error Handling

Database failures must not expose internal connection details to users.

Application code should distinguish between:

* unauthenticated access
* unauthorized access
* missing records
* uniqueness conflicts
* validation failures
* infrastructure failures

Future project creation must handle slug collisions safely.

Do not show raw Prisma errors in the UI.

Server logs may record appropriate diagnostic context, but must not contain:

* database credentials
* Clerk secrets
* session tokens
* sensitive user data

---

# Security Constraints

* Prisma must remain server-only.
* Database credentials must remain server-only.
* Clerk user IDs must be resolved from verified sessions.
* Client-provided ownership fields must never be trusted.
* Project membership must be checked server-side.
* Project roles must not be inferred from UI state.
* Soft-deleted projects must not be returned through normal queries.
* Raw database errors must not be exposed to users.
* Email addresses must not be used as permanent identity keys.
* No project operation may rely solely on an opaque project ID for authorization.

---

# Performance Constraints

* Reuse one Prisma Client instance per server runtime.
* Index known ownership and membership lookup paths.
* Avoid querying complete membership lists when only access existence is required.
* Avoid loading complete user records for simple identity checks.
* Avoid unbounded project and activity queries.
* Do not introduce premature caching in this feature.
* Do not open database connections from the browser.

---

# Out of Scope

Do not implement:

* project creation UI
* project rename UI
* project deletion UI
* project API routes
* project Server Actions
* slug collision UI
* project invitations
* invitation tokens
* ownership transfer
* public projects
* project templates
* project files
* folder trees
* Liveblocks rooms
* collaboration presence
* AI messages
* AI patches
* snapshots
* execution sessions
* activity timelines
* notifications
* billing
* database-backed sessions
* Clerk webhook synchronization
* permanent user-deletion workflows

These belong to later features.

---

# Expected File Structure

```text
prisma/
  schema.prisma
  migrations/
    ..._init_code_bros_database/
      migration.sql

lib/
  auth/
    get-or-create-user.ts

  db/
    prisma.ts

  projects/
    project.types.ts

.env.example
```

Additional Prisma configuration files may exist depending on the installed Prisma version.

Follow the repository’s current conventions rather than duplicating configuration.

---

# Implementation Sequence

1. Inspect the current package manager and Prisma version.
2. Install the required Prisma packages.
3. Configure the PostgreSQL datasource.
4. Configure Prisma Client generation.
5. Create the shared server-only Prisma Client.
6. Define `User`.
7. Define `Project`.
8. Define `ProjectMember`.
9. Define project enums.
10. Add relationships and constraints.
11. Add required indexes.
12. Generate Prisma Client.
13. Create the initial migration.
14. Inspect the migration SQL.
15. Apply the migration to the development database.
16. Implement `getOrCreateCurrentUser()`.
17. Verify a server-side database query succeeds.
18. Run lint and production build checks.

---

# Check When Done

* PostgreSQL is configured.
* Prisma is installed and initialized.
* The schema uses the PostgreSQL provider.
* Database credentials are stored only in environment variables.
* `.env.example` contains placeholders rather than secrets.
* A reusable server-only Prisma Client exists.
* Development hot reload does not create unnecessary Prisma clients.
* The `User` model exists.
* `clerkUserId` is required and unique.
* The `Project` model exists.
* The `ProjectMember` model exists.
* `ProjectRole` exists with `OWNER`, `EDITOR`, and `VIEWER`.
* `ProjectVisibility` exists with `PRIVATE`.
* `ProjectStatus` exists with `ACTIVE`, `ARCHIVED`, and `DELETED`.
* Projects have one canonical owner.
* Owner and project relationships are defined.
* Membership uniqueness is enforced per user and project.
* Project slug uniqueness is enforced per owner.
* Required lookup indexes exist.
* Soft-deletion fields exist on projects.
* The initial migration is generated and committed.
* Migration SQL has been inspected.
* Prisma Client generates successfully.
* The development migration applies successfully.
* `getOrCreateCurrentUser()` resolves identity from the Clerk server session.
* `getOrCreateCurrentUser()` does not trust client-provided identity.
* No Prisma imports exist in Client Components.
* No real credentials are committed.
* No mock persistence layer is introduced.
* No generated `components/ui/*` files are modified.
* `npm run lint` passes.
* `npm run build` passes.

---

# Unlocks

* `05-projects.md`
* persistent project creation
* owned project lists
* shared project lists
* project rename and deletion
* project authorization
* collaborator invitations
* project role enforcement
* protected Liveblocks rooms
* file persistence
* AI activity ownership
* snapshots
* execution history
* activity timelines
