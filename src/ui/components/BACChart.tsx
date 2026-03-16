import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Circle, G, Text as SvgText } from 'react-native-svg';
import { BACTimeSeries } from '../../domain/models/types';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { format } from 'date-fns';
import { formatBACValue, getBACUnitSymbol } from '../../domain/utils/bacConversion';
import { useBACUnit } from '../hooks/useAppStore';

interface BACChartProps {
  timeSeries: BACTimeSeries;
  height?: number;
  bacLimit?: number; // Optional BAC limit to display as horizontal line
}

interface ChartDataPoint {
  timestamp: number;
  bac: number;
}

// Y-axis labels are placed in negative x-space using a negative viewBox origin.
// This allows the chart area to use full width while labels remain visible.
// See: https://www.sarasoueidan.com/blog/svg-coordinate-systems/
const Y_AXIS_LABEL_SPACE = 45; // Space for labels like "0.98‰" in negative x territory
const PADDING = { top: 20, right: 8, bottom: 30, left: 8 }; // Small padding for the chart area itself

// Nice numbers algorithm for Y-axis scaling
// Based on Heckbert's algorithm - uses "nice" numbers (1, 2, 5) × 10^n
function niceNumber(range: number, round: boolean): number {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);

  let niceFraction: number;
  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }

  return niceFraction * Math.pow(10, exponent);
}

function calculateNiceScale(minValue: number, maxValue: number, maxTicks: number = 5) {
  const range = niceNumber(maxValue - minValue, false);
  const tickSpacing = niceNumber(range / (maxTicks - 1), true);
  const niceMin = Math.floor(minValue / tickSpacing) * tickSpacing;
  const niceMax = Math.ceil(maxValue / tickSpacing) * tickSpacing;

  return {
    niceMin,
    niceMax,
    tickSpacing,
  };
}

export function BACChart({ timeSeries, height = 200, bacLimit }: BACChartProps) {
  const now = Date.now();
  const bacUnit = useBACUnit();
  const unitSymbol = getBACUnitSymbol(bacUnit);

  // Downsample data for display
  const chartData = useMemo(() => {
    if (!timeSeries.dataPoints.length) return [];

    const sampledPoints: ChartDataPoint[] = [];
    let lastSampledTime = 0;
    const sampleInterval = 1 * 60 * 1000; // 1 minute - full resolution for accurate curves

    for (const point of timeSeries.dataPoints) {
      const pointTime = point.timestamp.getTime();
      if (pointTime - lastSampledTime >= sampleInterval || sampledPoints.length === 0) {
        sampledPoints.push({
          timestamp: pointTime,
          bac: point.bac,
        });
        lastSampledTime = pointTime;
      }
    }

    return sampledPoints;
  }, [timeSeries.dataPoints]);

  // Calculate chart dimensions and scales
  const chartMetrics = useMemo(() => {
    if (!chartData.length) return null;

    const timestamps = chartData.map(d => d.timestamp);
    const bacValues = chartData.map(d => d.bac);

    // Use reduce instead of spread operator to avoid stack overflow on large arrays
    const drinkingStartTime = timestamps.reduce((min, t) => (t < min ? t : min), Infinity);

    // Get sober time from timeSeries or use last data point
    const soberTimeMs = timeSeries.soberTime
      ? timeSeries.soberTime.getTime()
      : timestamps.reduce((max, t) => (t > max ? t : max), -Infinity);

    // Add 5% padding on each side for better visualization
    const timeRange = soberTimeMs - drinkingStartTime;
    const timePadding = timeRange * 0.05; // 5% padding

    const displayMinTime = drinkingStartTime - timePadding;
    const displayMaxTime = soberTimeMs + timePadding;

    // Y-axis: use nice numbers algorithm for clean tick marks
    // Always start at 0 for BAC, calculate nice max based on peak
    // Ensure the limit line is always visible by adding 20% buffer above the limit
    const limitWithBuffer = bacLimit ? bacLimit * 1.2 : 0.3;
    const peakBAC = bacValues.reduce((max, v) => (v > max ? v : max), limitWithBuffer);
    const { niceMax: maxBAC, tickSpacing: yTickSpacing } = calculateNiceScale(0, peakBAC, 5);

    const chartWidth = 300; // Will be scaled by viewBox
    const chartHeight = height;
    const innerWidth = chartWidth - PADDING.left - PADDING.right;
    const innerHeight = chartHeight - PADDING.top - PADDING.bottom;

    const xScale = (time: number) =>
      PADDING.left + ((time - displayMinTime) / (displayMaxTime - displayMinTime || 1)) * innerWidth;

    const yScale = (bac: number) =>
      PADDING.top + innerHeight - (bac / maxBAC) * innerHeight;

    return {
      drinkingStartTime,
      soberTime: soberTimeMs,
      displayMinTime,
      displayMaxTime,
      maxBAC,
      yTickSpacing,
      chartWidth,
      chartHeight,
      innerWidth,
      innerHeight,
      xScale,
      yScale,
    };
  }, [chartData, height, timeSeries.soberTime, bacLimit]);

  // Generate SVG path for the line
  const linePath = useMemo(() => {
    if (!chartData.length || !chartMetrics) return '';

    const { xScale, yScale } = chartMetrics;

    return chartData.reduce((path, point, index) => {
      const x = xScale(point.timestamp);
      const y = yScale(point.bac);
      return path + (index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, '');
  }, [chartData, chartMetrics]);

  // Generate Y-axis labels using nice number spacing
  // Filter out labels that would overlap with the limit label
  const yAxisLabels = useMemo(() => {
    if (!chartMetrics) return [];

    const { maxBAC, yTickSpacing, yScale } = chartMetrics;
    const labels = [];

    // Generate ticks from 0 to maxBAC using nice tick spacing
    for (let value = 0; value <= maxBAC + 0.0001; value += yTickSpacing) {
      // Skip this label if it's too close to the limit value (would overlap)
      if (bacLimit !== undefined && Math.abs(value - bacLimit) < yTickSpacing * 0.4) {
        continue;
      }

      // Format label using BAC conversion utility (value is in permille internally)
      labels.push({
        value,
        y: yScale(value),
        label: `${formatBACValue(value, bacUnit)}${unitSymbol}`,
      });
    }

    return labels;
  }, [chartMetrics, bacLimit, bacUnit, unitSymbol]);

  // Generate X-axis labels using D3-style "nice" time intervals
  // Target: ~5 labels total (including start and end)
  // Uses predefined intervals: 15min, 30min, 1h, 2h, 3h (like D3 time scale)
  const xAxisLabels = useMemo(() => {
    if (!chartMetrics || !chartData.length) return [];

    const { drinkingStartTime, soberTime, xScale, chartHeight } = chartMetrics;
    const labels: { time: number; x: number; y: number; label: string; isEndpoint: boolean }[] = [];

    const timeRangeMs = soberTime - drinkingStartTime;
    const timeRangeMinutes = timeRangeMs / (60 * 1000);

    // D3-style predefined "nice" intervals in minutes
    // Choose interval that gives approximately 3-4 intermediate ticks
    const niceIntervals = [15, 30, 60, 120, 180, 360]; // 15min, 30min, 1h, 2h, 3h, 6h
    const targetIntermediateTicks = 3;

    // Find the best interval that gives us close to target ticks
    let bestIntervalMinutes = 60; // default 1 hour
    for (const interval of niceIntervals) {
      const estimatedTicks = Math.floor(timeRangeMinutes / interval) - 1; // -1 because we skip ticks too close to edges
      if (estimatedTicks >= targetIntermediateTicks - 1 && estimatedTicks <= targetIntermediateTicks + 2) {
        bestIntervalMinutes = interval;
        break;
      }
      // Keep track of the best option if we can't find a perfect match
      if (estimatedTicks >= 1) {
        bestIntervalMinutes = interval;
      }
    }

    const intervalMs = bestIntervalMinutes * 60 * 1000;

    // Minimum distance from endpoints to avoid label overlap (15% of range or 10min, whichever is larger)
    const minDistanceMs = Math.max(timeRangeMs * 0.15, 10 * 60 * 1000);

    // Add start time (exact, not rounded)
    labels.push({
      time: drinkingStartTime,
      x: xScale(drinkingStartTime),
      y: chartHeight - 8,
      label: format(new Date(drinkingStartTime), 'HH:mm'),
      isEndpoint: true,
    });

    // Find first rounded time after start
    const firstRoundedTime = Math.ceil(drinkingStartTime / intervalMs) * intervalMs;

    // Add rounded intermediate ticks
    for (let time = firstRoundedTime; time < soberTime; time += intervalMs) {
      // Skip if too close to start or end
      if (time - drinkingStartTime < minDistanceMs || soberTime - time < minDistanceMs) {
        continue;
      }

      labels.push({
        time,
        x: xScale(time),
        y: chartHeight - 8,
        label: format(new Date(time), 'HH:mm'),
        isEndpoint: false,
      });
    }

    // Add sober time (exact, not rounded)
    labels.push({
      time: soberTime,
      x: xScale(soberTime),
      y: chartHeight - 8,
      label: format(new Date(soberTime), 'HH:mm'),
      isEndpoint: true,
    });

    return labels;
  }, [chartMetrics, chartData]);

  // Calculate "now" marker position
  const nowMarker = useMemo(() => {
    if (!chartMetrics) return null;

    const { displayMinTime, displayMaxTime, xScale } = chartMetrics;
    // Show marker if current time is within the displayed range
    if (now < displayMinTime || now > displayMaxTime) return null;

    return {
      x: xScale(now),
      y1: PADDING.top,
      y2: height - PADDING.bottom,
    };
  }, [chartMetrics, now, height]);

  if (!chartData.length || !chartMetrics) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={[styles.chartContainer, { height }]}>
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.chartContainer, { height }]}>
        <Svg
          width="100%"
          height={height}
          viewBox={`${-Y_AXIS_LABEL_SPACE} 0 ${chartMetrics.chartWidth + Y_AXIS_LABEL_SPACE} ${chartMetrics.chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Y-axis labels */}
          {yAxisLabels.map((tick, i) => (
            <G key={`y-${i}`}>
              <Line
                x1={PADDING.left}
                y1={tick.y}
                x2={chartMetrics.chartWidth - PADDING.right}
                y2={tick.y}
                stroke={colors.border}
                strokeWidth={1}
                strokeDasharray={i === 0 ? undefined : "4,4"}
              />
              <SvgText
                x={-4}
                y={tick.y + 4}
                fill={colors.textSecondary}
                fontSize={10}
                textAnchor="end"
              >
                {tick.label}
              </SvgText>
            </G>
          ))}

          {/* X-axis labels */}
          {xAxisLabels.map((tick, i) => (
            <SvgText
              key={`x-${i}`}
              x={tick.x}
              y={tick.y}
              fill={colors.textSecondary}
              fontSize={10}
              textAnchor="middle"
            >
              {tick.label}
            </SvgText>
          ))}

          {/* BAC Line */}
          <Path
            d={linePath}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* BAC Limit line with label - always visible since Y-axis scales to include it */}
          {bacLimit !== undefined && (
            <G>
              <Line
                x1={PADDING.left}
                y1={chartMetrics.yScale(bacLimit)}
                x2={chartMetrics.chartWidth - PADDING.right}
                y2={chartMetrics.yScale(bacLimit)}
                stroke={colors.error}
                strokeWidth={1.5}
                strokeDasharray="6,4"
              />
              <SvgText
                x={-4}
                y={chartMetrics.yScale(bacLimit) + 4}
                fill={colors.error}
                fontSize={10}
                textAnchor="end"
              >
                {`${formatBACValue(bacLimit, bacUnit)}${unitSymbol}`}
              </SvgText>
            </G>
          )}

          {/* Current time marker */}
          {nowMarker && (
            <G>
              <Line
                x1={nowMarker.x}
                y1={nowMarker.y1}
                x2={nowMarker.x}
                y2={nowMarker.y2}
                stroke={colors.warning}
                strokeWidth={2}
              />
              <Circle
                cx={nowMarker.x}
                cy={nowMarker.y1}
                r={4}
                fill={colors.warning}
              />
              {/* Current time label above the marker */}
              <SvgText
                x={nowMarker.x}
                y={nowMarker.y1 - 8}
                fill={colors.warning}
                fontSize={10}
                fontWeight="600"
                textAnchor="middle"
              >
                {format(new Date(now), 'HH:mm')}
              </SvgText>
            </G>
          )}
        </Svg>
      </View>
      {(nowMarker || bacLimit !== undefined) && (
        <View style={styles.legendContainer}>
          {bacLimit !== undefined && (
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: colors.error }]} />
              <Text style={styles.legendText}>Limit</Text>
            </View>
          )}
          {nowMarker && (
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: colors.warning }]} />
              <Text style={styles.legendText}>Now</Text>
            </View>
          )}
        </View>
      )}
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
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  chartContainer: {
    width: '100%',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendLine: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  noDataText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
});
