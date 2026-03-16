import { DrinkType, DrinkCategory } from '../../domain/models/types';
import { CATEGORY_COLORS, getDrinkById, CUSTOM_DRINK_COLOR, CUSTOM_DRINK_ICON } from '../../domain/constants/drinkCatalog';

// Centralized drink type icons - used across QuickAddBar, RecentDrinksSection, DrinkListItem
export const DRINK_TYPE_ICONS: Record<DrinkType, string> = {
  beer_small: 'beer-outline',
  beer_large: 'beer',
  wine: 'wine-outline',
  longdrink: 'cafe-outline',
  shot: 'flask-outline',
  custom: 'create-outline',
};

// Centralized drink type colors - used across QuickAddBar, RecentDrinksSection, DrinkListItem
export const DRINK_TYPE_COLORS: Record<DrinkType, string> = {
  beer_small: CATEGORY_COLORS.beer,
  beer_large: CATEGORY_COLORS.beer,
  wine: CATEGORY_COLORS.wine,
  longdrink: CATEGORY_COLORS.cocktails,
  shot: CATEGORY_COLORS.spirits,
  custom: CUSTOM_DRINK_COLOR,
};

// Category colors (re-exported for convenience)
export { CATEGORY_COLORS } from '../../domain/constants/drinkCatalog';

// Get icon for any drink (catalog item or legacy DrinkType)
export function getDrinkIcon(drinkId: string): string {
  // First check if it's a catalog item
  const catalogItem = getDrinkById(drinkId);
  if (catalogItem) {
    return catalogItem.icon;
  }

  // Fall back to legacy DrinkType mapping
  if (drinkId in DRINK_TYPE_ICONS) {
    return DRINK_TYPE_ICONS[drinkId as DrinkType];
  }

  return CUSTOM_DRINK_ICON;
}

// Get color for any drink (catalog item or legacy DrinkType)
export function getDrinkColor(drinkId: string): string {
  // First check if it's a catalog item
  const catalogItem = getDrinkById(drinkId);
  if (catalogItem) {
    return catalogItem.color;
  }

  // Fall back to legacy DrinkType mapping
  if (drinkId in DRINK_TYPE_COLORS) {
    return DRINK_TYPE_COLORS[drinkId as DrinkType];
  }

  return CUSTOM_DRINK_COLOR;
}

// Category display configuration (alphabetically sorted)
export const CATEGORY_DISPLAY: Record<DrinkCategory, { label: string; icon: string; color: string }> = {
  beer: { label: 'Beer', icon: 'beer-outline', color: CATEGORY_COLORS.beer },
  cocktails: { label: 'Cocktails', icon: 'cafe-outline', color: CATEGORY_COLORS.cocktails },
  longdrinks: { label: 'Long Drinks', icon: 'pint-outline', color: CATEGORY_COLORS.longdrinks },
  spirits: { label: 'Spirits', icon: 'flask-outline', color: CATEGORY_COLORS.spirits },
  wine: { label: 'Wine', icon: 'wine-outline', color: CATEGORY_COLORS.wine },
};

// Filter chip types for DrinkPicker (simplified: personalized categories only)
export type FilterChipType = 'favorites' | 'recent' | 'all' | 'myDrinks';

// Filter chip configuration
export const FILTER_CHIP_CONFIG: Record<FilterChipType, { label: string; icon: string }> = {
  favorites: { label: 'Favorites', icon: 'star' },
  recent: { label: 'Recent', icon: 'time-outline' },
  all: { label: 'All', icon: 'apps-outline' },
  myDrinks: { label: 'My Drinks', icon: 'person-outline' },
};
