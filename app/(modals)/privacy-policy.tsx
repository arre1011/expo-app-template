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
import { Card } from '../../src/ui/components';
import { appConfig } from '../../src/config/appConfig';
import { colors, spacing, fontSize, fontWeight } from '../../src/ui/theme';

export default function PrivacyPolicyModal() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/settings')} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Placeholder</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.highlightCard}>
          <View style={styles.highlightHeader}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.warning} />
            <Text style={styles.highlightTitle}>Replace before release</Text>
          </View>
          <Text style={styles.highlightText}>
            This template screen is intentionally generic. Review it against the real data flows of {appConfig.appName} before shipping.
          </Text>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What this template may store</Text>
          <Card style={styles.card}>
            <Text style={styles.bodyText}>Local app data such as onboarding choices, notes, calendar entries, and settings.</Text>
            <Text style={styles.bodyText}>Subscription metadata handled through RevenueCat when subscriptions are enabled.</Text>
            <Text style={styles.bodyText}>Reminder scheduling metadata for trial wrap-up notifications.</Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Potential third-party services</Text>
          <Text style={styles.bodyText}>
            This codebase includes integrations such as RevenueCat, Sentry, and PostHog. Depending on your configuration, these may process subscription, diagnostics, or analytics data.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer checklist</Text>
          <Text style={styles.bodyText}>Update support contact, legal URLs, notification copy, and the actual list of collected data.</Text>
          <Text style={styles.bodyText}>Remove any claim that is not true for the shipped product.</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Support: {appConfig.supportEmail}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  highlightCard: {
    padding: spacing.lg,
    backgroundColor: `${colors.warning}12`,
    marginBottom: spacing.xl,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  highlightTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  highlightText: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  card: {
    padding: spacing.md,
    gap: spacing.md,
  },
  bodyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  footer: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
