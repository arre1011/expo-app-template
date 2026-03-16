/**
 * Trial Reminder Screen
 *
 * Shown when the user taps a trial reminder notification.
 * Shows the user's full journey: sessions with BAC charts,
 * calendar heatmap, and statistics to demonstrate app value.
 *
 * Layout follows ethical UX: cancel visible early (transparency),
 * journey recap below, cancel again at bottom (FTC/EU compliant).
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, isSameDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../src/ui/theme';
import { requestStoreReview } from '../src/services/storeReviewService';
import { markReminderDismissed } from '../src/services/notificationService';
import { BACChart, DrinkListItem, Card } from '../src/ui/components';
import { YearView } from '../src/ui/components/YearView';
import { useSubscriptionStatus } from '../src/ui/hooks/useSubscriptionStore';
import { useAppStore, useBACUnit } from '../src/ui/hooks/useAppStore';
import { getAllDrinkEntries } from '../src/data/repositories/drinkEntryRepository';
import {
  getAllSessions,
  getSessionWithDrinks,
} from '../src/data/repositories/sessionRepository';
import { getDailyGoalsForRange } from '../src/data/repositories/dailyGoalRepository';
import { calculateBACTimeSeries } from '../src/domain/services/bacCalculator';
import { calculatePeriodStats } from '../src/domain/services/statistics';
import { SessionWithDrinks, BACTimeSeries, PeriodStats } from '../src/domain/models/types';
import { DEFAULT_DAILY_GOAL } from '../src/domain/constants/defaults';
import { formatBACValue, getBACUnitSymbol } from '../src/domain/utils/bacConversion';
import { posthog, AnalyticsEvents } from '../src/services/analyticsService';

// ─── Types ────────────────────────────────────────────────────

interface SessionDisplay {
  session: SessionWithDrinks;
  timeSeries: BACTimeSeries;
}

// ─── Component ────────────────────────────────────────────────

export default function TrialReminderScreen() {
  useState(() => { posthog.capture(AnalyticsEvents.WRAP_UP_VIEWED); });
  const { type } = useLocalSearchParams<{ type?: string }>();
  const subscriptionStatus = useSubscriptionStatus();
  const { profile, todayGoal } = useAppStore();
  const bacUnit = useBACUnit();
  const unitSymbol = getBACUnitSymbol(bacUnit);

  const [sessions, setSessions] = useState<SessionDisplay[]>([]);
  const [periodStats, setPeriodStats] = useState<PeriodStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const bacLimit = todayGoal?.maxBAC ?? DEFAULT_DAILY_GOAL.maxBAC;

  useEffect(() => {
    loadJourneyData();
  }, []);

  const loadJourneyData = async () => {
    try {
      const [allSessions, allDrinks] = await Promise.all([
        getAllSessions(),
        getAllDrinkEntries(),
      ]);

      // Load last 10 sessions with drinks and BAC time series
      const recentSessions = allSessions.slice(0, 10);

      if (profile && recentSessions.length > 0) {
        const sessionDisplays = await Promise.all(
          recentSessions.map(async (session) => {
            const withDrinks = await getSessionWithDrinks(session.id);
            if (!withDrinks || withDrinks.drinks.length === 0) return null;
            const timeSeries = calculateBACTimeSeries(withDrinks.drinks, profile);
            return { session: withDrinks, timeSeries };
          })
        );
        setSessions(sessionDisplays.filter((s): s is SessionDisplay => s !== null));
      }

      // Calculate period stats (all time)
      if (profile && allDrinks.length > 0) {
        const firstDrinkDate = new Date(
          allDrinks.reduce((min, d) =>
            d.timestamp < min ? d.timestamp : min, allDrinks[0].timestamp
          )
        );
        const today = new Date();
        const goals = await getDailyGoalsForRange(firstDrinkDate, today);
        const stats = calculatePeriodStats(
          allDrinks, goals, profile, firstDrinkDate, today, allSessions
        );
        setPeriodStats(stats);
      }
    } catch (error) {
      console.error('Failed to load journey data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────

  const getDaysRemaining = (): number | null => {
    if (!subscriptionStatus?.expirationDate) return null;
    const expiry = new Date(subscriptionStatus.expirationDate);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getExpirationDateFormatted = (): string => {
    if (!subscriptionStatus?.expirationDate) return '';
    return new Date(subscriptionStatus.expirationDate).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const daysRemaining = getDaysRemaining();

  const getTitle = (): string => {
    if (daysRemaining !== null) {
      if (daysRemaining > 1) return `Your trial ends in\n${daysRemaining} days`;
      if (daysRemaining === 1) return 'Your trial ends\ntomorrow';
      return 'Your trial ends\ntoday';
    }
    if (type === '48h') return 'Your trial ends in\n2 days';
    if (type === 'expiry') return 'Your trial ends\ntoday';
    return 'Your trial is\nending soon';
  };

  const formatSessionDate = (session: SessionWithDrinks): string => {
    const startDate = new Date(session.startTime);
    const endDate = new Date(session.endTime);
    if (isSameDay(startDate, endDate)) {
      return format(startDate, 'EEE, MMM d', { locale: enUS });
    }
    return `${format(startDate, 'MMM d', { locale: enUS })} – ${format(endDate, 'MMM d', { locale: enUS })}`;
  };

  const formatSessionTimeRange = (session: SessionWithDrinks): string => {
    const startDate = new Date(session.startTime);
    const endDate = new Date(session.endTime);
    if (isSameDay(startDate, endDate)) {
      return `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
    }
    return `${format(startDate, 'MMM d h:mm a', { locale: enUS })} - ${format(endDate, 'MMM d h:mm a', { locale: enUS })}`;
  };

  // ─── Handlers ─────────────────────────────────────────────

  const handleClose = async (action: 'x_button' | 'continue_tracking') => {
    posthog.capture('wrap_up_action', { action, reminder_type: type ?? 'unknown' });
    // Mark this reminder as dismissed so it won't show again on next app open
    const reminderType = (type === 'expiry' || daysRemaining === 0) ? 'expiry' : '48h';
    await markReminderDismissed(reminderType);

    // Request a review when the user consciously decides to keep the app
    // on the last day of their trial (expiry reminder)
    if (reminderType === 'expiry') {
      await requestStoreReview();
    }
    router.replace('/(tabs)');
  };

  const handleCancelAnytime = () => {
    posthog.capture('wrap_up_action', { action: 'cancel_anytime', reminder_type: type ?? 'unknown' });
    const url = Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions';
    Linking.openURL(url);
  };

  const hasJourneyData = sessions.length > 0;

  // ─── Render ───────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => handleClose('x_button')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{getTitle()}</Text>
        </View>

        {/* Primary CTA - above the fold */}
        <TouchableOpacity style={styles.continueButton} onPress={() => handleClose('continue_tracking')}>
          <Text style={styles.continueButtonText}>Continue Tracking</Text>
        </TouchableOpacity>

        {/* Cancel anytime - visible immediately (transparency) */}
        <TouchableOpacity style={styles.cancelLink} onPress={handleCancelAnytime}>
          <Text style={styles.cancelLinkText}>Cancel anytime</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Journey Content - only if user has data */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : hasJourneyData ? (
          <>
            {/* ─── Sessions ─────────────────────────────── */}
            <Text style={styles.sectionTitle}>Your Journey So Far</Text>

            {sessions.map(({ session, timeSeries }) => {
              const drinks = [...session.drinks].sort(
                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              );

              return (
                <View key={session.id} style={styles.sessionContainer}>
                  {/* Session Date Header */}
                  <View style={styles.sessionHeader}>
                    <Text style={styles.sessionDate}>
                      {formatSessionDate(session)}
                    </Text>
                    <View style={styles.sessionTimeRow}>
                      <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.sessionTime}>
                        {formatSessionTimeRange(session)}
                      </Text>
                    </View>
                  </View>

                  {/* Session Stats Row */}
                  <View style={styles.sessionStatsRow}>
                    <View style={styles.sessionStatCard}>
                      <Ionicons name="wine-outline" size={20} color={colors.primary} />
                      <Text style={styles.sessionStatValue}>{drinks.length}</Text>
                      <Text style={styles.sessionStatLabel}>Drinks</Text>
                    </View>
                    <View style={styles.sessionStatCard}>
                      <Ionicons name="trending-up-outline" size={20} color={colors.warning} />
                      <Text style={styles.sessionStatValue}>
                        {formatBACValue(session.peakBAC, bacUnit)}{unitSymbol}
                      </Text>
                      <Text style={styles.sessionStatLabel}>Peak</Text>
                    </View>
                    <View style={styles.sessionStatCard}>
                      <Ionicons name="moon-outline" size={20} color={colors.success} />
                      <Text style={styles.sessionStatValue}>
                        {timeSeries.soberTime
                          ? format(timeSeries.soberTime, 'HH:mm')
                          : '--:--'}
                      </Text>
                      <Text style={styles.sessionStatLabel}>Sober</Text>
                    </View>
                  </View>

                  {/* BAC Chart */}
                  {timeSeries.dataPoints.length > 0 && (
                    <View style={styles.chartContainer}>
                      <BACChart timeSeries={timeSeries} bacLimit={bacLimit} />
                    </View>
                  )}

                  {/* Drinks List */}
                  <View style={styles.drinksContainer}>
                    {drinks.map(drink => (
                      <DrinkListItem
                        key={drink.id}
                        drink={drink}
                        showArrow={false}
                      />
                    ))}
                  </View>
                </View>
              );
            })}

            {/* ─── Calendar ──────────────────────────────── */}
            <Text style={styles.sectionTitle}>Your Calendar</Text>
            <View style={styles.calendarContainer}>
              <YearView
                year={new Date().getFullYear()}
                onMonthPress={() => {}}
                onYearChange={() => {}}
              />
            </View>

            {/* ─── Stats Grid ────────────────────────────── */}
            {periodStats && (
              <>
                <Text style={styles.sectionTitle}>Your Stats</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.gridStatCard}>
                    <View style={styles.gridStatHeader}>
                      <Ionicons name="wine" size={16} color={colors.primary} />
                      <Text style={styles.gridStatLabel}>TOTAL</Text>
                    </View>
                    <View style={styles.gridStatValueRow}>
                      <Text style={styles.gridStatValue}>{periodStats.totalDrinks}</Text>
                      <Text style={styles.gridStatUnit}>Drinks</Text>
                    </View>
                  </View>

                  <View style={styles.gridStatCard}>
                    <View style={styles.gridStatHeader}>
                      <Ionicons name="calendar" size={16} color={colors.warning} />
                      <Text style={styles.gridStatLabel}>DRINKING</Text>
                    </View>
                    <View style={styles.gridStatValueRow}>
                      <Text style={styles.gridStatValue}>{periodStats.drinkingDays}</Text>
                      <Text style={styles.gridStatUnit}>Days</Text>
                    </View>
                  </View>

                  <View style={styles.gridStatCard}>
                    <View style={styles.gridStatHeader}>
                      <Ionicons name="moon" size={16} color={colors.success} />
                      <Text style={styles.gridStatLabel}>SOBER</Text>
                    </View>
                    <View style={styles.gridStatValueRow}>
                      <Text style={styles.gridStatValue}>{periodStats.soberDays}</Text>
                      <Text style={styles.gridStatUnit}>Days</Text>
                    </View>
                  </View>

                  <View style={styles.gridStatCard}>
                    <View style={styles.gridStatHeader}>
                      <Ionicons name="shield-checkmark" size={16} color={colors.success} />
                      <Text style={styles.gridStatLabel}>UNDER LIMIT</Text>
                    </View>
                    <View style={styles.gridStatValueRow}>
                      <Text style={styles.gridStatValue}>{periodStats.underLimitDays}</Text>
                      <Text style={styles.gridStatUnit}>Days</Text>
                    </View>
                  </View>

                  <View style={styles.gridStatCard}>
                    <View style={styles.gridStatHeader}>
                      <Ionicons name="alert-circle" size={16} color={colors.error} />
                      <Text style={styles.gridStatLabel}>OVER LIMIT</Text>
                    </View>
                    <View style={styles.gridStatValueRow}>
                      <Text style={styles.gridStatValue}>{periodStats.overLimitDays}</Text>
                      <Text style={styles.gridStatUnit}>Days</Text>
                    </View>
                  </View>

                  <View style={styles.gridStatCard}>
                    <View style={styles.gridStatHeader}>
                      <Ionicons name="trending-up" size={16} color={colors.error} />
                      <Text style={styles.gridStatLabel}>PEAK</Text>
                    </View>
                    <View style={styles.gridStatValueRow}>
                      <Text style={styles.gridStatValue}>
                        {formatBACValue(periodStats.peakBAC, bacUnit)}{unitSymbol}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}

            {/* ─── Bottom Section ────────────────────────── */}
            <Text style={styles.motivationalText}>
              You're doing great — stay on your mindful drinking journey!
            </Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="card-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.infoText}>
                  Your subscription starts automatically
                  {getExpirationDateFormatted() ? ` on ${getExpirationDateFormatted()}` : ''}.
                  No action needed.
                </Text>
              </View>
            </View>

            {/* Second CTA + Cancel (bottom) */}
            <TouchableOpacity style={styles.continueButton} onPress={() => handleClose('continue_tracking')}>
              <Text style={styles.continueButtonText}>Continue Tracking</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelLink} onPress={handleCancelAnytime}>
              <Text style={styles.cancelLinkText}>Cancel anytime</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </>
        ) : (
          /* Empty state — no sessions, just show subscription info */
          <>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="card-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.infoText}>
                  Your subscription starts automatically
                  {getExpirationDateFormatted() ? ` on ${getExpirationDateFormatted()}` : ''}.
                  No action needed.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 40,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  continueButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textOnPrimary,
  },
  cancelLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  cancelLinkText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },

  // ─── Sections ───────────────────────────────────────────
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },

  // ─── Session Cards ──────────────────────────────────────
  sessionContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sessionHeader: {
    marginBottom: spacing.md,
  },
  sessionDate: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  sessionTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  sessionTime: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  sessionStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sessionStatCard: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionStatValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  sessionStatLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chartContainer: {
    marginBottom: spacing.md,
  },
  drinksContainer: {
    marginTop: spacing.sm,
  },

  // ─── Calendar ───────────────────────────────────────────
  calendarContainer: {
    marginBottom: spacing.lg,
  },

  // ─── Stats Grid ─────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
    marginBottom: spacing.lg,
  },
  gridStatCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  gridStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  gridStatLabel: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  gridStatValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  gridStatValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  gridStatUnit: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },

  // ─── Bottom Section ─────────────────────────────────────
  motivationalText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
    lineHeight: 26,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
