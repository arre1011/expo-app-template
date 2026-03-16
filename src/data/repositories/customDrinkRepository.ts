import { getDatabase } from '../database/connection';
import { CustomDrink, CreateCustomDrink } from '../../domain/models/types';

interface CustomDrinkRow {
  id: number;
  name: string;
  volume_ml: number;
  abv_percent: number;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

function mapRowToCustomDrink(row: CustomDrinkRow): CustomDrink {
  return {
    id: row.id,
    name: row.name,
    volumeMl: row.volume_ml,
    abvPercent: row.abv_percent,
    icon: row.icon,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all custom drinks
 */
export async function getAllCustomDrinks(): Promise<CustomDrink[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CustomDrinkRow>(
    'SELECT * FROM custom_drink ORDER BY name ASC'
  );
  return rows.map(mapRowToCustomDrink);
}

/**
 * Get a custom drink by ID
 */
export async function getCustomDrinkById(id: number): Promise<CustomDrink | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CustomDrinkRow>(
    'SELECT * FROM custom_drink WHERE id = ?',
    [id]
  );

  if (!row) {
    return null;
  }

  return mapRowToCustomDrink(row);
}

/**
 * Create a new custom drink
 */
export async function createCustomDrink(drink: CreateCustomDrink): Promise<CustomDrink> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const result = await db.runAsync(
    `INSERT INTO custom_drink (name, volume_ml, abv_percent, icon, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [drink.name, drink.volumeMl, drink.abvPercent, drink.icon, drink.color, now, now]
  );

  return {
    id: result.lastInsertRowId,
    ...drink,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update a custom drink
 */
export async function updateCustomDrink(
  id: number,
  updates: Partial<CreateCustomDrink>
): Promise<CustomDrink | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  // Get current drink
  const current = await getCustomDrinkById(id);
  if (!current) {
    return null;
  }

  // Build dynamic update query
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.volumeMl !== undefined) {
    fields.push('volume_ml = ?');
    values.push(updates.volumeMl);
  }
  if (updates.abvPercent !== undefined) {
    fields.push('abv_percent = ?');
    values.push(updates.abvPercent);
  }
  if (updates.icon !== undefined) {
    fields.push('icon = ?');
    values.push(updates.icon);
  }
  if (updates.color !== undefined) {
    fields.push('color = ?');
    values.push(updates.color);
  }

  if (fields.length === 0) {
    return current;
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  await db.runAsync(
    `UPDATE custom_drink SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return {
    ...current,
    ...updates,
    updatedAt: now,
  };
}

/**
 * Delete a custom drink
 */
export async function deleteCustomDrink(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM custom_drink WHERE id = ?', [id]);
}

/**
 * Get the count of custom drinks
 */
export async function getCustomDrinkCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM custom_drink'
  );
  return row?.count ?? 0;
}

/**
 * Check if a custom drink name already exists
 */
export async function customDrinkNameExists(name: string, excludeId?: number): Promise<boolean> {
  const db = await getDatabase();

  let query = 'SELECT COUNT(*) as count FROM custom_drink WHERE LOWER(name) = LOWER(?)';
  const params: any[] = [name];

  if (excludeId !== undefined) {
    query += ' AND id != ?';
    params.push(excludeId);
  }

  const row = await db.getFirstAsync<{ count: number }>(query, params);
  return (row?.count ?? 0) > 0;
}
