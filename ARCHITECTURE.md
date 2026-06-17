# 🏗️ Monorepo Architecture Blueprint (Master)

## 📌 High-Level Overview (PRD Summary)

This repository contains the Menno ecosystem, which consists of backend API services, client-facing mobile-first e-commerce applications, and various back-office management dashboards and portals. The platform serves as an online e-commerce solution enabling product catalog navigation, checkout/payment routing, real-time analytics, and customer support.

## 📦 Package Management & Monorepo Governance

- **Primary Package Manager:** pnpm (Enforced, version `9.0.0`)
- **Monorepo Structure:** Managed via [Nx](https://nx.dev) with an integrated single-package-json repo structure. Rather than using individual `pnpm-workspace.yaml` workspaces, all project configurations are defined inside their respective `project.json` files and all dependencies are centralized in the root `package.json`. Shared paths are mapped in [tsconfig.base.json](./tsconfig.base.json).
- _Note for Agents: Never use npm or yarn. Always use pnpm filtering._

## 📂 Core Workspace Breakdown

### Applications (`/apps`)

- **backend**: The core backend API service built with NestJS (TypeScript, Node) running on Express. It connects to a PostgreSQL database using TypeORM, features SMS notifications via Kavenegar, caching via ioredis, JWT authentication, and monitoring metrics. Dockerized context resides in [docker/backend/Dockerfile](./docker/backend/Dockerfile) and [apps/backend/src/Dockerfile](./apps/backend/src/Dockerfile).
- **customer**: The client-facing mobile-first e-commerce application. Developed using Angular 21, standalone components, functional `inject()`, Signals state management, and `@tanstack/angular-query-experimental`. Dockerized context is in [docker/customer/Dockerfile](./docker/customer/Dockerfile).
- **new-app**: The modernized client e-commerce frontend app, sharing core logics with `customer` but incorporating extensive e-commerce event tracking for analytics. Dockerized context is in [docker/new-app/Dockerfile](./docker/new-app/Dockerfile).
- **new-panel**: The seller and manager control panel interface. Developed using Angular 21, Angular Material 3, density `-2`, and RTL-first logic. Contains specific CSS styling guidelines for AI/ML features using a subtle violet visual accent. Dockerized context is in [docker/new-panel/Dockerfile](./docker/new-panel/Dockerfile).
- **app**: The legacy mobile client application (Angular).
- **panel**: The legacy seller/manager panel application (Angular). Dockerized context in [docker/panel/Dockerfile](./docker/panel/Dockerfile).
- **admin**: The legacy back-office system administrator panel (Angular).
- **new-admin**: The modernized back-office administrator dashboard (Angular).

### Shared Packages (`/libs`)

- **@menno/types** (located in [libs/types](./libs/types)): Shared TypeScript types, interfaces, and DTOs used to enforce API contracts between the backend and frontend.
- **@menno/utils** (located in [libs/utils](./libs/utils)): Common utility functions, helpers, and shared modules used across frontend applications.

## 🎨 Design System & Frontend Architecture

- **Location:** Colors are configured centrally in [\_theme-colors.scss](./_theme-colors.scss) at the root level, and customized per-application (e.g., [apps/new-panel/src/theme.scss](./apps/new-panel/src/theme.scss) and [apps/new-panel/src/styles.scss](./apps/new-panel/src/styles.scss)).
- **Tokens/Theme:** Styling is governed by **Angular Material 3** (M3), custom logical properties for RTL layouts (`margin-inline-start`, `padding-inline`, etc.), and global typography hierarchies (using `IRANSans` font, customized slightly smaller than defaults for a compact and dense UI layout). A dedicated set of CSS variables (`--np-ai-*`) is used for violet accents on AI-related components.
- **Rule:** Global UI components, types, and configurations must be consumed from the common shared libraries; layouts must align with Material 3 tokens. Do not duplicate across apps.

## 🐳 DevOps & Deployment (Docker)

- **Strategy:** Applications are built and compiled using Nx CLI commands (e.g. `nx run-many --target=build`). Containerization is implemented using multi-stage Docker builds: a dependency resolution phase utilizing pnpm, a build phase running Nx compilers on `node:22-alpine` or `node:20-alpine`, and a run phase utilizing `nginx:1.27-alpine` (for serving static assets and handling client-side SPA routing fallbacks via [docker/spa-default.conf](./docker/spa-default.conf)) or lightweight node runner layers.
- **Deployments:** The ecosystem is deployed to **Liara PaaS** (Platform as a Service) using the Liara CLI (e.g., `liara deploy`). Deploy profiles (`liara.json`) specify `platform: "static"` for frontends and `platform: "docker"` for the backend.
- **Config Files Found:**
  - Root: [Dockerfile](./Dockerfile) (Legacy setup)
  - Backend dockerization: [docker/backend/Dockerfile](./docker/backend/Dockerfile) and [apps/backend/src/Dockerfile](./apps/backend/src/Dockerfile)
  - Frontends dockerization:
    - [docker/new-app/Dockerfile](./docker/new-app/Dockerfile)
    - [docker/new-panel/Dockerfile](./docker/new-panel/Dockerfile)
    - [docker/customer/Dockerfile](./docker/customer/Dockerfile)
    - [docker/panel/Dockerfile](./docker/panel/Dockerfile)
  - Deployment profiles: [apps/backend/src/liara.json](./apps/backend/src/liara.json), [apps/new-panel/src/liara.json](./apps/new-panel/src/liara.json), [apps/customer/src/liara.json](./apps/customer/src/liara.json)

## 🔗 Existing Documentation References

- See [README.md](./README.md) for Nx development guide.
- See [libs/types/README.md](./libs/types/README.md) for shared types details.
- See [libs/utils/README.md](./libs/utils/README.md) for shared utils details.
- See [.agent/apps/customer/architecture.md](./.agent/apps/customer/architecture.md) for customer application navigation & routing structure.
- See [.agent/apps/customer/event-tracking.md](./.agent/apps/customer/event-tracking.md) for customer app e-commerce tracking rules and schema.
- See [.agent/apps/new-panel/design-rules.md](./.agent/apps/new-panel/design-rules.md) for design architecture, theme tokens, density, and AI elements styling constraints in `new-panel`.
- See [.agent/rules/angular-rules.md](./.agent/rules/angular-rules.md) for Angular standalone component structure, Signals state management, and modern native control flow rules.
- See [.agent/rules/material-rules.md](./.agent/rules/material-rules.md) for Angular Material 3 directives syntax, token overrides, and styling rules.
- See [.agent/rules/tanstack-query-rules.md](./.agent/rules/tanstack-query-rules.md) for server-side state synchronization, query key caching, and mutation principles.
