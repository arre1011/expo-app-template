import { getDatabase } from '../database/connection';
import { JournalEntry, CreateJournalEntry, UpdateJournalEntry, MoodType } from '../../domain/models/types';
import { format } from 'date-fns';

interface JournalEntryRow {
  id: number;
  date: string;
  content: string | null;
  mood: string | null;
  sleep_quality: number | null;
  created_at: string;
  updated_at: string;
}

function mapRowToJournalEntry(row: JournalEntryRow): JournalEntry {
  return {
    id: row.id,
    date: row.date,
    content: row.content,
    mood: row.mood as MoodType | null,
    sleepQuality: row.sleep_quality,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get journal entry for a specific date
 */
export async function getJournalEntryForDate(date: Date): Promise<JournalEntry | null> {
  const db = await getDatabase();
  const dateString = format(date, 'yyyy-MM-dd');

  const row = await db.getFirstAsync<JournalEntryRow>(
    'SELECT * FROM journal_entry WHERE date = ?',
    [dateString]
  );

  if (!row) {
    return null;
  }

  return mapRowToJournalEntry(row);
}

/**
 * Get all journal entries
 */
export async function getAllJournalEntries(): Promise<JournalEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<JournalEntryRow>(
    'SELECT * FROM journal_entry ORDER BY date DESC'
  );
  return rows.map(mapRowToJournalEntry);
}

/**
 * Get journal entries for a date range
 */
export async function getJournalEntriesForRange(
  startDate: Date,
  endDate: Date
): Promise<JournalEntry[]> {
  const db = await getDatabase();
  const start = format(startDate, 'yyyy-MM-dd');
  const end = format(endDate, 'yyyy-MM-dd');

  const rows = await db.getAllAsync<JournalEntryRow>(
    'SELECT * FROM journal_entry WHERE date >= ? AND date <= ? ORDER BY date ASC',
    [start, end]
  );
  return rows.map(mapRowToJournalEntry);
}

/**
 * Create or update a journal entry (upsert)
 */
export async function upsertJournalEntry(entry: CreateJournalEntry): Promise<JournalEntry> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  // Try to get existing entry
  const existing = await getJournalEntryForDate(new Date(entry.date));

  if (existing) {
    // Update existing
    await db.runAsync(
      `UPDATE journal_entry
       SET content = ?, mood = ?, sleep_quality = ?, updated_at = ?
       WHERE id = ?`,
      [entry.content, entry.mood, entry.sleepQuality, now, existing.id]
    );

    return {
      ...existing,
      content: entry.content,
      mood: entry.mood,
      sleepQuality: entry.sleepQuality,
      updatedAt: now,
    };
  } else {
    // Create new
    const result = await db.runAsync(
      `INSERT INTO journal_entry (date, content, mood, sleep_quality, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [entry.date, entry.content, entry.mood, entry.sleepQuality, now, now]
    );

    return {
      id: result.lastInsertRowId,
      ...entry,
      createdAt: now,
      updatedAt: now,
    };
  }
}

/**
 * Update journal entry
 */
export async function updateJournalEntry(
  date: string,
  updates: UpdateJournalEntry
): Promise<JournalEntry | null> {
  const existing = await getJournalEntryForDate(new Date(date));

  if (!existing) {
    return null;
  }

  const updated: CreateJournalEntry = {
    date: existing.date,
    content: updates.content !== undefined ? updates.content : existing.content,
    mood: updates.mood !== undefined ? updates.mood : existing.mood,
    sleepQuality: updates.sleepQuality !== undefined ? updates.sleepQuality : existing.sleepQuality,
  };

  return upsertJournalEntry(updated);
}

/**
 * Delete a journal entry
 */
export async function deleteJournalEntry(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM journal_entry WHERE id = ?', [id]);
}

/**
 * Get today's journal entry
 */
export async function getTodayJournalEntry(): Promise<JournalEntry | null> {
  return getJournalEntryForDate(new Date());
}
