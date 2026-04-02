import { useEffect, useRef, useState } from 'react';
import { Slot, router, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PostHogProvider } from 'posthog-react-native';
import { analytics, posthog, AnalyticsEvents } from '@/infrastructure/analytics';
import { View, ActivityIndicator, StyleSheet, AppState, AppStateStatus, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { useProfileStore } from '@/features/core/onboarding/state/useProfileStore';
import { useSubscriptionStore } from '@/features/core/subscription/state/useSubscriptionStore';
import { useOfferStore } from '@/features/core/subscription/state/useOfferStore';
import { colors } from '@/ui/theme';
import { validateEnv } from '@/config/env';
import { setupNotificationChannel, getPendingReminderType } from '@/infrastructure/notifications';
import { initializeDeepLinkProvider, findDeferredOffer, parseOfferFromUrl } from '@/infrastructure/deep-links';
import { setSubscriberAttributes } from '@/infrastructure/subscriptions';
import { featureFlags, devOfferOverride, devOfferConfig } from '@/config/featureFlags';
import {
  initializeErrorTracking,
  navigationIntegration,
  wrapWithErrorTracking,
} from '@/infrastructure/error-tracking/sentry';

// Configure foreground notification display
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Configure Reanimated logger to suppress strict mode warnings
// These warnings occur because victory-native reads SharedValues during render
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

function RootLayout() {
  const navigationRef = useNavigationContainerRef();
  useEffect(() => {
    if (navigationRef.current) {
      navigationIntegration.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

  const [isReady, setIsReady] = useState(false);
  const loadProfile = useProfileStore(state => state.loadProfile);
  const initializeSubscription = useSubscriptionStore(state => state.initialize);

  // useLastNotificationResponse covers both cases:
  // - Cold start: returns the response that launched the app
  // - Warm start: updates when user taps a notification while app is backgrounded
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  // Track the last handled notification ID to avoid navigating twice on re-renders
  const lastHandledNotifId = useRef<string | null>(null);

  useEffect(() => {
    if (!isReady || !lastNotificationResponse) return;

    const notifId = lastNotificationResponse.notification.request.identifier;
    if (lastHandledNotifId.current === notifId) return;

    const data = lastNotificationResponse.notification.request.content.data;
    const screen = data?.screen;
    if (!screen || typeof screen !== 'string') return;

    lastHandledNotifId.current = notifId;
    const reminderType = data?.reminderType;
    const url =
      reminderType && typeof reminderType === 'string'
        ? `${screen}?type=${reminderType}`
        : screen;
    router.push(url as any);
  }, [isReady, lastNotificationResponse]);

  // Check if trial reminder wrap-up should show on app open (even without tapping notification).
  // Uses fire dates stored in AsyncStorage — no dependency on RevenueCat.
  const checkAppOpenReminder = async () => {
    const reminderType = await getPendingReminderType();
    if (reminderType) {
      router.push(`/trial-reminder?type=${reminderType}` as any);
    }
  };

  // Run on initial app ready (cold start without notification tap)
  useEffect(() => {
    if (!isReady) return;
    // Small delay to let notification tap handler run first (it takes priority)
    const timeout = setTimeout(() => {
      if (!lastHandledNotifId.current) {
        checkAppOpenReminder();
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [isReady]);

  // Refresh subscription status and check for pending reminders when app returns to foreground
  const refreshSubscription = useSubscriptionStore(state => state.refreshCustomerInfo);
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        refreshSubscription();
        await checkAppOpenReminder();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [refreshSubscription]);

  // ─── Deep Link: resolve deferred offers on cold start ────
  useEffect(() => {
    // Dev override: skip provider resolution and force a specific variant
    if (__DEV__ && devOfferOverride) {
      const trialDays = devOfferOverride === 'influencer_trial' ? devOfferConfig.trialDays
        : devOfferOverride === 'gift' ? 0
        : 7;
      useOfferStore.getState().setOffer({
        offerType: devOfferOverride,
        influencerName: devOfferOverride === 'influencer_trial' ? devOfferConfig.influencerName : null,
        trialDays,
        isDeepLinkResolved: true,
      });
      console.log(`🧪 Dev Override: Forcing paywall variant "${devOfferOverride}"`);
      return;
    }

    if (!featureFlags.deepLinkOffers || !featureFlags.deferredDeepLinkMatching) {
      useOfferStore.getState().setOffer({ isDeepLinkResolved: true });
    }
  }, []);

  // ─── Deep Link: handle direct deep links (app already installed) ────
  useEffect(() => {
    if (!isReady || !featureFlags.deepLinkOffers) return;

    const handleUrl = (event: { url: string }) => {
      const offer = parseOfferFromUrl(event.url);
      if (offer) {
        const setOffer = useOfferStore.getState().setOffer;
        setOffer({ ...offer, isDeepLinkResolved: true });
        analytics.track(AnalyticsEvents.DEEP_LINK_OFFER_APPLIED, {
          offer_type: offer.offerType,
          influencer_name: offer.influencerName,
          source: 'direct_link',
        });
        // Set RevenueCat subscriber attributes for influencer attribution
        if (featureFlags.revenueCat) {
          setSubscriberAttributes({
            influencerName: offer.influencerName,
            campaignId: offer.campaignId,
            mediaSource: 'deep_link',
          });
        }
        // Navigate to onboarding (which will show the right paywall variant)
        router.push('/onboarding' as any);
      }
    };

    // Check if app was opened with a URL (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    // Listen for URLs while app is open (warm start)
    const subscription = Linking.addEventListener('url', handleUrl);
    return () => subscription.remove();
  }, [isReady]);

  useEffect(() => {
    async function initialize() {
      try {
        // Validate and log environment variable status
        validateEnv();

        // Set up Android notification channel (no-op on iOS)
        setupNotificationChannel().catch(error => {
          console.error('Notification channel setup failed (non-blocking):', error);
        });

        // Initialize RevenueCat first (async, doesn't block app)
        initializeSubscription().catch(error => {
          console.error('RevenueCat initialization failed (non-blocking):', error);
        });

        // Load core app data
        await loadProfile();

        // Deferred deep link matching is intentionally provider-driven.
        // Direct app links keep working without any external SDK.
        if (featureFlags.deepLinkOffers && featureFlags.deferredDeepLinkMatching) {
          const DEEPLINK_TIMEOUT_MS = 2000;
          const resolveDeepLink = async () => {
            try {
              await initializeDeepLinkProvider();
              const offer = await findDeferredOffer();
              const setOffer = useOfferStore.getState().setOffer;
              if (offer) {
                setOffer({ ...offer, isDeepLinkResolved: true });
                analytics.track(AnalyticsEvents.DEEP_LINK_OFFER_APPLIED, {
                  offer_type: offer.offerType,
                  influencer_name: offer.influencerName,
                  source: 'deferred_link',
                });
                // Set RevenueCat subscriber attributes for influencer attribution
                if (featureFlags.revenueCat) {
                  setSubscriberAttributes({
                    influencerName: offer.influencerName,
                    campaignId: offer.campaignId,
                    mediaSource: 'deep_link',
                  });
                }
              } else {
                setOffer({ isDeepLinkResolved: true });
              }
            } catch {
              useOfferStore.getState().setOffer({ isDeepLinkResolved: true });
            }
          };

          // Race against timeout so slow network doesn't block the app
          Promise.race([
            resolveDeepLink(),
            new Promise<void>((resolve) =>
              setTimeout(() => {
                // If not resolved yet, mark as resolved (standard flow)
                if (!useOfferStore.getState().isDeepLinkResolved) {
                  useOfferStore.getState().setOffer({ isDeepLinkResolved: true });
                }
                resolve();
              }, DEEPLINK_TIMEOUT_MS)
            ),
          ]).catch(() => {
            useOfferStore.getState().setOffer({ isDeepLinkResolved: true });
          });
        }

      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsReady(true);
      }
    }

    initialize();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <PostHogProvider client={posthog}>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <StatusBar style="auto" />
            <Slot />
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </PostHogProvider>
  );
}

initializeErrorTracking();

export default wrapWithErrorTracking(RootLayout);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
