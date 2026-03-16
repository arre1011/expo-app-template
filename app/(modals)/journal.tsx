import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/ui/theme';
import { Button } from '../../src/ui/components';
import { MoodType } from '../../src/domain/models/types';
import {
  getJournalEntryForDate,
  upsertJournalEntry,
  deleteJournalEntry,
} from '../../src/data/repositories/journalEntryRepository';

const MOOD_OPTIONS: { type: MoodType; emoji: string; label: string }[] = [
  { type: 'very_happy', emoji: '😄', label: 'Great' },
  { type: 'happy', emoji: '🙂', label: 'Good' },
  { type: 'neutral', emoji: '😐', label: 'Neutral' },
  { type: 'sad', emoji: '😔', label: 'Bad' },
  { type: 'very_sad', emoji: '😞', label: 'Very bad' },
];

const SLEEP_QUALITY_LABELS = ['Very poor', 'Poor', 'OK', 'Good', 'Very good'];

export default function JournalModal() {
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();

  const targetDate = dateParam ? parseISO(dateParam) : new Date();
  const dateLabel = format(targetDate, 'EEEE, MMMM d', { locale: enUS });

  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingEntryId, setExistingEntryId] = useState<number | null>(null);

  useEffect(() => {
    loadExistingEntry();
  }, [dateParam]);

  const loadExistingEntry = async () => {
    setIsLoading(true);
    try {
      const entry = await getJournalEntryForDate(targetDate);
      if (entry) {
        setExistingEntryId(entry.id);
        setContent(entry.content || '');
        setSelectedMood(entry.mood);
        setSleepQuality(entry.sleepQuality);
      }
    } catch (error) {
      console.error('Failed to load journal entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // At least one field should be filled
    if (!content.trim() && !selectedMood && !sleepQuality) {
      Alert.alert('Note', 'Please add at least a note, mood, or sleep quality.');
      return;
    }

    setIsSaving(true);
    try {
      await upsertJournalEntry({
        date: format(targetDate, 'yyyy-MM-dd'),
        content: content.trim() || null,
        mood: selectedMood,
        sleepQuality,
      });

      // Navigate back to day-detail with the same date
      router.dismiss();
      router.push({
        pathname: '/(tabs)/day-detail',
        params: { date: dateParam },
      });
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      Alert.alert('Error', 'Could not save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const handleDelete = async () => {
    if (!existingEntryId) return;

    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteJournalEntry(existingEntryId);
              // Navigate back to day-detail with the same date
              router.dismiss();
              router.push({
                pathname: '/(tabs)/day-detail',
                params: { date: dateParam },
              });
            } catch (error) {
              console.error('Failed to delete journal entry:', error);
              Alert.alert('Error', 'Could not delete entry');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading entry...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {existingEntryId && (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={22} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Journal</Text>
            <Text style={styles.subtitle}>{dateLabel}</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Mood Selection */}
          <Text style={styles.sectionTitle}>HOW ARE YOU FEELING?</Text>
          <View style={styles.moodGrid}>
            {MOOD_OPTIONS.map((mood) => (
              <TouchableOpacity
                key={mood.type}
                style={[
                  styles.moodButton,
                  selectedMood === mood.type && styles.moodButtonSelected,
                ]}
                onPress={() => setSelectedMood(mood.type)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sleep Quality */}
          <Text style={styles.sectionTitle}>SLEEP QUALITY</Text>
          <View style={styles.sleepQualityContainer}>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setSleepQuality(star)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={sleepQuality && star <= sleepQuality ? 'star' : 'star-outline'}
                    size={32}
                    color={sleepQuality && star <= sleepQuality ? colors.warning : colors.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {sleepQuality !== null && (
              <Text style={styles.sleepQualityLabel}>
                {SLEEP_QUALITY_LABELS[sleepQuality - 1]}
              </Text>
            )}
          </View>

          {/* Notes */}
          <Text style={styles.sectionTitle}>NOTES</Text>
          <TextInput
            style={styles.notesInput}
            value={content}
            onChangeText={setContent}
            placeholder="How was your day? How did you sleep? What's on your mind?"
            placeholderTextColor={colors.textLight}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />

          <View style={styles.hintContainer}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.hintText}>
              These notes are private and help you identify patterns.
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title="Save"
            onPress={handleSave}
            loading={isSaving}
            disabled={!content.trim() && !selectedMood && !sleepQuality}
            size="large"
            style={styles.saveButton}
            icon={<Ionicons name="checkmark" size={20} color={colors.textOnPrimary} />}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    marginTop: 60,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  deleteButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  closeButton: {
    padding: spacing.xs,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  moodButton: {
    width: '18%',
    aspectRatio: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.xs,
  },
  moodButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 2,
  },
  moodLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sleepQualityContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  starButton: {
    padding: spacing.xs,
  },
  sleepQualityLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginTop: spacing.md,
  },
  notesInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 150,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
  },
  hintText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    width: '100%',
  },
});
