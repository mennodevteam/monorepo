# Angular Material 21 and Material Design 3 Rules

This document outlines workspace-wide standards for Angular Material 21 (Material Design 3 / M3) usage.

## Component Imports

Always import components and directives directly from the component packages. Do not import legacy `NgModule` modules:

```typescript
// Good:
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent } from '@angular/material/card';

// Bad:
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
```

## Button Directives Syntax

Use the M3 directive selectors (`matButton`, `matIconButton`, `matFab`) rather than the legacy selector formats:

```html
<!-- Good: -->
<button matButton>Basic</button>
<button matButton="elevated">Elevated</button>
<button matButton="outlined">Outlined</button>
<button matButton="filled">Filled</button>
<button matButton="tonal">Tonal</button>
<button matIconButton aria-label="More options"><mat-icon>more_vert</mat-icon></button>

<!-- Bad (Legacy, Avoid): -->
<button mat-button>Basic</button>
<button mat-raised-button>Elevated</button>
<button mat-stroked-button>Outlined</button>
<button mat-flat-button>Filled</button>
<button mat-icon-button><mat-icon>more_vert</mat-icon></button>
```

## Theming with SCSS

Always use the `mat.theme` mixin to configure themes. Avoid using legacy `mat.define-theme` functions or `mat.core` mixins.

### Example Theme Configuration:
```scss
@use '@angular/material' as mat;

html {
  color-scheme: light dark;
  @include mat.theme((
    color: mat.$violet-palette,
    typography: Roboto,
    density: -2
  ));
}

body.dark-mode {
  color-scheme: dark;
}
```

### Targeted Token Overrides:
Use component-specific override mixins to customize elements, or `mat.theme-overrides` for global variables:

```scss
html {
  // Override elevated card styles
  @include mat.card-overrides((
    elevated-container-color: var(--mat-sys-surface-container-low),
    elevated-container-shape: 16px,
  ));
}
```

## Color and Typography Tokens

Do not hardcode font sizes, colors, margins, or padding when M3 variables are available. Use the generated CSS variables:

### 1. Key Color Tokens:
- Primary: `--mat-sys-primary`, `--mat-sys-on-primary`, `--mat-sys-primary-container`
- Secondary: `--mat-sys-secondary`, `--mat-sys-on-secondary`, `--mat-sys-secondary-container`
- Surface: `--mat-sys-surface`, `--mat-sys-on-surface`, `--mat-sys-surface-container`
- Outline: `--mat-sys-outline`, `--mat-sys-outline-variant`
- Error: `--mat-sys-error`, `--mat-sys-on-error`, `--mat-sys-error-container`

### 2. Key Typography Tokens:
- Headlines: `--mat-sys-headline-large`, `--mat-sys-headline-medium`, `--mat-sys-headline-small`
- Titles: `--mat-sys-title-large`, `--mat-sys-title-medium`, `--mat-sys-title-small`
- Body Text: `--mat-sys-body-large`, `--mat-sys-body-medium`, `--mat-sys-body-small`
- Labels: `--mat-sys-label-large`, `--mat-sys-label-medium`, `--mat-sys-label-small`

### 3. Utility Classes:
You can also use built-in CSS typography classes directly in templates:
```html
<h1 class="mat-headline-medium">Medium Headline</h1>
<p class="mat-body-medium">Medium body paragraph text.</p>
```

## Minimal Styling Philosophy

Stick as close as possible to the native behavior and layout of Angular Material components. Do not write custom wrapper styles or overrides that fight against the Material specification.

- **Use the Native Components Directly**: Before custom styling a custom layout card, check if `<mat-card>` or `<mat-list-item>` meets the layout requirements.
- **RTL-First logical properties**: Because this monorepo is RTL-first, use logical properties (`margin-inline-start`, `padding-inline`, etc.) instead of hardcoded left/right directions.
- **No internal target classes**: Never style by targeting internal Material class names (e.g. `.mat-mdc-card-header`). Use token overrides or global theme styles.
