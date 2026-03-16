import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { ModalHeader } from '../components';
import { MoodType } from '../../domain/models/types';
import {
  getJournalEntryForDate,
  upsertJournalEntry,
  deleteJournalEntry,
} from '../../data/repositories/journalEntryRepository';

const MOOD_OPTIONS: { type: MoodType; emoji: string; label: string }[] = [
  { type: 'very_happy', emoji: '😄', label: 'Great' },
  { type: 'happy', emoji: '🙂', label: 'Good' },
  { type: 'neutral', emoji: '😐', label: 'Neutral' },
  { type: 'sad', emoji: '😔', label: 'Bad' },
  { type: 'very_sad', emoji: '😞', label: 'Very bad' },
];

const SLEEP_QUALITY_LABELS = ['Very poor', 'Poor', 'OK', 'Good', 'Very good'];

interface JournalSheetProps {
  open: boolean;
  onClose: () => void;
  date: string; // ISO date string (yyyy-MM-dd)
  onSaved?: () => void; // Called when journal is saved to refresh parent
}

export function JournalSheet({ open, onClose, date, onSaved }: JournalSheetProps) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const targetDate = date ? parseISO(date) : new Date();
  const dateLabel = format(targetDate, 'EEEE, MMMM d', { locale: enUS });

  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingEntryId, setExistingEntryId] = useState<number | null>(null);

  const snapPoints = useMemo(() => ['90%'], []);

  // Open/close based on `open` prop
  useEffect(() => {
    if (open) {
      loadExistingEntry();
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [open, date]);

  const loadExistingEntry = async () => {
    setIsLoading(true);
    try {
      const entry = await getJournalEntryForDate(targetDate);
      if (entry) {
        setExistingEntryId(entry.id);
        setContent(entry.content || '');
        setSelectedMood(entry.mood);
        setSleepQuality(entry.sleepQuality);
      } else {
        // Reset for new entry
        setExistingEntryId(null);
        setContent('');
        setSelectedMood(null);
        setSleepQuality(null);
      }
    } catch (error) {
      console.error('Failed to load journal entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

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
      onSaved?.();
      bottomSheetModalRef.current?.dismiss();
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      Alert.alert('Error', 'Could not save note');
    } finally {
      setIsSaving(false);
    }
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
              onSaved?.();
              bottomSheetModalRef.current?.dismiss();
            } catch (error) {
              console.error('Failed to delete journal entry:', error);
              Alert.alert('Error', 'Could not delete entry');
            }
          },
        },
      ]
    );
  };

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enablePanDownToClose={true}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      stackBehavior="push"
    >
      {/* Header with ModalHeader component */}
      <ModalHeader
        title={`Journal - ${dateLabel}`}
        onClose={handleClose}
        onSave={handleSave}
        saveDisabled={isSaving || (!content.trim() && !selectedMood && !sleepQuality)}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading entry...</Text>
        </View>
      ) : (
        <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
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

          {/* Delete Button - only shown for existing entries */}
          {existingEntryId && (
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={styles.deleteButtonText}>Delete Entry</Text>
            </TouchableOpacity>
          )}
        </BottomSheetScrollView>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  handleIndicator: {
    backgroundColor: colors.textLight,
    width: 40,
  },
  sheetBackground: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
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
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  deleteButtonText: {
    fontSize: fontSize.md,
    color: colors.error,
    fontWeight: fontWeight.medium,
  },
});
