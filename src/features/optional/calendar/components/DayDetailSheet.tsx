import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/ui/theme';
import { ModalHeader } from '@/ui/components';
import { MoodType, MOOD_DEFAULT, JournalEntry } from '../types';
import { getJournalEntryForDate, upsertJournalEntry, deleteJournalEntry } from '../data/journalEntryRepository';

export interface DayDetailData {
  journalEntry: JournalEntry | null;
}

interface DayDetailSheetProps {
  open: boolean;
  onClose: () => void;
  date: string; // YYYY-MM-DD
  onRefresh?: () => void;
}

const MOODS: { type: MoodType; label: string; icon: string; color: string }[] = [
  { type: 'good', label: 'Good', icon: 'happy-outline', color: colors.sober },
  { type: 'moderate', label: 'Moderate', icon: 'remove-circle-outline', color: colors.moderate },
  { type: 'bad', label: 'Bad', icon: 'sad-outline', color: colors.overLimit },
];

export function DayDetailSheet({ open, onClose, date, onRefresh }: DayDetailSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const [mood, setMood] = useState<MoodType>(MOOD_DEFAULT);
  const [content, setContent] = useState('');
  const [existingEntry, setExistingEntry] = useState<JournalEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && date) {
      loadEntry();
      ref.current?.present();
    }
  }, [open, date]);

  const loadEntry = async () => {
    if (!date) return;
    const entry = await getJournalEntryForDate(parseISO(date));
    if (entry) {
      setExistingEntry(entry);
      setMood(entry.mood || MOOD_DEFAULT);
      setContent(entry.content || '');
    } else {
      setExistingEntry(null);
      setMood(MOOD_DEFAULT);
      setContent('');
    }
  };

  const handleClose = useCallback(() => {
    ref.current?.dismiss();
  }, []);

  // onDismiss is more reliable than onChange for detecting all close scenarios
  // (backdrop tap, swipe down, programmatic dismiss)
  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} pressBehavior="close" />
    ),
    []
  );

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await upsertJournalEntry({ date, content: content.trim() || null, mood });
      onRefresh?.();
      ref.current?.dismiss();
    } catch (error) {
      console.error('Failed to save entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingEntry) return;
    try {
      await deleteJournalEntry(existingEntry.id);
      onRefresh?.();
      ref.current?.dismiss();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const dateLabel = date
    ? format(parseISO(date), 'EEEE, MMMM d', { locale: enUS })
    : '';

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetView style={styles.contentContainer}>
        <ModalHeader
          title={dateLabel}
          onClose={handleClose}
          onSave={handleSave}
          saveDisabled={isSaving}
        />

        <View style={styles.content}>
          {/* Mood Picker */}
          <Text style={styles.sectionLabel}>How was your day?</Text>
          <View style={styles.moodRow}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m.type}
                style={[styles.moodButton, mood === m.type && { backgroundColor: m.color + '20', borderColor: m.color }]}
                onPress={() => setMood(m.type)}
              >
                <Ionicons name={m.icon as any} size={28} color={mood === m.type ? m.color : colors.textLight} />
                <Text style={[styles.moodLabel, mood === m.type && { color: m.color, fontWeight: fontWeight.semibold }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Note Input */}
          <Text style={styles.sectionLabel}>Note</Text>
          <BottomSheetTextInput
            style={styles.textInput}
            value={content}
            onChangeText={setContent}
            placeholder="Write a note for this day..."
            placeholderTextColor={colors.textLight}
            multiline
            textAlignVertical="top"
          />

          {/* Delete Button */}
          {existingEntry && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={styles.deleteText}>Delete entry</Text>
            </TouchableOpacity>
          )}
        </View>
      </BottomSheetView>
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
  contentContainer: {
    paddingBottom: spacing.xxl,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  moodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  moodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  moodLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  textInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 100,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  deleteText: {
    fontSize: fontSize.sm,
    color: colors.error,
  },
});
