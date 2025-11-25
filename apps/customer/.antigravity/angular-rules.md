# Angular Development Rules

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

1. **NO NgModules** - Everything must be standalone
2. **NO constructor injection** - Use `inject()` function
3. **NO old control flow** - Use `@if`, `@for`, `@switch`, `@defer`
4. **NO `@Input()/@Output()`** - Use `input()`/`output()` functions
5. **Prefer signals** over RxJS observables for simple state
6. **Use `toSignal()`** when working with observables in templates
