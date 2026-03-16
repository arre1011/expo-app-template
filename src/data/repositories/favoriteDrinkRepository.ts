import { getDatabase } from '../database/connection';

interface FavoriteDrinkRow {
  id: number;
  drink_id: string;
  display_order: number;
  created_at: string;
}

export interface FavoriteDrink {
  id: number;
  drinkId: string;
  displayOrder: number;
  createdAt: string;
}

function mapRowToFavoriteDrink(row: FavoriteDrinkRow): FavoriteDrink {
  return {
    id: row.id,
    drinkId: row.drink_id,
    displayOrder: row.display_order,
    createdAt: row.created_at,
  };
}

/**
 * Get all favorite drinks ordered by display_order
 */
export async function getAllFavoriteDrinks(): Promise<FavoriteDrink[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<FavoriteDrinkRow>(
    'SELECT * FROM favorite_drink ORDER BY display_order ASC, created_at ASC'
  );
  return rows.map(mapRowToFavoriteDrink);
}

/**
 * Get all favorite drink IDs as a simple string array
 */
export async function getFavoriteDrinkIds(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ drink_id: string }>(
    'SELECT drink_id FROM favorite_drink ORDER BY display_order ASC, created_at ASC'
  );
  return rows.map(row => row.drink_id);
}

/**
 * Check if a drink is favorited
 */
export async function isFavorite(drinkId: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM favorite_drink WHERE drink_id = ?',
    [drinkId]
  );
  return (row?.count ?? 0) > 0;
}

/**
 * Add a drink to favorites
 */
export async function addFavorite(drinkId: string): Promise<FavoriteDrink> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  // Get the next display_order
  const maxOrderRow = await db.getFirstAsync<{ max_order: number | null }>(
    'SELECT MAX(display_order) as max_order FROM favorite_drink'
  );
  const nextOrder = (maxOrderRow?.max_order ?? -1) + 1;

  const result = await db.runAsync(
    `INSERT INTO favorite_drink (drink_id, display_order, created_at)
     VALUES (?, ?, ?)`,
    [drinkId, nextOrder, now]
  );

  return {
    id: result.lastInsertRowId,
    drinkId,
    displayOrder: nextOrder,
    createdAt: now,
  };
}

/**
 * Remove a drink from favorites
 */
export async function removeFavorite(drinkId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM favorite_drink WHERE drink_id = ?', [drinkId]);
}

/**
 * Toggle favorite status - returns the new status (true = now favorited, false = removed)
 */
export async function toggleFavorite(drinkId: string): Promise<boolean> {
  const isFav = await isFavorite(drinkId);

  if (isFav) {
    await removeFavorite(drinkId);
    return false;
  } else {
    await addFavorite(drinkId);
    return true;
  }
}

/**
 * Get the count of favorite drinks
 */
export async function getFavoriteCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM favorite_drink'
  );
  return row?.count ?? 0;
}
