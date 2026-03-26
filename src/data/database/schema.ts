// Database schema version for migrations
export const SCHEMA_VERSION = 1;

// SQL statements for creating tables
export const CREATE_USER_PROFILE_TABLE = `
  CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    display_name TEXT,
    onboarding_completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

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

export const CREATE_SCHEMA_VERSION_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY
  );
`;

export const CREATE_JOURNAL_ENTRY_DATE_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_journal_entry_date ON journal_entry(date);
`;

// User motivations table
export const CREATE_USER_MOTIVATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS user_motivations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    motivations TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

// All creation statements in order
export const ALL_CREATE_STATEMENTS = [
  CREATE_SCHEMA_VERSION_TABLE,
  CREATE_USER_PROFILE_TABLE,
  CREATE_JOURNAL_ENTRY_TABLE,
  CREATE_JOURNAL_ENTRY_DATE_INDEX,
  CREATE_USER_MOTIVATIONS_TABLE,
];
