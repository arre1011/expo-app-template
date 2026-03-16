import { getDatabase } from '../database/connection';
import { UserProfile, CreateUserProfile, UpdateUserProfile, WeightUnit, VolumeUnit, BACUnit, Sex } from '../../domain/models/types';

interface UserProfileRow {
  id: number;
  weight_kg: number;
  sex: string | null;
  body_water_constant_r: number;
  elimination_rate_permille_per_hour: number;
  weight_unit: string;
  volume_unit: string;
  bac_unit: string;
  created_at: string;
  updated_at: string;
}

function mapRowToUserProfile(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    weightKg: row.weight_kg,
    sex: row.sex as Sex,
    bodyWaterConstantR: row.body_water_constant_r,
    eliminationRatePermillePerHour: row.elimination_rate_permille_per_hour,
    weightUnit: (row.weight_unit as WeightUnit) || 'lb',
    volumeUnit: (row.volume_unit as VolumeUnit) || 'oz',
    bacUnit: (row.bac_unit as BACUnit) || 'percent',
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
    `INSERT INTO user_profile (weight_kg, sex, body_water_constant_r, elimination_rate_permille_per_hour, weight_unit, volume_unit, bac_unit, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      profile.weightKg,
      profile.sex,
      profile.bodyWaterConstantR,
      profile.eliminationRatePermillePerHour,
      profile.weightUnit || 'lb',
      profile.volumeUnit || 'oz',
      profile.bacUnit || 'percent',
      now,
      now,
    ]
  );

  return {
    id: result.lastInsertRowId,
    ...profile,
    weightUnit: profile.weightUnit || 'lb',
    volumeUnit: profile.volumeUnit || 'oz',
    bacUnit: profile.bacUnit || 'percent',
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

  if (updates.weightKg !== undefined) {
    fields.push('weight_kg = ?');
    values.push(updates.weightKg);
  }
  if (updates.sex !== undefined) {
    fields.push('sex = ?');
    values.push(updates.sex);
  }
  if (updates.bodyWaterConstantR !== undefined) {
    fields.push('body_water_constant_r = ?');
    values.push(updates.bodyWaterConstantR);
  }
  if (updates.eliminationRatePermillePerHour !== undefined) {
    fields.push('elimination_rate_permille_per_hour = ?');
    values.push(updates.eliminationRatePermillePerHour);
  }
  if (updates.weightUnit !== undefined) {
    fields.push('weight_unit = ?');
    values.push(updates.weightUnit);
  }
  if (updates.volumeUnit !== undefined) {
    fields.push('volume_unit = ?');
    values.push(updates.volumeUnit);
  }
  if (updates.bacUnit !== undefined) {
    fields.push('bac_unit = ?');
    values.push(updates.bacUnit);
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
