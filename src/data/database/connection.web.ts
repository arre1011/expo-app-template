import { SCHEMA_VERSION } from './schema';

/**
 * Web-compatible in-memory database using localStorage
 * This is a simplified implementation for web testing
 */

interface StorageData {
  userProfile: any | null;
  journalEntries: any[];
  schemaVersion: number;
}

const STORAGE_KEY = 'app_template_db';

function getStorageData(): StorageData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to read from localStorage:', e);
  }
  return {
    userProfile: null,
    journalEntries: [],
    schemaVersion: SCHEMA_VERSION,
  };
}

function saveStorageData(data: StorageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

// Web database mock that mimics expo-sqlite interface
class WebDatabase {
  private data: StorageData;
  private nextId = { userProfile: 1, journalEntry: 1 };

  constructor() {
    this.data = getStorageData();
    if (this.data.userProfile) {
      this.nextId.userProfile = this.data.userProfile.id + 1;
    }
    if (this.data.journalEntries.length > 0) {
      this.nextId.journalEntry = Math.max(...this.data.journalEntries.map(e => e.id)) + 1;
    }
  }

  async execAsync(sql: string): Promise<void> {
    // No-op for schema creation on web
  }

  async runAsync(sql: string, params: any[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
    const sqlLower = sql.toLowerCase();

    if (sqlLower.includes('insert into user_profile')) {
      const id = this.nextId.userProfile++;
      const now = new Date().toISOString();
      this.data.userProfile = {
        id,
        display_name: params[0],
        onboarding_completed: params[1],
        created_at: now,
        updated_at: now,
      };
      saveStorageData(this.data);
      return { lastInsertRowId: id, changes: 1 };
    }

    if (sqlLower.includes('update user_profile')) {
      if (this.data.userProfile) {
        this.data.userProfile.updated_at = new Date().toISOString();
        saveStorageData(this.data);
        return { lastInsertRowId: this.data.userProfile.id, changes: 1 };
      }
      return { lastInsertRowId: 0, changes: 0 };
    }

    return { lastInsertRowId: 0, changes: 0 };
  }

  async getFirstAsync<T>(sql: string, params: any[] = []): Promise<T | null> {
    const sqlLower = sql.toLowerCase();

    if (sqlLower.includes('from user_profile')) {
      return this.data.userProfile as T | null;
    }

    if (sqlLower.includes('from schema_version')) {
      return { version: this.data.schemaVersion } as T;
    }

    return null;
  }

  async getAllAsync<T>(sql: string, params: any[] = []): Promise<T[]> {
    const sqlLower = sql.toLowerCase();

    if (sqlLower.includes('from journal_entry')) {
      return this.data.journalEntries as T[];
    }

    return [];
  }

  async closeAsync(): Promise<void> {
    // No-op for web
  }
}

let db: WebDatabase | null = null;

export async function getDatabase(): Promise<WebDatabase> {
  if (db) {
    return db;
  }
  db = new WebDatabase();
  return db;
}

export async function closeDatabase(): Promise<void> {
  db = null;
}

export async function resetDatabase(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
  db = null;
}
