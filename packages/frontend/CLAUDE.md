# Angular Frontend (groceries-list)

Angular 21 application with NgRx state management, Angular Material UI, and Firebase integration.

## Quick Commands

```bash
pnpm dev                # Start dev server at localhost:4200
pnpm build:frontend     # Production build
pnpm test               # Run Jasmine tests with Karma
pnpm lint               # Run ESLint
```

## Architecture

- **State Management**: NgRx (store, effects, entity)
- **UI Framework**: Angular Material with custom theming
- **Styling**: SCSS with component-scoped styles
- **Testing**: Jasmine + Karma
- **i18n**: Angular localize (English/Estonian)
- **Firebase**: Firebase Auth, Firestore, Storage, Functions

## Project Structure

```
src/app/
├── auth/           # Authentication (Firebase Auth)
├── state/          # NgRx store (actions, effects, reducers)
│   ├── list/       # Shopping lists state
│   ├── item/       # List items state
│   ├── group/      # Categories/groups state
│   ├── user/       # User state
│   └── config/     # App configuration state
├── shared/         # Shared services, models, utilities
├── list/           # List view components
├── item-edit/      # Item editing components
└── ...
```

## Angular Best Practices

### Components

- Use **standalone components** (default in Angular 21 - do NOT set `standalone: true`)
- Use `ChangeDetection.OnPush` for all components
- Use `input()` and `output()` functions instead of `@Input`/`@Output` decorators
- Use `inject()` function instead of constructor injection
- Use `host` object in decorator instead of `@HostBinding`/`@HostListener`
- Prefer inline templates for small components

```typescript
@Component({
  selector: 'app-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button (click)="clicked.emit()">{{ label() }}</button>`,
  host: { '[class.active]': 'isActive()' }
})
export class ExampleComponent {
  label = input.required<string>();
  isActive = input(false);
  clicked = output<void>();
}
```

### Templates

- Use native control flow: `@if`, `@for`, `@switch` (NOT `*ngIf`, `*ngFor`, `*ngSwitch`)
- Use `class` bindings instead of `ngClass`
- Use `style` bindings instead of `ngStyle`
- Use `toSignal` from RxJS interop for observables (NOT `async` pipe)
- For NgRx store, prefer `store.selectSignal()` over `toSignal(store.select())`

```typescript
// In component class - use selectSignal for NgRx
private store = inject(Store);
items = this.store.selectSignal(selectAllItems);

// In template - use signal directly
@if (items().length) {
  @for (item of items(); track item.id) {
    <app-item [data]="item" />
  }
} @else {
  <p>No items</p>
}
```

### State Management

- Use signals for local component state
- Use `computed()` for derived state
- Use `update()` or `set()` on signals (NOT `mutate`)
- Keep state transformations pure

### Services

- Use `providedIn: 'root'` for singleton services
- Use `inject()` function for dependencies
- Single responsibility per service

### Styling

- Component styles in separate `.scss` files
- Use relative paths: `styleUrls: ['./component.scss']`
- Theme variables defined in `src/theme.scss` and `src/palette.scss`
- Only add styles for layout using grid or flex
- Never add color, background color, font size, font weight (Angular Material handles this)
- Only use standard paddings, margins, borders, etc in `rem` units based on Material Design guidelines

### Images

- Use `NgOptimizedImage` directive for static images
- Does not work for inline base64 images

### Accessibility

- Must pass AXE checks
- Follow WCAG AA standards
- Proper focus management, color contrast, ARIA attributes

## NgRx Patterns

Actions use createActionGroup:
```typescript
export const ListActions = createActionGroup({
  source: 'List',
  events: {
    'Load Lists': emptyProps(),
    'Load Lists Success': props<{ lists: List[] }>(),
  }
});
```

Selectors with createFeatureSelector:
```typescript
export const selectListState = createFeatureSelector<ListState>('list');
export const selectAllLists = createSelector(selectListState, state => state.lists);
```

## TypeScript

- Strict type checking enabled
- Avoid `any`, use `unknown` when type is uncertain
- Prefer type inference when obvious

# MCP Commands

- Use playwright to test the application UI, the application is already built and running on http://localhost:4200
- Use angular-cli mcp to get the best practices for the application
- Use context7 mcp to get wider documentation for NgRx, Firebase etc