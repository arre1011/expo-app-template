export type UserMotivation =
  | 'save_time'
  | 'build_routine'
  | 'reduce_stress'
  | 'feel_better'
  | 'improve_focus'
  | 'stay_consistent'
  | 'reach_personal_goal';

export interface UserMotivations {
  id: number;
  motivations: UserMotivation[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: number;
  displayName: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateUserProfile = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserProfile = Partial<CreateUserProfile>;

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
