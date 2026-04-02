import { UserMotivation } from '../types';

/** All possible onboarding step identifiers */
export type OnboardingStep =
  | 'intro_emotional'
  | 'intro_influencer'
  | 'science_based'
  | 'personalization'
  | 'motivation_select'
  | 'pre_paywall_hook'
  | 'paywall';

/** Base props every onboarding screen receives */
export interface OnboardingScreenProps {
  onNext: () => void;
  onBack?: () => void;
  progress: { current: number; total: number };
}

export type PersonalizationOption = 'guided' | 'focused' | 'lightweight';

/** Props for PersonalizationScreen */
export interface PersonalizationScreenProps extends OnboardingScreenProps {
  selectedOption: PersonalizationOption;
  onOptionSelect: (option: PersonalizationOption) => void;
  onSubmit: () => void;
}

/** Props for MotivationSelectScreen */
export interface MotivationSelectScreenProps extends OnboardingScreenProps {
  selectedMotivations: UserMotivation[];
  onMotivationToggle: (motivation: UserMotivation) => void;
  onMotivationsSubmit: () => void;
}
