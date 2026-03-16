# Test Suite Documentation

This directory contains automated tests for the drink tracking application. These tests ensure that core functionality works correctly and help prevent regressions when making changes.

## Why These Tests Matter

**Problem:** In the past, changes to the codebase broke core functionality:
- Adding drinks sometimes didn't update the calendar or statistics
- Modal for reaching BAC limit appeared, but calendar showed yellow instead of red
- State synchronization issues between different views

**Solution:** These tests catch these issues automatically before they reach production.

## Test Files

### 0. `goalReachedModal.test.tsx` - UI Tests for Goal Reached Modal
**Purpose:** Test the UI and interaction behavior of the limit intervention modal.

**What it tests:**
- Modal visibility based on state
- Button interactions ("Wasser zuerst", "10-Min-Pause", "Trotzdem eintragen")
- Celebration animations
- Correct messaging for "reached" vs "exceeded" states
- Integration with app store actions

**Real-world scenarios covered:**
1. Modal appears when goal is reached ✅
2. Clicking "Trotzdem eintragen" saves the drink ✅
3. Clicking "Wasser zuerst" or "10-Min-Pause" cancels and shows celebration ✅
4. Different messages shown for "reached" vs "exceeded" ✅

---

### 1. `bacCalculator.test.ts` - BAC Calculation Tests
**Purpose:** Verify that blood alcohol concentration calculations are mathematically correct.

**What it tests:**
- Alcohol gram calculations from volume and ABV
- BAC increase calculations based on weight and body water constant
- Absorption and elimination over time
- Time series generation for BAC curves

**When to run:** After any changes to `src/domain/services/bacCalculator.ts`

**Example scenarios:**
```typescript
// 500ml beer at 5% ABV should produce 19.725g alcohol
calculateAlcoholGrams(500, 5) === 19.725

// 20g alcohol for 80kg male (r=0.68) should produce 0.3676‰ BAC
calculateBACIncrease(20, 80, 0.68) === 0.3676
```

---

### 2. `limitLogicConsistency.test.ts` - **Critical Integration Tests**
**Purpose:** Ensure BAC limit checking is consistent across all views (modal trigger vs calendar color).

**Bug History:** This test was created to prevent the bug where:
- `checkBACLimitStatus` used `>=` for limit checking (modal trigger)
- `getDayStatus` used `>` for limit checking (calendar color)
- **Result:** Modal appeared but calendar showed yellow instead of red

**What it tests:**
- Modal triggers when BAC reaches/exceeds limit
- Calendar shows red (over_limit) when modal would trigger
- Calendar shows yellow (moderate) when under limit
- Calendar shows green (sober) when no drinks

**Real-world scenarios covered:**
1. User adds drink that reaches limit → Modal appears + Calendar red ✅
2. User has multiple drinks throughout day → Correct calendar color ✅
3. Limit status is consistent across home, calendar, and statistics ✅

**Example:**
```typescript
// If this triggers a modal...
checkBACLimitStatus(drinks, goal, profile) → "bac_reached"

// ...then calendar must show red, not yellow
getDayStatus(drinks, goal, profile) → "over_limit" ✅
```

---

### 3. `statisticsIntegration.test.ts` - Statistics & Cross-View Consistency
**Purpose:** Verify statistics calculations and that data is consistent across all views.

**Bug History:** Adding or deleting drinks sometimes didn't update calendar/statistics.

**What it tests:**
- Filtering drinks by day and period
- Daily stats: drink count, alcohol grams, peak BAC, goal achievement
- Weekly/monthly stats: drinking days, sober days, goal achievement rate
- **Cross-view consistency:** Same data appears in home, calendar, and statistics

**Real-world scenarios covered:**
1. Add drink → appears in home, calendar, and statistics ✅
2. Delete drink → disappears from all views ✅
3. Drinks from different days don't interfere with each other ✅
4. Period stats aggregate correctly over weeks/months ✅

**Example:**
```typescript
// After adding a drink, it should appear in all views:
addDrink(newDrink)

// Home view
getDrinksForDay(allDrinks, today).length === 1 ✅

// Calendar view
getDayStatus(allDrinks, goal, profile, today) === "moderate" ✅

// Statistics view
calculateDailyStats(allDrinks, goal, profile, today).drinkCount === 1 ✅
```

---

## Additional Test Files (Skipped)

See [ADDITIONAL_TESTS.md](./ADDITIONAL_TESTS.md) for comprehensive tests that were written but are currently skipped due to test environment limitations:

- `addDrinkFlow.test.ts.skip` - Integration tests for fresh data loading and "Trotzdem eintragen" flow
- `addDrinkModal.test.tsx.skip` - UI tests for Add Drink Modal component
- `e2e-drinkFlow.test.tsx.skip` - End-to-end integration tests for complete user workflows

These tests document expected behavior and serve as blueprints for future E2E testing with Detox or Appium.

---

## Running Tests

### Run all tests:
```bash
npm test
```

### Run specific test file:
```bash
npm test bacCalculator.test.ts
npm test limitLogicConsistency.test.ts
npm test statisticsIntegration.test.ts
```

### Run tests in watch mode (auto-rerun on changes):
```bash
npm test -- --watch
```

### Run tests with coverage:
```bash
npm test -- --coverage
```

---

## Test Philosophy

### What We Test
✅ **Domain logic:** BAC calculations, limit checking, statistics
✅ **Integration points:** Consistency between different services
✅ **Real-world scenarios:** User workflows that have caused bugs in the past

### What We Don't Test (Yet)
❌ **UI components:** React components (would require different test setup)
❌ **Database:** Repository layer (would require SQLite mock)
❌ **State management:** Zustand stores (would require React testing library)

---

## When to Write New Tests

**Always write tests when:**
1. **Fixing a bug:** Write a test that reproduces the bug, then fix it
2. **Adding core functionality:** New BAC calculations, limit logic, etc.
3. **Changing business rules:** Changes to goals, thresholds, calculations

**Example workflow:**
```typescript
// 1. Write failing test
it('should handle drinks at midnight correctly', () => {
  const midnight = new Date('2025-01-15T00:00:00');
  const drinks = [createDrink(midnight)];
  expect(getDrinksForDay(drinks, midnight)).toHaveLength(1); // FAILS
});

// 2. Fix the code
// ... make changes to getDrinksForDay ...

// 3. Test passes
npm test // ✅ All tests pass
```

---

## Best Practices

### 1. Test Names Should Be Descriptive
```typescript
// ❌ Bad
it('test 1', () => { ... })

// ✅ Good
it('should show red calendar when BAC equals limit (critical edge case)', () => { ... })
```

### 2. Test Real Scenarios
```typescript
// ✅ Good - tests actual user workflow
it('Scenario: Add drink and verify it appears in all views', () => {
  // Add drink
  const newDrink = createDrink(today);

  // Verify in home view
  expect(todayDrinks).toContain(newDrink);

  // Verify in calendar view
  expect(dayStatus).not.toBe('sober');

  // Verify in statistics view
  expect(dailyStats.drinkCount).toBe(1);
});
```

### 3. Document Why Tests Exist
```typescript
/**
 * Critical Integration Test:
 * This test ensures consistency between BAC limit checking (for modals)
 * and calendar day status display.
 *
 * Bug History:
 * - checkBACLimitStatus used >= for limit checking (modal trigger)
 * - getDayStatus used > for limit checking (calendar color)
 * - This caused modal to appear but calendar showed yellow instead of red
 */
describe('BAC Limit Logic Consistency', () => { ... });
```

---

## Interpreting Test Failures

### Example Failure:
```bash
FAIL __tests__/limitLogicConsistency.test.ts
● BAC Limit Logic Consistency › should show red when at limit
  expect(received).toBe(expected)
  Expected: "over_limit"
  Received: "moderate"
```

**What this means:**
- The calendar is showing yellow (moderate) when it should show red (over_limit)
- This is the exact bug that happened before!
- Someone changed the threshold logic in `getDayStatus`

**How to fix:**
1. Check `src/domain/services/statistics.ts` in the `getDayStatus` function
2. Ensure it uses `>=` for the limit check, not `>`
3. Run tests again to verify fix

---

## Coverage Goals

Current coverage:
- `bacCalculator.ts`: ~95% ✅
- `statistics.ts`: ~90% ✅
- Overall domain logic: ~90% ✅

**Goal:** Maintain >85% coverage for all domain logic.

---

## CI/CD Integration

These tests should run automatically on:
- Every commit (pre-commit hook)
- Every pull request (GitHub Actions)
- Before deployment

**Example GitHub Actions workflow:**
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test
```

---

## Questions?

- **"Test is failing but I didn't change anything!"**
  → Check if you updated dependencies (date-fns, etc.)

- **"How do I test a new feature?"**
  → Look at existing tests for similar features and follow the same pattern

- **"Test is too slow"**
  → Check if you're creating too many mock objects or running expensive calculations

- **"Need help writing a test?"**
  → Ask! Tests are documentation and should be easy to understand.
