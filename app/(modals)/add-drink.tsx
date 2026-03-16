import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { router, useLocalSearchParams } from 'expo-router';
import { parseISO } from 'date-fns';
import { DrinkPickerSheet } from '../../src/ui/components';
import { useAppStore } from '../../src/ui/hooks/useAppStore';
import { getDrinkEntryById } from '../../src/data/repositories/drinkEntryRepository';
import { CreateDrinkEntry, DrinkEntry } from '../../src/domain/models/types';
import { posthog, AnalyticsEvents } from '../../src/services/analyticsService';

export default function AddDrinkModal() {
  const { date: dateParam, drinkId, source } = useLocalSearchParams<{
    date?: string;
    drinkId?: string;
    source?: 'home' | 'calendar';
  }>();
  const {
    addDrink,
    updateDrink,
    saveDrinkDirectly,
    removeDrink,
  } = useAppStore();

  // Source determines behavior:
  // - 'home': Check BAC limits, show Goal Reached modal, router.back()
  // - 'calendar': Skip BAC checks (historical data), return to calendar
  const isFromCalendar = source === 'calendar';

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [editingDrink, setEditingDrink] = useState<DrinkEntry | null>(null);
  const [isLoadingDrink, setIsLoadingDrink] = useState(!!drinkId);

  const isEditMode = !!drinkId;

  // Determine the target date
  const targetDate = dateParam ? parseISO(dateParam) : new Date();

  // Load existing drink in edit mode
  useEffect(() => {
    if (isEditMode && drinkId) {
      loadDrink(parseInt(drinkId, 10));
    }
  }, [drinkId, isEditMode]);

  const loadDrink = async (id: number) => {
    setIsLoadingDrink(true);
    try {
      const drink = await getDrinkEntryById(id);
      if (drink) {
        setEditingDrink(drink);
      } else {
        Alert.alert('Error', 'Drink not found');
        router.back();
      }
    } catch (error) {
      console.error('Failed to load drink:', error);
      Alert.alert('Error', 'Could not load drink');
      router.back();
    } finally {
      setIsLoadingDrink(false);
    }
  };

  // Present sheet on mount
  useEffect(() => {
    if (!isLoadingDrink) {
      // Small delay to ensure modal is ready
      const timer = setTimeout(() => {
        bottomSheetRef.current?.present();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoadingDrink]);

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    // Navigation happens in onDismiss callback when sheet is fully dismissed
  }, []);

  const handleDismiss = useCallback(() => {
    if (isFromCalendar) {
      // When opened from calendar, go back to calendar tab
      router.replace('/(tabs)/calendar');
    } else {
      // Default behavior - go back in navigation stack
      router.back();
    }
  }, [isFromCalendar]);

  const handleDelete = useCallback(async () => {
    if (!drinkId) return;

    Alert.alert(
      'Delete Drink',
      'Are you sure you want to delete this drink?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              posthog.capture(AnalyticsEvents.DRINK_DELETED, { source: source ?? 'home' });
              await removeDrink(parseInt(drinkId, 10));
              bottomSheetRef.current?.dismiss();
            } catch (error) {
              console.error('Failed to delete drink:', error);
              Alert.alert('Error', 'Could not delete drink');
            }
          },
        },
      ]
    );
  }, [drinkId, removeDrink]);

  const handleAddDrink = useCallback(async (drink: CreateDrinkEntry) => {
    try {
      if (isEditMode && drinkId) {
        posthog.capture(AnalyticsEvents.DRINK_EDITED, { type: drink.type, source: source ?? 'home' });
        await updateDrink(parseInt(drinkId, 10), drink);
      } else if (isFromCalendar) {
        posthog.capture(AnalyticsEvents.DRINK_ADDED, { type: drink.type, source: 'calendar' });
        await saveDrinkDirectly(drink);
      } else {
        posthog.capture(AnalyticsEvents.DRINK_ADDED, { type: drink.type, source: 'manual' });
        await addDrink(drink);

        // Check if warning popup should be shown
        // The popup will be rendered based on limitWarning state
        const state = useAppStore.getState();
        if (state.limitWarning && state.limitWarning.type !== 'none' && state.limitWarning.type !== 'approaching_limit') {
          // Don't navigate - the popup will be shown in this component
          return;
        }
      }
    } catch (error) {
      console.error('Failed to save drink:', error);
      Alert.alert('Error', 'Could not save drink');
      throw error;
    }
  }, [isEditMode, drinkId, isFromCalendar, addDrink, saveDrinkDirectly, updateDrink]);

  if (isLoadingDrink) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <DrinkPickerSheet
        bottomSheetRef={bottomSheetRef}
        onAddDrink={handleAddDrink}
        editingDrink={editingDrink}
        defaultDate={targetDate}
        onClose={handleClose}
        onDismiss={handleDismiss}
        onDelete={isEditMode ? handleDelete : undefined}
      />
      {/* LimitWarningPopup is now rendered globally in _layout.tsx */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
