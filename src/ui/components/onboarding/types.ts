import { Sex, UserMotivation } from '../../../domain/models/types';
import { WeightUnit } from '../../../domain/utils/weightConversion';
import { VolumeUnit } from '../../../domain/utils/volumeConversion';

/** All possible onboarding step identifiers */
export type OnboardingStep =
  | 'intro_emotional'
  | 'intro_influencer'
  | 'intro_not'
  | 'intro_benefits'
  | 'how_monitoring'
  | 'profile_limit'
  | 'profile_sex'
  | 'profile_weight'
  | 'profile_volume'
  | 'motivation_select'
  | 'motivation_partner'
  | 'paywall';

/** Base props every onboarding screen receives */
export interface OnboardingScreenProps {
  onNext: () => void;
  onBack?: () => void;
  progress: { current: number; total: number };
}

/** Props for ProfileSexScreen */
export interface ProfileSexScreenProps extends OnboardingScreenProps {
  sex: Sex;
  onSexChange: (value: Sex) => void;
}

/** Props for ProfileWeightScreen */
export interface ProfileWeightScreenProps extends OnboardingScreenProps {
  weightKg: number;
  weightUnit: WeightUnit;
  onWeightValueChange: (valueKg: number) => void;
  onWeightUnitChange: (unit: WeightUnit) => void;
}

/** Props for ProfileVolumeScreen */
export interface ProfileVolumeScreenProps extends OnboardingScreenProps {
  volumeUnit: VolumeUnit;
  onVolumeUnitChange: (unit: VolumeUnit) => void;
  onSubmitProfile: () => void;
  isLoading: boolean;
}

/** Props for ProfileLimitScreen */
export interface ProfileLimitScreenProps extends OnboardingScreenProps {
  selectedGoalPreset: string;
  onGoalPresetSelect: (presetId: string) => void;
  onGoalSubmit: () => void;
}

/** Props for MotivationSelectScreen */
export interface MotivationSelectScreenProps extends OnboardingScreenProps {
  selectedMotivations: UserMotivation[];
  onMotivationToggle: (motivation: UserMotivation) => void;
  onMotivationsSubmit: () => void;
}
