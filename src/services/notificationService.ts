/**
 * Notification Service
 *
 * Handles local push notifications for trial reminders.
 *
 * Two notifications are scheduled at purchase time:
 * - 48h before expiry (Day 5 of 7-day trial)
 * - Day of expiry (Day 7)
 *
 * Scheduling strategy:
 * - Production (7-day trial): fires at calculated dates, 10:00 AM local time
 * - Sandbox/TestFlight (3-min trial): fires with short delays (5s, 10s)
 * - Dev mode: use the test buttons in Settings > Development
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

// ─── Constants ────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = 'trial_reminder_';
const STORAGE_KEY_48H = `${STORAGE_KEY_PREFIX}48h_id`;
const STORAGE_KEY_EXPIRY = `${STORAGE_KEY_PREFIX}expiry_id`;

// Keys to track when reminders should fire and whether they've been dismissed
const FIRE_DATE_KEY_48H = `${STORAGE_KEY_PREFIX}48h_fire_date`;
const FIRE_DATE_KEY_EXPIRY = `${STORAGE_KEY_PREFIX}expiry_fire_date`;
const DISMISSED_KEY_48H = `${STORAGE_KEY_PREFIX}48h_dismissed`;
const DISMISSED_KEY_EXPIRY = `${STORAGE_KEY_PREFIX}expiry_dismissed`;
// Store trial expiration date so we can stop showing wrap-up after trial converts to paid
const TRIAL_EXPIRATION_KEY = `${STORAGE_KEY_PREFIX}trial_expiration`;

const CHANNEL_ID = 'trial-reminders';
const DEEP_LINK_SCREEN = '/trial-reminder';

// Sandbox/TestFlight fallback delays (staggered so both fire in sequence)
const SANDBOX_DELAY_48H = 60;   // 1 minute  → "2 days" reminder
const SANDBOX_DELAY_EXPIRY = 30; // 30 seconds → "today" reminder

// ─── Notification Content ─────────────────────────────────────

const NOTIFICATIONS = {
  '48h': {
    title: 'Your free trial ends soon',
    body: "You're doing great — stay on your mindful drinking journey! Your trial ends in 2 days.",
  },
  expiry: {
    title: 'Last day of your free trial',
    body: 'Today is your last day of full access. Subscribe to keep tracking mindfully.',
  },
} as const;

type ReminderType = keyof typeof NOTIFICATIONS;

// ─── Android Notification Channel ─────────────────────────────

/**
 * Create Android notification channel (required for Android 8+).
 * Call once at app startup in _layout.tsx.
 */
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Trial Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

// ─── Permission Handling ──────────────────────────────────────

/**
 * Request notification permissions with a contextual pre-prompt.
 * Shows an Alert explaining WHY we want to send notifications before
 * triggering the system permission dialog (preserves the one-time iOS prompt).
 *
 * @returns true if permission was granted
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  // Check if already granted
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') {
    return true;
  }

  // Show contextual pre-prompt
  return new Promise<boolean>((resolve) => {
    Alert.alert(
      'Stay Informed',
      "We'll remind you before your free trial ends — so you're never surprised by a charge.",
      [
        {
          text: 'Not Now',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Allow Reminders',
          onPress: async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            resolve(status === 'granted');
          },
        },
      ]
    );
  });
}

// ─── Schedule Trial Reminders ─────────────────────────────────

/**
 * Schedule both trial reminder notifications.
 *
 * Timing logic for each reminder:
 * 1. Calculate target date (48h or day-of expiry) at 10:00 AM local time
 * 2. If target is in the future → use date-based trigger (production)
 * 3. If target is in the past → sandbox trial, use short fallback delay
 *
 * @param expirationDateISO - ISO 8601 date string from RevenueCat
 */
export async function scheduleTrialReminders(
  expirationDateISO: string
): Promise<void> {
  try {
    // Cancel any previously scheduled reminders and reset dismissed state
    await cancelTrialReminders();
    await resetDismissedFlags();

    const expiration = new Date(expirationDateISO);
    const now = new Date();

    // 48h before expiry at 10:00 AM
    const date48h = new Date(expiration);
    date48h.setDate(date48h.getDate() - 2);
    date48h.setHours(10, 0, 0, 0);

    // Day of expiry at 10:00 AM
    const dateExpiry = new Date(expiration);
    dateExpiry.setHours(10, 0, 0, 0);

    // Schedule each notification and store fire dates
    await scheduleOneReminder('48h', date48h, now, SANDBOX_DELAY_48H, STORAGE_KEY_48H);
    await scheduleOneReminder('expiry', dateExpiry, now, SANDBOX_DELAY_EXPIRY, STORAGE_KEY_EXPIRY);

    // Store actual fire dates (for sandbox, calculate from delay)
    const actual48h = date48h.getTime() > now.getTime()
      ? date48h.toISOString()
      : new Date(now.getTime() + SANDBOX_DELAY_48H * 1000).toISOString();
    const actualExpiry = dateExpiry.getTime() > now.getTime()
      ? dateExpiry.toISOString()
      : new Date(now.getTime() + SANDBOX_DELAY_EXPIRY * 1000).toISOString();
    await AsyncStorage.setItem(FIRE_DATE_KEY_48H, actual48h);
    await AsyncStorage.setItem(FIRE_DATE_KEY_EXPIRY, actualExpiry);
    await AsyncStorage.setItem(TRIAL_EXPIRATION_KEY, expirationDateISO);

    console.log('🔔 All trial reminders scheduled');
  } catch (error) {
    console.error('Failed to schedule trial reminders:', error);
  }
}

/**
 * Schedule a single reminder notification.
 */
async function scheduleOneReminder(
  type: ReminderType,
  targetDate: Date,
  now: Date,
  sandboxFallbackSeconds: number,
  storageKey: string,
): Promise<void> {
  const content = NOTIFICATIONS[type];

  let trigger: Notifications.NotificationTriggerInput;

  if (targetDate.getTime() > now.getTime()) {
    // Production: target is in the future → schedule for exact date
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: targetDate,
    };
    console.log(`🔔 [${type}] scheduled for ${targetDate.toLocaleString()}`);
  } else {
    // Sandbox: target is in the past → use short fallback delay
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: sandboxFallbackSeconds,
      repeats: false,
    };
    console.log(`🔔 [${type}] scheduled (sandbox fallback: ${sandboxFallbackSeconds}s)`);
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      sound: true,
      data: { screen: DEEP_LINK_SCREEN, reminderType: type },
      ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
    },
    trigger,
  });

  // Persist notification ID so we can cancel it later
  await AsyncStorage.setItem(storageKey, notificationId);
}

// ─── Cancel Trial Reminders ──────────────────────────────────

/**
 * Cancel all previously scheduled trial reminders.
 */
export async function cancelTrialReminders(): Promise<void> {
  const keys = [STORAGE_KEY_48H, STORAGE_KEY_EXPIRY];

  for (const key of keys) {
    try {
      const notificationId = await AsyncStorage.getItem(key);
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Failed to cancel reminder (${key}):`, error);
    }
  }

  console.log('🔕 All trial reminders cancelled');
}

// Keep backward compatibility alias
export const scheduleTrialReminder = scheduleTrialReminders;
export const cancelTrialReminder = cancelTrialReminders;

// ─── Dev/Debug Utilities ──────────────────────────────────────

/**
 * Send a specific test notification immediately (dev-only).
 * The notification includes deep link data so tapping opens the trial-reminder screen.
 */
export async function sendTestReminder(type: ReminderType): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    Alert.alert('Permission Denied', 'Enable notifications in device settings to test.');
    return;
  }

  const content = NOTIFICATIONS[type];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      sound: true,
      data: { screen: DEEP_LINK_SCREEN, reminderType: type },
      ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
    },
    trigger: null, // Fire immediately
  });

  // Store fire date as "now" and clear dismissed flag so app-open check works
  const fireDateKey = type === '48h' ? FIRE_DATE_KEY_48H : FIRE_DATE_KEY_EXPIRY;
  const dismissedKey = type === '48h' ? DISMISSED_KEY_48H : DISMISSED_KEY_EXPIRY;
  await AsyncStorage.setItem(fireDateKey, new Date().toISOString());
  await AsyncStorage.removeItem(dismissedKey);

  console.log(`🧪 Test notification sent: ${type}`);
}

// Legacy function — kept for backward compatibility
export async function sendTestNotification(): Promise<void> {
  return sendTestReminder('48h');
}

/**
 * Schedule both test notifications with delays (dev-only).
 * - "48h" reminder fires after 30s
 * - "expiry" reminder fires after 60s
 * Use this to test background notification delivery and deep-link tap behavior.
 */
export async function scheduleSequentialTestReminders(): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    Alert.alert('Permission Denied', 'Enable notifications in device settings to test.');
    return;
  }

  const schedule = [
    { type: '48h' as ReminderType, seconds: 30 },
    { type: 'expiry' as ReminderType, seconds: 60 },
  ];

  for (const { type, seconds } of schedule) {
    const content = NOTIFICATIONS[type];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        sound: true,
        data: { screen: DEEP_LINK_SCREEN, reminderType: type },
        ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        repeats: false,
      },
    });

    // Store fire date and clear dismissed flag so app-open check works
    const fireDateKey = type === '48h' ? FIRE_DATE_KEY_48H : FIRE_DATE_KEY_EXPIRY;
    const dismissedKey = type === '48h' ? DISMISSED_KEY_48H : DISMISSED_KEY_EXPIRY;
    await AsyncStorage.setItem(fireDateKey, new Date(Date.now() + seconds * 1000).toISOString());
    await AsyncStorage.removeItem(dismissedKey);

    console.log(`🧪 Scheduled test [${type}] in ${seconds}s`);
  }

  Alert.alert(
    'Notifications Scheduled',
    '• "2 days" reminder fires in 30s\n• "Today" reminder fires in 60s\n\nBackground the app now to test!'
  );
}

// ─── Dismissed State Tracking ─────────────────────────────────

/**
 * Mark a reminder type as dismissed (user has seen and closed the wrap-up).
 */
export async function markReminderDismissed(type: '48h' | 'expiry'): Promise<void> {
  const key = type === '48h' ? DISMISSED_KEY_48H : DISMISSED_KEY_EXPIRY;
  await AsyncStorage.setItem(key, 'true');
  console.log(`🔕 Reminder dismissed: ${type}`);
}

/**
 * Check if the trial reminder wrap-up should be shown on app open.
 *
 * Uses fire dates stored in AsyncStorage at scheduling time — no dependency
 * on RevenueCat or subscription store. This makes the check reliable even
 * before RevenueCat has initialized.
 *
 * Logic:
 * 1. Check if expiry fire date has passed AND not dismissed → show 'expiry'
 * 2. Else check if 48h fire date has passed AND not dismissed → show '48h'
 * 3. Expiry always overrides 48h (more recent = higher priority)
 */
export async function getPendingReminderType(): Promise<'48h' | 'expiry' | null> {
  const now = Date.now();

  // Safety check: if the trial has already fully expired, don't show the wrap-up.
  // This prevents showing "Cancel anytime" to users whose trial converted to a paid subscription.
  const trialExpiration = await AsyncStorage.getItem(TRIAL_EXPIRATION_KEY);
  if (trialExpiration) {
    const expirationTime = new Date(trialExpiration).getTime();
    if (now > expirationTime) {
      // Trial is over — clean up all reminder state
      await clearAllReminderState();
      return null;
    }
  }

  // Check expiry first (higher priority — overrides 48h)
  const expiryFireDate = await AsyncStorage.getItem(FIRE_DATE_KEY_EXPIRY);
  if (expiryFireDate && new Date(expiryFireDate).getTime() <= now) {
    const dismissed = await AsyncStorage.getItem(DISMISSED_KEY_EXPIRY);
    if (dismissed !== 'true') return 'expiry';
  }

  // Check 48h reminder
  const fireDate48h = await AsyncStorage.getItem(FIRE_DATE_KEY_48H);
  if (fireDate48h && new Date(fireDate48h).getTime() <= now) {
    const dismissed = await AsyncStorage.getItem(DISMISSED_KEY_48H);
    if (dismissed !== 'true') return '48h';
  }

  return null;
}

/**
 * Clean up all reminder-related AsyncStorage keys.
 * Called when the trial period is over to prevent stale state.
 */
async function clearAllReminderState(): Promise<void> {
  await AsyncStorage.multiRemove([
    FIRE_DATE_KEY_48H, FIRE_DATE_KEY_EXPIRY,
    DISMISSED_KEY_48H, DISMISSED_KEY_EXPIRY,
    TRIAL_EXPIRATION_KEY,
  ]);
  console.log('🧹 Trial reminder state cleared (trial expired)');
}

/**
 * Reset dismissed flags. Called when new reminders are scheduled
 * (e.g. after a new purchase/renewal).
 */
async function resetDismissedFlags(): Promise<void> {
  await AsyncStorage.multiRemove([
    DISMISSED_KEY_48H, DISMISSED_KEY_EXPIRY,
    FIRE_DATE_KEY_48H, FIRE_DATE_KEY_EXPIRY,
    TRIAL_EXPIRATION_KEY,
  ]);
}

/**
 * List all currently scheduled notifications (dev debugging).
 */
export async function debugScheduledNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log(`📋 Scheduled notifications: ${scheduled.length}`);
  scheduled.forEach((notif, i) => {
    console.log(`  [${i + 1}] ID: ${notif.identifier}, Title: ${notif.content.title}`);
    console.log(`       Trigger:`, notif.trigger);
    console.log(`       Data:`, notif.content.data);
  });
}
