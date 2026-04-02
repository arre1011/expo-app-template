export const CREATE_JOURNAL_ENTRY_TABLE = `
  CREATE TABLE IF NOT EXISTS journal_entry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    content TEXT,
    mood TEXT DEFAULT 'good',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export const CREATE_JOURNAL_ENTRY_DATE_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_journal_entry_date ON journal_entry(date);
`;
