import { Tabs, Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProfileStore } from '@/features/core/onboarding/state/useProfileStore';
import { useSubscriptionStore } from '@/features/core/subscription/state/useSubscriptionStore';
import { colors } from '@/ui/theme';
import { featureFlags, isFeatureEnabled } from '@/config/featureFlags';

export default function TabLayout() {
  const hasProfile = useProfileStore(state => state.hasProfile);
  const isLoading = useProfileStore(state => state.isProfileLoading);
  const isProUser = useSubscriptionStore(state => state.isProUser);
  const isSubscriptionLoading = useSubscriptionStore(state => state.isLoading);

  // Redirect to onboarding if no profile
  if (!isLoading && !hasProfile) {
    return <Redirect href="/onboarding" />;
  }

  // Wait for subscription status to be determined
  if (isSubscriptionLoading) {
    return (
      <View style={layoutStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Redirect to subscription wall if no active subscription
  if (isFeatureEnabled('subscriptionRequired') && hasProfile && !isProUser) {
    return <Redirect href="/subscription-wall" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          headerShown: false,
          href: featureFlags.calendarTab ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Statistics',
          headerShown: false,
          href: featureFlags.statisticsTab ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="examples"
        options={{
          title: 'Showcase',
          headerShown: false,
          href: featureFlags.showcaseTab ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="code-slash-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const layoutStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
