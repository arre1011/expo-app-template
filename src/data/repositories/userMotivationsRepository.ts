import { getDatabase } from '../database/connection';
import { UserMotivation, UserMotivations } from '../../domain/models/types';

interface UserMotivationsRow {
  id: number;
  motivations: string;
  created_at: string;
  updated_at: string;
}

function mapRowToUserMotivations(row: UserMotivationsRow): UserMotivations {
  return {
    id: row.id,
    motivations: JSON.parse(row.motivations) as UserMotivation[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get the user motivations (there should be only one)
 */
export async function getUserMotivations(): Promise<UserMotivations | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<UserMotivationsRow>(
    'SELECT * FROM user_motivations LIMIT 1'
  );

  if (!row) {
    return null;
  }

  return mapRowToUserMotivations(row);
}

/**
 * Save user motivations (creates or updates)
 */
export async function saveUserMotivations(motivations: UserMotivation[]): Promise<UserMotivations> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const motivationsJson = JSON.stringify(motivations);

  // Check if motivations already exist
  const existing = await getUserMotivations();

  if (existing) {
    // Update existing
    await db.runAsync(
      'UPDATE user_motivations SET motivations = ?, updated_at = ? WHERE id = ?',
      [motivationsJson, now, existing.id]
    );
    return {
      ...existing,
      motivations,
      updatedAt: now,
    };
  } else {
    // Create new
    const result = await db.runAsync(
      'INSERT INTO user_motivations (motivations, created_at, updated_at) VALUES (?, ?, ?)',
      [motivationsJson, now, now]
    );
    return {
      id: result.lastInsertRowId,
      motivations,
      createdAt: now,
      updatedAt: now,
    };
  }
}

/**
 * Delete user motivations
 */
export async function deleteUserMotivations(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM user_motivations');
}
