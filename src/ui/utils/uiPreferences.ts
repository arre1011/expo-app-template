import AsyncStorage from '@react-native-async-storage/async-storage';
import { FilterChipType } from '../theme/drinkStyles';

const KEYS = {
  LAST_DRINK_CATEGORY: 'ui_lastDrinkCategory',
} as const;

/**
 * UI Preferences Storage
 *
 * Stores user interface preferences that persist between app sessions.
 * Uses AsyncStorage for simple key-value persistence.
 */

/**
 * Get the last selected drink category tab
 */
export async function getLastDrinkCategory(): Promise<FilterChipType | null> {
  try {
    const value = await AsyncStorage.getItem(KEYS.LAST_DRINK_CATEGORY);
    if (value) {
      return value as FilterChipType;
    }
    return null;
  } catch (error) {
    console.error('Failed to get last drink category:', error);
    return null;
  }
}

/**
 * Save the last selected drink category tab
 */
export async function setLastDrinkCategory(category: FilterChipType): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LAST_DRINK_CATEGORY, category);
  } catch (error) {
    console.error('Failed to save last drink category:', error);
  }
}

// Valid chip types (used to validate saved preferences)
const VALID_CHIP_TYPES: FilterChipType[] = ['favorites', 'recent', 'all', 'myDrinks'];

/**
 * Determine the smart default category based on:
 * 1. Last selected category (if saved and has content)
 * 2. Recent drinks (if any exist)
 * 3. Favorites (if any exist)
 * 4. All (fallback)
 */
export async function getSmartDefaultCategory(
  recentCount: number,
  favoritesCount: number,
  myDrinksCount: number = 0
): Promise<FilterChipType> {
  // First, check if user has a saved preference
  const lastCategory = await getLastDrinkCategory();

  if (lastCategory && VALID_CHIP_TYPES.includes(lastCategory)) {
    // Validate the saved category still makes sense
    if (lastCategory === 'recent' && recentCount > 0) {
      return 'recent';
    }
    if (lastCategory === 'favorites' && favoritesCount > 0) {
      return 'favorites';
    }
    if (lastCategory === 'myDrinks' && myDrinksCount > 0) {
      return 'myDrinks';
    }
    // 'all' is always valid
    if (lastCategory === 'all') {
      return 'all';
    }
  }

  // No saved preference or saved category is empty/invalid - use smart defaults
  // Priority: Recent > Favorites > All
  if (recentCount > 0) {
    return 'recent';
  }
  if (favoritesCount > 0) {
    return 'favorites';
  }

  return 'all';
}
