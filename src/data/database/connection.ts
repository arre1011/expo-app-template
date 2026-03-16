import { Platform } from 'react-native';
import {
  ALL_CREATE_STATEMENTS,
  SESSION_CREATE_STATEMENTS,
  DRINK_PICKER_CREATE_STATEMENTS,
  USER_MOTIVATIONS_CREATE_STATEMENTS,
  AWARDS_CREATE_STATEMENTS,
  SCHEMA_VERSION,
  CREATE_SESSION_TABLE,
  CREATE_SESSION_START_TIME_INDEX,
  CREATE_SESSION_END_TIME_INDEX,
  CREATE_DRINK_ENTRY_SESSION_ID_INDEX,
} from './schema';

const DATABASE_NAME = 'drink_tracking.db';

// Type for our database interface (compatible with both native and web)
export interface DatabaseInterface {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: any[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getFirstAsync<T>(sql: string, params?: any[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: any[]): Promise<T[]>;
  closeAsync(): Promise<void>;
}

let db: DatabaseInterface | null = null;

/**
 * Get or create the database connection
 */
export async function getDatabase(): Promise<DatabaseInterface> {
  if (db) {
    return db;
  }

  if (Platform.OS === 'web') {
    // Use web implementation
    const webModule = await import('./connection.web');
    db = await webModule.getDatabase();
    return db;
  }

  // Use native SQLite
  const SQLite = await import('expo-sqlite');
  const nativeDb = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await initializeDatabase(nativeDb as any);
  db = nativeDb as any;
  return db!
}

/**
 * Initialize the database with schema
 */
async function initializeDatabase(database: DatabaseInterface): Promise<void> {
  // Enable WAL mode for better performance
  await database.execAsync('PRAGMA journal_mode = WAL;');

  // Create base tables (without session-related structures)
  for (const statement of ALL_CREATE_STATEMENTS) {
    await database.execAsync(statement);
  }

  // Check and update schema version
  const versionResult = await database.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1'
  );

  if (!versionResult) {
    // First run - create session table and add session_id column
    await database.execAsync('ALTER TABLE drink_entry ADD COLUMN session_id INTEGER REFERENCES session(id);');

    // Create session-related structures
    for (const statement of SESSION_CREATE_STATEMENTS) {
      await database.execAsync(statement);
    }

    // Create DrinkPicker tables (v7+)
    for (const statement of DRINK_PICKER_CREATE_STATEMENTS) {
      await database.execAsync(statement);
    }

    // Create user motivations table (v8+)
    for (const statement of USER_MOTIVATIONS_CREATE_STATEMENTS) {
      await database.execAsync(statement);
    }

    // Create awards tables (v10+)
    for (const statement of AWARDS_CREATE_STATEMENTS) {
      await database.execAsync(statement);
    }

    // Insert schema version
    await database.runAsync(
      'INSERT INTO schema_version (version) VALUES (?)',
      [SCHEMA_VERSION]
    );
  } else if (versionResult.version < SCHEMA_VERSION) {
    // Run migrations if needed
    await runMigrations(database, versionResult.version, SCHEMA_VERSION);
  } else {
    // Database is up to date, ensure session structures exist
    // (they should exist after migration, but this is a safety check)
    for (const statement of SESSION_CREATE_STATEMENTS) {
      await database.execAsync(statement);
    }
    // Ensure DrinkPicker tables exist (v7+)
    for (const statement of DRINK_PICKER_CREATE_STATEMENTS) {
      await database.execAsync(statement);
    }
    // Ensure user motivations table exists (v8+)
    for (const statement of USER_MOTIVATIONS_CREATE_STATEMENTS) {
      await database.execAsync(statement);
    }
    // Ensure awards tables exist (v10+)
    for (const statement of AWARDS_CREATE_STATEMENTS) {
      await database.execAsync(statement);
    }
  }
}

/**
 * Run database migrations
 */
async function runMigrations(
  database: DatabaseInterface,
  fromVersion: number,
  toVersion: number
): Promise<void> {
  // Migration from version 1 to 2: Add max_bac column to daily_goal
  if (fromVersion < 2) {
    await database.execAsync('ALTER TABLE daily_goal ADD COLUMN max_bac REAL;');
  }

  // Migration from version 2 to 3: Remove max_drinks column, make max_bac required
  if (fromVersion < 3) {
    // SQLite doesn't support DROP COLUMN, so we need to recreate the table
    await database.execAsync(`
      CREATE TABLE daily_goal_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        max_bac REAL NOT NULL DEFAULT 0.5,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Copy data (use max_bac if exists, otherwise default to 0.5)
    await database.execAsync(`
      INSERT INTO daily_goal_new (id, date, max_bac, enabled, created_at, updated_at)
      SELECT id, date, COALESCE(max_bac, 0.5), enabled, created_at, updated_at
      FROM daily_goal;
    `);

    // Drop old table
    await database.execAsync('DROP TABLE daily_goal;');

    // Rename new table
    await database.execAsync('ALTER TABLE daily_goal_new RENAME TO daily_goal;');

    // Recreate index
    await database.execAsync('CREATE INDEX IF NOT EXISTS idx_daily_goal_date ON daily_goal(date);');
  }

  // Migration from version 3 to 4: Add session table and session_id to drink_entry
  if (fromVersion < 4) {
    // Create session table
    await database.execAsync(CREATE_SESSION_TABLE);

    // Create session indexes
    await database.execAsync(CREATE_SESSION_START_TIME_INDEX);
    await database.execAsync(CREATE_SESSION_END_TIME_INDEX);

    // Add session_id column to drink_entry
    await database.execAsync('ALTER TABLE drink_entry ADD COLUMN session_id INTEGER REFERENCES session(id);');

    // Create index on session_id
    await database.execAsync(CREATE_DRINK_ENTRY_SESSION_ID_INDEX);

    // Note: Session assignment for existing drinks will be done by the sessionService
    // when the app first loads after migration
  }

  // Migration from version 4 to 5: Add weight_unit column to user_profile
  if (fromVersion < 5) {
    await database.execAsync("ALTER TABLE user_profile ADD COLUMN weight_unit TEXT NOT NULL DEFAULT 'lb';");
  }

  // Migration from version 5 to 6: Add volume_unit column to user_profile
  if (fromVersion < 6) {
    await database.execAsync("ALTER TABLE user_profile ADD COLUMN volume_unit TEXT NOT NULL DEFAULT 'oz';");
  }

  // Migration from version 6 to 7: Add favorite_drink and custom_drink tables for DrinkPicker
  if (fromVersion < 7) {
    for (const statement of DRINK_PICKER_CREATE_STATEMENTS) {
      await database.execAsync(statement);
    }
  }

  // Migration from version 7 to 8: Add user_motivations table
  if (fromVersion < 8) {
    for (const statement of USER_MOTIVATIONS_CREATE_STATEMENTS) {
      await database.execAsync(statement);
    }
  }

  // Migration from version 8 to 9: Add bac_unit column to user_profile
  if (fromVersion < 9) {
    await database.execAsync("ALTER TABLE user_profile ADD COLUMN bac_unit TEXT NOT NULL DEFAULT 'percent';");
  }

  // Migration from version 9 to 10: Add awards system tables
  if (fromVersion < 10) {
    for (const statement of AWARDS_CREATE_STATEMENTS) {
      await database.execAsync(statement);
    }
  }

  // Update schema version
  await database.runAsync(
    'UPDATE schema_version SET version = ?',
    [toVersion]
  );
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

/**
 * Reset the database (for development/testing)
 */
export async function resetDatabase(): Promise<void> {
  if (Platform.OS === 'web') {
    const webModule = await import('./connection.web');
    await webModule.resetDatabase();
    db = null;
    return;
  }

  const database = await getDatabase();

  await database.execAsync('DROP TABLE IF EXISTS drink_entry;');
  await database.execAsync('DROP TABLE IF EXISTS daily_goal;');
  await database.execAsync('DROP TABLE IF EXISTS user_profile;');
  await database.execAsync('DROP TABLE IF EXISTS journal_entry;');
  await database.execAsync('DROP TABLE IF EXISTS session;');
  await database.execAsync('DROP TABLE IF EXISTS favorite_drink;');
  await database.execAsync('DROP TABLE IF EXISTS custom_drink;');
  await database.execAsync('DROP TABLE IF EXISTS user_motivations;');
  await database.execAsync('DROP TABLE IF EXISTS award_milestone;');
  await database.execAsync('DROP TABLE IF EXISTS award_progress;');
  await database.execAsync('DROP TABLE IF EXISTS schema_version;');

  // Reinitialize
  await initializeDatabase(database);
}
