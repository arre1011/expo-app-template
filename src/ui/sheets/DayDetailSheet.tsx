import React, { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { Card, Button, DrinkListItem, ModalHeader, BACChart, GoalProgress } from '../components';
import { JournalSheet } from './JournalSheet';
import { EditBacLimitSheet } from './EditBacLimitSheet';
import { SessionWithDrinks, DailyGoal, JournalEntry, BACTimeSeries } from '../../domain/models/types';
import { DEFAULT_DAILY_GOAL } from '../../domain/constants/defaults';

// Exported type for parent component to use
export interface SessionDisplayData {
  session: SessionWithDrinks;
  timeSeries: BACTimeSeries;
  isOvernight: boolean;
  soberDateLabel: string | null; // e.g., "Jan 26" if overnight
}

export interface DayDetailData {
  sessions: SessionDisplayData[];
  goal: DailyGoal | null;
  journalEntry: JournalEntry | null;
}

interface DayDetailSheetProps {
  open: boolean;
  onClose: () => void;
  date: string; // ISO date string (yyyy-MM-dd)
  data: DayDetailData | null; // Data loaded by parent
  onRefresh: () => void; // Called when data needs refresh
}

export function DayDetailSheet({ open, onClose, date, data, onRefresh }: DayDetailSheetProps) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [journalSheetOpen, setJournalSheetOpen] = useState(false);
  const [editGoalSheetOpen, setEditGoalSheetOpen] = useState(false);

  const snapPoints = useMemo(() => ['90%'], []);

  const parsedDate = date ? parseISO(date) : new Date();
  const dateLabel = format(parsedDate, 'EEEE, MMMM d', { locale: enUS });

  // Extract data from props (data is pre-loaded by parent)
  const sessions = data?.sessions ?? [];
  const goal = data?.goal ?? null;
  const journalEntry = data?.journalEntry ?? null;

  // Open/close based on `open` prop - NO data loading here!
  useEffect(() => {
    if (open) {
      // Data is already loaded by parent, just present the sheet
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [open]);

  // Calculate overall day stats
  const dayStats = useMemo(() => {
    if (sessions.length === 0) {
      return { drinkCount: 0, peakBAC: 0, isOverLimit: false };
    }

    const drinkCount = sessions.reduce((sum, s) => sum + s.session.drinks.length, 0);
    const peakBAC = Math.max(...sessions.map(s => s.timeSeries.peakBAC));

    // Check if over limit using goal or default
    const maxBAC = goal?.enabled ? goal.maxBAC : DEFAULT_DAILY_GOAL.maxBAC;
    const isOverLimit = peakBAC >= maxBAC;

    return { drinkCount, peakBAC, isOverLimit };
  }, [sessions, goal]);

  const handleClose = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleAddDrink = () => {
    bottomSheetModalRef.current?.dismiss();
    router.push({
      pathname: '/(modals)/add-drink',
      params: { date, source: 'calendar' },
    });
  };

  const handleOpenJournal = () => {
    setJournalSheetOpen(true);
  };

  const handleJournalSaved = () => {
    onRefresh();
  };

  const handleEditDrink = (id: number) => {
    bottomSheetModalRef.current?.dismiss();
    router.push({
      pathname: '/(modals)/add-drink',
      params: { drinkId: id.toString(), date, source: 'calendar' },
    });
  };

  const getMoodEmoji = (mood: string | null) => {
    if (!mood) return null;
    const moodMap: Record<string, string> = {
      very_happy: '😄',
      happy: '🙂',
      neutral: '😐',
      sad: '😔',
      very_sad: '😞',
    };
    return moodMap[mood];
  };

  // Get BAC limit for chart display
  const bacLimit = goal?.enabled ? goal.maxBAC : DEFAULT_DAILY_GOAL.maxBAC;

  return (
    <>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.sheetBackground}
        stackBehavior="push"
      >
        <ModalHeader title={dateLabel} onClose={handleClose} />

        <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
            {sessions.length === 0 ? (
              // Empty state - no sessions on this day
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={colors.textLight} />
                <Text style={styles.emptyTitle}>No sessions on this day</Text>
                <Text style={styles.emptySubtitle}>
                  Add a drink to start tracking
                </Text>
              </View>
            ) : (
              <>
                {/* Status Banner - overall day status */}
                {goal && goal.enabled && (
                  <View style={[
                    styles.statusBanner,
                    dayStats.isOverLimit ? styles.statusWarning : styles.statusSuccess
                  ]}>
                    <Ionicons
                      name={dayStats.isOverLimit ? 'warning' : 'thumbs-up'}
                      size={24}
                      color={dayStats.isOverLimit ? colors.warning : colors.success}
                    />
                    <View style={styles.statusTextContainer}>
                      <Text style={styles.statusTitle}>
                        {dayStats.isOverLimit ? 'Over the limit' : 'Within your goal'}
                      </Text>
                      <Text style={styles.statusSubtitle}>
                        {`Peak: ${dayStats.peakBAC.toFixed(2)}‰ / Limit: ${goal.maxBAC.toFixed(2)}‰`}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Goal Progress Card — tappable to edit limit for this day */}
                <GoalProgress
                  currentBAC={dayStats.peakBAC}
                  maxBAC={bacLimit}
                  onPress={() => setEditGoalSheetOpen(true)}
                />

                {/* Sessions List */}
                {sessions.map((sessionData, index) => (
                  <View key={sessionData.session.id}>
                    {/* Session separator for multiple sessions */}
                    {index > 0 && <View style={styles.sessionSeparator} />}

                    {/* Session Header */}
                    {sessions.length > 1 && (
                      <Text style={styles.sessionLabel}>
                        Session {index + 1}
                      </Text>
                    )}

                    {/* Overnight Banner */}
                    {sessionData.isOvernight && (
                      <View style={styles.overnightBanner}>
                        <Ionicons name="moon-outline" size={16} color={colors.info} />
                        <Text style={styles.overnightText}>
                          This session continued past midnight until {sessionData.soberDateLabel}
                        </Text>
                      </View>
                    )}

                    {/* BAC Chart */}
                    <View style={styles.chartSection}>
                      <BACChart
                        timeSeries={sessionData.timeSeries}
                        height={180}
                        bacLimit={bacLimit}
                      />
                    </View>

                    {/* Session Stats Row */}
                    <View style={styles.statsRow}>
                      <View style={styles.statCard}>
                        <Ionicons name="wine-outline" size={20} color={colors.primary} />
                        <Text style={styles.statValue}>{sessionData.session.drinks.length}</Text>
                        <Text style={styles.statLabel}>Drinks</Text>
                      </View>
                      <View style={styles.statCard}>
                        <Ionicons name="trending-up-outline" size={20} color={colors.warning} />
                        <Text style={styles.statValue}>{sessionData.timeSeries.peakBAC.toFixed(2)}‰</Text>
                        <Text style={styles.statLabel}>Peak</Text>
                      </View>
                      <View style={styles.statCard}>
                        <Ionicons name="time-outline" size={20} color={colors.success} />
                        <Text style={styles.statValue}>
                          {sessionData.timeSeries.soberTime
                            ? format(sessionData.timeSeries.soberTime, 'HH:mm')
                            : '--:--'}
                        </Text>
                        <Text style={styles.statLabel}>
                          {sessionData.isOvernight ? `Sober (${sessionData.soberDateLabel})` : 'Sober'}
                        </Text>
                      </View>
                    </View>

                    {/* Drinks List */}
                    <View style={styles.drinksSection}>
                      <Text style={styles.sectionTitle}>Drinks</Text>
                      <View style={styles.drinksList}>
                        {/* Sort drinks newest first */}
                        {[...sessionData.session.drinks]
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map(drink => (
                            <DrinkListItem
                              key={drink.id}
                              drink={drink}
                              onPress={() => handleEditDrink(drink.id)}
                              showArrow={true}
                            />
                          ))}
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Add Drink Button */}
            <Button
              title="Add Drink"
              onPress={handleAddDrink}
              variant="outline"
              size="large"
              style={styles.addButton}
              icon={<Ionicons name="add" size={20} color={colors.primary} />}
            />

            {/* Journal Section */}
            <View style={styles.journalSection}>
              <Text style={styles.sectionTitle}>Journal</Text>
              <TouchableOpacity onPress={handleOpenJournal}>
                <Card style={styles.journalCard}>
                  {journalEntry ? (
                    <View style={styles.journalContent}>
                      <View style={styles.journalIconContainer}>
                        <Ionicons name="document-text" size={24} color={colors.primary} />
                        {journalEntry.mood && (
                          <Text style={styles.journalMoodEmoji}>{getMoodEmoji(journalEntry.mood)}</Text>
                        )}
                      </View>
                      <View style={styles.journalTextContainer}>
                        <View style={styles.journalHeader}>
                          <Text style={styles.journalTitle}>Journal Entry</Text>
                          {journalEntry.sleepQuality && (
                            <View style={styles.sleepBadge}>
                              <Ionicons name="star" size={12} color={colors.warning} />
                              <Text style={styles.sleepBadgeText}>{journalEntry.sleepQuality}/5</Text>
                            </View>
                          )}
                        </View>
                        {journalEntry.content ? (
                          <Text style={styles.journalPreview} numberOfLines={2}>
                            {journalEntry.content}
                          </Text>
                        ) : (
                          <Text style={styles.journalSubtitle}>
                            {journalEntry.mood ? 'Mood recorded' : 'No text'} - Tap to edit
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </View>
                  ) : (
                    <View style={styles.journalContent}>
                      <Ionicons name="document-text-outline" size={24} color={colors.textSecondary} />
                      <View style={styles.journalTextContainer}>
                        <Text style={styles.journalTitle}>Add Note</Text>
                        <Text style={styles.journalSubtitle}>How was your sleep / mood?</Text>
                      </View>
                      <Ionicons name="add" size={24} color={colors.primary} />
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            </View>
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Journal Sheet - Opens OVER DayDetail (stacked modal) */}
      <JournalSheet
        open={journalSheetOpen}
        onClose={() => setJournalSheetOpen(false)}
        date={date}
        onSaved={handleJournalSaved}
      />

      {/* Edit Limit Sheet - Opens OVER DayDetail (stacked modal) */}
      <EditBacLimitSheet
        open={editGoalSheetOpen}
        onClose={() => setEditGoalSheetOpen(false)}
        date={date}
        initialMaxBAC={goal?.maxBAC}
        onSaved={onRefresh}
      />
    </>
  );
}

const styles = StyleSheet.create({
  handleIndicator: {
    backgroundColor: colors.textLight,
    width: 40,
  },
  sheetBackground: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  statusSuccess: {
    backgroundColor: colors.successLight,
  },
  statusWarning: {
    backgroundColor: colors.warningLight,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  statusSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sessionSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
  },
  sessionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  overnightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  overnightText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.info,
  },
  chartSection: {
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  drinksSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  drinksList: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  addButton: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  journalSection: {
    marginBottom: spacing.lg,
  },
  journalCard: {
    marginTop: spacing.sm,
  },
  journalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  journalTextContainer: {
    flex: 1,
  },
  journalTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  journalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  journalIconContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  journalMoodEmoji: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    fontSize: 16,
  },
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sleepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}20`,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 2,
  },
  sleepBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.warning,
  },
  journalPreview: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginTop: 4,
    lineHeight: 18,
  },
});
