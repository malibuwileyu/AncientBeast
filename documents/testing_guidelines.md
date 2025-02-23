# Testing Guidelines
> Standardized testing patterns for AncientBeast
> Following established patterns from src/__tests__/

## Test File Structure

### Basic Test Layout
```typescript
import { jest, expect, describe, test, beforeEach } from '@jest/globals';
import { TestedComponent } from '../component';

describe('ComponentName', () => {
  // Setup variables
  let component: TestedComponent;
  let mockDependencies;

  // Common setup
  beforeEach(() => {
    mockDependencies = getMockDependencies();
    component = new TestedComponent(mockDependencies);
  });

  // Group related functionality
  describe('core behavior', () => {
    test('handles normal case', () => {
      const result = component.process();
      expect(result).toBeDefined();
    });
  });
});
```

### Mock Data Patterns
Following the established patterns in `creature.ts` tests:

```typescript
// Mock factory functions at top of file
const getMockDependencies = () => ({
  // Match the actual interface
  game: getGameMock(),
  config: getConfigMock()
});

// Specific mock factories
const getGameMock = () => ({
  creatures: [],
  grid: {
    hexes: getHexesMock(),
    orderCreatureZ: jest.fn()
  },
  queue: { 
    update: jest.fn() 
  }
});

// Helper functions for test data
const getRandomString = (length: number) => {
  return Array(length + 1)
    .join((Math.random().toString(36) + '00000000000000000')
    .slice(2, 18))
    .slice(0, length);
};
```

## Test Categories

### 1. Unit Tests
Following patterns from `string.ts` and `version.ts` tests:

```typescript
describe('utility function', () => {
  test('handles basic case', () => {
    expect(zfill(1, 2)).toBe('01');
  });

  test('handles edge case', () => {
    expect(zfill(-1, 3)).toBe('-01');
  });

  test('validates input', () => {
    expect(isValid('0.0.0')).toBe(true);
    expect(isValid('invalid')).toBe(false);
  });
});
```

### 2. Component Tests
Following patterns from `queue.ts` tests:

```typescript
describe('Component', () => {
  test('initializes correctly', () => {
    const element = document.createElement('div');
    const component = new Component(element);
    expect(component).toBeDefined();
    expect(element.innerHTML).toBe('');
  });
});
```

### 3. Integration Tests
Following patterns from `pointfacade.ts` tests:

```typescript
describe('component interactions', () => {
  test('components work together', () => {
    const facade = new PointFacade({
      getCreatures: () => creatures,
      getTraps: () => traps
    });

    const result = facade.getBlockedSet();
    expect(result.has(10, 10)).toBe(true);
  });
});
```

## Test Organization

### 1. File Structure
```
src/
├── __tests__/
│   ├── component.ts      # Tests matching component structure
│   ├── ui/
│   │   └── queue.ts     # UI component tests
│   └── utility/
│       ├── string.ts    # Utility function tests
│       └── version.ts   # Version utility tests
└── component.ts         # Source file
```

### 2. Test Grouping
```typescript
describe('MainComponent', () => {
  // Setup
  beforeEach(() => {
    // Common setup
  });

  // Group by functionality
  describe('initialization', () => {
    test('constructs properly', () => {});
    test('handles invalid config', () => {});
  });

  describe('core operations', () => {
    test('processes input', () => {});
    test('handles errors', () => {});
  });
});
```

## Best Practices

### 1. Mock Usage
```typescript
// Use jest.fn() for function mocks
const mockFn = jest.fn();
mockFn.mockReturnValue(true);

// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Mock minimal required dependencies
const getMinimalMock = () => ({
  required: jest.fn(),
  // Only mock what's needed
});
```

### 2. Type Safety
```typescript
// Use TypeScript for type checking
interface MockConfig {
  value: number;
  callback: () => void;
}

const getMockConfig = (): MockConfig => ({
  value: 1,
  callback: jest.fn()
});

// Test type validation
test('validates types', () => {
  // @ts-ignore - Testing runtime check
  expect(() => process("invalid"))
    .toThrow('Expected number');
});
```

### 3. Test Description
- Use clear, descriptive test names
- Follow "should <expected behavior>" pattern
- Group related tests logically
- Keep tests focused and atomic

### 4. Error Testing
```typescript
describe('error handling', () => {
  test('throws on invalid input', () => {
    expect(() => component.process(null))
      .toThrow('Invalid input');
  });

  test('handles edge cases', () => {
    const input = Number.MAX_SAFE_INTEGER;
    expect(() => component.process(input))
      .not.toThrow();
  });
});
```

## Coverage Requirements

### Minimum Coverage
- Lines: 85%
- Branches: 80%
- Functions: 90%
- Statements: 85%

### Critical Areas
1. Core Game Logic
2. Combat Mechanics
3. State Management
4. User Interactions
5. Data Validation

## Continuous Integration

### Pre-commit Checks
1. All tests pass
2. Coverage thresholds met
3. No TypeScript errors
4. ESLint validation

### Test Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage"
  }
}
``` 