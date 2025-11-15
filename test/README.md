Test Suite Documentation

## Overview

This project uses **Vitest** and **React Testing Library** for comprehensive unit and integration testing.

## 🎯 Zero-Failure Policy

**This project maintains a strict 100% test pass rate policy.**

- ✅ **All tests must pass** - No exceptions
- ❌ **No "ok to fail" tests** - Every test provides value
- 🚫 **No skipping tests** - Fix broken tests, don't ignore them
- 📊 **Current status: 89/89 tests passing (100%)**

If a test is failing, it must be fixed before merging. A test suite with any failures is considered broken and blocks deployment.

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test

# Run tests with UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

## Test Structure

```
├── components/
│   ├── kanban-card.test.tsx           # KanbanCard component tests
│   ├── add-task-dialog.test.tsx       # AddTaskDialog component tests
│   └── board-selector.test.tsx        # BoardSelector component tests
├── contexts/
│   └── auth-context.test.tsx          # Authentication context tests
├── lib/
│   ├── api/
│   │   └── boards.test.ts             # Board API functions tests
│   └── utils.test.ts                  # Utility functions tests
└── test/
    ├── setup.ts                       # Test configuration
    └── README.md                      # This file
```

## Test Coverage

Our test suite covers:

### Components

- ✅ **KanbanCard** - Task card rendering, interactions, category display
- ✅ **AddTaskDialog** - Task creation, form validation, character limits
- ✅ **BoardSelector** - Board loading, selection, creation

### Contexts

- ✅ **AuthContext** - Authentication state, sign in/up/out, session management

### API Functions

- ✅ **Board API** - CRUD operations for boards, columns, and tasks
- ✅ **Utils** - Class name merging, Tailwind utilities

## Writing Tests

### Component Test Example

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MyComponent } from "./my-component";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("handles user interaction", () => {
    const onClick = vi.fn();
    render(<MyComponent onClick={onClick} />);

    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### API Test Example

```typescript
import { describe, it, expect, vi } from "vitest";
import { myApiFunction } from "./my-api";

vi.mock("@/lib/supabase", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe("myApiFunction", () => {
  it("calls Supabase correctly", async () => {
    const result = await myApiFunction("param");
    expect(result).toBeDefined();
  });
});
```

## Mocking

### Supabase Client

```typescript
vi.mock("@/lib/supabase", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      // ... other methods
    })),
  })),
}));
```

### Next.js Router

Next.js router is automatically mocked in `test/setup.ts`:

```typescript
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    // ... other methods
  }),
}));
```

## Best Practices

### 1. Test User Behavior, Not Implementation

```typescript
// ❌ Bad
expect(component.state.count).toBe(1);

// ✅ Good
expect(screen.getByText("Count: 1")).toBeInTheDocument();
```

### 2. Use User Events

```typescript
import userEvent from "@testing-library/user-event";

// ✅ Good - simulates real user interaction
const user = userEvent.setup();
await user.type(input, "Hello");
await user.click(button);
```

### 3. Use Semantic Queries

```typescript
// ✅ Good - accessible and maintainable
screen.getByRole("button", { name: /submit/i });
screen.getByLabelText(/email/i);
screen.getByText(/welcome/i);

// ❌ Avoid - brittle
screen.getByTestId("submit-btn");
```

### 4. Clean Up After Each Test

Cleanup is automatic with our setup in `test/setup.ts`:

```typescript
afterEach(() => {
  cleanup();
});
```

### 5. Mock External Dependencies

Always mock:

- API calls (Supabase)
- Next.js routing
- Third-party libraries
- Browser APIs

### 6. Test Accessibility

```typescript
// Check ARIA labels
expect(screen.getByRole("button")).toHaveAccessibleName("Submit");

// Check keyboard navigation
await user.tab();
expect(button).toHaveFocus();
```

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%
- **Pass Rate**: 100% (non-negotiable)

## Continuous Integration

Tests run automatically on:

- Push to main branch
- Pull requests
- Pre-commit hooks (if configured)

## Troubleshooting

### Tests Timing Out

Increase timeout in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    testTimeout: 10000,
  },
});
```

### Mock Not Working

Ensure mocks are defined before imports:

```typescript
vi.mock('./module')
import { function } from './module' // Import after mock
```

### Async Tests Failing

Always use `waitFor` for async operations:

```typescript
await waitFor(() => {
  expect(screen.getByText("Loaded")).toBeInTheDocument();
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
