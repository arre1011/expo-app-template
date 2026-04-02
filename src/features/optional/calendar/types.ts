export type DayStatus = 'good' | 'moderate' | 'bad' | 'no_data';
export type MoodType = 'good' | 'moderate' | 'bad';

export const MOOD_DEFAULT: MoodType = 'good';

export interface JournalEntry {
  id: number;
  date: string;
  content: string | null;
  mood: MoodType | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateJournalEntry = Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateJournalEntry = Partial<CreateJournalEntry>;
