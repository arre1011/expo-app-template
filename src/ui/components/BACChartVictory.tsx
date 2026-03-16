import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';
import { useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BACTimeSeries } from '../../domain/models/types';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import { format } from 'date-fns';

interface BACChartVictoryProps {
  timeSeries: BACTimeSeries;
  height?: number;
  onTouchBAC?: (bac: number | null) => void;
}

// Victory Native requires data with index signature
type ChartDataPoint = {
  timestamp: number;
  bac: number;
  [key: string]: unknown;
};

interface ActiveValueIndicatorProps {
  xPosition: SharedValue<number>;
  yPosition: SharedValue<number>;
}

function ActiveValueIndicator({
  xPosition,
  yPosition,
}: ActiveValueIndicatorProps) {
  return (
    <>
      {/* Marker dot on curve */}
      <Circle
        cx={xPosition}
        cy={yPosition}
        r={8}
        color={colors.primary}
      />
      {/* Inner white dot for better visibility */}
      <Circle
        cx={xPosition}
        cy={yPosition}
        r={4}
        color={colors.card}
      />
    </>
  );
}

interface DefaultMarkerProps {
  chartData: ChartDataPoint[];
  startTime: number;
  endTime: number;
  yDomain: [number, number];
  chartBounds: { left: number; right: number; top: number; bottom: number };
  onPositionCalculated: (x: number, y: number) => void;
}

function DefaultMarker({
  chartData,
  startTime,
  endTime,
  yDomain,
  chartBounds,
  onPositionCalculated,
}: DefaultMarkerProps) {
  const now = Date.now();

  // Find the BAC value at current time by interpolation
  const currentBac = useMemo(() => {
    if (!chartData.length) return 0;

    // Find the two points surrounding "now"
    let before: ChartDataPoint | null = null;
    let after: ChartDataPoint | null = null;

    for (let i = 0; i < chartData.length; i++) {
      if (chartData[i].timestamp <= now) {
        before = chartData[i];
      }
      if (chartData[i].timestamp >= now && !after) {
        after = chartData[i];
      }
    }

    if (!before && !after) return 0;
    if (!before) return after!.bac;
    if (!after) return before.bac;

    // Linear interpolation
    const ratio = (now - before.timestamp) / (after.timestamp - before.timestamp);
    return before.bac + (after.bac - before.bac) * ratio;
  }, [chartData, now]);

  // Calculate X position using chartBounds
  const xPosition = useMemo(() => {
    if (endTime === startTime) return chartBounds.left;
    const ratio = (now - startTime) / (endTime - startTime);
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    return chartBounds.left + clampedRatio * (chartBounds.right - chartBounds.left);
  }, [now, startTime, endTime, chartBounds]);

  // Calculate Y position using chartBounds
  const yPosition = useMemo(() => {
    const [yMin, yMax] = yDomain;
    if (yMax === yMin) return chartBounds.bottom;
    const ratio = (currentBac - yMin) / (yMax - yMin);
    // Y is inverted (0 at bottom, max at top)
    return chartBounds.bottom - ratio * (chartBounds.bottom - chartBounds.top);
  }, [currentBac, yDomain, chartBounds]);

  // Report position to parent for tooltip overlay
  useEffect(() => {
    onPositionCalculated(xPosition, yPosition);
  }, [xPosition, yPosition, onPositionCalculated]);

  return (
    <>
      {/* Marker dot on curve */}
      <Circle
        cx={xPosition}
        cy={yPosition}
        r={8}
        color={colors.primary}
      />
      {/* Inner white dot for better visibility */}
      <Circle
        cx={xPosition}
        cy={yPosition}
        r={4}
        color={colors.card}
      />
    </>
  );
}

export function BACChartVictory({
  timeSeries,
  height = 250,
  onTouchBAC
}: BACChartVictoryProps) {
  // State for tooltip position (default marker)
  const [markerPosition, setMarkerPosition] = useState<{ x: number; y: number } | null>(null);

  // State for touch tooltip position and time
  const [touchInfo, setTouchInfo] = useState<{ x: number; y: number; time: string } | null>(null);

  // Setup chart press state for touch interactivity
  const { state, isActive } = useChartPressState({ x: 0, y: { bac: 0 } });

  // Callback functions for runOnJS
  const handleTouchStart = (bac: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTouchBAC?.(bac);
  };

  const handleTouchEnd = () => {
    onTouchBAC?.(null);
    setTouchInfo(null);
  };

  const handleTouchMove = (bac: number) => {
    onTouchBAC?.(bac);
  };

  const updateTouchInfo = (x: number, y: number, timestamp: number) => {
    const timeText = format(new Date(timestamp), 'HH:mm');
    setTouchInfo({ x, y, time: timeText });
  };

  // Use a single useAnimatedReaction for all touch-related updates
  // This avoids reading SharedValues during render
  useAnimatedReaction(
    () => ({
      x: state.x.position.value,
      y: state.y.bac.position.value,
      bac: state.y.bac.value.value,
      timestamp: state.x.value.value,
      active: isActive,
    }),
    (current, previous) => {
      const wasActive = previous?.active ?? false;

      if (current.active && !wasActive) {
        // Touch started
        runOnJS(handleTouchStart)(current.bac);
        runOnJS(updateTouchInfo)(current.x, current.y, current.timestamp);
      } else if (!current.active && wasActive) {
        // Touch ended
        runOnJS(handleTouchEnd)();
      } else if (current.active) {
        // Dragging - update BAC value and position
        runOnJS(handleTouchMove)(current.bac);
        runOnJS(updateTouchInfo)(current.x, current.y, current.timestamp);
      }
    },
    [isActive, onTouchBAC]
  );

  // Convert data points for chart - use all points for smooth touch interaction
  const chartData = useMemo(() => {
    if (!timeSeries.dataPoints.length) return [];

    // Use all data points for smooth touch tracking
    return timeSeries.dataPoints.map(point => ({
      timestamp: point.timestamp.getTime(),
      bac: point.bac,
    }));
  }, [timeSeries.dataPoints]);

  // Get start time (first drink) and end time (sober time)
  const { startTime, endTime } = useMemo(() => {
    if (!chartData.length) return { startTime: 0, endTime: 0 };

    const start = chartData[0].timestamp;
    const end = timeSeries.soberTime
      ? timeSeries.soberTime.getTime()
      : chartData[chartData.length - 1].timestamp;

    return { startTime: start, endTime: end };
  }, [chartData, timeSeries.soberTime]);

  // Calculate Y-axis domain
  const yDomain = useMemo((): [number, number] => {
    if (!chartData.length) return [0, 1];
    const maxBac = Math.max(...chartData.map(d => d.bac), 0.3);
    const niceMax = Math.ceil(maxBac * 10) / 10;
    return [0, niceMax];
  }, [chartData]);

  // Current time for tooltip
  const currentTimeText = format(new Date(), 'HH:mm');

  if (!chartData.length) {
    return (
      <View style={styles.container}>
        <View style={{ height, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.noDataText}>Keine Daten verfügbar</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ height, width: '100%', position: 'relative', marginHorizontal: -spacing.md }}>
        <CartesianChart
          padding={{ left: spacing.md, right: spacing.md, top: 0, bottom: 0 }}
          data={chartData}
          xKey="timestamp"
          yKeys={["bac"]}
          domain={{
            x: [startTime, endTime],
            y: yDomain
          }}
          chartPressState={state}
          axisOptions={{
            formatXLabel: (value) => format(new Date(value as number), 'HH:mm'),
            formatYLabel: (value) => `${(value as number).toFixed(1)}%`,
            tickCount: { x: 4, y: 5 },
            labelColor: colors.textSecondary,
            lineColor: 'transparent', // Hide grid lines for clean look
            axisSide: { x: 'bottom', y: 'right' }, // Move Y-axis to right for better touch area on left
          }}
        >
          {({ points, chartBounds }) => (
            <>
              {/* BAC curve */}
              <Line
                points={points.bac}
                color={colors.chartLine}
                strokeWidth={2.5}
                curveType="natural"
              />
              {/* Active value indicator (shown during touch) */}
              {isActive && (
                <ActiveValueIndicator
                  xPosition={state.x.position}
                  yPosition={state.y.bac.position}
                />
              )}
              {/* Default marker at current time (shown when not touching) */}
              {!isActive && (
                <DefaultMarker
                  chartData={chartData}
                  startTime={startTime}
                  endTime={endTime}
                  yDomain={yDomain}
                  chartBounds={chartBounds}
                  onPositionCalculated={(x, y) => setMarkerPosition({ x, y })}
                />
              )}
            </>
          )}
        </CartesianChart>

        {/* Tooltip overlay - positioned above the marker (default state) */}
        {!isActive && markerPosition && (
          <View
            style={[
              styles.tooltipContainer,
              {
                left: markerPosition.x - 25,
                top: markerPosition.y - 28,
              }
            ]}
            pointerEvents="none"
          >
            <Text style={styles.tooltipText}>{currentTimeText}</Text>
          </View>
        )}

        {/* Tooltip overlay - positioned above the marker (touch state) */}
        {isActive && touchInfo && (
          <View
            style={[
              styles.tooltipContainer,
              {
                left: touchInfo.x - 25,
                top: touchInfo.y - 28,
              }
            ]}
            pointerEvents="none"
          >
            <Text style={styles.tooltipText}>{touchInfo.time}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  noDataText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  tooltipContainer: {
    position: 'absolute',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    minWidth: 50,
    alignItems: 'center',
  },
  tooltipText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});
