import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/ui/theme';
import { Card, Button, DrinkListItem, ModalHeader } from '../../src/ui/components';
import { getDrinkEntriesForDay } from '../../src/data/repositories/drinkEntryRepository';
import { getDailyGoalForDate } from '../../src/data/repositories/dailyGoalRepository';
import { getUserProfile } from '../../src/data/repositories/userProfileRepository';
import { getJournalEntryForDate } from '../../src/data/repositories/journalEntryRepository';
import { calculateBACTimeSeries } from '../../src/domain/services/bacCalculator';
import { DrinkEntry, DailyGoal, UserProfile, JournalEntry, BACUnit } from '../../src/domain/models/types';
import { formatBACValue, getBACUnitSymbol } from '../../src/domain/utils/bacConversion';

export default function DayDetailModal() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [drinks, setDrinks] = useState<DrinkEntry[]>([]);
  const [goal, setGoal] = useState<DailyGoal | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [journalEntry, setJournalEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const snapPoints = useMemo(() => ['90%'], []);

  const parsedDate = date ? parseISO(date) : new Date();
  const dateLabel = format(parsedDate, 'EEEE, MMMM d', { locale: enUS });

  // Present modal on mount - same pattern as edit-sex.tsx
  useEffect(() => {
    bottomSheetModalRef.current?.present();
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [drinksData, goalData, profileData, journalData] = await Promise.all([
        getDrinkEntriesForDay(parsedDate),
        getDailyGoalForDate(parsedDate),
        getUserProfile(),
        getJournalEntryForDate(parsedDate),
      ]);

      // Sort drinks by timestamp (newest first)
      const sortedDrinks = [...drinksData].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setDrinks(sortedDrinks);
      setGoal(goalData);
      setProfile(profileData);
      setJournalEntry(journalData);
    } catch (error) {
      console.error('Failed to load day data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const drinkCount = drinks.length;
  let peakBAC = 0;
  let soberTime: Date | null = null;

  if (profile && drinks.length > 0) {
    const timeSeries = calculateBACTimeSeries(drinks, profile);
    peakBAC = timeSeries.peakBAC;
    soberTime = timeSeries.soberTime;
  }

  // Get BAC unit from profile
  const bacUnit: BACUnit = profile?.bacUnit ?? 'percent';
  const unitSymbol = getBACUnitSymbol(bacUnit);

  // Check if within BAC goal
  let isWithinGoal = true;

  if (goal && goal.enabled) {
    isWithinGoal = peakBAC <= goal.maxBAC;
  }

  const handleClose = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      router.replace('/(tabs)/calendar');
    }
  }, []);

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
      params: { date },
    });
  };

  const handleOpenJournal = () => {
    bottomSheetModalRef.current?.dismiss();
    router.push({
      pathname: '/(modals)/journal',
      params: { date },
    });
  };

  const handleEditDrink = (id: number) => {
    bottomSheetModalRef.current?.dismiss();
    router.push({
      pathname: '/(modals)/add-drink',
      params: { drinkId: id.toString(), date },
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

  return (
    <View style={styles.container}>
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
      >
        <ModalHeader title={dateLabel} onClose={handleClose} />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
            {/* Status Banner */}
            {goal && goal.enabled && (
              <View style={[styles.statusBanner, isWithinGoal ? styles.statusSuccess : styles.statusWarning]}>
                <Ionicons
                  name={isWithinGoal ? 'thumbs-up' : 'warning'}
                  size={24}
                  color={isWithinGoal ? colors.success : colors.warning}
                />
                <View style={styles.statusTextContainer}>
                  <Text style={styles.statusTitle}>
                    {isWithinGoal ? 'Within your goal' : 'Over the limit'}
                  </Text>
                  <Text style={styles.statusSubtitle}>
                    {`${formatBACValue(peakBAC, bacUnit)} of ${formatBACValue(goal.maxBAC, bacUnit)}${unitSymbol}`}
                  </Text>
                </View>
              </View>
            )}

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Ionicons name="wine-outline" size={24} color={colors.primary} />
                <Text style={styles.statValue}>{drinkCount}</Text>
                <Text style={styles.statLabel}>Drinks</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="trending-up-outline" size={24} color={colors.warning} />
                <Text style={styles.statValue}>{formatBACValue(peakBAC, bacUnit)}{unitSymbol}</Text>
                <Text style={styles.statLabel}>Peak</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="moon-outline" size={24} color={colors.success} />
                <Text style={styles.statValue}>
                  {soberTime ? format(soberTime, 'HH:mm') : '--:--'}
                </Text>
                <Text style={styles.statLabel}>Sober</Text>
              </View>
            </View>

            {/* Drinks List */}
            <View style={styles.drinksSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Drinks</Text>
              </View>

              {drinks.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No drinks on this day</Text>
                </View>
              ) : (
                <View style={styles.drinksList}>
                  {drinks.map(drink => (
                    <DrinkListItem
                      key={drink.id}
                      drink={drink}
                      onPress={() => handleEditDrink(drink.id)}
                      showArrow={true}
                    />
                  ))}
                </View>
              )}

              <Button
                title="Add Drink"
                onPress={handleAddDrink}
                variant="outline"
                size="large"
                style={styles.addButton}
                icon={<Ionicons name="add" size={20} color={colors.primary} />}
              />
            </View>

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
        )}
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  drinksSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  drinksList: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  addButton: {
    marginTop: spacing.md,
  },
  journalSection: {
    marginBottom: spacing.lg,
  },
  journalCard: {
    marginTop: spacing.md,
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
