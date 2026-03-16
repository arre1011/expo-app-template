import { getDatabase } from '../database/connection';
import { DrinkEntry, CreateDrinkEntry, UpdateDrinkEntry, DrinkType, RecentDrinkTemplate } from '../../domain/models/types';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from 'date-fns';

interface DrinkEntryRow {
  id: number;
  timestamp: string;
  type: string;
  volume_ml: number;
  abv_percent: number;
  label: string | null;
  notes: string | null;
  session_id: number | null;
  created_at: string;
  updated_at: string;
}

function mapRowToDrinkEntry(row: DrinkEntryRow): DrinkEntry {
  return {
    id: row.id,
    timestamp: row.timestamp,
    type: row.type as DrinkType,
    volumeMl: row.volume_ml,
    abvPercent: row.abv_percent,
    label: row.label,
    notes: row.notes,
    sessionId: row.session_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all drink entries
 */
export async function getAllDrinkEntries(): Promise<DrinkEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DrinkEntryRow>(
    'SELECT * FROM drink_entry ORDER BY timestamp DESC'
  );
  return rows.map(mapRowToDrinkEntry);
}

/**
 * Get drink entries for a specific day
 */
export async function getDrinkEntriesForDay(date: Date): Promise<DrinkEntry[]> {
  const db = await getDatabase();
  const start = startOfDay(date).toISOString();
  const end = endOfDay(date).toISOString();

  const rows = await db.getAllAsync<DrinkEntryRow>(
    'SELECT * FROM drink_entry WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC',
    [start, end]
  );
  return rows.map(mapRowToDrinkEntry);
}

/**
 * Get drink entries for a date range
 */
export async function getDrinkEntriesForRange(
  startDate: Date,
  endDate: Date
): Promise<DrinkEntry[]> {
  const db = await getDatabase();
  const start = startOfDay(startDate).toISOString();
  const end = endOfDay(endDate).toISOString();

  const rows = await db.getAllAsync<DrinkEntryRow>(
    'SELECT * FROM drink_entry WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC',
    [start, end]
  );
  return rows.map(mapRowToDrinkEntry);
}

/**
 * Get drink entries for a month
 */
export async function getDrinkEntriesForMonth(year: number, month: number): Promise<DrinkEntry[]> {
  const date = new Date(year, month - 1, 1);
  const start = startOfMonth(date).toISOString();
  const end = endOfMonth(date).toISOString();

  const db = await getDatabase();
  const rows = await db.getAllAsync<DrinkEntryRow>(
    'SELECT * FROM drink_entry WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC',
    [start, end]
  );
  return rows.map(mapRowToDrinkEntry);
}

/**
 * Get a single drink entry by ID
 */
export async function getDrinkEntryById(id: number): Promise<DrinkEntry | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DrinkEntryRow>(
    'SELECT * FROM drink_entry WHERE id = ?',
    [id]
  );

  if (!row) {
    return null;
  }

  return mapRowToDrinkEntry(row);
}

/**
 * Create a new drink entry (without session assignment)
 * For session-aware creation, use createDrinkEntryWithSession
 */
export async function createDrinkEntry(entry: CreateDrinkEntry): Promise<DrinkEntry> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const result = await db.runAsync(
    `INSERT INTO drink_entry (timestamp, type, volume_ml, abv_percent, label, notes, session_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.timestamp,
      entry.type,
      entry.volumeMl,
      entry.abvPercent,
      entry.label,
      entry.notes,
      null, // session_id will be set later by sessionService
      now,
      now,
    ]
  );

  return {
    id: result.lastInsertRowId,
    ...entry,
    sessionId: null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update a drink entry
 */
export async function updateDrinkEntry(
  id: number,
  updates: UpdateDrinkEntry
): Promise<DrinkEntry | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  // Build dynamic update query
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.timestamp !== undefined) {
    fields.push('timestamp = ?');
    values.push(updates.timestamp);
  }
  if (updates.type !== undefined) {
    fields.push('type = ?');
    values.push(updates.type);
  }
  if (updates.volumeMl !== undefined) {
    fields.push('volume_ml = ?');
    values.push(updates.volumeMl);
  }
  if (updates.abvPercent !== undefined) {
    fields.push('abv_percent = ?');
    values.push(updates.abvPercent);
  }
  if (updates.label !== undefined) {
    fields.push('label = ?');
    values.push(updates.label);
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes);
  }

  if (fields.length === 0) {
    return getDrinkEntryById(id);
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  await db.runAsync(
    `UPDATE drink_entry SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return getDrinkEntryById(id);
}

/**
 * Delete a drink entry
 */
export async function deleteDrinkEntry(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM drink_entry WHERE id = ?', [id]);
}

/**
 * Get count of drinks for a specific day
 */
export async function getDrinkCountForDay(date: Date): Promise<number> {
  const db = await getDatabase();
  const start = startOfDay(date).toISOString();
  const end = endOfDay(date).toISOString();

  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM drink_entry WHERE timestamp >= ? AND timestamp <= ?',
    [start, end]
  );

  return result?.count ?? 0;
}

/**
 * Get today's drink entries
 */
export async function getTodayDrinkEntries(): Promise<DrinkEntry[]> {
  return getDrinkEntriesForDay(new Date());
}

/**
 * Get all drink entries from the last N days
 */
export async function getDrinkEntriesForLastDays(days: number): Promise<DrinkEntry[]> {
  const db = await getDatabase();
  const end = endOfDay(new Date());
  const start = startOfDay(new Date(Date.now() - days * 24 * 60 * 60 * 1000));

  const rows = await db.getAllAsync<DrinkEntryRow>(
    'SELECT * FROM drink_entry WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC',
    [start.toISOString(), end.toISOString()]
  );
  return rows.map(mapRowToDrinkEntry);
}

/**
 * Get drink entries for a specific session
 */
export async function getDrinksForSession(sessionId: number): Promise<DrinkEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DrinkEntryRow>(
    'SELECT * FROM drink_entry WHERE session_id = ? ORDER BY timestamp ASC',
    [sessionId]
  );
  return rows.map(mapRowToDrinkEntry);
}

/**
 * Update the session_id for a drink entry
 */
export async function updateDrinkSession(
  drinkId: number,
  sessionId: number | null
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    'UPDATE drink_entry SET session_id = ?, updated_at = ? WHERE id = ?',
    [sessionId, now, drinkId]
  );
}

/**
 * Get all drink entries without a session assignment
 */
export async function getDrinksWithoutSession(): Promise<DrinkEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DrinkEntryRow>(
    'SELECT * FROM drink_entry WHERE session_id IS NULL ORDER BY timestamp ASC'
  );
  return rows.map(mapRowToDrinkEntry);
}

/**
 * Create a drink entry with session assignment
 */
export async function createDrinkEntryWithSession(
  entry: CreateDrinkEntry,
  sessionId: number | null
): Promise<DrinkEntry> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const result = await db.runAsync(
    `INSERT INTO drink_entry (timestamp, type, volume_ml, abv_percent, label, notes, session_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.timestamp,
      entry.type,
      entry.volumeMl,
      entry.abvPercent,
      entry.label,
      entry.notes,
      sessionId,
      now,
      now,
    ]
  );

  return {
    id: result.lastInsertRowId,
    ...entry,
    sessionId,
    createdAt: now,
    updatedAt: now,
  };
}

// Helper to generate a unique ID for a drink template
function generateTemplateId(type: string, volumeMl: number, abvPercent: number, label: string | null): string {
  return `${type}-${volumeMl}-${abvPercent}-${label || 'unlabeled'}`;
}

interface RecentDrinkRow {
  type: string;
  volume_ml: number;
  abv_percent: number;
  label: string | null;
  usage_count: number;
  last_used_at: string;
}

/**
 * Get the timestamp of the earliest drink entry.
 * Used to determine the user's journey start date.
 */
export async function getEarliestDrinkTimestamp(): Promise<string | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ earliest: string | null }>(
    'SELECT MIN(timestamp) as earliest FROM drink_entry'
  );
  return result?.earliest ?? null;
}

/**
 * Get unique drink templates from recent history
 * Groups by (type, volumeMl, abvPercent, label) and counts usage
 * Returns max `limit` templates, sorted by lastUsedAt DESC
 */
export async function getRecentDrinkTemplates(
  limit: number = 10,
  daysBack: number = 30
): Promise<RecentDrinkTemplate[]> {
  const db = await getDatabase();
  const cutoffDate = subDays(new Date(), daysBack).toISOString();

  const rows = await db.getAllAsync<RecentDrinkRow>(
    `SELECT
      type,
      volume_ml,
      abv_percent,
      label,
      COUNT(*) as usage_count,
      MAX(timestamp) as last_used_at
    FROM drink_entry
    WHERE timestamp >= ?
    GROUP BY type, volume_ml, abv_percent, label
    ORDER BY last_used_at DESC
    LIMIT ?`,
    [cutoffDate, limit]
  );

  return rows.map(row => ({
    id: generateTemplateId(row.type, row.volume_ml, row.abv_percent, row.label),
    type: row.type as DrinkType,
    volumeMl: row.volume_ml,
    abvPercent: row.abv_percent,
    label: row.label,
    usageCount: row.usage_count,
    lastUsedAt: row.last_used_at,
  }));
}
