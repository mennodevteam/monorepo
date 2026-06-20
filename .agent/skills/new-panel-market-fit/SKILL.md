---
name: new-panel-market-fit
description: |
  Guides developers and agents in fitting apps/new-panel's UI/UX to market standards.
  Covers spacing, typography, control alignment, mobile compatibility, AI features consolidation, empty states, and onboarding flows.
---

# new-panel UI/UX Market-Fit Standardization Skill

This skill contains the step-by-step engineering guidelines and verification checklists to transform the `new-panel` Angular client into a polished, consistent, and highly professional web interface. 

Use this skill whenever you are refactoring, creating, or polishing screens under `apps/new-panel`.

---

## 1. Visual Alignment Checklist

### Spacing & Font Standardization
- Ensure page headers (toolbar components) have a bottom margin/gap of exactly `24px` to the main content wrapper.
- Use `Estedad` as the font family for all elements. Font weights are structured as follows:
  - Page Main Header: `600`
  - Cards, Section Headers, Subtitles: `500`
  - Body, Descriptions, Details: `300` / `400`
  - Secondary metadata / helper texts: `300` (color: `var(--text-secondary)`)
- Avoid arbitrary spacing values. Stick to `16px` for generic layouts, `24px` for content-to-header blocks, and `32px` for section margins in forms.

### Interactive Components
- **Switches**: Enable/Disable or Active/Inactive toggles must utilize Angular Material `<mat-slide-toggle>`.
- **Checkboxes**: List selections and filter conditions must use `<mat-checkbox>`.
- **Multi-state**: Segmented pills/tab-like structures (`.status-pills`) should be used for status selection (e.g., Active / Blocked / Draft).

---

## 2. Dynamic layouts, Overflow & Responsive Tables

### Overflow Protection
- Ensure buttons and cards do not specify hardcoded pixel widths unless necessary. Use `min-width` and standard padding (`0.75rem 1.5rem` for primary buttons).
- For long text items in headers/labels, specify:
  ```css
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  ```
- Wrap descriptions and details with `word-break: break-word` and `overflow-wrap: break-word`.

### Responsive Grid & Tables
- Dense tables must always be wrapped in a scroll container with `overflow-x: auto; -webkit-overflow-scrolling: touch;`:
  ```html
  <div class="invoices-table-container">
    <table mat-table ...>
      <!-- columns -->
    </table>
  </div>
  ```
- On viewports narrower than `768px`, consider using media queries or Angular `BreakpointObserver` to:
  1. Hide less important table columns (e.g. description or secondary codes).
  2. Switch list display to a stack of modern cards.

---

## 3. Explanatory & AI Features Layouts

### Informative UX Cards
- Provide context cards on pages requiring configuration updates. They must contain:
  - An icon badge (`.np-icon-badge .sm` or default) wrapped with theme colors.
  - Heading (`font-weight: 500`).
  - Brief description.
  - A CTA button or link (`.btn-secondary` or underlined button) directing the user to the config page.

### Interactive Settings Card Pattern
- Transform settings groups and item lists (e.g., config page options, home page sections list) into visual cards (`.np-config-card`).
- **Header Structure**: Use `.np-config-header` containing:
  - An icon badge (`.np-icon-badge`) colored dynamically based on the state or item type (e.g., `.green`, `.blue`, `.orange`, `.purple`, `.gray`).
  - Title and dynamic description texts wrapped in `.np-config-text`.
  - Action items wrapped in `.np-config-action`, containing status badges (`.status-badge .status-badge-available` or `.status-badge-inactive`) and toggles/control buttons.
- **Body / Content Preview**: Render a live visual representation or configuration details inside the card content (`.np-config-body` or similar). Hide/show config inputs dynamically using transition classes (`.animate-slide-up`).
- **Promo Banners**: When settings are disabled or need recommendations, inject a `.promo-card` with an informational link directing users to the appropriate settings screen.

### AI Page Unification
  ```html
  <main p-md class="np-ai-page">
     ...
  </main>
  ```
- Keep all AI/ML features grouped or linked under one master dashboard, ensuring a clean and structured UX.

---

## 4. Empty States & Onboarding System

### Custom Empty State Components
If the data list is empty, instead of a blank screen, output the custom `<app-empty-state>`:
```html
<app-empty-state
  [icon]="'box-open'"
  [text]="'هیچ موردی ثبت نشده است. همین حالا اولین مورد را ایجاد کنید.'"
  [action]="{ label: 'افزودن مورد جدید', icon: 'plus' }"
  (actionClick)="openCreateDialog()">
</app-empty-state>
```

### Onboarding Popups
For screens containing settings/configurations that users access for the first time:
1. Define a checking directive/hook in the component logic using `localStorage`:
   ```typescript
   private onboardingKey = 'menno_onboarding_developer_api';
   
   ngOnInit() {
     const seen = localStorage.getItem(this.onboardingKey);
     if (!seen) {
       this.showOnboardingDialog();
     }
   }

   showOnboardingDialog() {
     const dialogRef = this.dialog.open(OnboardingDialogComponent, {
       width: '400px',
       data: {
         title: 'تنظیمات کلید توسعه‌دهندگان',
         description: 'در این صفحه می‌توانید کلیدهای دسترسی API خود را مدیریت کنید...'
       }
     });
     
     dialogRef.afterClosed().subscribe(() => {
       localStorage.setItem(this.onboardingKey, 'true');
     });
   }
   ```
2. Design a simple onboarding modal highlighting the main features and steps.

---

## 5. Verification Commands

Run these steps when testing your visual changes locally:
1. Compile and inspect build errors:
   ```bash
   npx nx build new-panel
   ```
2. Verify responsive layout in the browser console under mobile viewport emulations (`375px`, `414px`, `768px`).
3. Assert that no raw hex colors are used in custom SCSS sheets.
