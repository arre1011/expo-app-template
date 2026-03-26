// Database schema version for migrations
export const SCHEMA_VERSION = 1;

// SQL statements for creating tables
export const CREATE_USER_PROFILE_TABLE = `
  CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    weight_kg REAL NOT NULL,
    sex TEXT,
    body_water_constant_r REAL NOT NULL,
    elimination_rate_permille_per_hour REAL NOT NULL,
    weight_unit TEXT NOT NULL DEFAULT 'lb',
    volume_unit TEXT NOT NULL DEFAULT 'oz',
    bac_unit TEXT NOT NULL DEFAULT 'percent',
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
