import { getDatabase } from '../database/connection';
import { DailyGoal, CreateDailyGoal } from '../../domain/models/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

interface DailyGoalRow {
  id: number;
  date: string;
  max_bac: number;
  enabled: number;
  created_at: string;
  updated_at: string;
}

function mapRowToDailyGoal(row: DailyGoalRow): DailyGoal {
  return {
    id: row.id,
    date: row.date,
    maxBAC: row.max_bac,
    enabled: row.enabled === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all daily goals
 */
export async function getAllDailyGoals(): Promise<DailyGoal[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DailyGoalRow>(
    'SELECT * FROM daily_goal ORDER BY date DESC'
  );
  return rows.map(mapRowToDailyGoal);
}

/**
 * Get daily goal for a specific date
 */
export async function getDailyGoalForDate(date: Date): Promise<DailyGoal | null> {
  const db = await getDatabase();
  const dateString = format(date, 'yyyy-MM-dd');

  const row = await db.getFirstAsync<DailyGoalRow>(
    'SELECT * FROM daily_goal WHERE date = ?',
    [dateString]
  );

  if (!row) {
    return null;
  }

  return mapRowToDailyGoal(row);
}

/**
 * Get daily goals for a month
 */
export async function getDailyGoalsForMonth(year: number, month: number): Promise<DailyGoal[]> {
  const db = await getDatabase();
  const date = new Date(year, month - 1, 1);
  const start = format(startOfMonth(date), 'yyyy-MM-dd');
  const end = format(endOfMonth(date), 'yyyy-MM-dd');

  const rows = await db.getAllAsync<DailyGoalRow>(
    'SELECT * FROM daily_goal WHERE date >= ? AND date <= ? ORDER BY date ASC',
    [start, end]
  );
  return rows.map(mapRowToDailyGoal);
}

/**
 * Get daily goals for a date range
 */
export async function getDailyGoalsForRange(
  startDate: Date,
  endDate: Date
): Promise<DailyGoal[]> {
  const db = await getDatabase();
  const start = format(startDate, 'yyyy-MM-dd');
  const end = format(endDate, 'yyyy-MM-dd');

  const rows = await db.getAllAsync<DailyGoalRow>(
    'SELECT * FROM daily_goal WHERE date >= ? AND date <= ? ORDER BY date ASC',
    [start, end]
  );
  return rows.map(mapRowToDailyGoal);
}

/**
 * Create or update a daily goal (upsert)
 */
export async function upsertDailyGoal(goal: CreateDailyGoal): Promise<DailyGoal> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  // Try to get existing goal
  const existing = await getDailyGoalForDate(new Date(goal.date));

  if (existing) {
    // Update existing
    await db.runAsync(
      `UPDATE daily_goal SET max_bac = ?, enabled = ?, updated_at = ? WHERE id = ?`,
      [goal.maxBAC, goal.enabled ? 1 : 0, now, existing.id]
    );

    return {
      ...existing,
      maxBAC: goal.maxBAC,
      enabled: goal.enabled,
      updatedAt: now,
    };
  } else {
    // Create new
    const result = await db.runAsync(
      `INSERT INTO daily_goal (date, max_bac, enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [goal.date, goal.maxBAC, goal.enabled ? 1 : 0, now, now]
    );

    return {
      id: result.lastInsertRowId,
      ...goal,
      createdAt: now,
      updatedAt: now,
    };
  }
}

/**
 * Delete a daily goal
 */
export async function deleteDailyGoal(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM daily_goal WHERE id = ?', [id]);
}

/**
 * Get today's goal
 */
export async function getTodayGoal(): Promise<DailyGoal | null> {
  return getDailyGoalForDate(new Date());
}

/**
 * Set today's goal
 */
export async function setTodayGoal(maxBAC: number, enabled: boolean = true): Promise<DailyGoal> {
  const today = format(new Date(), 'yyyy-MM-dd');
  return upsertDailyGoal({
    date: today,
    maxBAC,
    enabled,
  });
}

/**
 * Get the default goal settings (most recent or default)
 */
export async function getDefaultGoalSettings(): Promise<{ maxBAC: number }> {
  const db = await getDatabase();

  // Get most recent goal
  const row = await db.getFirstAsync<DailyGoalRow>(
    'SELECT * FROM daily_goal ORDER BY date DESC LIMIT 1'
  );

  if (row) {
    return {
      maxBAC: row.max_bac
    };
  }

  // Return default
  return { maxBAC: 0.5 };
}

/**
 * Get daily goals for an entire year
 * Used for year calendar view
 */
export async function getDailyGoalsForYear(year: number): Promise<DailyGoal[]> {
  const db = await getDatabase();
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const rows = await db.getAllAsync<DailyGoalRow>(
    'SELECT * FROM daily_goal WHERE date >= ? AND date <= ? ORDER BY date ASC',
    [start, end]
  );
  return rows.map(mapRowToDailyGoal);
}
