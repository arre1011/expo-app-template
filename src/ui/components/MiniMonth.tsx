import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { format, startOfMonth, getDay, isToday } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { colors, spacing, fontSize, fontWeight } from '../theme';
import { DayStatus } from '../../domain/models/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MONTH_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 2) / 3;

interface MiniMonthProps {
  year: number;
  month: number;
  dayData?: Map<string, DayStatus>;
  onPress: () => void;
  isCurrentMonth?: boolean;
}

const statusColors: Record<DayStatus, string> = {
  good: colors.soberSoft,
  moderate: colors.moderateSoft,
  bad: colors.overLimitSoft,
  no_data: colors.transparent,
};

export const MiniMonth = memo(function MiniMonth({
  year,
  month,
  dayData,
  onPress,
  isCurrentMonth,
}: MiniMonthProps) {
  const firstDay = startOfMonth(new Date(year, month - 1));
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayWeekday = getDay(firstDay);
  const paddingDays = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

  const monthName = format(firstDay, 'MMM', { locale: enUS });

  const days: (number | null)[] = [];
  for (let i = 0; i < paddingDays; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  while (days.length % 7 !== 0) days.push(null);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.monthName, isCurrentMonth && styles.currentMonthName]}>
        {monthName}
      </Text>
      <View style={styles.daysGrid}>
        {days.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const date = new Date(year, month - 1, day);
          const dateString = format(date, 'yyyy-MM-dd');
          const status = dayData?.get(dateString) || 'no_data';
          const isTodayDate = isToday(date);
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          const isFutureDate = date > today;

          return (
            <View key={day} style={styles.dayCell}>
              <View
                style={[
                  styles.dayCircle,
                  isTodayDate && styles.todayCircle,
                  status !== 'no_data' && !isFutureDate && {
                    backgroundColor: statusColors[status],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    isTodayDate && styles.todayText,
                    isFutureDate && styles.futureDayText,
                  ]}
                >
                  {day}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    width: MONTH_WIDTH,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  monthName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  currentMonthName: {
    color: colors.primary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircle: {
    width: '90%',
    aspectRatio: 1,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCircle: {},
  dayText: {
    fontSize: 8,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  todayText: {
    fontWeight: fontWeight.bold,
  },
  futureDayText: {
    color: colors.textSecondary,
    opacity: 0.4,
  },
});
