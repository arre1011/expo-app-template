import { getDatabase } from '../database/connection';
import { JournalEntry, CreateJournalEntry, UpdateJournalEntry, MoodType } from '../../domain/models/types';
import { format } from 'date-fns';

interface JournalEntryRow {
  id: number;
  date: string;
  content: string | null;
  mood: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToJournalEntry(row: JournalEntryRow): JournalEntry {
  return {
    id: row.id,
    date: row.date,
    content: row.content,
    mood: row.mood as MoodType | null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getJournalEntryForDate(date: Date): Promise<JournalEntry | null> {
  const db = await getDatabase();
  const dateString = format(date, 'yyyy-MM-dd');
  const row = await db.getFirstAsync<JournalEntryRow>(
    'SELECT * FROM journal_entry WHERE date = ?',
    [dateString]
  );
  return row ? mapRowToJournalEntry(row) : null;
}

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

export async function getJournalEntriesForYear(year: number): Promise<JournalEntry[]> {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  return getJournalEntriesForRange(startDate, endDate);
}

export async function upsertJournalEntry(entry: CreateJournalEntry): Promise<JournalEntry> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const existing = await getJournalEntryForDate(new Date(entry.date));

  if (existing) {
    await db.runAsync(
      `UPDATE journal_entry SET content = ?, mood = ?, updated_at = ? WHERE id = ?`,
      [entry.content, entry.mood, now, existing.id]
    );
    return { ...existing, content: entry.content, mood: entry.mood, updatedAt: now };
  } else {
    const result = await db.runAsync(
      `INSERT INTO journal_entry (date, content, mood, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      [entry.date, entry.content, entry.mood, now, now]
    );
    return { id: result.lastInsertRowId, ...entry, createdAt: now, updatedAt: now };
  }
}

export async function deleteJournalEntry(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM journal_entry WHERE id = ?', [id]);
}
