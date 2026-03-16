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
import { colors, spacing, fontSize, fontWeight } from '../../src/ui/theme';
import { Card } from '../../src/ui/components';

export default function PrivacyPolicyModal() {
  const handleClose = () => {
    router.replace('/(tabs)/settings');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.highlightCard}>
          <View style={styles.highlightHeader}>
            <Ionicons name="lock-closed" size={32} color={colors.primary} />
            <Text style={styles.highlightTitle}>Your data stays local</Text>
          </View>
          <Text style={styles.highlightText}>
            All your data is stored exclusively on your device.
            No data is transferred to servers or third parties.
          </Text>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What data is stored?</Text>
          <Card style={styles.card}>
            <View style={styles.dataItem}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.dataText}>
                <Text style={styles.dataBold}>Profile data:</Text> Weight, sex, metabolism rate
              </Text>
            </View>
            <View style={styles.dataItem}>
              <Ionicons name="wine-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.dataText}>
                <Text style={styles.dataBold}>Drink logs:</Text> Time, amount, alcohol content
              </Text>
            </View>
            <View style={styles.dataItem}>
              <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.dataText}>
                <Text style={styles.dataBold}>Settings:</Text> Daily goals, alcohol level limit
              </Text>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where is the data stored?</Text>
          <Text style={styles.bodyText}>
            All data is stored in a local SQLite database on your smartphone.
            This database is only accessible to this app and is not shared with other apps.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Is any data transmitted?</Text>
          <Text style={styles.bodyText}>
            No. This app does not send data to servers, cloud services, or third parties.
            There is no synchronization, no tracking, and no analytics.
            The app works completely offline.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What happens when I delete the app?</Text>
          <Text style={styles.bodyText}>
            When you uninstall the app, all data is automatically removed from your device.
            There are no backups or copies outside of your device.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analytics and Tracking</Text>
          <Text style={styles.bodyText}>
            This app does not use analytics tools, tracking pixels, or similar technologies.
            We do not collect usage data and do not create user profiles.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          <Text style={styles.bodyText}>
            The app does not require special permissions. Optionally, notifications can be
            enabled for reminders – this is voluntary and can be disabled at any time
            in your system settings.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.bodyText}>
            For privacy questions, you can contact the app developer.
            This app is an open-source project for harm reduction.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Last updated: January 2025
          </Text>
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
    backgroundColor: colors.primaryLight + '15',
    marginBottom: spacing.xl,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  highlightTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
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
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dataText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  dataBold: {
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  bodyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
  },
});
