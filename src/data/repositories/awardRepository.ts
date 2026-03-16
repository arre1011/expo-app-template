/**
 * Award Repository - Database operations for Awards System
 *
 * Handles persistence of:
 * - AwardProgress: Persistent award data (best streak, total count)
 * - AwardMilestone: Records of milestone achievements
 */

import { getDatabase } from '../database/connection';
import {
  AwardId,
  AwardTier,
  AwardProgress,
  AwardMilestone,
} from '../../domain/models/types';
import { getTierForMilestone } from '../../domain/constants/awardDefinitions';

// ============================================================================
// DB Row Types
// ============================================================================

interface AwardProgressRow {
  id: number;
  award_id: string;
  best_streak: number;
  total_count: number;
  last_updated_at: string;
  created_at: string;
  updated_at: string;
}

interface AwardMilestoneRow {
  id: number;
  award_id: string;
  milestone_value: number;
  tier: string;
  achieved_at: string;
  celebrated: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Row Mappers
// ============================================================================

function mapRowToAwardProgress(row: AwardProgressRow): AwardProgress {
  return {
    id: row.id,
    awardId: row.award_id as AwardId,
    bestStreak: row.best_streak,
    totalCount: row.total_count,
    lastUpdatedAt: row.last_updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToAwardMilestone(row: AwardMilestoneRow): AwardMilestone {
  return {
    id: row.id,
    awardId: row.award_id as AwardId,
    milestoneValue: row.milestone_value,
    tier: row.tier as AwardTier,
    achievedAt: row.achieved_at,
    celebrated: row.celebrated === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================================================
// Award Progress CRUD
// ============================================================================

/**
 * Get award progress by award ID
 */
export async function getAwardProgress(awardId: AwardId): Promise<AwardProgress | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<AwardProgressRow>(
    'SELECT * FROM award_progress WHERE award_id = ?',
    [awardId]
  );
  return row ? mapRowToAwardProgress(row) : null;
}

/**
 * Get all award progress records
 */
export async function getAllAwardProgress(): Promise<AwardProgress[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<AwardProgressRow>(
    'SELECT * FROM award_progress ORDER BY award_id ASC'
  );
  return rows.map(mapRowToAwardProgress);
}

/**
 * Create or update award progress (upsert)
 */
export async function upsertAwardProgress(
  awardId: AwardId,
  updates: { bestStreak: number; totalCount: number }
): Promise<AwardProgress> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const existing = await getAwardProgress(awardId);

  if (existing) {
    // Update existing
    await db.runAsync(
      `UPDATE award_progress
       SET best_streak = ?, total_count = ?, last_updated_at = ?, updated_at = ?
       WHERE award_id = ?`,
      [updates.bestStreak, updates.totalCount, now, now, awardId]
    );

    return {
      ...existing,
      bestStreak: updates.bestStreak,
      totalCount: updates.totalCount,
      lastUpdatedAt: now,
      updatedAt: now,
    };
  } else {
    // Create new
    const result = await db.runAsync(
      `INSERT INTO award_progress (award_id, best_streak, total_count, last_updated_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [awardId, updates.bestStreak, updates.totalCount, now, now, now]
    );

    return {
      id: result.lastInsertRowId,
      awardId,
      bestStreak: updates.bestStreak,
      totalCount: updates.totalCount,
      lastUpdatedAt: now,
      createdAt: now,
      updatedAt: now,
    };
  }
}

// ============================================================================
// Award Milestone CRUD
// ============================================================================

/**
 * Get all milestones for an award
 */
export async function getMilestonesForAward(awardId: AwardId): Promise<AwardMilestone[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<AwardMilestoneRow>(
    'SELECT * FROM award_milestone WHERE award_id = ? ORDER BY milestone_value ASC',
    [awardId]
  );
  return rows.map(mapRowToAwardMilestone);
}

/**
 * Get all milestones
 */
export async function getAllMilestones(): Promise<AwardMilestone[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<AwardMilestoneRow>(
    'SELECT * FROM award_milestone ORDER BY achieved_at DESC'
  );
  return rows.map(mapRowToAwardMilestone);
}

/**
 * Get the most recent milestone (for display in widget)
 */
export async function getMostRecentMilestone(): Promise<AwardMilestone | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<AwardMilestoneRow>(
    'SELECT * FROM award_milestone ORDER BY achieved_at DESC LIMIT 1'
  );
  return row ? mapRowToAwardMilestone(row) : null;
}

/**
 * Get uncelebrated milestones
 */
export async function getUncelebratedMilestones(): Promise<AwardMilestone[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<AwardMilestoneRow>(
    'SELECT * FROM award_milestone WHERE celebrated = 0 ORDER BY achieved_at ASC'
  );
  return rows.map(mapRowToAwardMilestone);
}

/**
 * Check if a milestone already exists
 */
export async function milestoneExists(
  awardId: AwardId,
  milestoneValue: number
): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM award_milestone WHERE award_id = ? AND milestone_value = ?',
    [awardId, milestoneValue]
  );
  return (row?.count ?? 0) > 0;
}

/**
 * Create a new milestone record
 */
export async function createMilestone(
  awardId: AwardId,
  milestoneValue: number
): Promise<AwardMilestone> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const tier = getTierForMilestone(awardId, milestoneValue);

  const result = await db.runAsync(
    `INSERT INTO award_milestone (award_id, milestone_value, tier, achieved_at, celebrated, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, ?, ?)`,
    [awardId, milestoneValue, tier, now, now, now]
  );

  return {
    id: result.lastInsertRowId,
    awardId,
    milestoneValue,
    tier,
    achievedAt: now,
    celebrated: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Mark a milestone as celebrated
 */
export async function markMilestoneCelebrated(milestoneId: number): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    'UPDATE award_milestone SET celebrated = 1, updated_at = ? WHERE id = ?',
    [now, milestoneId]
  );
}

/**
 * Mark all milestones for an award as celebrated
 */
export async function markAllMilestonesCelebrated(awardId: AwardId): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    'UPDATE award_milestone SET celebrated = 1, updated_at = ? WHERE award_id = ?',
    [now, awardId]
  );
}

// ============================================================================
// Cleanup/Reset
// ============================================================================

/**
 * Delete all award data (for reset/testing)
 */
export async function deleteAllAwardData(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM award_milestone');
  await db.runAsync('DELETE FROM award_progress');
}
