import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/ui/components';
import { appConfig } from '@/config/appConfig';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/ui/theme';

const START_POINTS = [
  {
    title: 'Replace this screen first',
    description: 'Use Home for the first meaningful action in your next app, not for generic stats.',
    icon: 'home-outline' as const,
    color: colors.primary,
  },
  {
    title: 'Calendar stays reusable',
    description: 'The calendar/journal flow is still available if the next app benefits from day-based tracking.',
    icon: 'calendar-outline' as const,
    color: colors.info,
  },
  {
    title: 'Statistics are intentionally out',
    description: 'Build a new stats area only when the next product actually needs one.',
    icon: 'analytics-outline' as const,
    color: colors.warning,
  },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>{appConfig.appName}</Text>
        <Text style={styles.title}>Template Home Placeholder</Text>
        <Text style={styles.subtitle}>
          The old domain-specific home is removed. This is now the clean starting point for the next app.
        </Text>

        <Card style={styles.highlightCard}>
          <View style={styles.highlightRow}>
            <Ionicons name="build-outline" size={24} color={colors.primary} />
            <Text style={styles.highlightTitle}>What belongs here next</Text>
          </View>
          <Text style={styles.highlightText}>
            Replace this screen with your product&apos;s primary action, strongest empty state, or first repeatable user loop.
          </Text>
        </Card>

        <View style={styles.cardList}>
          {START_POINTS.map((item) => (
            <Card key={item.title} style={styles.infoCard}>
              <View style={[styles.iconWrap, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => router.push('/(tabs)/calendar')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryActionText}>Open Calendar Module</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => router.push('/(tabs)/settings')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryActionText}>Open Template Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  eyebrow: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  highlightCard: {
    padding: spacing.lg,
    backgroundColor: `${colors.primary}10`,
    marginBottom: spacing.lg,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  highlightTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  highlightText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  cardList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    padding: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  actions: {
    gap: spacing.md,
  },
  primaryAction: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryActionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
  secondaryAction: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryActionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
});
