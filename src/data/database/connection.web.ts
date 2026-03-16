import { SCHEMA_VERSION } from './schema';

/**
 * Web-compatible in-memory database using localStorage
 * This is a simplified implementation for web testing
 */

interface StorageData {
  userProfile: any | null;
  drinkEntries: any[];
  dailyGoals: any[];
  schemaVersion: number;
}

const STORAGE_KEY = 'drink_tracking_db';

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
    drinkEntries: [],
    dailyGoals: [],
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
  private nextId = { userProfile: 1, drinkEntry: 1, dailyGoal: 1 };

  constructor() {
    this.data = getStorageData();
    // Initialize next IDs based on existing data
    if (this.data.userProfile) {
      this.nextId.userProfile = this.data.userProfile.id + 1;
    }
    if (this.data.drinkEntries.length > 0) {
      this.nextId.drinkEntry = Math.max(...this.data.drinkEntries.map(e => e.id)) + 1;
    }
    if (this.data.dailyGoals.length > 0) {
      this.nextId.dailyGoal = Math.max(...this.data.dailyGoals.map(g => g.id)) + 1;
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
        weight_kg: params[0],
        sex: params[1],
        body_water_constant_r: params[2],
        elimination_rate_permille_per_hour: params[3],
        created_at: now,
        updated_at: now,
      };
      saveStorageData(this.data);
      return { lastInsertRowId: id, changes: 1 };
    }

    if (sqlLower.includes('update user_profile')) {
      if (this.data.userProfile) {
        this.data.userProfile.weight_kg = params[0];
        this.data.userProfile.sex = params[1];
        this.data.userProfile.body_water_constant_r = params[2];
        this.data.userProfile.elimination_rate_permille_per_hour = params[3];
        this.data.userProfile.updated_at = new Date().toISOString();
        saveStorageData(this.data);
        return { lastInsertRowId: this.data.userProfile.id, changes: 1 };
      }
      return { lastInsertRowId: 0, changes: 0 };
    }

    if (sqlLower.includes('insert into drink_entry')) {
      const id = this.nextId.drinkEntry++;
      const now = new Date().toISOString();
      this.data.drinkEntries.push({
        id,
        timestamp: params[0],
        type: params[1],
        volume_ml: params[2],
        abv_percent: params[3],
        label: params[4],
        notes: params[5],
        created_at: now,
        updated_at: now,
      });
      saveStorageData(this.data);
      return { lastInsertRowId: id, changes: 1 };
    }

    if (sqlLower.includes('delete from drink_entry')) {
      const id = params[0];
      const initialLength = this.data.drinkEntries.length;
      this.data.drinkEntries = this.data.drinkEntries.filter(e => e.id !== id);
      saveStorageData(this.data);
      return { lastInsertRowId: 0, changes: initialLength - this.data.drinkEntries.length };
    }

    if (sqlLower.includes('insert into daily_goal') || sqlLower.includes('replace into daily_goal')) {
      const existingIndex = this.data.dailyGoals.findIndex(g => g.date === params[0]);
      const now = new Date().toISOString();

      if (existingIndex >= 0) {
        this.data.dailyGoals[existingIndex] = {
          ...this.data.dailyGoals[existingIndex],
          max_drinks: params[1],
          enabled: params[2] ? 1 : 0,
          updated_at: now,
        };
        saveStorageData(this.data);
        return { lastInsertRowId: this.data.dailyGoals[existingIndex].id, changes: 1 };
      } else {
        const id = this.nextId.dailyGoal++;
        this.data.dailyGoals.push({
          id,
          date: params[0],
          max_drinks: params[1],
          enabled: params[2] ? 1 : 0,
          created_at: now,
          updated_at: now,
        });
        saveStorageData(this.data);
        return { lastInsertRowId: id, changes: 1 };
      }
    }

    return { lastInsertRowId: 0, changes: 0 };
  }

  async getFirstAsync<T>(sql: string, params: any[] = []): Promise<T | null> {
    const sqlLower = sql.toLowerCase();

    if (sqlLower.includes('from user_profile')) {
      return this.data.userProfile as T | null;
    }

    if (sqlLower.includes('from daily_goal') && sqlLower.includes('where date')) {
      const date = params[0];
      const goal = this.data.dailyGoals.find(g => g.date === date);
      return goal as T | null;
    }

    if (sqlLower.includes('from drink_entry') && sqlLower.includes('where id')) {
      const id = params[0];
      const entry = this.data.drinkEntries.find(e => e.id === id);
      return entry as T | null;
    }

    if (sqlLower.includes('count(*)')) {
      if (sqlLower.includes('user_profile')) {
        return { count: this.data.userProfile ? 1 : 0 } as T;
      }
    }

    if (sqlLower.includes('from schema_version')) {
      return { version: this.data.schemaVersion } as T;
    }

    return null;
  }

  async getAllAsync<T>(sql: string, params: any[] = []): Promise<T[]> {
    const sqlLower = sql.toLowerCase();

    if (sqlLower.includes('from drink_entry')) {
      let entries = [...this.data.drinkEntries];

      if (sqlLower.includes('where date(timestamp)')) {
        const date = params[0];
        entries = entries.filter(e => e.timestamp.startsWith(date));
      } else if (sqlLower.includes('between')) {
        const startDate = params[0];
        const endDate = params[1];
        entries = entries.filter(e => e.timestamp >= startDate && e.timestamp <= endDate);
      }

      // Sort by timestamp
      entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

      return entries as T[];
    }

    if (sqlLower.includes('from daily_goal')) {
      let goals = [...this.data.dailyGoals];

      if (sqlLower.includes('between')) {
        const startDate = params[0];
        const endDate = params[1];
        goals = goals.filter(g => g.date >= startDate && g.date <= endDate);
      }

      return goals as T[];
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
