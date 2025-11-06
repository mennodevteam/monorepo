# Customer App Architecture

## Overview
This is a mobile-first e-commerce application built with Angular standalone components. The app features a bottom navigation for main pages.

## Directory Structure

```
src/app/
├── core/                          # Core services and utilities
│   └── services/
│       └── loading.service.ts     # Loading state management
├── shared/                        # Shared/reusable components
│   └── components/
│       ├── bottom-navigation/     # Bottom navigation bar
│       └── loading/               # Loading indicator component
├── shell/                         # App shell with bottom navigation
│   └── shell.component.*
├── pages/                         # Feature pages
│   ├── home/                      # Home page (with bottom nav)
│   ├── cart/                      # Shopping cart (with bottom nav)
│   ├── orders/                    # Order history (with bottom nav)
│   ├── profile/                   # User profile (with bottom nav)
│   ├── auth/                      # Authentication pages (no bottom nav) - FUTURE
│   │   ├── login/
│   │   └── register/
│   ├── pdp/                       # Product detail page (no bottom nav) - FUTURE
│   ├── search/                    # Search page (no bottom nav) - FUTURE
│   ├── checkout/                  # Checkout flow (no bottom nav) - FUTURE
│   └── ...                        # Other feature pages
├── app.component.*                # Root component
├── app.config.ts                  # App configuration
└── app.routes.ts                  # Route definitions
```

## Key Concepts

### 1. Shell Component Pattern
The shell component wraps pages that need the bottom navigation. This allows for:
- Consistent layout across main pages
- Easy addition/removal of bottom navigation
- Clear separation between "main app" and "auxiliary" pages

**Pages WITH bottom navigation** (inside shell):
- Home
- Cart
- Orders
- Profile

**Pages WITHOUT bottom navigation** (outside shell):
- Auth pages (login, register)
- Product Detail Page (PDP)
- Search results
- Checkout flow
- Any other full-screen pages

### 2. Routing Strategy

```typescript
// Main app routes with shell (includes bottom nav)
{
  path: '',
  loadComponent: () => ShellComponent,
  children: [
    { path: 'home', loadComponent: () => HomeComponent },
    { path: 'cart', loadComponent: () => CartComponent },
    { path: 'orders', loadComponent: () => OrdersComponent },
    { path: 'profile', loadComponent: () => ProfileComponent },
  ]
}

// Routes without shell (no bottom nav)
{
  path: 'auth',
  children: [
    { path: 'login', loadComponent: () => LoginComponent },
    { path: 'register', loadComponent: () => RegisterComponent }
  ]
},
{
  path: 'product/:id',
  loadComponent: () => PdpComponent
}
```

### 3. Lazy Loading

All pages use lazy loading via `loadComponent` for optimal bundle size and performance:
- Pages are only loaded when navigated to
- Each page is a standalone component with its own dependencies
- Reduces initial bundle size significantly

## Future Extensions

### Adding a New Page WITH Bottom Navigation

1. Create the page component in `pages/your-page/`
2. Add route under shell children in `app.routes.ts`:
```typescript
{
  path: 'your-page',
  loadComponent: () => import('./pages/your-page/your-page.component').then(m => m.YourPageComponent)
}
```
4. Optionally add to bottom navigation items in `bottom-navigation.component.ts`

### Adding a New Page WITHOUT Bottom Navigation

1. Create the page component in `pages/your-page/`
2. Add route at root level (outside shell) in `app.routes.ts`:
```typescript
{
  path: 'your-page',
  loadComponent: () => import('./pages/your-page/your-page.component').then(m => m.YourPageComponent)
}
```

### Example: Adding Product Detail Page (PDP)

```bash
# Create component structure
pages/
└── pdp/
    ├── pdp.component.ts
    ├── pdp.component.html
    └── pdp.component.scss
```

```typescript
// In app.routes.ts (outside shell, no bottom nav)
{
  path: 'product/:id',
  loadComponent: () => import('./pages/pdp/pdp.component').then(m => m.PdpComponent)
}
```

### Example: Adding Auth Pages

```bash
# Create auth pages
pages/
└── auth/
    ├── login/
    │   ├── login.component.ts
    │   ├── login.component.html
    │   └── login.component.scss
    └── register/
        ├── register.component.ts
        ├── register.component.html
        └── register.component.scss
```

```typescript
// In app.routes.ts (outside shell, no bottom nav)
{
  path: 'auth',
  children: [
    {
      path: 'login',
      loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
      path: 'register',
      loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent)
    }
  ]
}
```

## Mobile-First Considerations

1. **Touch-friendly navigation**: Bottom navigation is optimized for thumb reach
2. **Performance**: Lazy loading ensures fast initial load
3. **Bundle size**: Each page is a separate chunk loaded on demand

## Technical Stack

- Angular (Standalone Components)
- TypeScript
- Angular Router with lazy loading
- RxJS (via Angular)
- SCSS for styling

