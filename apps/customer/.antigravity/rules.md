# Customer App Development Rules

## Angular 21 Features

### Use Latest Angular 21 Syntax and Features

- **Always use standalone components** - No NgModules
- **Use the new `inject()` function** for dependency injection instead of constructor injection
- **Use signals** (`signal()`, `computed()`, `effect()`) for reactive state management
- **Use the new control flow syntax** in templates:
  - `@if` instead of `*ngIf`
  - `@for` instead of `*ngFor`
  - `@switch` instead of `*ngSwitch`
  - `@defer` for lazy loading components
- **Use `input()` and `output()`** for component inputs and outputs instead of `@Input()` and `@Output()`
- **Use `viewChild()` and `viewChildren()`** instead of `@ViewChild()` and `@ViewChildren()`
- **Use `model()` for two-way binding** instead of `[(ngModel)]`
- **Use resource API** for data fetching when applicable
- **Use `linkedSignal()` and `toSignal()`** for reactive patterns
- **Prefer functional guards and resolvers** over class-based ones
- **Use `provideRouter` with `withComponentInputBinding()`** to bind route params directly to component inputs

### TypeScript Best Practices

- Use strict TypeScript settings
- Prefer `readonly` for immutable properties
- Use proper typing, avoid `any`
- Use type inference where appropriate

## Angular Material 21 Theming

### Color System

**ONLY use Material Design 3 (M3) theming tokens** - Do not hardcode colors!

#### Available Color Tokens (use via CSS variables):

- **Primary colors:**
  - `--mat-sys-primary`
  - `--mat-sys-on-primary`
  - `--mat-sys-primary-container`
  - `--mat-sys-on-primary-container`

- **Secondary colors:**
  - `--mat-sys-secondary`
  - `--mat-sys-on-secondary`
  - `--mat-sys-secondary-container`
  - `--mat-sys-on-secondary-container`

- **Tertiary colors:**
  - `--mat-sys-tertiary`
  - `--mat-sys-on-tertiary`
  - `--mat-sys-tertiary-container`
  - `--mat-sys-on-tertiary-container`

- **Error colors:**
  - `--mat-sys-error`
  - `--mat-sys-on-error`
  - `--mat-sys-error-container`
  - `--mat-sys-on-error-container`

- **Surface colors:**
  - `--mat-sys-surface`
  - `--mat-sys-on-surface`
  - `--mat-sys-surface-variant`
  - `--mat-sys-on-surface-variant`
  - `--mat-sys-surface-container`
  - `--mat-sys-surface-container-low`
  - `--mat-sys-surface-container-high`
  - `--mat-sys-surface-container-highest`
  - `--mat-sys-surface-container-lowest`
  - `--mat-sys-surface-dim`
  - `--mat-sys-surface-bright`

- **Background colors:**
  - `--mat-sys-background`
  - `--mat-sys-on-background`

- **Outline colors:**
  - `--mat-sys-outline`
  - `--mat-sys-outline-variant`

- **Other semantic colors:**
  - `--mat-sys-inverse-surface`
  - `--mat-sys-inverse-on-surface`
  - `--mat-sys-inverse-primary`
  - `--mat-sys-scrim`
  - `--mat-sys-shadow`

#### Usage Example:

```css
.my-component {
  background-color: var(--mat-sys-surface-container);
  color: var(--mat-sys-on-surface);
  border: 1px solid var(--mat-sys-outline-variant);
}

.primary-button {
  background-color: var(--mat-sys-primary);
  color: var(--mat-sys-on-primary);
}
```

### Typography System

**ONLY use Material Design 3 typography tokens** - Do not define custom font sizes!

#### Available Typography Tokens:

- **Display styles:**
  - `--mat-sys-display-large` (57px)
  - `--mat-sys-display-medium` (45px)
  - `--mat-sys-display-small` (36px)

- **Headline styles:**
  - `--mat-sys-headline-large` (32px)
  - `--mat-sys-headline-medium` (28px)
  - `--mat-sys-headline-small` (24px)

- **Title styles:**
  - `--mat-sys-title-large` (22px)
  - `--mat-sys-title-medium` (16px)
  - `--mat-sys-title-small` (14px)

- **Body styles:**
  - `--mat-sys-body-large` (16px)
  - `--mat-sys-body-medium` (14px)
  - `--mat-sys-body-small` (12px)

- **Label styles:**
  - `--mat-sys-label-large` (14px)
  - `--mat-sys-label-medium` (12px)
  - `--mat-sys-label-small` (11px)

#### Typography Usage:

Use the `font` shorthand property or individual properties:

```css
.page-title {
  font: var(--mat-sys-headline-large);
  color: var(--mat-sys-on-surface);
}

.card-title {
  font: var(--mat-sys-title-medium);
  color: var(--mat-sys-on-surface-variant);
}

.body-text {
  font: var(--mat-sys-body-medium);
  color: var(--mat-sys-on-surface);
}

.button-text {
  font: var(--mat-sys-label-large);
  font-weight: 500;
}
```

### Elevation and Shadows

Use Material elevation tokens:

- `--mat-sys-level0` through `--mat-sys-level5` for elevation

### Spacing

Use consistent spacing based on 4px or 8px grid system

## Material Design 3 Utility Classes

**PREFER utility classes over custom CSS** when you only need simple styling!

The app includes comprehensive utility classes for quick styling without writing custom CSS. Use these classes in your templates whenever possible.

### Typography Utility Classes

Apply typography styles directly in HTML:

```html
<h1 class="mat-headline-large">Large Headline</h1>
<h2 class="mat-headline-medium">Medium Headline</h2>
<h3 class="mat-headline-small">Small Headline</h3>

<p class="mat-body-large">Large body text</p>
<p class="mat-body-medium">Medium body text (default)</p>
<p class="mat-body-small">Small body text</p>

<span class="mat-label-large">Large label</span>
<span class="mat-label-medium">Medium label</span>
<span class="mat-label-small">Small label</span>
```

**Available classes:**

- Display: `.mat-display-large`, `.mat-display-medium`, `.mat-display-small`
- Headline: `.mat-headline-large`, `.mat-headline-medium`, `.mat-headline-small`
- Title: `.mat-title-large`, `.mat-title-medium`, `.mat-title-small`
- Body: `.mat-body-large`, `.mat-body-medium`, `.mat-body-small`
- Label: `.mat-label-large`, `.mat-label-medium`, `.mat-label-small`

### Color Utility Classes

#### Text Colors

```html
<p class="mat-color-primary">Primary color text</p>
<p class="mat-color-on-surface-variant">Muted text</p>
<p class="mat-color-error">Error text</p>
```

**Available classes:**

- `.mat-color-primary`, `.mat-color-on-primary`
- `.mat-color-secondary`, `.mat-color-on-secondary`
- `.mat-color-tertiary`, `.mat-color-on-tertiary`
- `.mat-color-error`, `.mat-color-on-error`
- `.mat-color-surface`, `.mat-color-on-surface-variant`
- `.mat-color-outline`, `.mat-color-outline-variant`

#### Background Colors

```html
<div class="mat-bg-surface-container">Container background</div>
<div class="mat-bg-primary mat-color-on-primary">Primary background</div>
```

**Available classes:**

- `.mat-bg-primary`, `.mat-bg-primary-container`
- `.mat-bg-secondary`, `.mat-bg-secondary-container`
- `.mat-bg-tertiary`, `.mat-bg-tertiary-container`
- `.mat-bg-error`, `.mat-bg-error-container`
- `.mat-bg-surface`, `.mat-bg-surface-variant`
- `.mat-bg-surface-container`, `.mat-bg-surface-container-low/high/highest/lowest`
- `.mat-bg-surface-dim`, `.mat-bg-surface-bright`
- `.mat-bg-background`

### Border Utility Classes

```html
<div class="mat-border">Default border</div>
<div class="mat-border-outline">Outline border</div>
<div class="mat-border-top">Top border only</div>
```

**Available classes:**

- `.mat-border`, `.mat-border-outline`, `.mat-border-outline-variant`
- `.mat-border-top`, `.mat-border-bottom`, `.mat-border-left`, `.mat-border-right`

### Elevation Utility Classes

```html
<div class="mat-elevation-1">Subtle shadow</div>
<div class="mat-elevation-3">Medium shadow</div>
```

**Available classes:** `.mat-elevation-0` through `.mat-elevation-5`

### Spacing Utility Classes

Based on 4px/8px grid system:

```html
<!-- Padding -->
<div class="mat-p-16">Padding 16px all sides</div>
<div class="mat-px-24">Padding 24px horizontal</div>
<div class="mat-py-12">Padding 12px vertical</div>

<!-- Margin -->
<div class="mat-m-16">Margin 16px all sides</div>
<div class="mat-mx-auto">Centered horizontally</div>
<div class="mat-my-24">Margin 24px vertical</div>
<div class="mat-mt-16">Margin top 16px</div>
<div class="mat-mb-8">Margin bottom 8px</div>

<!-- Gap (for flex/grid) -->
<div class="mat-flex mat-gap-16">Flex with 16px gap</div>
```

**Available spacing values:** `0`, `4`, `8`, `12`, `16`, `20`, `24`, `32`, `40`, `48`

### Layout Utility Classes

```html
<!-- Flexbox -->
<div class="mat-flex mat-gap-16">Flex container</div>
<div class="mat-flex-column mat-gap-8">Flex column</div>
<div class="mat-flex-center">Centered content</div>
<div class="mat-flex-between">Space between</div>

<!-- Alignment -->
<div class="mat-flex mat-items-center">Vertically centered</div>
<div class="mat-flex mat-justify-end">Right aligned</div>

<!-- Display -->
<div class="mat-block">Block element</div>
<span class="mat-inline-block">Inline block</span>
<div class="mat-hidden">Hidden element</div>
```

**Available classes:**

- Flex: `.mat-flex`, `.mat-flex-column`, `.mat-flex-row`, `.mat-flex-center`, `.mat-flex-between`, `.mat-flex-around`, `.mat-flex-wrap`, `.mat-flex-1`
- Alignment: `.mat-items-center/start/end`, `.mat-justify-center/start/end/between`
- Display: `.mat-block`, `.mat-inline-block`, `.mat-inline`, `.mat-hidden`

### Text Alignment Utility Classes

```html
<p class="mat-text-center">Centered text</p>
<p class="mat-text-right">Right aligned text</p>
<p class="mat-text-justify">Justified text</p>
```

**Available classes:** `.mat-text-left`, `.mat-text-center`, `.mat-text-right`, `.mat-text-justify`

### Size Utility Classes

```html
<div class="mat-w-full">Full width</div>
<div class="mat-h-full">Full height</div>
```

**Available classes:** `.mat-w-full`, `.mat-h-full`, `.mat-w-auto`, `.mat-h-auto`

### When to Use Utility Classes vs Custom CSS

✅ **Use utility classes when:**

- You only need simple styling (margins, padding, colors, typography)
- The styling is a one-off and won't be reused
- You want to quickly prototype
- The element doesn't need complex or component-specific styling

❌ **Use custom CSS when:**

- You have complex, component-specific styling
- You need pseudo-elements or pseudo-classes
- You have animations or transitions
- You need media queries
- The styling is part of a reusable component pattern

### Example: Using Utility Classes

```html
<!-- Good: Simple card with utility classes -->
<div class="mat-bg-surface-container mat-p-16 mat-border mat-elevation-1">
  <h2 class="mat-title-large mat-m-0 mat-mb-8">Card Title</h2>
  <p class="mat-body-medium mat-color-on-surface-variant mat-m-0">Card description text</p>
  <div class="mat-flex mat-gap-8 mat-mt-16">
    <button mat-button>Cancel</button>
    <button mat-raised-button color="primary">Confirm</button>
  </div>
</div>
```

## Component Development

### Material Components

- Use the latest Material 21 components
- Prefer Material components over custom implementations
- Follow Material Design 3 guidelines
- Use `mat-` prefix for Material component selectors

### Component Structure

```typescript
import { Component, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './my-component.component.html',
  styleUrl: './my-component.component.scss',
})
export class MyComponent {
  // Use input() for inputs
  title = input.required<string>();
  subtitle = input<string>('');

  // Use output() for outputs
  itemClicked = output<string>();

  // Use signals for state
  count = signal(0);
  doubleCount = computed(() => this.count() * 2);

  // Use inject() for services
  private myService = inject(MyService);

  increment() {
    this.count.update((c) => c + 1);
  }
}
```

### Template Structure

```html
<!-- Use new control flow -->
@if (title()) {
<h1 class="title">{{ title() }}</h1>
} @if (subtitle()) {
<h2 class="subtitle">{{ subtitle() }}</h2>
} @for (item of items(); track item.id) {
<div class="item" (click)="itemClicked.emit(item.name)">{{ item.name }}</div>
} @empty {
<p>No items available</p>
}

<!-- Use @defer for lazy loading -->
@defer (on viewport) {
<app-heavy-component />
} @placeholder {
<div class="skeleton">Loading...</div>
}
```

## Styling Guidelines

### SCSS Best Practices

- Use BEM naming convention for custom classes
- Nest selectors appropriately (max 3 levels)
- Use mixins for reusable styles
- **Always use Material tokens for colors and typography**
- Use `:host` for component-level styles

### Example Component Styles

```scss
:host {
  display: block;
  background-color: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
}

.component {
  &__header {
    font: var(--mat-sys-headline-medium);
    color: var(--mat-sys-on-surface);
    padding: 16px;
    background-color: var(--mat-sys-surface-container);
  }

  &__content {
    font: var(--mat-sys-body-medium);
    padding: 16px;
  }

  &__button {
    background-color: var(--mat-sys-primary);
    color: var(--mat-sys-on-primary);

    &:hover {
      background-color: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }
  }
}
```

## Services and State Management

### Service Structure

```typescript
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class MyService {
  private http = inject(HttpClient);

  // Use signals for reactive state
  private _items = signal<Item[]>([]);
  items = this._items.asReadonly();

  itemCount = computed(() => this._items().length);

  addItem(item: Item) {
    this._items.update((items) => [...items, item]);
  }
}
```

## Routing

### Route Configuration

```typescript
import { Routes } from '@angular/router';
import { provideRouter, withComponentInputBinding } from '@angular/router';

export const routes: Routes = [
  {
    path: 'products/:id',
    loadComponent: () => import('./product/product.component').then((m) => m.ProductComponent),
    // Route params automatically bound to component inputs
  },
];

// In app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes, withComponentInputBinding())],
};
```

## Critical Rules

1. **NO hardcoded colors** - Always use `--mat-sys-*` tokens or utility classes
2. **NO hardcoded font sizes** - Always use `--mat-sys-*` typography tokens or utility classes
3. **PREFER utility classes** - Use `.mat-*` utility classes for simple styling instead of custom CSS
4. **NO NgModules** - Everything must be standalone
5. **NO constructor injection** - Use `inject()` function
6. **NO old control flow** - Use `@if`, `@for`, `@switch`, `@defer`
7. **NO `@Input()/@Output()`** - Use `input()`/`output()` functions
8. **Prefer signals** over RxJS observables for simple state
9. **Use `toSignal()`** when working with observables in templates
