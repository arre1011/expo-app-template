import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { DrinkPickerSheet } from '../components';
import { useAppStore } from '../hooks/useAppStore';
import { getDrinkEntryById } from '../../data/repositories/drinkEntryRepository';
import { CreateDrinkEntry, DrinkEntry } from '../../domain/models/types';

interface AddDrinkSheetProps {
  open: boolean;
  onClose: () => void;
  editingDrinkId?: number | null;
  defaultDate?: Date;
}

export function AddDrinkSheet({
  open,
  onClose,
  editingDrinkId,
  defaultDate,
}: AddDrinkSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { addDrink, updateDrink, removeDrink } = useAppStore();

  const [editingDrink, setEditingDrink] = useState<DrinkEntry | null>(null);
  const [isLoadingDrink, setIsLoadingDrink] = useState(false);

  const isEditMode = !!editingDrinkId;

  // Open/close based on `open` prop - load drink if editing
  useEffect(() => {
    if (open && editingDrinkId) {
      // Load existing drink in edit mode
      setIsLoadingDrink(true);
      getDrinkEntryById(editingDrinkId)
        .then(drink => {
          if (drink) {
            setEditingDrink(drink);
          } else {
            Alert.alert('Error', 'Drink not found');
            onClose();
          }
        })
        .catch(error => {
          console.error('Failed to load drink:', error);
          Alert.alert('Error', 'Could not load drink');
          onClose();
        })
        .finally(() => {
          setIsLoadingDrink(false);
        });
    } else if (open) {
      // Reset state for new drink
      setEditingDrink(null);
      setIsLoadingDrink(false);
    } else {
      // Reset state when closing
      setEditingDrink(null);
      setIsLoadingDrink(false);
    }
  }, [open, editingDrinkId]);

  // Present sheet when ready (after loading if edit mode)
  useEffect(() => {
    if (open && !isLoadingDrink) {
      // Small delay to ensure modal is ready
      const timer = setTimeout(() => {
        bottomSheetRef.current?.present();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, isLoadingDrink]);

  const handleClose = useCallback(() => {
    // State SOFORT ändern, BEVOR dismiss() - verhindert Race Condition
    onClose();
    bottomSheetRef.current?.dismiss();
  }, [onClose]);

  const handleDismiss = useCallback(() => {
    // Fallback für Swipe-to-dismiss
    onClose();
  }, [onClose]);

  const handleAddDrink = useCallback(async (drink: CreateDrinkEntry) => {
    try {
      if (isEditMode && editingDrinkId) {
        // Update existing drink
        await updateDrink(editingDrinkId, drink);
      } else {
        // Add new drink
        // LimitWarningPopup is rendered globally in _layout.tsx
        await addDrink(drink);
      }
    } catch (error) {
      console.error('Failed to save drink:', error);
      Alert.alert('Error', 'Could not save drink');
      throw error;
    }
  }, [isEditMode, editingDrinkId, addDrink, updateDrink]);

  const handleDeleteDrink = useCallback(async () => {
    if (!editingDrinkId) return;

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
              await removeDrink(editingDrinkId);
              handleClose();
            } catch (error) {
              console.error('Failed to delete drink:', error);
              Alert.alert('Error', 'Could not delete drink');
            }
          },
        },
      ]
    );
  }, [editingDrinkId, removeDrink, handleClose]);

  // Don't render anything if not open and no loading
  if (!open) {
    return null;
  }

  // Show nothing while loading drink data
  if (isLoadingDrink) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <DrinkPickerSheet
        bottomSheetRef={bottomSheetRef}
        onAddDrink={handleAddDrink}
        editingDrink={editingDrink}
        defaultDate={defaultDate ?? new Date()}
        onClose={handleClose}
        onDismiss={handleDismiss}
        onDelete={isEditMode ? handleDeleteDrink : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Empty container - DrinkPickerSheet handles all rendering
  },
});
