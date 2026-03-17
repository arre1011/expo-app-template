// Database schema version for migrations
export const SCHEMA_VERSION = 10;

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

export const CREATE_DRINK_ENTRY_TABLE = `
  CREATE TABLE IF NOT EXISTS drink_entry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    type TEXT NOT NULL,
    volume_ml REAL NOT NULL,
    abv_percent REAL NOT NULL,
    label TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export const CREATE_DAILY_GOAL_TABLE = `
  CREATE TABLE IF NOT EXISTS daily_goal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    max_bac REAL NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
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

// Session table for tracking drinking sessions (from first drink until BAC = 0)
export const CREATE_SESSION_TABLE = `
  CREATE TABLE IF NOT EXISTS session (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    peak_bac REAL NOT NULL,
    peak_time TEXT NOT NULL,
    total_standard_units REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export const CREATE_SCHEMA_VERSION_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY
  );
`;

// Indexes for better query performance
export const CREATE_DRINK_ENTRY_TIMESTAMP_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_drink_entry_timestamp ON drink_entry(timestamp);
`;

export const CREATE_DAILY_GOAL_DATE_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_daily_goal_date ON daily_goal(date);
`;

export const CREATE_JOURNAL_ENTRY_DATE_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_journal_entry_date ON journal_entry(date);
`;

// Session indexes
export const CREATE_SESSION_START_TIME_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_session_start_time ON session(start_time);
`;

export const CREATE_SESSION_END_TIME_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_session_end_time ON session(end_time);
`;

// Index for drink_entry session_id
export const CREATE_DRINK_ENTRY_SESSION_ID_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_drink_entry_session_id ON drink_entry(session_id);
`;

// All creation statements in order
// Note: Session-related statements are handled separately in migrations
// to avoid issues with existing databases that don't have session_id column yet
export const ALL_CREATE_STATEMENTS = [
  CREATE_SCHEMA_VERSION_TABLE,
  CREATE_USER_PROFILE_TABLE,
  CREATE_DRINK_ENTRY_TABLE,
  CREATE_DAILY_GOAL_TABLE,
  CREATE_JOURNAL_ENTRY_TABLE,
  CREATE_DRINK_ENTRY_TIMESTAMP_INDEX,
  CREATE_DAILY_GOAL_DATE_INDEX,
  CREATE_JOURNAL_ENTRY_DATE_INDEX,
];

// Session-related statements (only run after migration ensures session_id exists)
export const SESSION_CREATE_STATEMENTS = [
  CREATE_SESSION_TABLE,
  CREATE_SESSION_START_TIME_INDEX,
  CREATE_SESSION_END_TIME_INDEX,
  CREATE_DRINK_ENTRY_SESSION_ID_INDEX,
];

// ========== DrinkPicker Tables (v7) ==========

// Favorite drinks table - stores user's favorited drink IDs
export const CREATE_FAVORITE_DRINK_TABLE = `
  CREATE TABLE IF NOT EXISTS favorite_drink (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    drink_id TEXT NOT NULL UNIQUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export const CREATE_FAVORITE_DRINK_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_favorite_drink_order ON favorite_drink(display_order);
`;

// Custom drinks table - stores user-created drinks
export const CREATE_CUSTOM_DRINK_TABLE = `
  CREATE TABLE IF NOT EXISTS custom_drink (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    volume_ml REAL NOT NULL,
    abv_percent REAL NOT NULL,
    icon TEXT NOT NULL DEFAULT 'create-outline',
    color TEXT NOT NULL DEFAULT '#6B7280',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

// DrinkPicker-related statements (v7+)
export const DRINK_PICKER_CREATE_STATEMENTS = [
  CREATE_FAVORITE_DRINK_TABLE,
  CREATE_FAVORITE_DRINK_INDEX,
  CREATE_CUSTOM_DRINK_TABLE,
];

// ========== User Motivations Table (v8) ==========

// User motivations table - stores user's reasons for using the app
export const CREATE_USER_MOTIVATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS user_motivations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    motivations TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

// User motivations statements (v8+)
export const USER_MOTIVATIONS_CREATE_STATEMENTS = [
  CREATE_USER_MOTIVATIONS_TABLE,
];

// ========== Awards System Tables (v10) ==========

// Award progress table - stores persistent award data
export const CREATE_AWARD_PROGRESS_TABLE = `
  CREATE TABLE IF NOT EXISTS award_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    award_id TEXT NOT NULL UNIQUE,
    best_streak INTEGER NOT NULL DEFAULT 0,
    total_count INTEGER NOT NULL DEFAULT 0,
    last_updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

// Award milestone table - records when user reaches a milestone
export const CREATE_AWARD_MILESTONE_TABLE = `
  CREATE TABLE IF NOT EXISTS award_milestone (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    award_id TEXT NOT NULL,
    milestone_value INTEGER NOT NULL,
    tier TEXT NOT NULL,
    achieved_at TEXT NOT NULL,
    celebrated INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(award_id, milestone_value)
  );
`;

export const CREATE_AWARD_PROGRESS_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_award_progress_id ON award_progress(award_id);
`;

export const CREATE_AWARD_MILESTONE_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_award_milestone_award ON award_milestone(award_id);
`;

// Awards-related statements (v10+)
export const AWARDS_CREATE_STATEMENTS = [
  CREATE_AWARD_PROGRESS_TABLE,
  CREATE_AWARD_MILESTONE_TABLE,
  CREATE_AWARD_PROGRESS_INDEX,
  CREATE_AWARD_MILESTONE_INDEX,
];
