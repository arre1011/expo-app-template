export type WeightUnit = 'kg' | 'lb';
export type VolumeUnit = 'ml' | 'oz';
export type BACUnit = 'permille' | 'percent';

// The template still uses the existing profile table for onboarding gates.
export type Sex = 'male' | 'female' | 'other' | null;

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
  weightKg: number;
  sex: Sex;
  bodyWaterConstantR: number;
  eliminationRatePermillePerHour: number;
  weightUnit: WeightUnit;
  volumeUnit: VolumeUnit;
  bacUnit: BACUnit;
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
