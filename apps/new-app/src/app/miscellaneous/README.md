# Miscellaneous Components

This folder contains various utility components and pages that don't fit into the main application categories.

## Components

### Privacy Policy Component (`privacy/privacy-policy.component.*`)

A comprehensive privacy policy page component that displays the application's privacy policy in Persian.

**Features:**
- Responsive design with RTL (Right-to-Left) support
- Modern, clean UI with Material Design principles
- Comprehensive privacy policy content
- Contact information section
- Last updated timestamp

**Usage:**
```typescript
import { PrivacyPolicyComponent } from './miscellaneous';

// Route: /misc/privacy-policy
```

**Files:**
- `privacy/privacy-policy.component.ts` - Component logic
- `privacy/privacy-policy.component.html` - HTML template
- `privacy/privacy-policy.component.scss` - Styling
- `privacy/privacy-policy.component.spec.ts` - Unit tests

## Routing

The miscellaneous routes are configured in `miscellaneous.routes.ts` and integrated into the main application routing at `/misc/*`.

## Styling

Components in this folder use:
- SCSS for styling
- Responsive design principles
- RTL support for Persian language
- Material Design color palette
- Consistent spacing and typography

## Folder Structure

```
miscellaneous/
├── privacy/                           # Privacy-related components
│   ├── privacy-policy.component.*     # Privacy policy component
│   └── index.ts                       # Privacy exports
├── miscellaneous.routes.ts            # Routing configuration
├── index.ts                           # Main exports
└── README.md                          # Documentation
```

## Adding New Components

To add a new miscellaneous component:

1. Create a dedicated folder for related components (e.g., `terms/`, `help/`)
2. Create the component files following the naming convention
3. Add the component to the folder's `index.ts`
4. Add the folder export to the main `miscellaneous/index.ts`
5. Add routes to `miscellaneous.routes.ts` if needed
6. Update this README with component documentation
