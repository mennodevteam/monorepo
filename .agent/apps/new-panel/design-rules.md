# design-rules.md — UI/UX Specification & Agent Rules for new-panel

This file applies to the Angular application **`apps/new-panel`**. When adding, modifying, or refactoring UI components and pages in `new-panel`, you MUST strictly adhere to these design system rules to ensure visual consistency, responsiveness, accessibility, and high aesthetic standards suitable for a production-ready, market-fit application.

---

## 1. Core Visual Spec & Design System Baseline

### Stack & UI Foundations
- **Angular Material 3 (M3)**: Always use Material M3 components (`mat-button`, `mat-card`, `mat-form-field`, etc.) and system design tokens.
- **Theme Variables**: Never hardcode colors (e.g. Hex `#fff`, `#6d28d9`). Use standard CSS theme variables:
  - `--bg-primary` & `--bg-secondary` (Pure White layout defaults: `#ffffff`).
  - `--text-primary` (`#171717` / neutral-900) & `--text-secondary` (`#525252` / neutral-600) & `--text-muted` (`#737373` / neutral-500).
  - `--border-color` (`#E5E5E5` / zinc-200) & `--border-dark` (`#E4E4E7` / zinc-200).
  - `--mat-sys-primary` (`#171717` stark dark button color) & `--mat-sys-on-primary` (`#ffffff`).
- **Density**: The app utilizes Angular Material density **-2** globally (compact but readable). Align top-level layouts accordingly.

---

## 2. Spacing, Typography & Margin Unity

### Spacing Consistency
To prevent visual jitter between pages, all content areas must follow a unified spacing hierarchy:
1. **Content to Page Title/Thumbnail Gap**: The distance from the page main title/header to the actual content container must be exactly **`24px`** (or `margin-block-end: 1.5rem` / `fxLayoutGap="24px"`).
2. **Page Padding**: Use the global padding class `[p-md]` (`16px`) on main containers.
3. **Form/Configuration Layouts**: All configuration/edit layouts are flat and **card-free** (no outer borders, no card wraps). Grouped form sections must be separated by a clean vertical gap of exactly **`32px`** (`fxLayoutGap="32px"` or `margin-bottom: 32px`).
4. **General Dashboard & Lists**: List rows and dashboard grids use a tighter vertical spacing of exactly **`16px`** (`fxLayoutGap="16px"`).

### Typography Scale
- **Page Titles**: Styled with a font weight of **`600`** and size **`1.35rem`** (`font-weight: 600 !important`).
- **Section Headers & Card Titles**: Styled with a font weight of **`500`** and size **`0.95rem`** (`font-weight: 500 !important`).
- **Body & Content Text**: Styled with a font weight of **`300`** or **`400`** and size **`0.8125rem`** (default body scale).
- **Secondary/Muted Labels**: Styled with a size of **`0.78rem`** (`color: var(--text-secondary)`).
- **RTL Alignment**: The app is RTL-first (using the `Estedad` Persian font family). Always use logical styles (`padding-inline`, `margin-inline`, `border-inline-start`) instead of left/right physical definitions.

---

## 3. Explanatory UX Promo & Help Cards

When a page requires additional context, onboarding, or cross-feature redirection, use custom explanation banners (`.promo-card` styled card layout) directly at the top of the content:
- **Structure**: Create a subtle, outlined card (`mat-card`) with:
  - An icon badge wrapper (`.np-icon-badge`) with unified colors: `blue` for info/guidance and `orange` for warning/attention.
  - A standardized status icon: `<i class="fa-regular fa-circle-info"></i>` for info/guidance cards and `<i class="fa-regular fa-circle-exclamation"></i>` for warning/attention cards.
  - **No Inner Title**: Banners must not contain a nested heading or title block (to prevent redundancy with the page-level header).
  - A descriptive text block (`font-weight: 300`, `font-size: 0.8125rem`) structured in two clear paragraphs.
  - **Contextual Inline Links**: Action footers and separate button blocks are deprecated. Use standard `<a>` tags with `routerLink` embedded contextually in the second paragraph of the description text.
- **Placement & Spacing**: Promo cards must sit near the page header toolbar (with an 8px spacing gap). The main page content separation gap of `24px` (represented by the banner's `margin-bottom: 24px`) must sit **under** the banner.
- **Example Markup**:
  ```html
  <mat-card class="promo-card blue">
    <mat-card-content fxLayout="row" fxLayoutAlign="start center" fxLayoutGap="12px">
      <div class="np-icon-badge"><i class="fa-regular fa-circle-info"></i></div>
      <div fxFlex>
        <div class="desc" style="color: var(--text-secondary); font-size: 0.8rem; line-height: 1.6;">
          <p style="margin: 0 0 6px 0;">در این بخش می‌توانید محصولات خود را تعریف و دسته‌بندی کنید. برای ویرایش اطلاعات و تصاویر محصولات از جدول زیر استفاده کنید.</p>
          <p style="margin: 0;">برای تعیین قیمت نهایی محصولات به بخش <a routerLink="/pricing">قیمت‌گذاری محصولات</a> مراجعه کنید.</p>
        </div>
      </div>
    </mat-card-content>
  </mat-card>
  ```

---

## 4. AI & ML Features Integration

- **Subtle Branding**: Use a distinct but soft violet accent for all AI/ML features. Never replace primary blue/dark styling with purple globally.
- **CSS Color Variables**:
  - `--np-ai-accent`: `#6d28d9` (violet-700)
  - `--np-ai-accent-muted`: `#7c3aed` (violet-600)
  - `--np-ai-outline`: `color-mix(in srgb, var(--np-ai-accent) 18%, var(--border-color))`
  - `--np-ai-surface-tint`: `color-mix(in srgb, var(--np-ai-accent) 5%, var(--bg-primary))`
- **Unified AI Page Wrapper**: Any AI-specific routes, data exports, or chat histories must apply the `.np-ai-page` class to the main scroll container.
- **Dialogs & Badges**: Wrap AI dialog contents in `.np-ai-dialog` and use `.np-icon-badge.ai` for AI features in lists.
- **Centralized Dashboard Access**: Keep all AI tools under a unified side navigation section or home card. Do not scatter AI configurations across random unrelated settings tabs.

---

## 5. Control Standardization (Toggles, Checkboxes & Switches)

To keep input components consistent:
- **Boolean Switches (Active/Inactive, Enable/Disable)**: Always use standard Material Toggle switches (`<mat-slide-toggle>`). Do NOT mix switches with checkboxes or sliders for this state.
- **Form Multi-selections (Filters, List Selection)**: Always use standard Material Checkboxes (`<mat-checkbox>`).
- **Interactive Multi-states (Status Selector)**: Use segmented button bars (`.status-pills` with `.status-pill-btn`) for multi-state status controls (e.g. Active, Blocked, Draft).
- **Styling Custom Inputs**: Ensure native inputs (`input[type="text"]`, etc.) have `#f5f5f5` background, turning `#ffffff` with a subtle outline (`0 0 0 2px rgba(23, 23, 23, 0.05)`) on focus.

---

## 6. Text & Button Overflow Prevention

- **Text Wrapping**: Always use CSS properties to handle text overflows cleanly in small widths or inside compact cards:
  - For titles: `text-overflow: ellipsis; overflow: hidden; white-space: nowrap;` or `-webkit-line-clamp`.
  - For long details: `word-break: break-word; overflow-wrap: break-word;`.
- **Button Flex**: Never use fixed widths (`width: 120px`) on buttons containing dynamic text. Buttons must use flexible padding (`padding: 0.75rem 1.5rem`) and scale with text, using `min-width` as a baseline.
- **Badge Content**: Avoid placing long texts inside badges. Keep labels concise.

---

## 7. Mobile-Responsive Layouts & Dense Tables

- **Flexible Grids**: Avoid using fixed row/column heights or absolute pixel positions. Use Tailwind-like utilities or Flexbox (`fxLayout="row wrap"` or CSS Grid `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`) to adapt dynamically.
- **Responsive Tables**:
  - Always wrap `<table mat-table>` elements inside a scrollable container (`.invoices-table-container` or a wrapper with `overflow-x: auto; -webkit-overflow-scrolling: touch;`).
  - For dense tables, hide low-priority columns on mobile screens (`@media (max-width: 768px)`) using responsive classes or Angular's `BreakpointObserver` matching.
  - Or display a card list on mobile screens while showing a dense table on desktop.

---

## 8. Unified Headings & Title Decorations

- **Decorations Consistency**: Standardize page headers. If subtitles or description texts under page titles have underlines or dividers, apply them globally using a unified structure.
- **Underline Styling**: If underlines are used:
  - Page titles should have a clean, light bottom border: `border-bottom: 1px solid var(--border-color)` on the `.content-toolbar` or a divider line directly below the header.
  - Sub-actions and details in card actions must use underlined text buttons (`.mat-mdc-card-actions button.mat-mdc-button` with `text-decoration: underline !important; text-underline-offset: 4px;`).

---

## 9. Empty States & First-Time Onboarding UX

### Empty State Standard Component
If a view has empty data, DO NOT leave it blank or show a dry error. Always render `<app-empty-state>`:
- **Inputs to supply**:
  - `icon`: string identifier (e.g., `ticket-dotted`, `users-slash`, `box-open`).
  - `text`: explaining what is missing (in Persian).
  - `action`: configuration containing `label` and `icon`.
  - `actionClick`: callback routing to the onboarding step or resource creation dialog.

### First-Time Onboarding Dialogs
- If a user enters a complex screen (e.g., AI Chat History, Developer API, SMS campaigns) for the first time:
  - Check `localStorage.getItem('onboarding_seen_[page-name]')` or similar flag.
  - If null, show a standard onboarding modal dialog summarizing how the page works, providing a quick starter guide, and a button to close/dismiss.
  - Save the flag to `localStorage` immediately.

---

## 10. Agent Verification Checklist

When building or modifying files, you MUST run through this checklist before submitting your changes:
- [ ] Are all font sizes in line with the typography scale?
- [ ] Is the spacing between page titles and content set to 24px?
- [ ] Are active/inactive toggles using `<mat-slide-toggle>`?
- [ ] Are all raw hex colors avoided, using CSS/theme variables instead?
- [ ] Is there an empty state view with `<app-empty-state>` implemented for data-driven screens?
- [ ] Have you tested the layout under mobile viewports to ensure tables scroll horizontally and buttons do not overflow?
- [ ] Are custom onboarding checks in place for first-time dashboard entries?
