# GymFlow — Testing Strategy

**Version:** 1.0.0  
**Date:** 2026-08-24

---

## Table of Contents

1. [Testing Philosophy](#1-testing-philosophy)
2. [Testing Stack](#2-testing-stack)
3. [Test Layers](#3-test-layers)
4. [Unit Tests](#4-unit-tests)
5. [Integration Tests](#5-integration-tests)
6. [End-to-End Tests](#6-end-to-end-tests)
7. [AI Testing Strategy](#7-ai-testing-strategy)
8. [Offline Testing](#8-offline-testing)
9. [Performance Testing](#9-performance-testing)
10. [Accessibility Testing](#10-accessibility-testing)
11. [Coverage Requirements](#11-coverage-requirements)
12. [CI/CD Test Pipeline](#12-cicd-test-pipeline)

---

## 1. Testing Philosophy

- **Test behavior, not implementation.** Tests should not break when internal code is refactored.
- **Pure functions are fully covered.** All utility functions (BMI, BMR, TDEE, protein, frequency) must have 100% branch coverage.
- **AI outputs are always mocked in tests.** No test should make a live AI API call.
- **External APIs are always mocked in tests.** No test should call ExerciseDB or any third-party API.
- **Database tests use a test database** or in-memory SQLite via Prisma.
- **E2E tests cover critical user journeys** — not every edge case.
- The test suite must complete in **< 5 minutes** on CI.

---

## 2. Testing Stack

| Tool | Purpose | Layer |
|------|---------|-------|
| **Jest** | Test runner + assertions | Unit + Integration |
| **React Testing Library** | Component rendering + user event simulation | Unit (components) |
| **MSW (Mock Service Worker)** | Mock API handlers in tests | Integration (client) |
| **Playwright** | Browser automation | E2E |
| **Prisma Test Utils** | Test database seeding and cleanup | Integration (API) |
| **@testing-library/jest-dom** | Custom DOM matchers | Unit (components) |
| **faker.js** | Test data generation | All layers |
| **axe-core / @axe-core/playwright** | Accessibility testing | E2E |

---

## 3. Test Layers

```
+--------------------------------------------------+
|             E2E Tests (Playwright)               |
|  Full browser flows — ~20 critical journeys      |
+--------------------------------------------------+
+--------------------------------------------------+
|             Integration Tests (Jest)             |
|  API route handlers + service layer + DB         |
+--------------------------------------------------+
+--------------------------------------------------+
|             Unit Tests (Jest + RTL)              |
|  Pure functions + React components + hooks       |
+--------------------------------------------------+
```

---

## 4. Unit Tests

### 4.1 Utility Functions (100% coverage required)

#### BMI Tests (`tests/unit/utils/bmi.test.ts`)

```typescript
describe('calculateBMI', () => {
  it('returns correct BMI for known values', () => {
    expect(calculateBMI({ weightKg: 70, heightCm: 175 })).toBeCloseTo(22.86, 2);
  });
  it('returns correct category for underweight BMI', () => {
    expect(getBMICategory(17.5)).toBe('Underweight');
  });
  it('returns correct category for normal BMI', () => {
    expect(getBMICategory(22)).toBe('Normal weight');
  });
  it('returns correct category for overweight BMI', () => {
    expect(getBMICategory(27)).toBe('Overweight');
  });
  it('returns correct category for obese BMI', () => {
    expect(getBMICategory(32)).toBe('Obese');
  });
  it('handles edge case: height = 0 returns null', () => {
    expect(calculateBMI({ weightKg: 70, heightCm: 0 })).toBeNull();
  });
});
```

#### Calorie Tests (`tests/unit/utils/calories.test.ts`)

```typescript
describe('calculateBMR', () => {
  it('calculates male BMR correctly (Mifflin-St Jeor)', () => {
    // Male: (10 x 80) + (6.25 x 175) - (5 x 30) + 5 = 1818.75
    const bmr = calculateBMR({ weightKg: 80, heightCm: 175, ageYears: 30, sex: 'MALE' });
    expect(bmr).toBeCloseTo(1818.75, 0);
  });
  it('calculates female BMR correctly (Mifflin-St Jeor)', () => {
    // Female: (10 x 60) + (6.25 x 165) - (5 x 25) - 161 = 1370.25
    const bmr = calculateBMR({ weightKg: 60, heightCm: 165, ageYears: 25, sex: 'FEMALE' });
    expect(bmr).toBeCloseTo(1370.25, 0);
  });
});

describe('calculateTDEE', () => {
  it('applies SEDENTARY multiplier (1.2)', () => {
    expect(calculateTDEE({ bmr: 1500, activityLevel: 'SEDENTARY' })).toBeCloseTo(1800, 0);
  });
  it('applies VERY_ACTIVE multiplier (1.725)', () => {
    expect(calculateTDEE({ bmr: 1500, activityLevel: 'VERY_ACTIVE' })).toBeCloseTo(2587.5, 0);
  });
});

describe('calculateCalorieTarget', () => {
  it('applies deficit for WEIGHT_LOSS goal', () => {
    expect(calculateCalorieTarget({ tdee: 2500, goalType: 'WEIGHT_LOSS' })).toBe(2000);
  });
  it('applies surplus for MUSCLE_GAIN goal', () => {
    expect(calculateCalorieTarget({ tdee: 2500, goalType: 'MUSCLE_GAIN' })).toBe(2750);
  });
  it('returns TDEE for CUSTOM goal', () => {
    expect(calculateCalorieTarget({ tdee: 2500, goalType: 'CUSTOM' })).toBe(2500);
  });
});
```

#### Frequency Tests (`tests/unit/utils/frequency.test.ts`)

```typescript
describe('calculateFrequencyPercentage', () => {
  it('returns 100 when all sessions completed', () => {
    expect(calculateFrequencyPercentage({ completed: 5, scheduled: 5 })).toBe(100);
  });
  it('returns 0 when no sessions completed', () => {
    expect(calculateFrequencyPercentage({ completed: 0, scheduled: 5 })).toBe(0);
  });
  it('returns 0 when no sessions scheduled (avoids division by zero)', () => {
    expect(calculateFrequencyPercentage({ completed: 0, scheduled: 0 })).toBe(0);
  });
  it('returns correct percentage', () => {
    expect(calculateFrequencyPercentage({ completed: 3, scheduled: 5 })).toBe(60);
  });
});
```

#### Goal Progress Tests (`tests/unit/utils/goals.test.ts`)

```typescript
describe('computeGoalProgress', () => {
  it('computes weight loss progress correctly', () => {
    const progress = computeGoalProgress({
      type: 'WEIGHT_LOSS',
      startValue: 80,
      currentValue: 75,
      targetValue: 70,
    });
    expect(progress).toBe(50); // 5kg lost of 10kg target = 50%
  });
  it('caps progress at 100%', () => {
    const progress = computeGoalProgress({
      type: 'WEIGHT_LOSS',
      startValue: 80,
      currentValue: 65,
      targetValue: 70,
    });
    expect(progress).toBe(100);
  });
  it('returns 0 when no progress made', () => {
    const progress = computeGoalProgress({
      type: 'WEIGHT_LOSS',
      startValue: 80,
      currentValue: 80,
      targetValue: 70,
    });
    expect(progress).toBe(0);
  });
});
```

### 4.2 Component Tests

```typescript
// tests/unit/components/GoalProgressBar.test.tsx
describe('GoalProgressBar', () => {
  it('renders correct percentage visually', () => {
    render(<GoalProgressBar progressPct={75} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
  });
  it('shows 0% when no progress', () => {
    render(<GoalProgressBar progressPct={0} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
  it('is accessible with aria labels', () => {
    render(<GoalProgressBar progressPct={50} label="Weight Loss Goal" />);
    expect(screen.getByRole('progressbar')).toHaveAccessibleName('Weight Loss Goal');
  });
});
```

---

## 5. Integration Tests

Integration tests call Next.js Route Handlers directly using `fetch` against a test server, with a dedicated test database.

### Setup Pattern

```typescript
// tests/integration/setup.ts
beforeAll(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE users CASCADE`;
  testUser = await createTestUser();
  testSession = await createTestSession(testUser.id);
});

afterEach(async () => {
  await prisma.workoutSession.deleteMany({ where: { userId: testUser.id } });
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

### Key Integration Tests

#### Goal API

```typescript
describe('POST /api/goals', () => {
  it('creates a goal successfully', async () => {
    const res = await POST('/api/goals', { type: 'WEIGHT_LOSS', title: 'Lose 5kg', targetValue: 70 });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ACTIVE');
  });

  it('rejects creating a second active goal', async () => {
    await createActiveGoal(testUser.id);
    const res = await POST('/api/goals', { type: 'MUSCLE_GAIN', title: 'Gain muscle' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('GOAL_ALREADY_ACTIVE');
  });
});
```

#### Session API — Idempotency

```typescript
describe('POST /api/sessions/:id/sets', () => {
  it('idempotently handles duplicate set log from offline sync', async () => {
    const key = 'test-idempotency-key-001';
    const res1 = await POST('/api/sessions/:id/sets', setData, { 'X-Idempotency-Key': key });
    const res2 = await POST('/api/sessions/:id/sets', setData, { 'X-Idempotency-Key': key });
    expect(res1.status).toBe(201);
    expect(res2.status).toBe(200); // Idempotent: returns existing
    const count = await prisma.setLog.count({ where: { idempotencyKey: key } });
    expect(count).toBe(1);
  });
});
```

#### Authorization

```typescript
describe('Authorization', () => {
  it("cannot access another user's session", async () => {
    const otherSession = await createSession(otherUser.id);
    const res = await GET(`/api/sessions/${otherSession.id}`, testUserAuth);
    expect(res.status).toBe(404); // Not 403 — do not reveal existence
  });
});
```

---

## 6. End-to-End Tests

E2E tests run against a fully running application with a test database.

### Critical User Journeys

| Journey | Test File | Priority |
|---------|-----------|----------|
| Registration + onboarding | `e2e/onboarding.spec.ts` | P0 |
| Login and session persistence | `e2e/auth.spec.ts` | P0 |
| Create a workout routine | `e2e/routine.spec.ts` | P0 |
| Start, log sets, finish workout | `e2e/workout-execution.spec.ts` | P0 |
| View workout history | `e2e/history.spec.ts` | P1 |
| Set and track a goal | `e2e/goals.spec.ts` | P1 |
| Log body weight and view chart | `e2e/weight.spec.ts` | P1 |
| View weekly statistics | `e2e/stats.spec.ts` | P1 |
| Browse exercise library | `e2e/exercises.spec.ts` | P2 |
| AI routine optimization flow | `e2e/ai-optimize.spec.ts` | P2 |
| Install PWA prompt | `e2e/pwa.spec.ts` | P2 |
| Offline set logging | `e2e/offline.spec.ts` | P2 |
| GDPR data export | `e2e/gdpr.spec.ts` | P2 |

### E2E Test Example

```typescript
// tests/e2e/workout-execution.spec.ts
test('User can complete a full workout session', async ({ page }) => {
  await loginAs(page, testUser);
  await page.goto('/dashboard');

  // Start workout
  await page.getByRole('button', { name: 'Start Workout' }).click();
  await expect(page).toHaveURL(/\/workout\/execute/);

  // Log first set
  await page.getByLabel('Actual Reps').fill('10');
  await page.getByLabel('Weight (kg)').fill('80');
  await page.getByRole('button', { name: 'Log Set' }).click();
  await expect(page.getByText('Set 1 logged')).toBeVisible();

  // Finish workout
  await page.getByRole('button', { name: 'Finish Workout' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('Workout Complete')).toBeVisible();
});
```

---

## 7. AI Testing Strategy

**Rule: No test makes a live AI API call.**

### Mock Strategy

```typescript
// tests/mocks/ai.mock.ts
jest.mock('@/lib/ai/client', () => ({
  aiProvider: { /* mock AI provider */ },
}));

export const mockRoutineOptimizationResponse: RoutineOptimizationOutput = {
  suggestions: [{ dayId: 'test-day-id', suggestedOrder: ['ex1', 'ex2'], rationale: 'Mock' }],
  imbalances: [],
  substitutions: [],
};
```

### What to Test for AI Features

1. **Zod validation rejects malformed AI output** — test the validator with invalid shapes.
2. **Route handler returns 503 when AI service throws** — test error handling.
3. **Route handler returns 200 with validated data on success** — happy path.
4. **Domain validation rejects hallucinated IDs** — test DB existence check.
5. **Rate limiting blocks requests after limit** — test with mocked Redis.
6. **User can reject AI suggestion without data mutation** — E2E test.

---

## 8. Offline Testing

### Strategy

1. Playwright offline emulation: `await context.setOffline(true)`.
2. Test that sets logged offline are saved to IndexedDB.
3. Test that going back online triggers sync.
4. Test idempotency key prevents duplicate sets.

```typescript
test('Sets logged offline sync on reconnect', async ({ page, context }) => {
  await loginAs(page, testUser);
  await page.goto('/workout/execute');

  // Go offline
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Log Set' }).click();
  await expect(page.getByText('Pending sync')).toBeVisible();

  // Restore connection
  await context.setOffline(false);
  await page.waitForTimeout(2000); // Wait for sync
  await expect(page.getByText('Synced')).toBeVisible();
});
```

---

## 9. Performance Testing

### Lighthouse CI

Run Lighthouse CI on every PR:

```yaml
# .github/workflows/lighthouse.yml
- name: Run Lighthouse
  uses: treosh/lighthouse-ci-action@v11
  with:
    urls: |
      http://localhost:3000/dashboard
      http://localhost:3000/workout/execute
    budgetPath: ./.lighthouserc.json
```

### Performance Budgets

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "first-contentful-paint": ["warn", { "maxNumericValue": 2000 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["warn", { "maxNumericValue": 300 }]
      }
    }
  }
}
```

---

## 10. Accessibility Testing

### Automated

- `@axe-core/playwright` runs on all E2E tests.
- Zero critical or serious violations allowed.

```typescript
test('Dashboard has no accessibility violations', async ({ page }) => {
  await page.goto('/dashboard');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
});
```

### Manual Checklist (per release)

- [ ] Keyboard navigation through all core flows
- [ ] Screen reader test (VoiceOver + NVDA) for workout execution
- [ ] Color contrast verified in light and dark mode
- [ ] Focus indicators visible on all interactive elements
- [ ] Form errors announced to screen readers

---

## 11. Coverage Requirements

| Layer | Minimum Coverage |
|-------|----------------|
| `src/lib/utils/` | 100% branch coverage |
| `src/lib/services/` | 80% coverage |
| `src/app/api/` (route handlers) | 80% coverage |
| `src/components/` | 60% coverage |
| Critical paths (auth, goal constraints) | 100% coverage |

### Jest Configuration

```json
{
  "coverageThreshold": {
    "./src/lib/utils/": { "branches": 100, "lines": 100 },
    "./src/lib/services/": { "branches": 80, "lines": 80 },
    "global": { "branches": 70, "lines": 75 }
  }
}
```

---

## 12. CI/CD Test Pipeline

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    steps:
      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm run test:unit -- --coverage

      - name: Integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - name: E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:3000

      - name: Lighthouse CI
        run: npm run test:lighthouse
```

### Test Scripts (package.json)

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:e2e": "playwright test",
    "test:coverage": "jest --coverage",
    "test:lighthouse": "lhci autorun"
  }
}
```
