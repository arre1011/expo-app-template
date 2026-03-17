import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, isSameDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { colors, spacing, fontSize, fontWeight } from '../../src/ui/theme';
import { BACDisplay, GoalProgress, DrinkListItem, BACChart, BACChartVictory, QuickAddBar } from '../../src/ui/components';
import { AddDrinkSheet, EditBacLimitSheet, PastSessionsSheet } from '../../src/ui/sheets';
import { useAppStore } from '../../src/ui/hooks/useAppStore';
import { useSessionStore, useIsSessionActive, usePastSessions } from '../../src/ui/hooks/useSessionStore';
import { RecentDrinkTemplate } from '../../src/domain/models/types';
import { featureFlags } from '../../src/config/featureFlags';
import { borderRadius } from '../../src/ui/theme';
import { DEFAULT_DAILY_GOAL } from '../../src/domain/constants/defaults';
import { drinkDataEvents } from '../../src/ui/hooks/drinkDataEvents';

export default function SessionScreen() {
  const { profile, todayGoal, recentDrinkTemplates, loadRecentDrinks, loadCustomDrinks, quickAddDrink } = useAppStore();

  const {
    currentSession,
    bacTimeSeries,
    isLoading,
    loadCurrentSession,
    refreshBACOnly,
    setProfile,
    initializeSessions,
  } = useSessionStore();

  const isActive = useIsSessionActive();
  const pastSessions = usePastSessions();

  const [refreshing, setRefreshing] = useState(false);

  // Freeze template list during Quick Add animation to prevent cards jumping positions
  const [frozenTemplates, setFrozenTemplates] = useState<typeof recentDrinkTemplates | null>(null);
  const displayTemplates = frozenTemplates ?? recentDrinkTemplates;

  // Ref to suppress screen reload during Quick Add animation (800ms)
  const isQuickAddInProgress = useRef(false);
  const quickAddTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sheet states
  const [addDrinkSheetOpen, setAddDrinkSheetOpen] = useState(false);
  const [editingDrinkId, setEditingDrinkId] = useState<number | null>(null);
  const [bacLimitSheetOpen, setBacLimitSheetOpen] = useState(false);
  const [pastSessionsSheetOpen, setPastSessionsSheetOpen] = useState(false);

  // Initialize sessions and load recent drinks when profile is available
  useEffect(() => {
    if (profile) {
      setProfile(profile);
      initializeSessions(profile);
      loadRecentDrinks();
      loadCustomDrinks();
    }
  }, [profile]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && profile) {
        // App came to foreground - reload current session
        // This ensures we don't show old sessions from days ago
        loadCurrentSession();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [profile, loadCurrentSession]);

  // Subscribe to drink and session changes
  // Skip reload if Quick Add animation is in progress (flag set in handleQuickAdd)
  useEffect(() => {
    const handleChange = () => {
      if (isQuickAddInProgress.current) return;
      loadCurrentSession();
    };

    drinkDataEvents.on('drinksChanged', handleChange);
    drinkDataEvents.on('sessionsChanged', handleChange);

    return () => {
      drinkDataEvents.off('drinksChanged', handleChange);
      drinkDataEvents.off('sessionsChanged', handleChange);
      if (quickAddTimeoutRef.current) clearTimeout(quickAddTimeoutRef.current);
    };
  }, [loadCurrentSession]);

  // Auto-refresh BAC every minute to update current BAC and chart
  // Uses lightweight refreshBACOnly instead of full loadCurrentSession
  // Aligns to the start of each minute for accurate clock display
  useEffect(() => {
    if (!profile || !isActive) return; // Only auto-refresh when there's an active session

    let intervalId: NodeJS.Timeout | null = null;

    // Calculate milliseconds until the next full minute
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    // First, wait until the start of the next minute
    const timeoutId = setTimeout(() => {
      refreshBACOnly(); // Update at the start of the minute

      // Then set up the interval for every subsequent minute
      intervalId = setInterval(() => {
        refreshBACOnly();
      }, 60 * 1000);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [profile, isActive, refreshBACOnly]);

  // Reload data when screen comes into focus
  // This also ensures "tap on tab = back to today" behavior:
  // - User in history → taps Session tab → returns to "today" (Welcome/Active)
  // - User on other tab → taps Session tab → shows "today"
  useFocusEffect(
    useCallback(() => {
      if (profile) {
        loadCurrentSession();
      }
    }, [loadCurrentSession, profile])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCurrentSession();
    setRefreshing(false);
  };

  const handleAddDrink = () => {
    setEditingDrinkId(null);
    setAddDrinkSheetOpen(true);
  };

  const handleQuickAdd = async (template: RecentDrinkTemplate) => {
    // Freeze template list so cards don't jump positions during animation
    setFrozenTemplates([...recentDrinkTemplates]);
    // Block event-driven reload so the success animation (800ms) can finish
    isQuickAddInProgress.current = true;
    if (quickAddTimeoutRef.current) clearTimeout(quickAddTimeoutRef.current);

    await quickAddDrink(template);
    // LimitWarningPopup is now rendered globally in _layout.tsx

    // After animation completes, unfreeze list + reload screen
    quickAddTimeoutRef.current = setTimeout(() => {
      setFrozenTemplates(null);
      isQuickAddInProgress.current = false;
      loadCurrentSession();
    }, 1000);
  };

  const handleEditDrink = (id: number) => {
    setEditingDrinkId(id);
    setAddDrinkSheetOpen(true);
  };

  const handleEditBACLimit = () => {
    setBacLimitSheetOpen(true);
  };

  // Handle AddDrinkSheet close
  const handleAddDrinkSheetClose = () => {
    setAddDrinkSheetOpen(false);
    setEditingDrinkId(null);
  };

  // Format session date range for current session
  const formatSessionDateRange = () => {
    if (!currentSession) return '';

    const startDate = new Date(currentSession.startTime);
    const endDate = new Date(currentSession.endTime);

    if (isSameDay(startDate, endDate)) {
      // Same day: "Saturday, Jan 4"
      return format(startDate, 'EEEE, MMM d', { locale: enUS });
    } else {
      // Multi-day: "Jan 3 – Jan 4"
      return `${format(startDate, 'MMM d', { locale: enUS })} – ${format(endDate, 'MMM d', { locale: enUS })}`;
    }
  };

  
  // Use either the user's goal or the default goal
  const displayMaxBAC = todayGoal?.maxBAC ?? DEFAULT_DAILY_GOAL.maxBAC;
  const currentBAC = bacTimeSeries?.currentBAC ?? 0;

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Empty state - no active session
  if (!currentSession) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.emptyScrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.emptyStateContainer}>
            <TouchableOpacity
              style={styles.emptyCircle}
              onPress={handleAddDrink}
              activeOpacity={0.7}
            >
              <View style={styles.emptyCircleInner} />
            </TouchableOpacity>

            <Text style={styles.emptyTitle} testID="empty-title">Ready for today?</Text>
            <Text style={styles.emptySubtitle}>
              Tracking helps you stay mindful.
            </Text>

            {/* Drink Again - recent drinks for quick re-logging */}
            {featureFlags.quickAddBar && displayTemplates.length > 0 && (
              <QuickAddBar
                templates={displayTemplates}
                onQuickAdd={handleQuickAdd}
                style={styles.emptyQuickAdd}
              />
            )}

            {/* Past Sessions - inside empty state container for proper positioning */}
            {featureFlags.pastSessionsList && pastSessions.length > 0 && (
              <View style={styles.emptyPastSessionsSection}>
                <TouchableOpacity
                  style={styles.pastSessionsButton}
                  onPress={() => setPastSessionsSheetOpen(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.pastSessionsButtonContent}>
                    <Ionicons name="time-outline" size={20} color={colors.primary} />
                    <Text style={styles.pastSessionsButtonText}>View Past Sessions</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Sheet Modals - also needed in empty state */}
        <AddDrinkSheet
          open={addDrinkSheetOpen}
          onClose={handleAddDrinkSheetClose}
          editingDrinkId={editingDrinkId}
        />

        <PastSessionsSheet
          open={pastSessionsSheetOpen}
          onClose={() => setPastSessionsSheetOpen(false)}
        />

        {/* Bottom Add Drink Bar */}
        <View style={styles.bottomBarContainer}>
          <TouchableOpacity
            style={styles.addDrinkBottomBar}
            onPress={handleAddDrink}
            activeOpacity={0.8}
            testID="btn-add-drink-bottom"
          >
            <Text style={styles.addDrinkBottomBarText}>ADD DRINK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sessionDateRange = formatSessionDateRange();
  // Sort drinks newest first for display (most recent at top)
  const drinks = [...(currentSession.drinks || [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Session Header - only show date for past sessions */}
        {!isActive && (
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionDateText}>{sessionDateRange.toUpperCase()}</Text>
          </View>
        )}

        {/* BAC Display */}
        <BACDisplay currentBAC={currentBAC} isActive={isActive} peakBAC={currentSession.peakBAC} />

        {/* Goal Progress */}
        {bacTimeSeries && (
          <GoalProgress
            currentBAC={bacTimeSeries.peakBAC}
            maxBAC={displayMaxBAC}
            onPress={handleEditBACLimit}
          />
        )}

        {/* BAC Chart */}
        {bacTimeSeries && bacTimeSeries.dataPoints.length > 0 && (
          <View style={styles.chartSection}>
            <BACChart timeSeries={bacTimeSeries} bacLimit={displayMaxBAC} />
          </View>
        )}

        {featureFlags.bacChartVictory && bacTimeSeries && bacTimeSeries.dataPoints.length > 0 && (
          <View style={styles.chartSection}>
            <BACChartVictory timeSeries={bacTimeSeries} />
          </View>
        )}

        {/* Drink Again Bar - zwischen Chart und Drinks */}
        {featureFlags.quickAddBar && displayTemplates.length > 0 && (
          <QuickAddBar
            templates={displayTemplates}
            onQuickAdd={handleQuickAdd}
          />
        )}

        {/* Drinks List */}
        <View style={styles.drinksSection} testID="drinks-section">
          <Text style={styles.sectionTitle}>Drinks</Text>

          {drinks.map(drink => (
            <DrinkListItem
              key={drink.id}
              drink={drink}
              onPress={() => handleEditDrink(drink.id)}
              showArrow={true}
            />
          ))}
        </View>

        {featureFlags.pastSessionsList && pastSessions.length > 0 && (
          <View style={styles.pastSessionsSection}>
            <TouchableOpacity
              style={styles.pastSessionsButton}
              onPress={() => setPastSessionsSheetOpen(true)}
              activeOpacity={0.7}
            >
              <View style={styles.pastSessionsButtonContent}>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
                <Text style={styles.pastSessionsButtonText}>View Past Sessions</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>
          </View>
        )}

        {/* Inline Add Drink Button */}
        <TouchableOpacity
          style={styles.addDrinkInline}
          onPress={handleAddDrink}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={22} color={colors.textOnPrimary} />
          <Text style={styles.addDrinkInlineText}>ADD DRINK</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Add Drink Bar */}
      <View style={styles.bottomBarContainer}>
        <TouchableOpacity
          style={styles.addDrinkBottomBar}
          onPress={handleAddDrink}
          activeOpacity={0.8}
          testID="btn-add-drink-bottom"
        >
          <Text style={styles.addDrinkBottomBarText}>ADD DRINK</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet Modals */}
      <AddDrinkSheet
        open={addDrinkSheetOpen}
        onClose={handleAddDrinkSheetClose}
        editingDrinkId={editingDrinkId}
      />

      <EditBacLimitSheet
        open={bacLimitSheetOpen}
        onClose={() => setBacLimitSheetOpen(false)}
      />

      <PastSessionsSheet
        open={pastSessionsSheetOpen}
        onClose={() => setPastSessionsSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 100,
  },
  emptyScrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.md,
  },
  sessionHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sessionDateText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.5,
  },
  chartSection: {
    marginTop: spacing.md,
  },
  drinksSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
  },
  addDrinkBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'red',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  addDrinkBottomBarText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textOnPrimary,
    letterSpacing: 0.5,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: `${colors.yellow}25`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyCircleInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.yellow}40`,
  },
  emptyTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  emptyQuickAddContainer: {
    width: '100%',
    marginTop: spacing.md,
  },
  emptyQuickAdd: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
  },
  emptyPastSessionsSection: {
    width: '100%',
    marginTop: spacing.lg,
  },
  pastSessionsSection: {
    marginTop: spacing.xl,
  },
  pastSessionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  pastSessionsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pastSessionsButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  addDrinkInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'pink',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  addDrinkInlineText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textOnPrimary,
    letterSpacing: 0.5,
  },
});
