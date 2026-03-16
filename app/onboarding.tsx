import React, { useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../src/ui/theme';
import { useAppStore } from '../src/ui/hooks/useAppStore';
import { useOfferStore } from '../src/ui/hooks/useOfferStore';
import { getRValueForSex, BAC_CONSTANTS } from '../src/domain/constants/defaults';
import { validateUserProfile } from '../src/domain/services/validation';
import { WeightUnit } from '../src/domain/utils/weightConversion';
import { VolumeUnit } from '../src/domain/utils/volumeConversion';
import { BACUnit, percentToPermille } from '../src/domain/utils/bacConversion';
import { Sex, UserMotivation } from '../src/domain/models/types';
import { saveUserMotivations } from '../src/data/repositories/userMotivationsRepository';
import { featureFlags } from '../src/config/featureFlags';
import { posthog, AnalyticsEvents } from '../src/services/analyticsService';

import {
  type OnboardingStep,
  STANDARD_FLOW,
  INFLUENCER_FLOW,
  GIFT_FLOW,
  GOAL_PRESETS,
  IntroEmotionalScreen,
  IntroInfluencerScreen,
  IntroNotScreen,
  IntroBenefitsScreen,
  HowMonitoringScreen,
  ProfileLimitScreen,
  ProfileSexScreen,
  ProfileWeightScreen,
  ProfileVolumeScreen,
  MotivationSelectScreen,
  MotivationPartnerScreen,
  PaywallScreen,
} from '../src/ui/components/onboarding';

type EliminationRate = 'slow' | 'standard' | 'fast';

function getFlowForOffer(offerType: string): OnboardingStep[] {
  switch (offerType) {
    case 'influencer_trial': return INFLUENCER_FLOW;
    case 'gift': return GIFT_FLOW;
    default: return STANDARD_FLOW;
  }
}

export default function OnboardingScreen() {
  const saveProfile = useAppStore(state => state.saveProfile);
  const setTodayGoal = useAppStore(state => state.setTodayGoal);
  const offerType = useOfferStore(state => state.offerType);

  const STEPS = getFlowForOffer(offerType);

  // Track onboarding start
  useState(() => { posthog.capture(AnalyticsEvents.ONBOARDING_STARTED); });

  // Step management
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(STEPS[0]);
  const currentStepIndex = STEPS.indexOf(currentStep);

  // Shared profile state
  const [weightKg, setWeightKg] = useState(75);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>('oz');
  const [bacUnit] = useState<BACUnit>('percent');
  const [sex, setSex] = useState<Sex>(null);
  const [eliminationRate] = useState<EliminationRate>('standard');
  const [isLoading, setIsLoading] = useState(false);

  // Goal state
  const [selectedGoalPreset, setSelectedGoalPreset] = useState<string>('social');

  // Motivation state
  const [selectedMotivations, setSelectedMotivations] = useState<UserMotivation[]>([]);

  // ─── Navigation ──────────────────────────────────────
  const goToNextStep = async () => {
    posthog.capture(`onboarding_step_${currentStepIndex + 1}_${currentStep}`, {
      step: currentStep,
      step_index: currentStepIndex,
      total_steps: STEPS.length,
    });

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      const nextStep = STEPS[nextIndex];
      if (nextStep === 'paywall' && !featureFlags.onboardingPaywall) {
        posthog.capture(AnalyticsEvents.ONBOARDING_COMPLETED);
        router.replace('/(tabs)');
        return;
      }
      setCurrentStep(nextStep);
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  // ─── Handlers ────────────────────────────────────────
  const getEliminationRateValue = (rate: EliminationRate): number => {
    switch (rate) {
      case 'slow': return BAC_CONSTANTS.ELIMINATION_RATE_SLOW;
      case 'standard': return BAC_CONSTANTS.ELIMINATION_RATE_STANDARD;
      case 'fast': return BAC_CONSTANTS.ELIMINATION_RATE_FAST;
    }
  };

  const handleGoalSubmit = async () => {
    const preset = GOAL_PRESETS.find(p => p.id === selectedGoalPreset);
    if (preset) {
      const goalValuePermille = percentToPermille(preset.value);
      try {
        await setTodayGoal(goalValuePermille, true);
      } catch (error) {
        console.error('Failed to save goal:', error);
      }
    }
    goToNextStep();
  };

  const handleMotivationsSubmit = async () => {
    if (selectedMotivations.length > 0) {
      try {
        await saveUserMotivations(selectedMotivations);
      } catch (error) {
        console.error('Failed to save motivations:', error);
      }
    }
    goToNextStep();
  };

  const handleMotivationToggle = (motivation: UserMotivation) => {
    setSelectedMotivations(prev =>
      prev.includes(motivation) ? prev.filter(m => m !== motivation) : [...prev, motivation]
    );
  };

  const handleProfileSubmit = async () => {
    if (sex === null) {
      Alert.alert('Error', 'Please select a biological profile first');
      return;
    }

    const profileData = {
      weightKg,
      sex,
      bodyWaterConstantR: getRValueForSex(sex),
      eliminationRatePermillePerHour: getEliminationRateValue(eliminationRate),
      weightUnit,
      volumeUnit,
      bacUnit,
    };

    const validation = validateUserProfile(profileData);
    if (!validation.isValid) {
      Alert.alert('Error', validation.errors.join('\n'));
      return;
    }

    setIsLoading(true);
    try {
      await saveProfile(profileData);
      goToNextStep();
    } catch {
      Alert.alert('Error', 'Could not save profile.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Shared progress prop ────────────────────────────
  const progress = { current: currentStepIndex, total: STEPS.length };
  const canGoBack = currentStepIndex > 0;

  // ─── Render ──────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      case 'intro_emotional':
        return <IntroEmotionalScreen onNext={goToNextStep} progress={progress} />;
      case 'intro_influencer':
        return <IntroInfluencerScreen onNext={goToNextStep} progress={progress} />;
      case 'intro_not':
        return <IntroNotScreen onNext={goToNextStep} onBack={goToPreviousStep} progress={progress} />;
      case 'intro_benefits':
        return <IntroBenefitsScreen onNext={goToNextStep} onBack={goToPreviousStep} progress={progress} />;
      case 'how_monitoring':
        return <HowMonitoringScreen onNext={goToNextStep} onBack={goToPreviousStep} progress={progress} />;
      case 'profile_limit':
        return (
          <ProfileLimitScreen
            onNext={goToNextStep}
            onBack={canGoBack ? goToPreviousStep : undefined}
            progress={progress}
            selectedGoalPreset={selectedGoalPreset}
            onGoalPresetSelect={setSelectedGoalPreset}
            onGoalSubmit={handleGoalSubmit}
          />
        );
      case 'profile_sex':
        return (
          <ProfileSexScreen
            onNext={goToNextStep}
            onBack={canGoBack ? goToPreviousStep : undefined}
            progress={progress}
            sex={sex}
            onSexChange={setSex}
          />
        );
      case 'profile_weight':
        return (
          <ProfileWeightScreen
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            progress={progress}
            weightKg={weightKg}
            weightUnit={weightUnit}
            onWeightValueChange={setWeightKg}
            onWeightUnitChange={setWeightUnit}
          />
        );
      case 'profile_volume':
        return (
          <ProfileVolumeScreen
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            progress={progress}
            volumeUnit={volumeUnit}
            onVolumeUnitChange={setVolumeUnit}
            onSubmitProfile={handleProfileSubmit}
            isLoading={isLoading}
          />
        );
      case 'motivation_select':
        return (
          <MotivationSelectScreen
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            progress={progress}
            selectedMotivations={selectedMotivations}
            onMotivationToggle={handleMotivationToggle}
            onMotivationsSubmit={handleMotivationsSubmit}
          />
        );
      case 'motivation_partner':
        return <MotivationPartnerScreen onNext={goToNextStep} onBack={goToPreviousStep} progress={progress} />;
      case 'paywall':
        return <PaywallScreen onNext={() => {}} onBack={canGoBack ? goToPreviousStep : undefined} progress={progress} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {renderStep()}
    </SafeAreaView>
  );
}
