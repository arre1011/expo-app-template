import { Platform } from 'react-native';
import {
  ALL_CREATE_STATEMENTS,
  SCHEMA_VERSION,
} from './schema';

const DATABASE_NAME = 'app_template.db';

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

  // Create all tables
  for (const statement of ALL_CREATE_STATEMENTS) {
    await database.execAsync(statement);
  }

  // Check and update schema version
  const versionResult = await database.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1'
  );

  if (!versionResult) {
    // First run - insert schema version
    await database.runAsync(
      'INSERT INTO schema_version (version) VALUES (?)',
      [SCHEMA_VERSION]
    );
  } else if (versionResult.version < SCHEMA_VERSION) {
    // Run migrations if needed
    await runMigrations(database, versionResult.version, SCHEMA_VERSION);
  }
}

/**
 * Run database migrations
 */
async function runMigrations(
  database: DatabaseInterface,
  _fromVersion: number,
  toVersion: number
): Promise<void> {
  // Add future migrations here

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

  await database.execAsync('DROP TABLE IF EXISTS user_profile;');
  await database.execAsync('DROP TABLE IF EXISTS journal_entry;');
  await database.execAsync('DROP TABLE IF EXISTS user_motivations;');
  await database.execAsync('DROP TABLE IF EXISTS schema_version;');

  // Reinitialize
  await initializeDatabase(database);
}
