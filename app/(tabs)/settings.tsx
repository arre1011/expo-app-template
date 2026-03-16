import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/ui/theme';
import { Card } from '../../src/ui/components';
import { EditWeightSheet, EditSexSheet, EditMetabolismSheet, EditBacLimitSheet, MySubscriptionSheet } from '../../src/ui/sheets';
import { useAppStore, useBACUnit } from '../../src/ui/hooks/useAppStore';
import { useSubscriptionStatus } from '../../src/ui/hooks/useSubscriptionStore';
import { BAC_CONSTANTS, TEXT } from '../../src/domain/constants/defaults';
import { featureFlags } from '../../src/config/featureFlags';
import { getDefaultGoalSettings } from '../../src/data/repositories/dailyGoalRepository';
import { resetDatabase } from '../../src/data/database/connection';
import { sendTestReminder, scheduleSequentialTestReminders, debugScheduledNotifications } from '../../src/services/notificationService';
import * as Sentry from '@sentry/react-native';
import { formatWeight, kgToLb } from '../../src/domain/utils/weightConversion';
import { VolumeUnit } from '../../src/domain/utils/volumeConversion';
import { BACUnit, formatBACValue, getBACUnitSymbol } from '../../src/domain/utils/bacConversion';

export default function SettingsScreen() {
  const { profile, updateProfile } = useAppStore();
  const subscriptionStatus = useSubscriptionStatus();
  const bacUnit = useBACUnit();
  const unitSymbol = getBACUnitSymbol(bacUnit);

  const [defaultMaxBAC, setDefaultMaxBAC] = useState<number>(0.5);
  const [weightSheetOpen, setWeightSheetOpen] = useState(false);
  const [sexSheetOpen, setSexSheetOpen] = useState(false);
  const [metabolismSheetOpen, setMetabolismSheetOpen] = useState(false);
  const [bacLimitSheetOpen, setBacLimitSheetOpen] = useState(false);
  const [subscriptionSheetOpen, setSubscriptionSheetOpen] = useState(false);

  useEffect(() => {
    loadDefaultSettings();
  }, []);

  const loadDefaultSettings = async () => {
    const settings = await getDefaultGoalSettings();
    setDefaultMaxBAC(settings.maxBAC);
  };

  const getEliminationRateLabel = (): string => {
    if (!profile) return 'Standard';
    const rate = profile.eliminationRatePermillePerHour;
    if (rate <= BAC_CONSTANTS.ELIMINATION_RATE_SLOW) return 'Slow';
    if (rate >= BAC_CONSTANTS.ELIMINATION_RATE_FAST) return 'Fast';
    return 'Normal';
  };

  const getSexLabel = (): string => {
    if (!profile) return '-';
    return profile.sex === 'male' ? 'Male' : profile.sex === 'female' ? 'Female' : '-';
  };

  const handleDisclaimerPress = () => {
    Alert.alert(
      'Legal Disclaimer',
      TEXT.FULL_DISCLAIMER,
      [{ text: 'I Understand' }]
    );
  };

  const handleResetDatabase = () => {
    Alert.alert(
      'Reset Database',
      'This will delete all data and reset the database. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetDatabase();
              Alert.alert('Success', 'Database has been reset. Please restart the app.');
            } catch (error) {
              console.error('Failed to reset database:', error);
              Alert.alert('Error', 'Database could not be reset.');
            }
          },
        },
      ]
    );
  };

  const handleVolumeUnitChange = async (newUnit: VolumeUnit) => {
    await updateProfile({ volumeUnit: newUnit });
  };

  const handleBACUnitChange = async (newUnit: BACUnit) => {
    await updateProfile({ bacUnit: newUnit });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>

        {/* Alcohol Level Limit Section - Most frequently changed */}
        <Text style={styles.sectionTitle}>ALCOHOL LEVEL LIMIT</Text>
        <Card style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setBacLimitSheetOpen(true)}
          >
            <View style={styles.settingIcon}>
              <Ionicons name="speedometer-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Alcohol Level Limit</Text>
              <Text style={styles.settingSubtext}>
                Warning when estimated alcohol level reaches this limit
              </Text>
            </View>
            <Text style={styles.goalValue}>{formatBACValue(defaultMaxBAC, bacUnit)}{unitSymbol}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </Card>

        {/* Profile Section */}
        <Text style={styles.sectionTitle}>MY PROFILE</Text>
        <Card style={styles.sectionCard}>
          <TouchableOpacity style={styles.settingRow} onPress={() => setWeightSheetOpen(true)}>
            <View style={styles.settingIcon}>
              <Ionicons name="scale-outline" size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.settingLabel}>Weight</Text>
            <Text style={styles.settingValue}>
              {profile?.weightKg
                ? formatWeight(
                    profile.weightUnit === 'lb' ? kgToLb(profile.weightKg) : Math.round(profile.weightKg),
                    profile.weightUnit ?? 'lb'
                  )
                : '-'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingRow} onPress={() => setSexSheetOpen(true)}>
            <View style={styles.settingIcon}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.settingLabel}>Sex</Text>
            <Text style={styles.settingValue}>{getSexLabel()}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingRow} onPress={() => setMetabolismSheetOpen(true)}>
            <View style={styles.settingIcon}>
              <Ionicons name="pulse-outline" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.settingLabelWithInfo}>
              <Text style={styles.settingLabel}>Metabolism</Text>
              <Ionicons name="information-circle-outline" size={16} color={colors.textLight} />
            </View>
            <Text style={styles.settingValue}>{getEliminationRateLabel()}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </Card>

        {/* Units Section */}
        <Text style={styles.sectionTitle}>UNITS</Text>
        <Card style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons name="beaker-outline" size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.settingLabel}>Volume</Text>
            <View style={styles.unitToggle}>
              <TouchableOpacity
                style={[
                  styles.unitOption,
                  profile?.volumeUnit === 'oz' && styles.unitOptionSelected,
                ]}
                onPress={() => handleVolumeUnitChange('oz')}
              >
                <Text style={[
                  styles.unitOptionText,
                  profile?.volumeUnit === 'oz' && styles.unitOptionTextSelected,
                ]}>oz</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unitOption,
                  profile?.volumeUnit !== 'oz' && styles.unitOptionSelected,
                ]}
                onPress={() => handleVolumeUnitChange('ml')}
              >
                <Text style={[
                  styles.unitOptionText,
                  profile?.volumeUnit !== 'oz' && styles.unitOptionTextSelected,
                ]}>ml</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons name="water-outline" size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.settingLabel}>Alcohol Level</Text>
            <View style={styles.unitToggle}>
              <TouchableOpacity
                style={[
                  styles.unitOption,
                  bacUnit === 'percent' && styles.unitOptionSelected,
                ]}
                onPress={() => handleBACUnitChange('percent')}
              >
                <Text style={[
                  styles.unitOptionText,
                  bacUnit === 'percent' && styles.unitOptionTextSelected,
                ]}>%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unitOption,
                  bacUnit === 'permille' && styles.unitOptionSelected,
                ]}
                onPress={() => handleBACUnitChange('permille')}
              >
                <Text style={[
                  styles.unitOptionText,
                  bacUnit === 'permille' && styles.unitOptionTextSelected,
                ]}>‰</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Subscription Section */}
        {featureFlags.subscriptionSection && (
          <>
            <Text style={styles.sectionTitle}>SUBSCRIPTION</Text>
            <Card style={styles.sectionCard}>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => setSubscriptionSheetOpen(true)}
              >
                <View style={styles.settingIcon}>
                  <Ionicons name="card-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>My Subscription</Text>
                  {subscriptionStatus?.isLifetime ? (
                    <Text style={styles.settingSubtext}>Lifetime Access</Text>
                  ) : subscriptionStatus?.expirationDate ? (
                    <Text style={styles.settingSubtext}>
                      {subscriptionStatus.willRenew ? 'Renews' : 'Expires'}{' '}
                      {new Date(subscriptionStatus.expirationDate).toLocaleDateString('en-US')}
                    </Text>
                  ) : (
                    <Text style={styles.settingSubtext}>Active</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
              </TouchableOpacity>
            </Card>
          </>
        )}

        {/* Legal Section */}
        <Text style={styles.sectionTitle}>LEGAL</Text>
        <Card style={styles.sectionCard}>
          <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/(modals)/privacy-policy')}>
            <View style={styles.settingIcon}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
              <Text style={styles.settingSubtext}>Data stays local on your device</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Linking.openURL('https://drink-tracking-landingpage.vercel.app/terms.html')}
          >
            <View style={styles.settingIcon}>
              <Ionicons name="document-outline" size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.settingLabel}>Terms of Service</Text>
            <Ionicons name="open-outline" size={18} color={colors.textLight} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingRow} onPress={handleDisclaimerPress}>
            <View style={styles.settingIcon}>
              <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.settingLabel}>Legal Disclaimer</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </Card>

        {/* Development Section */}
        {__DEV__ && (
          <>
            <Text style={styles.sectionTitle}>DEVELOPMENT</Text>
            <Card style={styles.sectionCard}>
              <TouchableOpacity style={styles.settingRow} onPress={handleResetDatabase}>
                <View style={styles.settingIcon}>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </View>
                <Text style={[styles.settingLabel, { color: colors.error }]}>Reset Database</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.settingRow} onPress={() => sendTestReminder('48h')}>
                <View style={styles.settingIcon}>
                  <Ionicons name="notifications-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Test: 48h Reminder</Text>
                  <Text style={styles.settingSubtext}>Trial ends in 2 days</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.settingRow} onPress={() => sendTestReminder('expiry')}>
                <View style={styles.settingIcon}>
                  <Ionicons name="notifications-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Test: Expiry Day</Text>
                  <Text style={styles.settingSubtext}>Last day of trial</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.settingRow} onPress={scheduleSequentialTestReminders}>
                <View style={styles.settingIcon}>
                  <Ionicons name="timer-outline" size={20} color={colors.warning} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Test: Sequential (30s + 60s)</Text>
                  <Text style={styles.settingSubtext}>2-days → 30s, Today → 60s — then background app</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.settingRow} onPress={debugScheduledNotifications}>
                <View style={styles.settingIcon}>
                  <Ionicons name="list-outline" size={20} color={colors.textSecondary} />
                </View>
                <Text style={styles.settingLabel}>Log Scheduled Notifications</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => {
                  Sentry.captureException(new Error('Sentry test error from dev'));
                  Alert.alert('Sentry', 'Test error sent! Check your Sentry dashboard.');
                }}
              >
                <View style={styles.settingIcon}>
                  <Ionicons name="bug-outline" size={20} color={colors.error} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Test: Sentry Error</Text>
                  <Text style={styles.settingSubtext}>Sends a test error to Sentry</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
              </TouchableOpacity>
            </Card>
          </>
        )}

        {/* Version Info */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>

      {/* Bottom Sheet Modals */}
      <EditWeightSheet
        open={weightSheetOpen}
        onClose={() => setWeightSheetOpen(false)}
      />
      <EditSexSheet
        open={sexSheetOpen}
        onClose={() => setSexSheetOpen(false)}
      />
      <EditMetabolismSheet
        open={metabolismSheetOpen}
        onClose={() => setMetabolismSheetOpen(false)}
      />
      <EditBacLimitSheet
        open={bacLimitSheetOpen}
        onClose={() => {
          setBacLimitSheetOpen(false);
          loadDefaultSettings(); // Refresh the displayed value
        }}
      />
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
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  sectionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  settingIcon: {
    width: 32,
    marginRight: spacing.sm,
  },
  settingLabel: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  settingLabelWithInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  settingValue: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  settingValuePrimary: {
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingSubtext: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 48,
  },
  goalValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    marginRight: spacing.sm,
  },
  versionText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  unitOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  unitOptionSelected: {
    backgroundColor: colors.primary,
  },
  unitOptionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  unitOptionTextSelected: {
    color: colors.textOnPrimary,
  },
});
