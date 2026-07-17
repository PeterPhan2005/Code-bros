# 01-design-system.md

> Read `AGENTS.md` before starting.

# Feature 01 — Design System

## Objective

Establish the visual foundation for Code Bros by configuring the shared design system, UI primitives, icons, fonts, and utility helpers.

This feature creates the UI foundation that every subsequent feature depends on. It ensures visual consistency, accessibility, and maintainability across the application.

---

# Goals

Implement the project's design system using modern React UI libraries while preserving a clean separation between generated UI primitives and application-specific components.

The design system must:

- provide reusable UI primitives
- support the Code Bros dark theme
- use semantic design tokens
- be fully compatible with Tailwind CSS v4
- remain easy to extend without modifying generated library code

---

# Design Principles

The design system should follow these principles:

- Consistency over customization
- Composition over duplication
- Accessibility by default
- Desktop-first experience
- Dark mode as the primary interface
- Semantic styling instead of hardcoded values

---

# Technology

Install and configure:

- shadcn/ui
- Tailwind CSS v4
- Radix UI (installed through shadcn)
- lucide-react
- class-variance-authority
- clsx
- tailwind-merge

---

# shadcn/ui

Initialize shadcn/ui.

Use the latest recommended configuration.

Configure:

- TypeScript
- Tailwind CSS v4
- App Router
- CSS Variables
- `components/ui`
- `lib/utils.ts`

---

# Required Components

Install the following shadcn components:

- Button
- Card
- Dialog
- Dropdown Menu
- Input
- Label
- Scroll Area
- Separator
- Sheet
- Skeleton
- Tabs
- Textarea
- Tooltip
- Avatar
- Badge

Additional components may be installed later when required.

---

# Icons

Install:

```
lucide-react
```

Use Lucide as the only icon library across the project.

Do not mix multiple icon libraries.

---

# Fonts

Configure:

UI Font

- Geist Sans

Code Font

- Geist Mono

Use Next.js font optimization.

---

# Utility Functions

Create:

```
lib/utils.ts
```

Provide a reusable

```
cn()
```

helper that combines:

- clsx
- tailwind-merge

This helper should be used throughout the project for conditional Tailwind class composition.

---

# Styling Rules

The design system must follow these rules.

## Colors

Use semantic design tokens.

Do not hardcode Tailwind color utilities for reusable components.

Examples:

- background
- foreground
- primary
- secondary
- accent
- muted
- destructive
- border
- ring

Application-specific colors should be defined through CSS variables in `globals.css`.

---

## Dark Theme

Code Bros is dark-first.

The design system must fully support the project's dark theme.

Generated components should automatically inherit the existing theme tokens.

No light-theme overrides should be introduced.

---

## Border Radius

Use the radius scale defined by the global design tokens.

Do not override radius values inside generated components.

---

## Spacing

Use Tailwind spacing utilities consistently.

Avoid arbitrary spacing values unless absolutely necessary.

---

## Icons

Icons should use the current text color by default.

Avoid custom icon colors unless representing semantic states such as:

- success
- warning
- destructive
- AI status

---

# Component Rules

Generated shadcn components are considered external library code.

Do not edit files inside:

```
components/ui/*
```

If customization is required:

- wrap the component
- compose it
- extend it outside `components/ui`

Never fork generated components unless absolutely necessary.

---

# Accessibility

The design system must preserve Radix accessibility behavior.

Do not remove:

- keyboard navigation
- focus rings
- aria attributes
- screen reader support

---

# Folder Structure

Expected structure:

```
components/
    ui/

lib/
    utils.ts

app/
    globals.css
```

---

# Future Features

Future features must reuse these primitives.

Do not create duplicate implementations of:

- Button
- Dialog
- Input
- Card
- Tabs
- Textarea

---

# Dependencies

None.

This is the foundational UI feature.

---

# Unlocks

- 02-project-shell
- 03-authentication
- 04-dialog-system
- 05-navigation
- 06-dashboard
- All subsequent UI features

---

# Acceptance Criteria

- shadcn/ui is installed and configured successfully
- Tailwind CSS v4 integration works correctly
- Required shadcn components install without errors
- `lucide-react` is installed
- `lib/utils.ts` exposes a reusable `cn()` helper
- Generated components are not modified
- All components compile successfully
- Components inherit the existing dark theme
- No default light styling appears
- Fonts load correctly
- No TypeScript errors
- No ESLint errors