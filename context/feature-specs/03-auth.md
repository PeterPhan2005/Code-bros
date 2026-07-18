# 03-auth.md

> Read `AGENTS.md` before starting.

# Feature 03 — Authentication

## Objective

Integrate Clerk authentication throughout the Code Bros Next.js application.

This feature establishes:

* global Clerk context
* sign-in and sign-up flows
* protected application routes
* authenticated root redirects
* user profile and sign-out controls
* reusable server-side authentication boundaries

Authentication is the identity foundation for projects, collaboration sessions, permissions, AI activity, snapshots, and execution history.

---

## Dependencies

* `01-design-system.md`
* `02-editor.md`

---

## Existing Setup

Clerk is already installed, configured, and connected to the application.

Use the existing Clerk environment variables.

Do not:

* create a second Clerk application
* rename existing Clerk variables
* invent replacement environment variables
* expose secret keys to client components
* build custom authentication APIs
* replace Clerk session management

Install only the additional Clerk UI theme package if it is not already present.

```bash
npm install @clerk/ui
```

Use the versions compatible with the existing `@clerk/nextjs` installation.

---

# Authentication Principles

## Clerk Owns Authentication

Clerk remains the source of truth for:

* user identity
* active sessions
* sign-in
* sign-up
* account security
* profile management
* sign-out

Do not duplicate Clerk authentication data or password flows inside the application database.

Application-specific profile information may be stored later using the Clerk user ID as the external identity reference.

## Authentication Is Not Authorization

A valid Clerk session proves who the user is.

It does not prove that the user can access a specific:

* project
* file
* collaboration room
* AI operation
* snapshot
* execution environment

Project authorization will be implemented separately.

Every protected resource must eventually verify both:

1. the user is authenticated
2. the user has permission to access the requested resource

## Server Trust Boundary

Never trust a user ID, role, project membership, or permission supplied by the browser.

Server Components, Route Handlers, Server Actions, background jobs, and database services must resolve identity from the verified Clerk session.

---

# Root Provider

Update the root application layout:

```text
app/layout.tsx
```

Wrap the entire application with:

```tsx
<ClerkProvider>
  {children}
</ClerkProvider>
```

The provider must:

* wrap all route groups
* use Clerk’s dark theme as its base
* use the existing authentication URLs
* preserve existing root layout metadata
* preserve the configured application fonts
* avoid turning the root layout into a Client Component

Use the dark theme exported by the Clerk UI theme package supported by the installed Clerk version.

---

# Clerk Appearance

Use Clerk’s dark theme as the base appearance.

Override Clerk appearance variables with the semantic CSS variables already defined in:

```text
app/globals.css
```

Do not hardcode reusable color values inside Clerk components.

Map Clerk styling to the existing Code Bros design tokens for:

* background
* foreground
* card
* muted foreground
* primary
* primary foreground
* border
* input
* ring
* destructive
* radius

The authentication UI must visually belong to Code Bros without heavily rebuilding Clerk internals.

## Styling Rules

* Dark mode is the primary appearance.
* No default light surface may flash during loading.
* Do not use gradients.
* Do not use glassmorphism.
* Do not use decorative illustrations.
* Do not introduce a second design-token system.
* Do not modify generated files inside `components/ui/*`.
* Do not rely on fragile selectors targeting Clerk’s internal markup.
* Prefer Clerk’s documented `appearance` configuration.

---

# Authentication Route Structure

Create dedicated authentication routes using App Router catch-all segments.

Expected structure:

```text
app/
  (auth)/
    layout.tsx

    sign-in/
      [[...sign-in]]/
        page.tsx

    sign-up/
      [[...sign-up]]/
        page.tsx
```

The catch-all routes are required so Clerk can render all steps of its authentication flows.

Keep authentication pages outside the protected editor layout.

---

# Authentication Layout

Create:

```text
app/(auth)/layout.tsx
```

This layout provides the shared visual frame for sign-in and sign-up pages.

## Large Screens

Use a restrained two-panel layout.

### Left Panel

Include:

* compact Code Bros logo or wordmark
* concise product tagline
* short product description
* text-only feature list

Suggested feature themes:

* build together in real time
* review AI-proposed code changes
* keep engineering decisions visible

Keep the content concise.

Do not add:

* feature cards
* screenshots
* testimonials
* statistics
* oversized headlines
* marketing carousels
* scroll-heavy content

### Right Panel

Include:

* centered Clerk authentication form
* enough space around the form for clear focus
* no additional competing actions

The form should remain the primary visual action.

## Small Screens

Display the authentication form only.

A compact Code Bros wordmark may appear above the form, but the product-information panel must be hidden.

The page must:

* fit naturally within the viewport
* avoid horizontal overflow
* avoid unnecessary scrolling
* remain usable with the on-screen keyboard

---

# Sign-In Page

Create:

```text
app/(auth)/sign-in/[[...sign-in]]/page.tsx
```

Render Clerk’s:

```tsx
<SignIn />
```

Requirements:

* use the existing sign-in route
* link correctly to the sign-up route
* use the shared Clerk appearance configuration
* redirect authenticated users according to the configured Clerk flow
* preserve Clerk’s built-in validation and recovery flows

Do not build a custom credential form.

Do not manually process passwords, OAuth callbacks, magic links, or verification codes.

---

# Sign-Up Page

Create:

```text
app/(auth)/sign-up/[[...sign-up]]/page.tsx
```

Render Clerk’s:

```tsx
<SignUp />
```

Requirements:

* use the existing sign-up route
* link correctly to the sign-in route
* use the shared Clerk appearance configuration
* preserve Clerk’s verification and onboarding steps
* redirect successful registrations to the configured application destination

Do not build a custom registration form.

---

# Proxy Configuration

Create:

```text
proxy.ts
```

at the project root.

Use Clerk’s current Next.js proxy integration.

The proxy must cover application requests according to Clerk’s recommended matcher configuration while excluding static assets and Next.js internals where appropriate.

Use the existing public sign-in and sign-up route values.

Public browser routes should include only the authentication flows required to enter the application.

Everything else is private by default unless a later specification explicitly declares a route public.

## Public Routes

At minimum, support the configured routes corresponding to:

```text
/sign-in(.*)
/sign-up(.*)
```

Do not duplicate route strings throughout the codebase when existing environment variables or centralized route constants already provide them.

## Next.js Version

Use `proxy.ts` for the project’s current Next.js version.

Do not create both:

```text
proxy.ts
middleware.ts
```

Clerk currently documents `proxy.ts` for modern Next.js versions; Next.js 15 and earlier use `middleware.ts`. This project must follow its installed framework version rather than maintaining both files.

---

# Resource-Level Protection

Proxy coverage alone must not be treated as the only security boundary.

Protect sensitive server resources individually.

Future protected resources include:

* Server Components
* Route Handlers
* Server Actions
* project services
* collaboration token endpoints
* AI job creation
* execution requests
* snapshot access
* database mutations

Use Clerk’s server-side authentication utilities from:

```text
@clerk/nextjs/server
```

A protected resource must:

1. resolve the authenticated session on the server
2. reject unauthenticated requests
3. never accept a client-provided user ID as proof of identity

Clerk’s current guidance favors resource-level checks rather than relying only on route matchers for application security.

Do not implement project-role authorization in this feature.

---

# Root Route

Update:

```text
app/page.tsx
```

The root route must resolve authentication on the server.

Behavior:

* authenticated users redirect to `/editor`
* unauthenticated users redirect to `/sign-in`

Use a server-side redirect.

Do not:

* render a temporary landing page
* perform the redirect in `useEffect`
* display authenticated content before redirecting
* introduce client-side loading flicker

---

# Editor Route Protection

Ensure the editor route cannot render for an unauthenticated user.

At minimum, protect:

```text
/editor
/editor/*
```

Prefer a protected route-group layout when the application begins adding more authenticated pages.

Suggested future structure:

```text
app/
  (app)/
    layout.tsx
    editor/
      page.tsx
```

A protected layout should verify the Clerk session server-side before rendering its children.

Do not rely only on hiding editor UI in the browser.

---

# Editor User Menu

Update:

```text
components/editor/editor-navbar.tsx
```

Add Clerk’s built-in:

```tsx
<UserButton />
```

to the navbar’s right section.

The right section was intentionally reserved by `02-editor.md` for this integration.

## Requirements

* Render the user menu only within authenticated application UI.
* Align it with the existing navbar controls.
* Preserve Clerk’s default user menu.
* Preserve Clerk’s account-management flow.
* Preserve Clerk’s sign-out behavior.
* Provide an after-sign-out destination of `/sign-in` through the supported Clerk configuration.
* Match the existing Code Bros theme through Clerk appearance variables.
* Prevent layout shift while Clerk state initializes.

Clerk’s `UserButton` already provides profile management and sign-out functionality; do not rebuild these flows.

Do not add a separate custom logout button unless a later feature explicitly requires one.

---

# Loading and Authentication State

Authentication checks that affect protected content should occur on the server whenever possible.

Avoid client-only route guards.

When Clerk client state is required:

* do not flash unauthenticated controls
* do not show fake user information
* use a small stable placeholder where necessary
* preserve navbar dimensions during initialization

Do not place a full-page spinner between every authenticated route transition.

---

# Redirect Behavior

Use the project’s existing Clerk redirect environment variables.

Do not rename or replace them.

Ensure the existing configuration provides the appropriate values for:

```text
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
```

Equivalent existing variables supported by the installed Clerk version may be used.

Do not invent alternate variables if the project already contains valid Clerk configuration.

Clerk can preserve a user’s original destination and otherwise use configured fallback redirects.

The expected default application destination is:

```text
/editor
```

The expected post-sign-out destination is:

```text
/sign-in
```

---

# Identity Usage

For all later database records, use the authenticated Clerk user ID as the external identity reference.

Examples of future ownership fields:

```text
ownerClerkUserId
createdByClerkUserId
actorClerkUserId
```

Do not:

* use email addresses as stable primary identity keys
* trust usernames as unique identifiers
* create a separate password-based user system
* duplicate Clerk session tokens in PostgreSQL
* expose `CLERK_SECRET_KEY` to the browser

A database user-profile synchronization feature may be implemented separately when Prisma-backed project ownership is introduced.

It is not required in this feature.

---

# Environment Variables

Use the existing Clerk environment variables.

Expected Clerk configuration typically includes:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
```

The exact existing names in the repository remain authoritative.

Rules:

* Never commit real secret values.
* Never expose `CLERK_SECRET_KEY` through a `NEXT_PUBLIC_` variable.
* Never log tokens or secrets.
* Update `.env.example` only when an expected variable is currently undocumented.
* Use placeholders in `.env.example`, not live credentials.

---

# Error Handling

Authentication failures must fail safely.

Requirements:

* unauthenticated protected-page access redirects to sign-in
* unauthenticated API access returns an appropriate unauthorized response
* missing server credentials produce a clear development error
* protected content must not render before authentication is confirmed
* redirect loops must not occur between `/`, `/editor`, and `/sign-in`
* auth pages must remain accessible while signed out

Do not silently allow access when Clerk initialization fails.

---

# File Structure

Expected structure:

```text
app/
  (auth)/
    layout.tsx

    sign-in/
      [[...sign-in]]/
        page.tsx

    sign-up/
      [[...sign-up]]/
        page.tsx

  layout.tsx
  page.tsx

components/
  auth/
    auth-layout-content.tsx

  editor/
    editor-navbar.tsx

lib/
  auth/
    appearance.ts
    routes.ts

proxy.ts
```

The exact helper filenames may vary if equivalent shared files already exist.

Avoid duplicating:

* Clerk appearance configuration
* authentication route constants
* redirect destinations
* session-checking helpers

---

# Out of Scope

Do not implement:

* custom credential authentication
* custom OAuth handling
* organization management
* project roles
* project invitations
* project membership
* database user synchronization
* onboarding questions
* billing
* subscription enforcement
* admin dashboards
* custom profile pages
* custom session management
* workspace presence
* collaboration authorization
* AI permission modes

These belong to later features.

---

# Security Constraints

* Never trust identity values sent from the client.
* Never expose Clerk secret keys.
* Never use UI visibility as authorization.
* Never make protected database queries without server-resolved identity.
* Never authorize project access using authentication status alone.
* Never duplicate Clerk’s password or session infrastructure.
* Never disable Clerk security and account-management flows for visual consistency.
* Never log authentication tokens.

---

# Check When Done

* `ClerkProvider` wraps the root application layout.
* Clerk’s supported dark theme is configured.
* Clerk appearance uses existing semantic CSS variables.
* No authentication colors are hardcoded.
* Sign-in catch-all route exists and renders correctly.
* Sign-up catch-all route exists and renders correctly.
* Large-screen auth pages use a restrained two-panel layout.
* Small-screen auth pages display the form-focused layout.
* No gradients, feature cards, or oversized hero content appear.
* `proxy.ts` exists at the project root.
* No duplicate `middleware.ts` exists for the same responsibility.
* Public authentication routes remain accessible.
* Protected application routes reject unauthenticated access.
* Root `/` redirects authenticated users to `/editor`.
* Root `/` redirects unauthenticated users to `/sign-in`.
* Redirects occur server-side without visible content flicker.
* `UserButton` appears in the editor navbar’s right section.
* Clerk’s default profile and sign-out flows remain intact.
* Secret keys are not exposed to client code.
* Existing Clerk environment variable names are preserved.
* No generated `components/ui/*` files are modified.
* `npm run lint` passes.
* `npm run build` passes.

---

# Unlocks

* Database user profiles
* Project ownership
* Project dashboard
* Project creation
* Project membership
* Collaboration invitations
* Role-based project permissions
* Protected Liveblocks authorization
* Authenticated AI activity
* Authenticated execution history
* User-specific snapshots
