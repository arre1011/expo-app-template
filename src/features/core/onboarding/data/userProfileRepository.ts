import { getDatabase } from '@/infrastructure/sqlite/connection';
import { UserProfile, CreateUserProfile, UpdateUserProfile } from '../types';

interface UserProfileRow {
  id: number;
  display_name: string | null;
  onboarding_completed: number;
  created_at: string;
  updated_at: string;
}

function mapRowToUserProfile(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    onboardingCompleted: row.onboarding_completed === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get the user profile (there should be only one)
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<UserProfileRow>(
    'SELECT * FROM user_profile LIMIT 1'
  );

  if (!row) {
    return null;
  }

  return mapRowToUserProfile(row);
}

/**
 * Create a new user profile
 */
export async function createUserProfile(profile: CreateUserProfile): Promise<UserProfile> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const result = await db.runAsync(
    `INSERT INTO user_profile (display_name, onboarding_completed, created_at, updated_at)
     VALUES (?, ?, ?, ?)`,
    [
      profile.displayName,
      profile.onboardingCompleted ? 1 : 0,
      now,
      now,
    ]
  );

  return {
    id: result.lastInsertRowId,
    ...profile,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update the user profile
 */
export async function updateUserProfile(
  id: number,
  updates: UpdateUserProfile
): Promise<UserProfile | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  // Build dynamic update query
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.displayName !== undefined) {
    fields.push('display_name = ?');
    values.push(updates.displayName);
  }
  if (updates.onboardingCompleted !== undefined) {
    fields.push('onboarding_completed = ?');
    values.push(updates.onboardingCompleted ? 1 : 0);
  }

  if (fields.length === 0) {
    return getUserProfile();
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  await db.runAsync(
    `UPDATE user_profile SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return getUserProfile();
}

/**
 * Delete the user profile
 */
export async function deleteUserProfile(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM user_profile WHERE id = ?', [id]);
}

/**
 * Check if a user profile exists
 */
export async function hasUserProfile(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile !== null;
}
