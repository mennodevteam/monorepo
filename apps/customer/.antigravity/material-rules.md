# Material Design 3 Rules

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

## Material Design 3 Utility Classes

**PREFER utility classes over custom CSS** when you only need simple styling!

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

### Elevation Utility Classes

```html
<div class="mat-elevation-1">Subtle shadow</div>
<div class="mat-elevation-3">Medium shadow</div>
```

**Available classes:** `.mat-elevation-0` through `.mat-elevation-5`

### When to Use Utility Classes vs Custom CSS

✅ **Use utility classes when:**

- You only need simple styling (colors, typography)
- The styling is a one-off and won't be reused
- You want to quickly prototype
- The element doesn't need complex or component-specific styling

❌ **Use custom CSS when:**

- You have complex, component-specific styling
- You need pseudo-elements or pseudo-classes
- You have animations or transitions
- You need media queries
- The styling is part of a reusable component pattern

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

## Critical Rules

1. **NO hardcoded colors** - Always use `--mat-sys-*` tokens or utility classes
2. **NO hardcoded font sizes** - Always use `--mat-sys-*` typography tokens or utility classes
3. **PREFER utility classes** - Use `.mat-*` utility classes for simple styling instead of custom CSS
