import React, { useEffect, useCallback, useRef, useMemo, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { format, isSameDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { ModalHeader, DrinkListItem, BACDisplay, BACChart } from '../components';
import { usePastSessions, useSessionStore } from '../hooks/useSessionStore';
import { Session, SessionWithDrinks, isSessionActive } from '../../domain/models/types';
import { getSessionWithDrinks } from '../../data/repositories/sessionRepository';
import { calculateBACTimeSeries } from '../../domain/services/bacCalculator';
import { useAppStore } from '../hooks/useAppStore';
import { DEFAULT_DAILY_GOAL } from '../../domain/constants/defaults';

interface PastSessionsSheetProps {
  open: boolean;
  onClose: () => void;
}

export function PastSessionsSheet({ open, onClose }: PastSessionsSheetProps) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const pastSessions = usePastSessions();
  const { profile, todayGoal } = useAppStore();
  const { loadPastSessions } = useSessionStore();

  // State for viewing a specific session's details
  const [selectedSession, setSelectedSession] = useState<SessionWithDrinks | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  const snapPoints = useMemo(() => ['90%'], []);

  // Open/close based on `open` prop
  useEffect(() => {
    if (open) {
      loadPastSessions();
      setSelectedSession(null);
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [open]);

  const handleClose = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      setSelectedSession(null);
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

  // Format date range for any session
  const formatSessionDate = (session: Session) => {
    const startDate = new Date(session.startTime);
    const endDate = new Date(session.endTime);

    if (isSameDay(startDate, endDate)) {
      return format(startDate, 'EEE, MMM d', { locale: enUS });
    } else {
      return `${format(startDate, 'MMM d', { locale: enUS })} – ${format(endDate, 'MMM d', { locale: enUS })}`;
    }
  };

  // Format time range for detail view
  const formatSessionTimeRange = (session: Session) => {
    const startDate = new Date(session.startTime);
    const endDate = new Date(session.endTime);

    if (isSameDay(startDate, endDate)) {
      return `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
    } else {
      return `${format(startDate, 'MMM d h:mm a', { locale: enUS })} - ${format(endDate, 'MMM d h:mm a', { locale: enUS })}`;
    }
  };

  // Handle tap on session - load details
  const handleSessionPress = async (session: Session) => {
    setIsLoadingSession(true);
    try {
      const sessionWithDrinks = await getSessionWithDrinks(session.id);
      if (sessionWithDrinks) {
        setSelectedSession(sessionWithDrinks);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Go back to list
  const handleBackToList = () => {
    setSelectedSession(null);
  };

  // Calculate BAC time series for selected session
  const bacTimeSeries = useMemo(() => {
    if (!selectedSession || !profile || selectedSession.drinks.length === 0) {
      return null;
    }
    return calculateBACTimeSeries(selectedSession.drinks, profile);
  }, [selectedSession, profile]);

  // Render session list
  const renderSessionList = () => (
    <>
      <ModalHeader title="Past Sessions" onClose={handleClose} />

      <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
        {pastSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No past sessions</Text>
            <Text style={styles.emptySubtext}>
              Your drinking sessions will appear here
            </Text>
          </View>
        ) : (
          pastSessions.map(session => (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionCard}
              onPress={() => handleSessionPress(session)}
              activeOpacity={0.7}
            >
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionDate}>
                  {formatSessionDate(session)}
                </Text>
                <Text style={styles.sessionPeak}>
                  Peak: {session.peakBAC.toFixed(2)}%
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textLight}
              />
            </TouchableOpacity>
          ))
        )}
      </BottomSheetScrollView>
    </>
  );

  // Render session details
  const renderSessionDetail = () => {
    if (!selectedSession) return null;

    // Sort drinks newest first for display
    const drinks = [...(selectedSession.drinks || [])].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
      <>
        <ModalHeader
          title={formatSessionDate(selectedSession)}
          onClose={handleClose}
          leftButton={
            <TouchableOpacity onPress={handleBackToList} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          }
        />

        <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
          {/* Session Time Range */}
          <View style={styles.timeRangeContainer}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.timeRangeText}>
              {formatSessionTimeRange(selectedSession)}
            </Text>
          </View>

          {/* BAC Display */}
          <BACDisplay
            currentBAC={bacTimeSeries?.currentBAC ?? 0}
            isActive={isSessionActive(selectedSession)}
            peakBAC={selectedSession.peakBAC}
          />

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="wine-outline" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{drinks.length}</Text>
              <Text style={styles.statLabel}>Drinks</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trending-up-outline" size={24} color={colors.warning} />
              <Text style={styles.statValue}>{selectedSession.peakBAC.toFixed(2)}%</Text>
              <Text style={styles.statLabel}>Peak</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="moon-outline" size={24} color={colors.success} />
              <Text style={styles.statValue}>
                {bacTimeSeries?.soberTime
                  ? format(bacTimeSeries.soberTime, 'HH:mm')
                  : '--:--'}
              </Text>
              <Text style={styles.statLabel}>Sober</Text>
            </View>
          </View>

          {/* BAC Chart */}
          {bacTimeSeries && bacTimeSeries.dataPoints.length > 0 && (
            <View style={styles.chartSection}>
              <BACChart timeSeries={bacTimeSeries} bacLimit={todayGoal?.maxBAC ?? DEFAULT_DAILY_GOAL.maxBAC} />
            </View>
          )}

          {/* Drinks List */}
          <View style={styles.drinksSection}>
            <Text style={styles.sectionTitle}>Drinks</Text>

            {drinks.length === 0 ? (
              <View style={styles.emptyDrinks}>
                <Text style={styles.emptyDrinksText}>No drinks in this session</Text>
              </View>
            ) : (
              drinks.map(drink => (
                <DrinkListItem
                  key={drink.id}
                  drink={drink}
                  showArrow={false}
                />
              ))
            )}
          </View>
        </BottomSheetScrollView>
      </>
    );
  };

  return (
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
      {isLoadingSession ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : selectedSession ? (
        renderSessionDetail()
      ) : (
        renderSessionList()
      )}
    </BottomSheetModal>
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
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sessionPeak: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  backButton: {
    padding: spacing.xs,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  timeRangeText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
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
  chartSection: {
    marginBottom: spacing.lg,
  },
  drinksSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyDrinks: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyDrinksText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
