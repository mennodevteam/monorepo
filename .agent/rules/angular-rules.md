# Angular 21 Development Rules

This document outlines workspace-wide best practices and coding standards for Angular 21 development across all applications.

## Standalone Components and Dependency Injection

- **Standalone Components Only**: Always use standalone components, directives, and pipes. Do not use `NgModules` for new features or refactoring.
- **Implicit Standalone**: Do not explicitly write `standalone: true` inside the `@Component`, `@Directive`, or `@Pipe` decorators. Standalone behavior is implied by default in modern configurations.
- **`inject()` Function Pattern**: Prefer the functional `inject()` API for dependency injection instead of standard constructor parameter injection:
  ```typescript
  import { inject } from '@angular/core';
  import { MyService } from './my.service';

  export class MyComponent {
    private myService = inject(MyService);
  }
  ```
- **Functional Guards & Resolvers**: Prefer functional routers (guards and resolvers) over class-based ones.

## Signals and State Management

- **Signal-Based Reactive State**: Utilize Angular Signals (`signal()`, `computed()`, `effect()`) for local reactive state management in components and services.
- **Immutable Updates**: Do not mutate signals directly (e.g., using legacy `mutate()`). Use `.set()` or `.update()` for updates:
  ```typescript
  // Good:
  this.items.update(currentItems => [...currentItems, newItem]);
  ```
- **Derived State**: Always use `computed()` to derive state from other signals.
- **Signal Inputs/Outputs**: Prefer signal-based inputs and outputs over decorators (`@Input`, `@Output`):
  - Use `input()` and `input.required()` instead of `@Input()`.
  - Use `output()` instead of `@Output()`.
  - Use `model()` for two-way bindings.
- **Linked Signals**: Use `linkedSignal()` to synchronize source signals with dependent writable signals.
- **RxJS Integration**: Prefer signals over RxJS Observables for component-level UI state. Use `toSignal()` to read values from required streams or `HttpClient` responses in templates.

## Templates and Control Flow

- **Native Control Flow Syntax**: Always use built-in control flow syntax (`@if`, `@for`, `@switch`, `@defer`) rather than older structural directives (`*ngIf`, `*ngFor`, `*ngSwitch`):
  ```html
  @if (isVisible()) {
    <section>Content</section>
  }
  @for (item of items(); track item.id) {
    <div class="item">{{ item.name }}</div>
  } @empty {
    <p>No items found</p>
  }
  ```
- **Lazy Loading with `@defer`**: Use `@defer` blocks to defer loading of heavy elements or routes until they enter the viewport.
- **Conditional Styling (No `NgClass`/`NgStyle`)**: Avoid using `ngClass` or `ngStyle` directives. Use native `class` and `style` bindings:
  ```html
  <!-- Good: -->
  <div [class.active]="isActive()"></div>
  <div [style.font-size.px]="fontSize()"></div>
  ```
- **Host Bindings**: Do not use `@HostBinding` or `@HostListener` decorators. Put host configurations directly inside the `host` metadata block of the component/directive decorator.

## TypeScript Coding Standards

- **Strict Type Checking**: Keep strict compilation checks enabled. Never bypass checks with `any`. Use `unknown` when types are dynamic or uncertain.
- **Type Inference**: Allow TypeScript to infer types when they are obvious from context (e.g., `value = signal(true)` rather than `value = signal<boolean>(true)`).
- **Readonly Properties**: Mark class properties and state representations as `readonly` when they are immutable.
