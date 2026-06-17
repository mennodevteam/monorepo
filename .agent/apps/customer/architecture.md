# Customer App Architecture

## Overview
The customer application is a mobile-first e-commerce application built with Angular. It leverages standalone components, Signals for state management, and the `inject()` pattern.

The application layout uses an app shell that controls the rendering of the bottom navigation bar. Some pages render within the shell, while others render outside it as full-screen views, or within the shell but with the bottom navigation hidden.

## Directory Structure

```
src/app/
├── auth/                          # Authentication flow (login, OTP)
│   ├── login/                     # Phone number entry component
│   └── otp/                       # OTP verification component
├── core/                          # Core services, guards, and providers
│   ├── guards/                    # Route activators (e.g., login.guard.ts)
│   ├── providers/                 # Core app providers (e.g., api.provider.ts)
│   └── services/                  # Core services (auth, cart, loading, etc.)
├── pages/                         # Main feature page components
│   ├── addresses/                 # Customer address management
│   ├── cart/                      # Cart pages (and missed-products upsell)
│   ├── categories/                # Category listing
│   ├── category/                  # Products under a specific category
│   ├── chat/                      # Support chat / order chat
│   ├── checkout/                  # Checkout / payment flow
│   ├── home/                      # Application home page
│   ├── main-menu/                 # Main settings/navigation menu
│   ├── not-found/                 # 404 page
│   ├── orders/                    # Order history and order details
│   ├── privacy/                   # Privacy policy page
│   ├── product/                   # Product detail page (PDP)
│   └── search/                    # Search page
├── shared/                        # Shared components, directives, and pipes
├── shell/                         # Shell component managing bottom nav layout
│   ├── shell.component.html
│   ├── shell.component.scss
│   └── shell.component.ts
├── app.component.ts               # Root component
├── app.config.ts                  # Application configuration
└── app.routes.ts                  # Route definitions
```

## Routing and Bottom Navigation Layout

The application separates pages based on whether they display the bottom navigation or run full-screen.

### 1. Pages WITH Bottom Navigation (Within Shell)
These pages are children of the root path `''` which loads `ShellComponent`:
- **Home Page** (`/` or `/home` redirected)
- **Categories Listing** (`/categories`)
- **Category Details** (`/categories/:categoryId`)
- **Order History** (`/orders`)
- **Order Details** (`/orders/:id` or `/orders/details/:id`)
- **Main Menu** (`/main-menu`)
- **Search Page** (`/search`)

### 2. Pages WITHIN Shell (But Hiding Bottom Navigation)
These pages are rendered inside the shell component for lifecycle or state sharing reasons, but pass `hideBottomNav: true` in their route data to hide the navigation bar:
- **Product Detail Page (PDP)** (`/menu/product/:id` or `/categories/:categoryId/:id`)

### 3. Pages WITHOUT Bottom Navigation (Outside Shell)
These pages are configured as top-level routes outside the `ShellComponent` block, taking up the full screen:
- **Login Flow** (`/login` containing `/login/otp` and `/login`)
- **Cart Page** (`/cart` and `/cart/missed-products`)
- **Checkout / Payment** (`/payment`)
- **Order Thanks Page** (`/orders/thanks/:id` and `/complete/:id`)
- **Chat Page** (`/chat/order/:id`)
- **Addresses Management** (`/addresses`)
- **Privacy Policy** (`/privacy-policy`)
- **Theme Demo** (`/theme-demo`)

## Key Architecture Patterns

### 1. Lazy Loading
All feature routes and pages use standalone component lazy loading (`loadComponent` or child routes) to optimize bundle size.

### 2. Dependency Injection
All services and components use the functional `inject()` API instead of class constructor parameter injection:
```typescript
private authService = inject(AuthService);
```

### 3. State Management
State is managed reactively using Angular Signals (`signal`, `computed`, and `linkedSignal`), coupled with `@tanstack/angular-query-experimental` (v5) for caching and synchronizing server state.
