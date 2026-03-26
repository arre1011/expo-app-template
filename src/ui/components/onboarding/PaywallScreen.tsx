import React from 'react';
import { router } from 'expo-router';
import { PaywallContent } from '../PaywallContent';
import type { PaywallVariantConfig } from '../PaywallContent';
import { useOfferStore } from '../../hooks/useOfferStore';
import { posthog, AnalyticsEvents } from '../../../services/analyticsService';
import { appConfig } from '../../../config/appConfig';
import type { OnboardingScreenProps } from './types';

export function PaywallScreen({ onBack }: OnboardingScreenProps) {
  const offerStore = useOfferStore.getState();
  const isStandard = offerStore.offerType === 'standard';

  // Standard: exactly as before deep link changes — no variantConfig
  if (isStandard) {
    return (
      <PaywallContent
        title={`Unlock the full\n${appConfig.appName} template`}
        subtitle="7-day free trial"
        showBackButton={false}
        onPurchaseSuccess={() => {
          posthog.capture(AnalyticsEvents.ONBOARDING_COMPLETED);
          router.replace('/(tabs)');
        }}
        onBack={onBack}
      />
    );
  }

  // Influencer / Gift: variant-specific config
  const variantConfig: PaywallVariantConfig = {
    variant: offerStore.offerType,
    trialDays: offerStore.trialDays,
    influencerName: offerStore.influencerName,
    showCountdown: false,
  };

  const paywallTitle = offerStore.offerType === 'influencer_trial'
    ? (offerStore.influencerName
        ? `Your exclusive offer\nfrom @${offerStore.influencerName}`
        : 'Your exclusive offer')
    : 'Your template offer is ready.';

  return (
    <PaywallContent
      title={paywallTitle}
      variantConfig={variantConfig}
      showBackButton={false}
      onPurchaseSuccess={() => {
        posthog.capture(AnalyticsEvents.ONBOARDING_COMPLETED, {
          variant: offerStore.offerType,
        });
        router.replace('/(tabs)');
      }}
    />
  );
}
