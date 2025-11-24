# Material Design 3 Utility Classes Implementation

## Overview

This document describes the comprehensive Material Design 3 utility class system added to the customer app, enabling rapid development with consistent theming.

## Implementation Date

2025-11-24

## Changes Made

### 1. **styles.scss Updates**

#### Typography Hierarchy

Added Material typography hierarchy mixin:

```scss
html {
  @include mat.typography-hierarchy(theme.$primary-palette);
}
```

#### Background Override

Overrode system background to white for a clean, bright appearance:

```scss
:root {
  --mat-sys-background: #ffffff;
}
```

#### Utility Classes Added

Added 450+ utility classes covering:

- Typography (15 classes)
- Text colors (12 classes)
- Background colors (15 classes)
- Borders (7 classes)
- Elevation/shadows (6 classes)
- Spacing - padding, margin, gap (100+ classes)
- Layout - flexbox, alignment (20+ classes)
- Display utilities (4 classes)
- Text alignment (4 classes)
- Size utilities (4 classes)

### 2. **Development Rules Updated**

Added comprehensive "Material Design 3 Utility Classes" section to `.antigravity/rules.md` including:

- Complete documentation of all utility classes
- Usage examples for each category
- Guidelines on when to use utility classes vs custom CSS
- Practical examples

Updated Critical Rules to emphasize utility class usage:

- Rule #3: **PREFER utility classes** for simple styling

## Utility Class Categories

### Typography Classes

```html
<!-- Display -->
.mat-display-large, .mat-display-medium, .mat-display-small

<!-- Headline -->
.mat-headline-large, .mat-headline-medium, .mat-headline-small

<!-- Title -->
.mat-title-large, .mat-title-medium, .mat-title-small

<!-- Body -->
.mat-body-large, .mat-body-medium, .mat-body-small

<!-- Label -->
.mat-label-large, .mat-label-medium, .mat-label-small
```

### Color Classes

#### Text Colors

```html
.mat-color-primary .mat-color-secondary .mat-color-tertiary .mat-color-error .mat-color-surface
.mat-color-on-surface-variant .mat-color-outline .mat-color-outline-variant
```

#### Background Colors

```html
.mat-bg-primary, .mat-bg-primary-container .mat-bg-secondary, .mat-bg-secondary-container .mat-bg-tertiary,
.mat-bg-tertiary-container .mat-bg-error, .mat-bg-error-container .mat-bg-surface, .mat-bg-surface-variant
.mat-bg-surface-container (+ low/high/highest/lowest) .mat-bg-surface-dim, .mat-bg-surface-bright
.mat-bg-background
```

### Border Classes

```html
.mat-border .mat-border-outline .mat-border-outline-variant .mat-border-top/bottom/left/right
```

### Elevation Classes

```html
.mat-elevation-0 through .mat-elevation-5
```

### Spacing Classes

Based on 4px/8px grid system with values: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48

#### Padding

```html
.mat-p-{size}
<!-- All sides -->
.mat-px-{size}
<!-- Horizontal (inline) -->
.mat-py-{size}
<!-- Vertical (block) -->
```

#### Margin

```html
.mat-m-{size}
<!-- All sides -->
.mat-mx-{size}
<!-- Horizontal (inline) -->
.mat-my-{size}
<!-- Vertical (block) -->
.mat-mt-{size}
<!-- Top -->
.mat-mb-{size}
<!-- Bottom -->
.mat-mx-auto
<!-- Horizontal centering -->
```

#### Gap (for flex/grid)

```html
.mat-gap-{size}
```

### Layout Classes

#### Flexbox

```html
.mat-flex
<!-- display: flex -->
.mat-flex-column
<!-- flex-direction: column -->
.mat-flex-row
<!-- flex-direction: row -->
.mat-flex-center
<!-- center both axes -->
.mat-flex-between
<!-- justify-content: space-between -->
.mat-flex-around
<!-- justify-content: space-around -->
.mat-flex-wrap
<!-- flex-wrap: wrap -->
.mat-flex-1
<!-- flex: 1 -->
```

#### Alignment

```html
.mat-items-center/start/end .mat-justify-center/start/end/between
```

#### Display

```html
.mat-block .mat-inline-block .mat-inline .mat-hidden
```

### Text Alignment

```html
.mat-text-left .mat-text-center .mat-text-right .mat-text-justify
```

### Size Utilities

```html
.mat-w-full, .mat-w-auto .mat-h-full, .mat-h-auto
```

## Usage Guidelines

### ✅ When to Use Utility Classes

1. **Simple styling needs** - margins, padding, colors, typography
2. **One-off styling** - not part of a reusable pattern
3. **Rapid prototyping** - quick iterations
4. **Layout adjustments** - flex, alignment, spacing
5. **Theme-aware styling** - colors that adapt to theme changes

### ❌ When to Use Custom CSS

1. **Complex component styling** - multiple related styles
2. **Pseudo-elements/classes** - ::before, ::after, :hover with complex logic
3. **Animations/transitions** - keyframes, complex transitions
4. **Media queries** - responsive breakpoints
5. **Reusable component patterns** - component-specific design systems

## Practical Examples

### Example 1: Simple Card

```html
<div class="mat-bg-surface-container mat-p-16 mat-border mat-elevation-1">
  <h2 class="mat-title-large mat-m-0 mat-mb-8">Product Name</h2>
  <p class="mat-body-medium mat-color-on-surface-variant mat-m-0">Product description goes here</p>
  <div class="mat-flex mat-gap-8 mat-mt-16 mat-justify-end">
    <button mat-button>Cancel</button>
    <button mat-raised-button color="primary">Add to Cart</button>
  </div>
</div>
```

### Example 2: List Item

```html
<div class="mat-flex mat-items-center mat-gap-12 mat-p-12 mat-border-bottom">
  <img src="..." class="mat-w-48 mat-h-48" />
  <div class="mat-flex-1">
    <h3 class="mat-title-medium mat-m-0">Item Title</h3>
    <p class="mat-body-small mat-color-on-surface-variant mat-m-0">Item subtitle</p>
  </div>
  <span class="mat-label-large mat-color-primary">$19.99</span>
</div>
```

### Example 3: Centered Content

```html
<div class="mat-flex-center mat-h-full mat-flex-column mat-gap-16">
  <mat-icon class="mat-color-on-surface-variant">inbox</mat-icon>
  <p class="mat-body-large mat-color-on-surface-variant mat-text-center">No items found</p>
</div>
```

## Benefits

### 1. **Consistency**

- All spacing follows 4px/8px grid
- All colors use M3 tokens
- All typography uses M3 type scale

### 2. **Speed**

- No need to write custom CSS for simple styling
- Faster prototyping and iteration
- Less context switching between HTML and CSS

### 3. **Maintainability**

- Centralized styling system
- Easy to update theme globally
- Self-documenting class names

### 4. **Theme Support**

- All colors automatically adapt to theme changes
- Easy to implement dark mode
- Consistent with Material Design guidelines

### 5. **Reduced Bundle Size**

- Reusable utility classes instead of duplicate custom CSS
- Tree-shakeable (unused classes can be removed)

## Migration Path

### For New Components

- Use utility classes by default
- Only create custom CSS when necessary
- Follow the guidelines in `.antigravity/rules.md`

### For Existing Components

- Gradually refactor to use utility classes where appropriate
- Focus on simple styling first (margins, padding, colors)
- Keep complex component-specific styles in SCSS files

## Best Practices

1. **Combine utility classes** for complex layouts
2. **Use semantic HTML** - don't rely solely on utility classes for structure
3. **Group related classes** - typography, then layout, then spacing, then colors
4. **Don't over-use** - if you need 10+ classes, consider custom CSS
5. **Be consistent** - if you use utility classes in one place, use them everywhere similar

## Example: Before and After

### Before (Custom CSS)

```html
<!-- HTML -->
<div class="product-card">
  <h2 class="product-card__title">Product</h2>
  <p class="product-card__description">Description</p>
</div>

<!-- SCSS -->
.product-card { background-color: var(--mat-sys-surface-container); padding: 16px; border: 1px solid
var(--mat-sys-outline-variant); &__title { font: var(--mat-sys-title-large); margin: 0 0 8px 0; }
&__description { font: var(--mat-sys-body-medium); color: var(--mat-sys-on-surface-variant); margin: 0; } }
```

### After (Utility Classes)

```html
<!-- HTML only, no custom CSS needed -->
<div class="mat-bg-surface-container mat-p-16 mat-border">
  <h2 class="mat-title-large mat-m-0 mat-mb-8">Product</h2>
  <p class="mat-body-medium mat-color-on-surface-variant mat-m-0">Description</p>
</div>
```

## Next Steps

1. ✅ Utility classes implemented in `styles.scss`
2. ✅ Documentation added to `.antigravity/rules.md`
3. 🔄 Start using utility classes in new components
4. 🔄 Gradually refactor existing simple styles to use utility classes
5. 🔄 Monitor bundle size and optimize if needed

## Resources

- Material Design 3 Guidelines: https://m3.material.io/
- Angular Material 21 Theming: https://material.angular.io/guide/theming
- Utility Classes Documentation: `.antigravity/rules.md`
