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
