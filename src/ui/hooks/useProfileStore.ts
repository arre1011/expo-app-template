import { create } from 'zustand';
import {
  UserProfile,
  CreateUserProfile,
  UpdateUserProfile,
} from '../../domain/models/types';
import {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
} from '../../data/repositories/userProfileRepository';

interface ProfileState {
  profile: UserProfile | null;
  hasProfile: boolean;
  isProfileLoading: boolean;
  loadProfile: () => Promise<void>;
  saveProfile: (data: CreateUserProfile) => Promise<void>;
  updateProfile: (data: UpdateUserProfile) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  hasProfile: false,
  isProfileLoading: true,

  loadProfile: async () => {
    set({ isProfileLoading: true });

    try {
      const profile = await getUserProfile();
      set({
        profile,
        hasProfile: profile !== null,
        isProfileLoading: false,
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      set({ isProfileLoading: false });
    }
  },

  saveProfile: async (data: CreateUserProfile) => {
    try {
      const profile = await createUserProfile(data);
      set({ profile, hasProfile: true });
    } catch (error) {
      console.error('Failed to save profile:', error);
      throw error;
    }
  },

  updateProfile: async (data: UpdateUserProfile) => {
    const { profile } = get();
    if (!profile) return;

    try {
      const updated = await updateUserProfile(profile.id, data);
      if (updated) {
        set({ profile: updated, hasProfile: true });
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },
}));

export const useProfile = () => useProfileStore(state => state.profile);
export const useHasProfile = () => useProfileStore(state => state.hasProfile);
export const useIsProfileLoading = () => useProfileStore(state => state.isProfileLoading);
