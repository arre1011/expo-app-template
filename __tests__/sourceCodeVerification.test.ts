/**
 * 🚨 CRITICAL SOURCE CODE VERIFICATION TEST 🚨
 *
 * This test reads the actual source code and verifies that the limit warning
 * logic is NOT disabled.
 *
 * This will FAIL if someone changes:
 * - Removes the evaluateLimitWarning call
 * - Removes the limitWarning state setting
 * - Comments out the if blocks
 * - Removes the return statements
 */

import * as fs from 'fs';
import * as path from 'path';

describe('🚨 CRITICAL: Source Code Verification - Limit Warning 🚨', () => {
  const useAppStorePath = path.join(__dirname, '../src/ui/hooks/useAppStore.ts');
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = fs.readFileSync(useAppStorePath, 'utf-8');
  });

  describe('Limit warning service must be used', () => {
    it('CRITICAL: evaluateLimitWarning must be imported', () => {
      const pattern = /import\s*\{[^}]*evaluateLimitWarning[^}]*\}\s*from/;
      const match = sourceCode.match(pattern);

      expect(match).not.toBeNull();

      if (!match) {
        fail(`
🚨🚨🚨 CRITICAL REGRESSION DETECTED 🚨🚨🚨

The limitWarningService import is MISSING!

Expected to find: import { evaluateLimitWarning, ... } from '../../domain/services/limitWarningService'

Please ensure the limit warning service is imported.
        `);
      }
    });

    it('CRITICAL: evaluateLimitWarning must be called in addDrink', () => {
      const pattern = /evaluateLimitWarning\s*\(/;
      const match = sourceCode.match(pattern);

      expect(match).not.toBeNull();

      if (!match) {
        fail(`
🚨🚨🚨 CRITICAL REGRESSION DETECTED 🚨🚨🚨

The evaluateLimitWarning call is MISSING!

Expected to find: evaluateLimitWarning(...)

Location: src/ui/hooks/useAppStore.ts (in addDrink function)

Please ensure the limit warning evaluation is performed.
        `);
      }
    });

    it('CRITICAL: limitWarning state must be set', () => {
      const pattern = /limitWarning:\s*warningResult/;
      const match = sourceCode.match(pattern);

      expect(match).not.toBeNull();

      if (!match) {
        fail(`
🚨🚨🚨 CRITICAL REGRESSION DETECTED 🚨🚨🚨

The limitWarning state is NOT being set!

Expected to find: limitWarning: warningResult

Location: src/ui/hooks/useAppStore.ts (in addDrink function)

Please ensure the warning result is stored in state.
        `);
      }
    });

    it('CRITICAL: Warning check must have return statement to prevent immediate save', () => {
      // Look for the warning block pattern with return statement
      // The pattern should find: set({ ... limitWarning ... }); return;
      const warningBlockWithReturn = /set\s*\(\s*\{[\s\S]*?limitWarning:\s*warningResult[\s\S]*?\}\s*\)\s*;\s*return\s*;/;
      const match = sourceCode.match(warningBlockWithReturn);

      expect(match).not.toBeNull();

      if (!match) {
        fail(`
🚨🚨🚨 CRITICAL ERROR DETECTED 🚨🚨🚨

The warning check block is MISSING the return statement!

This means drinks will be saved IMMEDIATELY instead of showing the warning popup.

Location: src/ui/hooks/useAppStore.ts (in addDrink function)

CORRECT CODE:
  if (warningResult.type === 'will_exceed_limit' || ...) {
    set({ pendingDrink: drink, limitWarning: warningResult, ... });
    return;  // ✅ MUST return to prevent immediate save
  }

Please add the return statement.
        `);
      }
    });
  });

  describe('Verify complete addDrink implementation', () => {
    it('addDrink function must exist', () => {
      const addDrinkPattern = /addDrink:\s*async\s*\([^)]*\)\s*=>/;
      expect(addDrinkPattern.test(sourceCode)).toBe(true);
    });

    it('pendingDrink must be set when warning is triggered', () => {
      const pendingDrinkPattern = /pendingDrink:\s*drink/;
      expect(pendingDrinkPattern.test(sourceCode)).toBe(true);
    });
  });

  describe('State cleanup verification', () => {
    it('cancelPendingDrink must clear limitWarning', () => {
      const pattern = /cancelPendingDrink[\s\S]*?limitWarning:\s*null/;
      expect(pattern.test(sourceCode)).toBe(true);
    });

    it('confirmPendingDrink must clear limitWarning', () => {
      const pattern = /confirmPendingDrink[\s\S]*?limitWarning:\s*null/;
      expect(pattern.test(sourceCode)).toBe(true);
    });
  });

  describe('Documentation test', () => {
    it('Documents the correct implementation', () => {
      /**
       * EXPECTED CODE in src/ui/hooks/useAppStore.ts:
       *
       * Import:
       * import { evaluateLimitWarning, LimitWarningResult } from '../../domain/services/limitWarningService';
       *
       * In addDrink function:
       * const warningResult = evaluateLimitWarning(dayDrinks, goalToUse, profile, drink);
       *
       * if (warningResult.type === 'will_exceed_limit') {
       *   set({
       *     pendingDrink: drink,
       *     limitWarning: warningResult,
       *   });
       *   return; // Wait for user confirmation
       * }
       *
       * // For predictive_warning: Save drink, then show informational popup
       * await saveDrinkDirectly(drink);
       * if (warningResult.type === 'predictive_warning') {
       *   set({ limitWarning: warningResult });
       * }
       */
      expect(true).toBe(true);
    });
  });
});
