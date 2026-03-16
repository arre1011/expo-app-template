import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/ui/theme';
import { Card, TimeNavigationHeader } from '../../src/ui/components';
import { useStatisticsStore } from '../../src/ui/hooks/useStatisticsStore';
import { useBACUnit } from '../../src/ui/hooks/useAppStore';
import { ChartPeriodType } from '../../src/domain/models/types';
import { formatBACValue, getBACUnitSymbol } from '../../src/domain/utils/bacConversion';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 200;
const MIN_BAR_WIDTH = 4;
const MAX_BAR_WIDTH = 40;
const Y_AXIS_WIDTH = 32;

/**
 * Heckbert's "Nice Numbers" algorithm for axis labeling
 * Returns a "nice" number approximately equal to the input range.
 * Rounds to 1, 2, or 5 times a power of 10.
 *
 * Based on: Paul S. Heckbert, "Nice Numbers for Graph Labels", Graphics Gems (1990)
 */
function niceNum(range: number, round: boolean): number {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);
  let niceFraction: number;

  if (round) {
    // Round to nearest nice number
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    // Ceiling to next nice number
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }

  return niceFraction * Math.pow(10, exponent);
}

/**
 * Calculate nice axis range and step size
 * Returns { niceMin, niceMax, tickSpacing }
 */
function calculateNiceScale(minValue: number, maxValue: number, maxTicks: number = 5): {
  niceMin: number;
  niceMax: number;
  tickSpacing: number;
} {
  const range = niceNum(maxValue - minValue, false);
  const tickSpacing = niceNum(range / (maxTicks - 1), true);
  const niceMin = Math.floor(minValue / tickSpacing) * tickSpacing;
  const niceMax = Math.ceil(maxValue / tickSpacing) * tickSpacing;

  return { niceMin, niceMax, tickSpacing };
}

// Period type labels for the segmented control
const PERIOD_LABELS: { type: ChartPeriodType; label: string }[] = [
  { type: 'day', label: 'D' },
  { type: 'week', label: 'W' },
  { type: 'month', label: 'M' },
  { type: 'sixMonth', label: '6M' },
  { type: 'year', label: 'Y' },
];

export default function StatisticsScreen() {
  const {
    periodType,
    periodOffset,
    stats,
    chartData,
    isLoading,
    selectedBarIndex,
    setPeriodType,
    navigatePeriod,
    goToCurrentPeriod,
    selectBar,
    loadStats,
  } = useStatisticsStore();

  const bacUnit = useBACUnit();
  const unitSymbol = getBACUnitSymbol(bacUnit);

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const barDetailSheetRef = useRef<BottomSheetModal>(null);

  // Toggle this to switch between tooltip and bottom sheet
  const USE_TOOLTIP = true;

  useEffect(() => {
    loadStats();
  }, []);

  // Touch-and-hold: show tooltip while finger is down
  const handleBarPressIn = useCallback((index: number) => {
    if (USE_TOOLTIP) {
      selectBar(index);
      setShowTooltip(true);
    }
  }, [selectBar, USE_TOOLTIP]);

  const handleBarPressOut = useCallback(() => {
    if (USE_TOOLTIP) {
      setShowTooltip(false);
      selectBar(null);
    }
  }, [selectBar, USE_TOOLTIP]);

  // For bottom sheet mode: tap to open
  const handleBarPress = useCallback((index: number) => {
    if (!USE_TOOLTIP) {
      selectBar(index);
      barDetailSheetRef.current?.present();
    }
  }, [selectBar, USE_TOOLTIP]);

  const handleBarDetailDismiss = useCallback(() => {
    selectBar(null);
    setShowTooltip(false);
  }, [selectBar]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const selectedBar = selectedBarIndex !== null && chartData?.bars[selectedBarIndex];

  // Calculate column width - each bar gets equal space
  // Available width = screen width - scrollView padding - card padding - y-axis
  const getChartMetrics = () => {
    if (!chartData) return { columnWidth: 20, barWidth: 12 };
    // ScrollView has padding: spacing.lg (24) on each side
    // Card has padding: spacing.md (16) on each side
    const scrollViewPadding = spacing.lg * 2; // 48
    const cardPadding = spacing.md * 2; // 32
    const availableWidth = SCREEN_WIDTH - scrollViewPadding - cardPadding - Y_AXIS_WIDTH;
    const barCount = chartData.bars.length;

    // Each bar gets equal column width
    const columnWidth = availableWidth / barCount;
    // Bar is 60-80% of column width, with min/max limits
    const rawBarWidth = columnWidth * 0.7;
    const barWidth = Math.max(MIN_BAR_WIDTH, Math.min(MAX_BAR_WIDTH, rawBarWidth));

    return { columnWidth, barWidth };
  };

  // Calculate Y-axis ticks and nice max using Heckbert's nice numbers algorithm
  const getYAxisData = () => {
    if (!chartData || chartData.maxValue === 0) {
      return {
        ticks: [{ value: 0, label: '0' }],
        niceMax: 1,
      };
    }

    const { niceMax, tickSpacing } = calculateNiceScale(0, chartData.maxValue, 5);

    // Format tick label: show decimals only if needed
    const formatTick = (val: number) => {
      if (val === 0) return '0';
      // If tickSpacing has decimals, format with 1 decimal place
      if (tickSpacing < 1) {
        return val.toFixed(1);
      }
      return val % 1 === 0 ? val.toString() : val.toFixed(1);
    };

    // Generate ticks from 0 to niceMax
    const ticks: { value: number; label: string }[] = [];
    for (let val = niceMax; val >= 0; val -= tickSpacing) {
      // Avoid floating point errors
      const roundedVal = Math.round(val * 100) / 100;
      ticks.push({ value: roundedVal, label: formatTick(roundedVal) });
    }

    // Ensure we have 0 at the end
    if (ticks[ticks.length - 1]?.value !== 0) {
      ticks.push({ value: 0, label: '0' });
    }

    return { ticks, niceMax };
  };

  const { ticks: yAxisTicks, niceMax: chartNiceMax } = getYAxisData();

  const { columnWidth, barWidth } = getChartMetrics();

  // Check if a bar index should show a tick label
  const shouldShowTickLabel = (barIndex: number): string | null => {
    if (!chartData) return null;
    const tick = chartData.xAxisTicks.find(t => t.barIndex === barIndex);
    return tick ? tick.label : null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Period Toggle (Segmented Control) */}
        <View style={styles.periodToggle}>
          {PERIOD_LABELS.map(({ type, label }) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.periodOption,
                periodType === type && styles.periodOptionActive,
              ]}
              onPress={() => setPeriodType(type)}
            >
              <Text
                style={[
                  styles.periodText,
                  periodType === type && styles.periodTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Global Time Navigation */}
        <TimeNavigationHeader
          title={chartData?.periodTitle ?? ''}
          subtitle={chartData?.periodSubtitle}
          canGoBack={true}
          canGoForward={periodOffset !== 0}
          showGoToCurrentHint={periodOffset !== 0}
          onPrev={() => navigatePeriod('prev')}
          onNext={() => navigatePeriod('next')}
          onTapTitle={periodOffset !== 0 ? goToCurrentPeriod : undefined}
        />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Chart Card - Primary visualization */}
            <Card style={styles.chartCard}>
              {/* Chart Title with Info Button */}
              <View style={styles.yAxisHeader}>
                <Text style={styles.yAxisLabel}>Drinks in Pure Alcohol (g)</Text>
                <TouchableOpacity
                  style={styles.infoButton}
                  onPress={() => setShowInfoModal(true)}
                >
                  <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Bar Chart */}
              <View style={styles.chartContainer}>
                {chartData && chartData.bars.length > 0 && (
                  <View style={styles.chartWithAxis}>
                    {/* Y-Axis */}
                    <View style={styles.yAxis}>
                      {yAxisTicks.map((tick) => (
                        <Text key={tick.value} style={styles.yAxisTickLabel}>
                          {tick.label}
                        </Text>
                      ))}
                    </View>

                    {/* Bars Area */}
                    <View style={styles.chartInner}>
                      {/* Bars Row */}
                      <View style={styles.barsRow}>
                        {chartData.bars.map((bar, index) => {
                          const barHeight = chartNiceMax > 0
                            ? (bar.alcoholGrams / chartNiceMax) * (CHART_HEIGHT - 50)
                            : 0;
                          const isSelected = selectedBarIndex === index;

                          return (
                            <TouchableOpacity
                              key={bar.id}
                              style={[styles.barColumn, { width: columnWidth }]}
                              onPress={() => handleBarPress(index)}
                              onPressIn={() => handleBarPressIn(index)}
                              onPressOut={handleBarPressOut}
                              activeOpacity={0.7}
                              delayPressIn={0}
                            >
                              <View
                                style={[
                                  styles.bar,
                                  {
                                    height: Math.max(2, barHeight),
                                    width: barWidth,
                                    backgroundColor: isSelected ? colors.primaryDark : colors.primary,
                                  },
                                ]}
                              />
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Tooltip */}
                      {USE_TOOLTIP && showTooltip && selectedBar && selectedBarIndex !== null && (
                        <View
                          style={[
                            styles.tooltip,
                            {
                              left: (selectedBarIndex * columnWidth) + (columnWidth / 2) - 75,
                            },
                          ]}
                        >
                          <View style={styles.tooltipContent}>
                            <Text style={styles.tooltipTitle}>{selectedBar.fullLabel}</Text>
                            <View style={styles.tooltipRow}>
                              <Text style={styles.tooltipLabel}>Drinks:</Text>
                              <Text style={styles.tooltipValue}>{selectedBar.drinkCount}</Text>
                            </View>
                            <View style={styles.tooltipRow}>
                              <Text style={styles.tooltipLabel}>Pure Alcohol:</Text>
                              <Text style={styles.tooltipValue}>{selectedBar.alcoholGrams.toFixed(1)} g</Text>
                            </View>
                          </View>
                          <View style={styles.tooltipArrow} />
                        </View>
                      )}

                      {/* X-Axis Labels Row */}
                      <View style={styles.xAxisRow}>
                        {chartData.bars.map((_, index) => {
                          const tickLabel = shouldShowTickLabel(index);
                          return (
                            <View key={`label-${index}`} style={[styles.xAxisColumn, { width: columnWidth }]}>
                              {tickLabel && (
                                <Text style={styles.xAxisLabel}>
                                  {tickLabel}
                                </Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                )}
              </View>

            </Card>

            {/* Stats Grid - Summary numbers (2 columns x 3 rows) */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Ionicons name="wine" size={16} color={colors.primary} />
                  <Text style={styles.statLabel}>TOTAL</Text>
                </View>
                <View style={styles.statValueRow}>
                  <Text style={styles.statValue}>{stats?.totalDrinks ?? 0}</Text>
                  <Text style={styles.statUnit}>Drinks</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Ionicons name="calendar" size={16} color={colors.warning} />
                  <Text style={styles.statLabel}>DRINKING</Text>
                </View>
                <View style={styles.statValueRow}>
                  <Text style={styles.statValue}>{stats?.drinkingDays ?? 0}</Text>
                  <Text style={styles.statUnit}>Days</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Ionicons name="moon" size={16} color={colors.success} />
                  <Text style={styles.statLabel}>SOBER</Text>
                </View>
                <View style={styles.statValueRow}>
                  <Text style={styles.statValue}>{stats?.soberDays ?? 0}</Text>
                  <Text style={styles.statUnit}>Days</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Ionicons name="shield-checkmark" size={16} color={colors.success} />
                  <Text style={styles.statLabel}>UNDER LIMIT</Text>
                </View>
                <View style={styles.statValueRow}>
                  <Text style={styles.statValue}>{stats?.underLimitDays ?? 0}</Text>
                  <Text style={styles.statUnit}>Days</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={styles.statLabel}>OVER LIMIT</Text>
                </View>
                <View style={styles.statValueRow}>
                  <Text style={styles.statValue}>{stats?.overLimitDays ?? 0}</Text>
                  <Text style={styles.statUnit}>Days</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Ionicons name="trending-up" size={16} color={colors.error} />
                  <Text style={styles.statLabel}>PEAK</Text>
                </View>
                <View style={styles.statValueRow}>
                  <Text style={styles.statValue}>
                    {formatBACValue(stats?.peakBAC ?? 0, bacUnit)}{unitSymbol}
                  </Text>
                </View>
              </View>
            </View>

          </>
        )}
      </ScrollView>

      {/* Standard Units Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowInfoModal(false)}
        >
          <View style={styles.infoModalContent}>
            <View style={styles.infoModalHeader}>
              <Ionicons name="information-circle" size={24} color={colors.primary} />
              <Text style={styles.infoModalTitle}>Pure Alcohol</Text>
            </View>

            <Text style={styles.infoModalText}>
              This chart shows the grams of pure alcohol consumed.
              This allows for a fair comparison between different drinks.
            </Text>

            <View style={styles.infoExampleContainer}>
              <Text style={styles.infoExampleTitle}>Examples:</Text>
              <View style={styles.infoExample}>
                <Ionicons name="beer-outline" size={20} color={colors.text} />
                <Text style={styles.infoExampleText}>
                  Beer 500ml (5%) = ~20g
                </Text>
              </View>
              <View style={styles.infoExample}>
                <Ionicons name="wine-outline" size={20} color={colors.text} />
                <Text style={styles.infoExampleText}>
                  Wine 200ml (12%) = ~19g
                </Text>
              </View>
              <View style={styles.infoExample}>
                <Ionicons name="cafe-outline" size={20} color={colors.text} />
                <Text style={styles.infoExampleText}>
                  Shot 20ml (40%) = ~6g
                </Text>
              </View>
            </View>

            <View style={styles.infoFormulaContainer}>
              <Text style={styles.infoFormulaTitle}>Formula:</Text>
              <Text style={styles.infoFormula}>
                Alcohol (g) = Volume (ml) × ABV% × 0.789
              </Text>
              <Text style={styles.infoFormulaNote}>
                0.789 g/ml = Density of ethanol
              </Text>
            </View>

            <TouchableOpacity
              style={styles.infoModalCloseButton}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={styles.infoModalCloseText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bar Detail Bottom Sheet */}
      <BottomSheetModal
        ref={barDetailSheetRef}
        enableDynamicSizing={true}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
        onDismiss={handleBarDetailDismiss}
      >
        <BottomSheetView style={styles.barDetailContent}>
          {selectedBar && (
            <>
              <Text style={styles.barDetailTitle}>{selectedBar.fullLabel}</Text>

              <View style={styles.barDetailRow}>
                <Ionicons name="wine" size={20} color={colors.primary} />
                <Text style={styles.barDetailLabel}>Drinks:</Text>
                <Text style={styles.barDetailValue}>{selectedBar.drinkCount}</Text>
              </View>

              <View style={styles.barDetailRow}>
                <Ionicons name="flask" size={20} color={colors.warning} />
                <Text style={styles.barDetailLabel}>Pure Alcohol:</Text>
                <Text style={styles.barDetailValue}>
                  {selectedBar.alcoholGrams.toFixed(1)} g
                </Text>
              </View>

              {/* Bottom padding for safe area */}
              <View style={{ height: spacing.xl }} />
            </>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  periodOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  periodOptionActive: {
    backgroundColor: colors.primary,
  },
  periodText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  periodTextActive: {
    color: colors.textOnPrimary,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
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
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  statUnit: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  chartCard: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
  },
  yAxisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  yAxisLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoButton: {
    marginLeft: spacing.xs,
    padding: 2,
  },
  chartContainer: {
    height: CHART_HEIGHT,
  },
  chartWithAxis: {
    flexDirection: 'row',
    flex: 1,
  },
  yAxis: {
    width: Y_AXIS_WIDTH,
    height: CHART_HEIGHT - 50, // Same as barsRow height
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: spacing.xs,
  },
  yAxisTickLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  chartInner: {
    flex: 1,
    height: CHART_HEIGHT, // Ensure bars area has full height
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT - 50,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    borderRadius: 2,
    minHeight: 2,
  },
  xAxisRow: {
    flexDirection: 'row',
    height: 24,
    marginTop: spacing.xs,
    overflow: 'visible',
  },
  xAxisColumn: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'visible',
  },
  xAxisLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    minWidth: 30,
  },
  // Info Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoModalContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    maxWidth: 350,
  },
  infoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoModalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  infoModalText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  infoExampleContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoExampleTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoExample: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  infoExampleText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  infoFormulaContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  infoFormulaTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  infoFormula: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontFamily: 'monospace',
    marginBottom: spacing.xs,
  },
  infoFormulaNote: {
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
  infoModalCloseButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  infoModalCloseText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textOnPrimary,
  },
  // Bottom Sheet Styles
  sheetBackground: {
    backgroundColor: colors.background,
  },
  sheetHandle: {
    backgroundColor: colors.textLight,
    width: 40,
  },
  // Bar Detail Content Styles
  barDetailContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  barDetailTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  barDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  barDetailLabel: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  barDetailValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  // Tooltip Styles
  tooltip: {
    position: 'absolute',
    bottom: CHART_HEIGHT - 50 + spacing.sm,
    width: 150,
    zIndex: 100,
  },
  tooltipContent: {
    backgroundColor: colors.text,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.text,
    alignSelf: 'center',
  },
  tooltipTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.background,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  tooltipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  tooltipLabel: {
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
  tooltipValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.background,
  },
});
