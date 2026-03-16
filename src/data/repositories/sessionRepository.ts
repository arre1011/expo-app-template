import { getDatabase } from '../database/connection';
import { Session, CreateSession, UpdateSession, SessionWithDrinks, DrinkEntry, DrinkType } from '../../domain/models/types';

interface SessionRow {
  id: number;
  start_time: string;
  end_time: string;
  peak_bac: number;
  peak_time: string;
  total_standard_units: number;
  created_at: string;
  updated_at: string;
}

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

function mapRowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time,
    peakBAC: row.peak_bac,
    peakTime: row.peak_time,
    totalStandardUnits: row.total_standard_units,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
 * Get all sessions ordered by start_time descending (newest first)
 */
export async function getAllSessions(): Promise<Session[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SessionRow>(
    'SELECT * FROM session ORDER BY start_time DESC'
  );
  return rows.map(mapRowToSession);
}

/**
 * Get a single session by ID
 */
export async function getSessionById(id: number): Promise<Session | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SessionRow>(
    'SELECT * FROM session WHERE id = ?',
    [id]
  );
  return row ? mapRowToSession(row) : null;
}

/**
 * Get a session with all its drinks
 */
export async function getSessionWithDrinks(sessionId: number): Promise<SessionWithDrinks | null> {
  const session = await getSessionById(sessionId);
  if (!session) {
    return null;
  }

  const db = await getDatabase();
  const drinkRows = await db.getAllAsync<DrinkEntryRow>(
    'SELECT * FROM drink_entry WHERE session_id = ? ORDER BY timestamp ASC',
    [sessionId]
  );

  return {
    ...session,
    drinks: drinkRows.map(mapRowToDrinkEntry),
  };
}

/**
 * Get the active session (endTime > now), if any
 */
export async function getActiveSession(): Promise<SessionWithDrinks | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const row = await db.getFirstAsync<SessionRow>(
    'SELECT * FROM session WHERE end_time > ? ORDER BY start_time DESC LIMIT 1',
    [now]
  );

  if (!row) {
    return null;
  }

  const session = mapRowToSession(row);
  const drinkRows = await db.getAllAsync<DrinkEntryRow>(
    'SELECT * FROM drink_entry WHERE session_id = ? ORDER BY timestamp ASC',
    [session.id]
  );

  return {
    ...session,
    drinks: drinkRows.map(mapRowToDrinkEntry),
  };
}

/**
 * Get the most recent session (regardless of active status)
 */
export async function getMostRecentSession(): Promise<Session | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SessionRow>(
    'SELECT * FROM session ORDER BY start_time DESC LIMIT 1'
  );
  return row ? mapRowToSession(row) : null;
}

/**
 * Get session that was active at a specific timestamp
 */
export async function getSessionAtTime(timestamp: Date): Promise<Session | null> {
  const db = await getDatabase();
  const timeStr = timestamp.toISOString();

  const row = await db.getFirstAsync<SessionRow>(
    'SELECT * FROM session WHERE start_time <= ? AND end_time >= ? LIMIT 1',
    [timeStr, timeStr]
  );

  return row ? mapRowToSession(row) : null;
}

/**
 * Get adjacent sessions for navigation (previous and next)
 */
export async function getAdjacentSessions(sessionId: number): Promise<{
  previous: Session | null;
  next: Session | null;
}> {
  const session = await getSessionById(sessionId);
  if (!session) {
    return { previous: null, next: null };
  }

  const db = await getDatabase();

  // Previous session: earlier start_time
  const prevRow = await db.getFirstAsync<SessionRow>(
    'SELECT * FROM session WHERE start_time < ? ORDER BY start_time DESC LIMIT 1',
    [session.startTime]
  );

  // Next session: later start_time
  const nextRow = await db.getFirstAsync<SessionRow>(
    'SELECT * FROM session WHERE start_time > ? ORDER BY start_time ASC LIMIT 1',
    [session.startTime]
  );

  return {
    previous: prevRow ? mapRowToSession(prevRow) : null,
    next: nextRow ? mapRowToSession(nextRow) : null,
  };
}

/**
 * Get total count of sessions
 */
export async function getSessionCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM session'
  );
  return result?.count ?? 0;
}

/**
 * Create a new session
 */
export async function createSession(session: CreateSession): Promise<Session> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const result = await db.runAsync(
    `INSERT INTO session (start_time, end_time, peak_bac, peak_time, total_standard_units, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      session.startTime,
      session.endTime,
      session.peakBAC,
      session.peakTime,
      session.totalStandardUnits,
      now,
      now,
    ]
  );

  return {
    id: result.lastInsertRowId,
    ...session,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update a session
 */
export async function updateSession(
  id: number,
  updates: UpdateSession
): Promise<Session | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (updates.startTime !== undefined) {
    fields.push('start_time = ?');
    values.push(updates.startTime);
  }
  if (updates.endTime !== undefined) {
    fields.push('end_time = ?');
    values.push(updates.endTime);
  }
  if (updates.peakBAC !== undefined) {
    fields.push('peak_bac = ?');
    values.push(updates.peakBAC);
  }
  if (updates.peakTime !== undefined) {
    fields.push('peak_time = ?');
    values.push(updates.peakTime);
  }
  if (updates.totalStandardUnits !== undefined) {
    fields.push('total_standard_units = ?');
    values.push(updates.totalStandardUnits);
  }

  if (fields.length === 0) {
    return getSessionById(id);
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  await db.runAsync(
    `UPDATE session SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return getSessionById(id);
}

/**
 * Delete a session
 */
export async function deleteSession(id: number): Promise<void> {
  const db = await getDatabase();
  // First, remove session_id from all drinks
  await db.runAsync(
    'UPDATE drink_entry SET session_id = NULL WHERE session_id = ?',
    [id]
  );
  // Then delete the session
  await db.runAsync('DELETE FROM session WHERE id = ?', [id]);
}

/**
 * Merge two sessions: move all drinks from mergeSessionId to keepSessionId
 * and delete mergeSessionId
 */
export async function mergeSessions(
  keepSessionId: number,
  mergeSessionId: number
): Promise<void> {
  const db = await getDatabase();

  // Move all drinks from merge session to keep session
  await db.runAsync(
    'UPDATE drink_entry SET session_id = ? WHERE session_id = ?',
    [keepSessionId, mergeSessionId]
  );

  // Delete the merged session
  await db.runAsync('DELETE FROM session WHERE id = ?', [mergeSessionId]);
}

/**
 * Get sessions that overlap with a time range
 * Useful for finding sessions when adding a drink at a specific time
 */
export async function getSessionsOverlappingRange(
  startTime: Date,
  endTime: Date
): Promise<Session[]> {
  const db = await getDatabase();
  const startStr = startTime.toISOString();
  const endStr = endTime.toISOString();

  // A session overlaps if:
  // session.start_time <= endTime AND session.end_time >= startTime
  const rows = await db.getAllAsync<SessionRow>(
    `SELECT * FROM session
     WHERE start_time <= ? AND end_time >= ?
     ORDER BY start_time ASC`,
    [endStr, startStr]
  );

  return rows.map(mapRowToSession);
}

/**
 * Get sessions for a specific date (any session that was active on that date)
 */
export async function getSessionsForDate(date: Date): Promise<Session[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return getSessionsOverlappingRange(startOfDay, endOfDay);
}

/**
 * Get sessions that STARTED in a specific month
 * Used for calendar display - returns all sessions whose start_time falls in the given month
 */
export async function getSessionsForMonth(year: number, month: number): Promise<Session[]> {
  const db = await getDatabase();

  const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const rows = await db.getAllAsync<SessionRow>(
    `SELECT * FROM session
     WHERE start_time >= ? AND start_time <= ?
     ORDER BY start_time ASC`,
    [startOfMonth.toISOString(), endOfMonth.toISOString()]
  );

  return rows.map(mapRowToSession);
}

/**
 * Get sessions that STARTED on a specific date
 * Used for calendar day attribution - a session belongs to the day it started
 */
export async function getSessionsStartedOnDate(date: Date): Promise<Session[]> {
  const db = await getDatabase();

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const rows = await db.getAllAsync<SessionRow>(
    `SELECT * FROM session
     WHERE start_time >= ? AND start_time <= ?
     ORDER BY start_time ASC`,
    [startOfDay.toISOString(), endOfDay.toISOString()]
  );

  return rows.map(mapRowToSession);
}

/**
 * Get sessions that STARTED on a specific date with their drinks
 */
export async function getSessionsWithDrinksStartedOnDate(date: Date): Promise<SessionWithDrinks[]> {
  const sessions = await getSessionsStartedOnDate(date);

  const sessionsWithDrinks: SessionWithDrinks[] = [];
  for (const session of sessions) {
    const sessionWithDrinks = await getSessionWithDrinks(session.id);
    if (sessionWithDrinks) {
      sessionsWithDrinks.push(sessionWithDrinks);
    }
  }

  return sessionsWithDrinks;
}

/**
 * Synchronize sessions in the database with calculated session boundaries.
 *
 * This is the key method for the "recalculate all sessions" approach.
 * It replaces all existing sessions with the newly calculated ones.
 *
 * ALGORITHM:
 * 1. Delete all existing sessions
 * 2. Create new sessions from boundaries
 * 3. Update drink-session associations
 *
 * This approach guarantees consistency: the database always reflects
 * the calculated session boundaries.
 *
 * @param boundaries - Calculated session boundaries (from sessionCalculator)
 */
export async function syncSessionsFromBoundaries(
  boundaries: Array<{
    startTime: Date;
    endTime: Date;
    peakBAC: number;
    peakTime: Date;
    totalStandardUnits: number;
    drinks: Array<{ id: number }>;
  }>
): Promise<void> {
  const db = await getDatabase();

  // STEP 1: Clear all drink-session associations
  await db.runAsync('UPDATE drink_entry SET session_id = NULL');

  // STEP 2: Delete all existing sessions
  await db.runAsync('DELETE FROM session');

  // STEP 3: Create new sessions and associate drinks
  for (const boundary of boundaries) {
    // Create the session
    const session = await createSession({
      startTime: boundary.startTime.toISOString(),
      endTime: boundary.endTime.toISOString(),
      peakBAC: boundary.peakBAC,
      peakTime: boundary.peakTime.toISOString(),
      totalStandardUnits: boundary.totalStandardUnits,
    });

    // Associate drinks with this session
    for (const drink of boundary.drinks) {
      await db.runAsync(
        'UPDATE drink_entry SET session_id = ? WHERE id = ?',
        [session.id, drink.id]
      );
    }
  }
}

/**
 * Delete all sessions (for testing or reset purposes)
 */
export async function deleteAllSessions(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE drink_entry SET session_id = NULL');
  await db.runAsync('DELETE FROM session');
}

/**
 * Get sessions that STARTED in a specific year
 * Used for year calendar view
 */
export async function getSessionsForYear(year: number): Promise<Session[]> {
  const db = await getDatabase();

  const startOfYear = new Date(year, 0, 1, 0, 0, 0, 0);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

  const rows = await db.getAllAsync<SessionRow>(
    `SELECT * FROM session
     WHERE start_time >= ? AND start_time <= ?
     ORDER BY start_time ASC`,
    [startOfYear.toISOString(), endOfYear.toISOString()]
  );

  return rows.map(mapRowToSession);
}

/**
 * Get sessions that STARTED within a date range
 * Used for statistics - a session belongs to the period based on its start time
 */
export async function getSessionsForDateRange(startDate: Date, endDate: Date): Promise<Session[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<SessionRow>(
    `SELECT * FROM session
     WHERE start_time >= ? AND start_time <= ?
     ORDER BY start_time ASC`,
    [startDate.toISOString(), endDate.toISOString()]
  );

  return rows.map(mapRowToSession);
}
