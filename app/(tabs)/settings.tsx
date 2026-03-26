import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/ui/components';
import { MySubscriptionSheet } from '../../src/ui/sheets';
import { useSubscriptionStatus } from '../../src/ui/hooks/useSubscriptionStore';
import { resetDatabase } from '../../src/data/database/connection';
import {
  sendTestReminder,
  scheduleSequentialTestReminders,
  debugScheduledNotifications,
} from '../../src/services/notificationService';
import { appConfig } from '../../src/config/appConfig';
import { featureFlags } from '../../src/config/featureFlags';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/ui/theme';

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function SettingRow({
  icon,
  label,
  subtext,
  onPress,
  iconColor = colors.textSecondary,
  trailing,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtext?: string;
  onPress?: () => void;
  iconColor?: string;
  trailing?: React.ReactNode;
}) {
  const content = (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtext ? <Text style={styles.rowSubtext}>{subtext}</Text> : null}
      </View>
      {trailing ?? (onPress ? <Ionicons name="chevron-forward" size={20} color={colors.textLight} /> : null)}
    </View>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

type SubscriptionStatus = {
  isActive: boolean;
  productIdentifier?: string;
  expirationDate?: string;
  willRenew?: boolean;
  isLifetime?: boolean;
} | null;

function getSubscriptionCopy(subscriptionStatus: SubscriptionStatus) {
  if (!subscriptionStatus?.isActive) return 'No active subscription';
  if (subscriptionStatus.isLifetime) return 'Lifetime access';
  if (subscriptionStatus.expirationDate) {
    const label = subscriptionStatus.willRenew ? 'Renews' : 'Expires';
    return `${label} ${new Date(subscriptionStatus.expirationDate).toLocaleDateString('en-US')}`;
  }
  return 'Active subscription';
}

export default function SettingsScreen() {
  const subscriptionStatus = useSubscriptionStatus();
  const [subscriptionSheetOpen, setSubscriptionSheetOpen] = useState(false);

  const handleResetDatabase = () => {
    Alert.alert(
      'Reset Database',
      'This deletes local app data in the template database. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetDatabase();
              Alert.alert('Success', 'Database reset. Restart the app if needed.');
            } catch (error) {
              console.error('Failed to reset database:', error);
              Alert.alert('Error', 'Database could not be reset.');
            }
          },
        },
      ]
    );
  };

  const handleSupport = () => {
    Linking.openURL(`mailto:${appConfig.supportEmail}?subject=${encodeURIComponent(`${appConfig.appName} Support`)}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <SectionHeader title="TEMPLATE" />
        <Card style={styles.card}>
          <SettingRow
            icon="layers-outline"
            label="Home is now a placeholder"
            subtext="Replace it with the first meaningful action of the next app."
          />
          <Divider />
          <SettingRow
            icon="analytics-outline"
            label="Statistics are hidden by default"
            subtext="Rebuild them from scratch when the product really needs them."
          />
          <Divider />
          <SettingRow
            icon="calendar-outline"
            label="Calendar module stays available"
            subtext="Useful if the next app benefits from notes or day-based tracking."
          />
        </Card>

        {featureFlags.subscriptionSection && (
          <>
            <SectionHeader title="SUBSCRIPTION" />
            <Card style={styles.card}>
              <SettingRow
                icon="card-outline"
                label="Manage Subscription"
                subtext={getSubscriptionCopy(subscriptionStatus)}
                onPress={() => setSubscriptionSheetOpen(true)}
                iconColor={colors.primary}
              />
            </Card>
          </>
        )}

        <SectionHeader title="NOTIFICATIONS" />
        <Card style={styles.card}>
          <SettingRow
            icon="notifications-outline"
            label="Trial wrap-up reminders stay wired"
            subtext="The template still reminds users 2 days before expiry and again on the final day."
            iconColor={colors.warning}
          />
        </Card>

        <SectionHeader title="LEGAL" />
        <Card style={styles.card}>
          <SettingRow
            icon="lock-closed-outline"
            label="Privacy Placeholder"
            subtext="Open the in-app privacy placeholder and replace it before shipping."
            onPress={() => router.push('/(modals)/privacy-policy')}
          />
          <Divider />
          <SettingRow
            icon="document-outline"
            label="Terms URL"
            subtext={appConfig.legal.termsUrl}
            onPress={() => Linking.openURL(appConfig.legal.termsUrl)}
          />
          <Divider />
          <SettingRow
            icon="mail-outline"
            label="Support Email"
            subtext={appConfig.supportEmail}
            onPress={handleSupport}
          />
        </Card>

        {__DEV__ && (
          <>
            <SectionHeader title="DEVELOPMENT" />
            <Card style={styles.card}>
              <SettingRow
                icon="trash-outline"
                label="Reset Database"
                subtext="Clears local template data."
                onPress={handleResetDatabase}
                iconColor={colors.error}
              />
              <Divider />
              <SettingRow
                icon="notifications-outline"
                label="Test 48h Reminder"
                subtext="Fires the 2-days-before reminder immediately."
                onPress={() => sendTestReminder('48h')}
                iconColor={colors.primary}
              />
              <Divider />
              <SettingRow
                icon="notifications-outline"
                label="Test Expiry Reminder"
                subtext="Fires the last-day reminder immediately."
                onPress={() => sendTestReminder('expiry')}
                iconColor={colors.primary}
              />
              <Divider />
              <SettingRow
                icon="timer-outline"
                label="Test Reminder Sequence"
                subtext="Schedules both reminders in short succession for local testing."
                onPress={scheduleSequentialTestReminders}
                iconColor={colors.warning}
              />
              <Divider />
              <SettingRow
                icon="bug-outline"
                label="Debug Scheduled Notifications"
                subtext="Logs pending reminder metadata."
                onPress={debugScheduledNotifications}
                iconColor={colors.info}
              />
            </Card>
          </>
        )}
      </ScrollView>

      <MySubscriptionSheet
        open={subscriptionSheetOpen}
        onClose={() => setSubscriptionSheetOpen(false)}
      />
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
  title: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  rowSubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
});
