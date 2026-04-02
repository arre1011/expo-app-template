import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/ui/theme';
import { useProfileStore } from '../state/useProfileStore';
import { useOfferStore } from '@/features/core/subscription/state/useOfferStore';
import { UserMotivation } from '../types';
import { saveUserMotivations } from '../data/userMotivationsRepository';
import { isFeatureEnabled } from '@/config/featureFlags';
import { analytics, AnalyticsEvents } from '@/infrastructure/analytics';

import {
  type OnboardingStep,
  STANDARD_FLOW,
  INFLUENCER_FLOW,
  GIFT_FLOW,
  IntroEmotionalScreen,
  IntroInfluencerScreen,
  ScienceBasedScreen,
  PersonalizationScreen,
  MotivationSelectScreen,
  PrePaywallHookScreen,
  PaywallScreen,
} from '@/features/core/onboarding/components';

function getFlowForOffer(offerType: string): OnboardingStep[] {
  switch (offerType) {
    case 'influencer_trial': return INFLUENCER_FLOW;
    case 'gift': return GIFT_FLOW;
    default: return STANDARD_FLOW;
  }
}

export default function OnboardingScreen() {
  const saveProfile = useProfileStore(state => state.saveProfile);
  const profile = useProfileStore(state => state.profile);
  const offerType = useOfferStore(state => state.offerType);

  const STEPS = getFlowForOffer(offerType);

  // Track onboarding start
  useEffect(() => {
    analytics.track(AnalyticsEvents.ONBOARDING_STARTED);
  }, []);

  // Step management
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(STEPS[0]);
  const currentStepIndex = STEPS.indexOf(currentStep);

  const [selectedPersonalization, setSelectedPersonalization] = useState<'guided' | 'focused' | 'lightweight'>('guided');

  // Motivation state
  const [selectedMotivations, setSelectedMotivations] = useState<UserMotivation[]>([]);

  const ensureTemplateProfile = async () => {
    if (profile) return;

    await saveProfile({
      displayName: null,
      onboardingCompleted: true,
    });
  };

  // ─── Navigation ──────────────────────────────────────
  const goToNextStep = async () => {
    analytics.track(`onboarding_step_${currentStepIndex + 1}_${currentStep}`, {
      step: currentStep,
      step_index: currentStepIndex,
      total_steps: STEPS.length,
    });

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      const nextStep = STEPS[nextIndex];
      if (nextStep === 'paywall' && !isFeatureEnabled('onboardingPaywall')) {
        await ensureTemplateProfile();
        analytics.track(AnalyticsEvents.ONBOARDING_COMPLETED);
        router.replace('/(tabs)');
        return;
      }

      if (nextStep === 'paywall') {
        try {
          await ensureTemplateProfile();
        } catch (error) {
          Alert.alert('Error', error instanceof Error ? error.message : 'Could not prepare onboarding.');
          return;
        }
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
      case 'science_based':
        return <ScienceBasedScreen onNext={goToNextStep} onBack={goToPreviousStep} progress={progress} />;
      case 'personalization':
        return (
          <PersonalizationScreen
            onNext={goToNextStep}
            onBack={canGoBack ? goToPreviousStep : undefined}
            progress={progress}
            selectedOption={selectedPersonalization}
            onOptionSelect={setSelectedPersonalization}
            onSubmit={goToNextStep}
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
      case 'pre_paywall_hook':
        return <PrePaywallHookScreen onNext={goToNextStep} onBack={goToPreviousStep} progress={progress} />;
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
