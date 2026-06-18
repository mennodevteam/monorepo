# new-panel — design rules for agents

This file applies to the Angular app **`apps/new-panel`**. When you add or change UI here, follow these rules so the product stays consistent.

## Stack and baseline

- **Angular Material 3** (M3): use Material components and tokens; do not introduce a parallel design system or heavy custom component libraries for routine UI.
- Prefer **theme tokens** (`var(--mat-sys-…)`) and Material **overrides mixins** in `apps/new-panel/src/styles.scss` over ad-hoc per-component styling.
- **Form Fields Style**: All form fields globally use `appearance="outline"`, configured via `MAT_FORM_FIELD_DEFAULT_OPTIONS` in `app.config.ts`.
- **Density** is global (`mat.theme` density **-2**). If you change density in `styles.scss`, align shell layout: `fixedTopGap` on the sidenav in `shell.component.html` should match the **standard toolbar height** (see comment in that file if you adjust).

## Visual direction

- **Card-Free Form Layouts**: All edit, configuration, and form screens are flat and **card-free** (no outer border, no divider lines, and no card boxes). Sections are separated by a clean vertical gap of **32px** (using `fxLayoutGap="32px"` or margin spacing).
- **Typography Hierarchy**:
  - **Page titles** are styled with a font weight of **600** to represent page headers clearly.
  - **Cards, section headers, and intermediate titles** are styled with a font weight of **500**.
  - General text, descriptions, and details use regular font weights (400 or lower) to maintain visual hierarchy.
- **Typography Scale**: The global M3 type scale is slightly **smaller than default** (`mat.theme-overrides` in `styles.scss`). Prefer Material text styles (`mat-body-*`, card titles, form fields) so new screens inherit the scale; avoid hardcoded `px` font sizes unless necessary.
- **Compact but readable**: default page padding uses `[p-md]` (global). Form and configuration screens use `32px` vertical gaps, while other dashboard/list screens prefer tighter **vertical** spacing with `fxLayoutGap` in the **16px** range.
- **RTL**: the app is RTL-first; use logical properties (`padding-inline`, `margin-inline`, `border-inline-start`) when you add custom CSS.
- **Icon Badges (`np-icon-badge`)**: Use this utility class for structured, soft color-accented icon wrappers/backgrounds in lists, settings, and navigation lists. Size variations are `.sm` (28px) and `.lg` (44px), with the default being 38px. Color variations include `.blue`, `.pink`, `.green`, `.purple`, `.orange`, `.teal`, `.sky`, `.cyan`, `.gray`, and `.ai`. When placed inside an active route link (`a.active-link`), the badge styles invert automatically.


## AI / ML features (distinct, subtle violet)

Use a **hint** of violet — not a second primary color across the whole app.

1. **CSS variables** (defined in `styles.scss` on `:root`): `--np-ai-accent`, `--np-ai-accent-muted`, `--np-ai-outline`, `--np-ai-surface-tint`. Prefer these over hardcoded purple hex in new code.
2. **Page-level** AI flows: add **`class="np-ai-page"`** on the main scroll container (e.g. `<main p-md class="np-ai-page">`). Outlined `mat-card`s inside get a light violet border/background via global CSS — no need to duplicate that in each card’s SCSS.
3. **Dialogs** for AI: wrap dialog content in **`<div class="np-ai-dialog">`** (see `buy-ai-tokens-dialog.component.html`).
4. **Side nav**: use **`class="nav-ai"`** on `mat-list-item` links that are primarily AI-related (icons pick up `--np-ai-*` from global + shell styles).
5. **Home hero card** for AI may keep a slightly richer treatment (`ai-intelligence-card`); still align with `--np-ai-*` variables.

## What to avoid

- Replacing Material with bespoke controls for standard patterns (lists, forms, dialogs, tables).
- Large one-off margins (e.g. 32px+) without a reason; prefer theme density and consistent gaps.
- Strong purple fills on primary actions app-wide — primary actions stay **primary** (blue); AI is accent only.

## Files agents usually touch

| Area            | File(s)                                      |
|-----------------|----------------------------------------------|
| Global theme    | `apps/new-panel/src/styles.scss`, `theme.scss` |
| App chrome      | `apps/new-panel/src/app/shell/shell.component.*` |
| AI tokens/util  | `styles.scss` (`.np-ai-page`, `.np-ai-dialog`, `:root` AI vars) |

When in doubt, extend **global** styles or reuse **existing** utilities before adding new component SCSS.
