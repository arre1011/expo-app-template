import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  Keyboard,
  ScrollView,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, setHours, setMinutes } from 'date-fns';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { CreateDrinkEntry, DrinkEntry } from '../../domain/models/types';
import { DRINK_CATALOG, getDrinkById } from '../../domain/constants/drinkCatalog';
import { FilterChipType } from '../theme/drinkStyles';
import { CategoryChips } from './CategoryChips';
import { DrinkPickerItem } from './DrinkPickerItem';
import { ModalHeader } from './ModalHeader';
import { useAppStore } from '../hooks/useAppStore';
import { parseVolumeInput, getVolumeUnitLabel, volumeForDisplay, getDrinkDisplayVolume } from '../../domain/utils/volumeConversion';
import { CUSTOM_DRINK_COLOR, CUSTOM_DRINK_ICON } from '../../domain/constants/drinkCatalog';
import { getSmartDefaultCategory, setLastDrinkCategory } from '../utils/uiPreferences';
import { featureFlags } from '../../config/featureFlags';

// Available icons for custom drinks
const AVAILABLE_ICONS = [
  'beer-outline',
  'beer',
  'wine-outline',
  'wine',
  'cafe-outline',
  'flask-outline',
  'water-outline',
  'pint-outline',
];

// Available colors for custom drinks
const AVAILABLE_COLORS = [
  '#F59E0B', // Amber (Beer)
  '#8B5CF6', // Purple (Wine)
  '#EC4899', // Pink (Spirits)
  '#3B82F6', // Blue (Cocktails)
  '#10B981', // Green
  '#EF4444', // Red
  '#6B7280', // Gray
  '#F97316', // Orange
];

// Volume presets by category (in ml - common sizes for EU/US)
const VOLUME_PRESETS: Record<string, number[]> = {
  beer: [200, 330, 500],      // Small glass, bottle, large/pint
  wine: [100, 150, 200],      // Small, standard, large pour
  spirits: [20, 40],          // Single shot, double shot
  cocktails: [100, 150, 200], // Small, medium, large
  longdrinks: [200, 300, 400], // Long drink sizes
  default: [150, 250, 350],   // Generic sizes for custom drinks
};

// Get volume presets for a drink category
function getVolumePresets(category?: string): number[] {
  if (category && VOLUME_PRESETS[category]) {
    return VOLUME_PRESETS[category];
  }
  return VOLUME_PRESETS.default;
}

interface DrinkPickerSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  onAddDrink: (drink: CreateDrinkEntry) => Promise<void>;
  editingDrink?: DrinkEntry | null;
  defaultDate?: Date;
  onClose: () => void;
  onDismiss?: () => void; // Called when sheet is fully dismissed (for navigation)
  onDelete?: () => void; // Called when delete button is pressed (edit mode only)
}

// Unified display type for drinks in the picker
interface DisplayDrink {
  id: string;
  name: string;
  volumeMl: number;
  volumeOz?: number;
  abvPercent: number;
  icon: string;
  color: string;
  category?: string;
}

export function DrinkPickerSheet({
  bottomSheetRef,
  onAddDrink,
  editingDrink,
  defaultDate,
  onClose,
  onDismiss,
  onDelete,
}: DrinkPickerSheetProps) {
  const {
    profile,
    favoriteDrinkIds,
    customDrinks,
    recentDrinkTemplates,
    loadFavorites,
    loadCustomDrinks,
    loadRecentDrinks,
    toggleFavorite,
    addCustomDrink,
  } = useAppStore();

  const volumeUnit = profile?.volumeUnit ?? 'ml';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterChipType>('all');
  const [isCategoryInitialized, setIsCategoryInitialized] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState<DisplayDrink | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  // Detail/Config view state
  const [configDrink, setConfigDrink] = useState<DisplayDrink | null>(null);
  const [configVolume, setConfigVolume] = useState('');
  const [configAbv, setConfigAbv] = useState('');

  // Custom drink form state
  const [customName, setCustomName] = useState('');
  const [customVolume, setCustomVolume] = useState('');
  const [customAbv, setCustomAbv] = useState('');
  const [customIcon, setCustomIcon] = useState(CUSTOM_DRINK_ICON);
  const [customColor, setCustomColor] = useState(CUSTOM_DRINK_COLOR);
  const [customErrors, setCustomErrors] = useState<{
    name?: string;
    volume?: string;
    abv?: string;
  }>({});

  // Date & Time selection (combined)
  const getInitialDateTime = useCallback(() => {
    const baseDate = defaultDate ?? new Date();
    if (isToday(baseDate)) {
      return new Date();
    }
    // For past dates, default to 8 PM
    return setMinutes(setHours(baseDate, 20), 0);
  }, [defaultDate]);

  const [selectedDateTime, setSelectedDateTime] = useState<Date>(getInitialDateTime);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);

  // Load data on mount - always fetch fresh from DB
  useEffect(() => {
    loadFavorites();
    loadCustomDrinks();
    loadRecentDrinks();
  }, []);

  // Initialize smart default category (only for add mode, not edit mode)
  useEffect(() => {
    if (isCategoryInitialized || editingDrink) return;

    const initCategory = async () => {
      const smartDefault = await getSmartDefaultCategory(
        recentDrinkTemplates.length,
        favoriteDrinkIds.length,
        customDrinks.length
      );
      setSelectedCategory(smartDefault);
      setIsCategoryInitialized(true);
    };

    initCategory();
  }, [isCategoryInitialized, editingDrink, recentDrinkTemplates.length, favoriteDrinkIds.length, customDrinks.length]);

  // Handle category selection and save preference
  const handleCategorySelect = useCallback((category: FilterChipType) => {
    setSelectedCategory(category);
    // Save preference asynchronously (don't await)
    setLastDrinkCategory(category);
  }, []);

  // Handle search input - switch to "all" category for global search
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    // When user starts typing, switch to "all" for global search
    if (text.trim() && selectedCategory !== 'all') {
      setSelectedCategory('all');
    }
  }, [selectedCategory]);

  // Pre-select drink when editing - go directly to config view
  useEffect(() => {
    if (editingDrink) {
      // Try to find the drink in catalog
      const catalogDrink = getDrinkById(editingDrink.type);
      let drink: DisplayDrink | null = null;

      if (catalogDrink) {
        drink = catalogDrink;
      } else if (editingDrink.type === 'custom') {
        // Check if it's a custom drink
        const customMatch = customDrinks.find(
          d => d.name === editingDrink.label
        );
        if (customMatch) {
          drink = {
            ...customMatch,
            id: `custom_${customMatch.id}`,
          };
        } else {
          // Create a temporary display drink for unknown custom
          drink = {
            id: 'custom_temp',
            name: editingDrink.label || 'Custom Drink',
            volumeMl: editingDrink.volumeMl,
            abvPercent: editingDrink.abvPercent,
            icon: CUSTOM_DRINK_ICON,
            color: CUSTOM_DRINK_COLOR,
          };
        }
      }

      if (drink) {
        // Go directly to config view with the editing drink's values
        // Convert ml to user's preferred unit for display
        setConfigDrink(drink);
        setConfigVolume(volumeForDisplay(editingDrink.volumeMl, volumeUnit).toString());
        setConfigAbv(editingDrink.abvPercent.toString());
      }

      // Set the datetime from the editing drink
      setSelectedDateTime(new Date(editingDrink.timestamp));
    } else {
      // Reset when not editing
      setSearchQuery('');
      setSelectedDrink(null);
      setConfigDrink(null);
      setConfigVolume('');
      setConfigAbv('');
    }
  }, [editingDrink, customDrinks]);

  // Convert custom drinks to display format
  const customDrinksDisplay: DisplayDrink[] = useMemo(() => {
    return customDrinks.map(d => ({
      ...d,
      id: `custom_${d.id}`,
    }));
  }, [customDrinks]);

  // All drinks combined
  const allDrinks: DisplayDrink[] = useMemo(() => {
    return [...DRINK_CATALOG, ...customDrinksDisplay];
  }, [customDrinksDisplay]);

  // Recent drinks mapped to display format (deduplicated by ID)
  const recentDrinksDisplay: DisplayDrink[] = useMemo(() => {
    const seenIds = new Set<string>();
    return recentDrinkTemplates
      .map(template => {
        // Try to find matching catalog item
        const catalogMatch = DRINK_CATALOG.find(
          d => d.id === template.type ||
               (d.volumeMl === template.volumeMl && d.abvPercent === template.abvPercent)
        );
        if (catalogMatch) return catalogMatch;

        // Try to find matching custom drink
        const customMatch = customDrinks.find(
          d => d.name === template.label &&
               d.volumeMl === template.volumeMl &&
               d.abvPercent === template.abvPercent
        );
        if (customMatch) {
          return {
            ...customMatch,
            id: `custom_${customMatch.id}`,
          } as DisplayDrink;
        }

        return null;
      })
      .filter((d): d is DisplayDrink => {
        if (d === null) return false;
        // Deduplicate: only keep first occurrence of each ID
        if (seenIds.has(d.id)) return false;
        seenIds.add(d.id);
        return true;
      })
      .slice(0, 10);
  }, [recentDrinkTemplates, customDrinks]);

  // Filtered drinks based on search and category
  const filteredDrinks = useMemo(() => {
    let drinks: DisplayDrink[] = [];

    if (selectedCategory === 'favorites') {
      drinks = allDrinks.filter(d => favoriteDrinkIds.includes(d.id));
    } else if (selectedCategory === 'recent') {
      drinks = recentDrinksDisplay;
    } else if (selectedCategory === 'all') {
      drinks = allDrinks;
    } else if (selectedCategory === 'myDrinks') {
      drinks = customDrinksDisplay;
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      drinks = drinks.filter(d => d.name.toLowerCase().includes(query));
    }

    return drinks;
  }, [selectedCategory, searchQuery, allDrinks, favoriteDrinkIds, recentDrinksDisplay, customDrinksDisplay]);

  // Handle drink selection - opens config view
  const handleSelectDrink = (drink: DisplayDrink) => {
    setConfigDrink(drink);
    // Use natural regional volume (volumeOz) when available for oz users
    setConfigVolume(getDrinkDisplayVolume(drink.volumeMl, drink.volumeOz, volumeUnit).toString());
    setConfigAbv(drink.abvPercent.toString());
    Keyboard.dismiss();
  };

  // Handle back from config view
  const handleBackFromConfig = () => {
    setConfigDrink(null);
    setConfigVolume('');
    setConfigAbv('');
  };

  // Check if config form is valid
  const isConfigFormValid = useMemo(() => {
    const volumeMl = parseVolumeInput(configVolume, volumeUnit);
    const abvValue = parseFloat(configAbv);
    return volumeMl !== null && volumeMl > 0 && !isNaN(abvValue) && abvValue > 0 && abvValue <= 100;
  }, [configVolume, configAbv, volumeUnit]);

  // Handle favorite toggle
  const handleToggleFavorite = async (drinkId: string) => {
    await toggleFavorite(drinkId);
  };

  // Handle save from config view
  const handleSaveFromConfig = async () => {
    if (!configDrink || !isConfigFormValid) return;

    setIsLoading(true);
    try {
      const timestamp = new Date(selectedDateTime);
      timestamp.setSeconds(0);
      timestamp.setMilliseconds(0);

      const volumeMl = parseVolumeInput(configVolume, volumeUnit)!;
      const abvPercent = parseFloat(configAbv);
      const isCustom = configDrink.id.startsWith('custom_');

      const drinkEntry: CreateDrinkEntry = {
        type: isCustom ? 'custom' : (configDrink.id as any),
        volumeMl,
        abvPercent,
        label: configDrink.name,
        notes: null,
        timestamp: timestamp.toISOString(),
      };

      await onAddDrink(drinkEntry);

      // Always close the sheet after adding drink
      // The LimitWarningPopup is rendered globally in _layout.tsx and will appear on top
      onClose();
    } catch (error) {
      console.error('Failed to add drink:', error);
    } finally {
      setIsLoading(false);
    }
  };


  // Reset custom form
  const resetCustomForm = useCallback(() => {
    setCustomName('');
    setCustomVolume('');
    setCustomAbv('');
    setCustomIcon(CUSTOM_DRINK_ICON);
    setCustomColor(CUSTOM_DRINK_COLOR);
    setCustomErrors({});
  }, []);

  // Open custom form
  const openCustomForm = useCallback(() => {
    resetCustomForm();
    setShowCustomForm(true);
  }, [resetCustomForm]);

  // Validate custom drink form
  const validateCustomForm = (): boolean => {
    const newErrors: typeof customErrors = {};

    if (!customName.trim()) {
      newErrors.name = 'Name is required';
    }

    const volumeMl = parseVolumeInput(customVolume, volumeUnit);
    if (!customVolume || volumeMl === null || volumeMl <= 0) {
      newErrors.volume = 'Valid volume is required';
    } else if (volumeMl > 5000) {
      newErrors.volume = 'Volume seems too high';
    }

    const abvValue = parseFloat(customAbv);
    if (!customAbv || isNaN(abvValue) || abvValue <= 0) {
      newErrors.abv = 'Valid alcohol % is required';
    } else if (abvValue > 100) {
      newErrors.abv = 'Cannot exceed 100%';
    }

    setCustomErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if custom form is valid
  const isCustomFormValid = customName.trim() !== '' &&
    parseVolumeInput(customVolume, volumeUnit) !== null &&
    parseVolumeInput(customVolume, volumeUnit)! > 0 &&
    !isNaN(parseFloat(customAbv)) &&
    parseFloat(customAbv) > 0;

  // Handle custom drink save - creates the template AND adds the drink entry
  const handleSaveCustomDrink = async () => {
    if (!validateCustomForm()) return;

    setIsSavingCustom(true);
    try {
      const volumeMl = parseVolumeInput(customVolume, volumeUnit)!;
      const abvPercent = parseFloat(customAbv);

      // Save the custom drink template
      await addCustomDrink({
        name: customName.trim(),
        volumeMl,
        abvPercent,
        icon: customIcon,
        color: customColor,
      });

      // Use selectedDateTime directly
      const timestamp = new Date(selectedDateTime);
      timestamp.setSeconds(0);
      timestamp.setMilliseconds(0);

      // Create the drink entry directly
      const drinkEntry: CreateDrinkEntry = {
        type: 'custom',
        volumeMl,
        abvPercent,
        label: customName.trim(),
        notes: null,
        timestamp: timestamp.toISOString(),
      };

      await onAddDrink(drinkEntry);

      // Always close the sheet after adding drink
      // The LimitWarningPopup is rendered globally in _layout.tsx and will appear on top
      onClose();
    } catch (error) {
      console.error('Failed to create custom drink:', error);
    } finally {
      setIsSavingCustom(false);
    }
  };

  // Handle sheet state changes (detect dismiss)
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1 && onDismiss) {
      onDismiss();
    }
  }, [onDismiss]);

  // Render backdrop
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    []
  );

  // Render list item
  const renderItem = useCallback(({ item }: { item: DisplayDrink }) => (
    <DrinkPickerItem
      drink={item}
      isFavorite={favoriteDrinkIds.includes(item.id)}
      isSelected={selectedDrink?.id === item.id}
      onSelect={() => handleSelectDrink(item)}
      onToggleFavorite={() => handleToggleFavorite(item.id)}
      volumeUnit={volumeUnit}
      showFavorite={featureFlags.drinkFavorites}
    />
  ), [favoriteDrinkIds, selectedDrink, volumeUnit]);

  // Render empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={48} color={colors.textLight} />
      <Text style={styles.emptyTitle}>
        {selectedCategory === 'favorites' ? 'No favorites yet' : 'No drinks found'}
      </Text>
      <Text style={styles.emptyText}>
        {selectedCategory === 'favorites'
          ? 'Tap the star on any drink to add it to your favorites'
          : 'Try a different search or create a custom drink'}
      </Text>
    </View>
  );

  // Render footer (create custom drink button)
  const renderFooter = () => (
    <TouchableOpacity
      style={styles.createCustomButton}
      onPress={openCustomForm}
    >
      <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
      <Text style={styles.createCustomText}>Create custom drink</Text>
    </TouchableOpacity>
  );

  // Render custom drink form content
  const renderCustomFormContent = () => (
    <BottomSheetScrollView style={styles.customFormScrollView} contentContainerStyle={styles.customFormContent}>
      {/* Name Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Name</Text>
        <BottomSheetTextInput
          style={[styles.customInput, customErrors.name && styles.inputError]}
          value={customName}
          onChangeText={(text) => {
            setCustomName(text);
            if (customErrors.name) setCustomErrors(prev => ({ ...prev, name: undefined }));
          }}
          placeholder="e.g. My Special Cocktail"
          placeholderTextColor={colors.textLight}
        />
        {customErrors.name && <Text style={styles.errorText}>{customErrors.name}</Text>}
      </View>

      {/* Volume and ABV Row */}
      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.inputLabel}>Volume ({getVolumeUnitLabel(volumeUnit)})</Text>
          <BottomSheetTextInput
            style={[styles.customInput, customErrors.volume && styles.inputError]}
            value={customVolume}
            onChangeText={(text) => {
              setCustomVolume(text);
              if (customErrors.volume) setCustomErrors(prev => ({ ...prev, volume: undefined }));
            }}
            keyboardType="numeric"
            placeholder={volumeUnit === 'oz' ? '11' : '330'}
            placeholderTextColor={colors.textLight}
          />
          {customErrors.volume && <Text style={styles.errorText}>{customErrors.volume}</Text>}
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.inputLabel}>Alcohol (%)</Text>
          <BottomSheetTextInput
            style={[styles.customInput, customErrors.abv && styles.inputError]}
            value={customAbv}
            onChangeText={(text) => {
              setCustomAbv(text);
              if (customErrors.abv) setCustomErrors(prev => ({ ...prev, abv: undefined }));
            }}
            keyboardType="decimal-pad"
            placeholder="5.0"
            placeholderTextColor={colors.textLight}
          />
          {customErrors.abv && <Text style={styles.errorText}>{customErrors.abv}</Text>}
        </View>
      </View>

      {/* Icon Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Icon</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.iconRow}>
            {AVAILABLE_ICONS.map(icon => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconOption,
                  customIcon === icon && styles.iconOptionSelected,
                  { backgroundColor: `${customColor}20` },
                ]}
                onPress={() => setCustomIcon(icon)}
              >
                <Ionicons
                  name={icon as any}
                  size={24}
                  color={customIcon === icon ? customColor : colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Color Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Color</Text>
        <View style={styles.colorRow}>
          {AVAILABLE_COLORS.map(color => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                customColor === color && styles.colorOptionSelected,
              ]}
              onPress={() => setCustomColor(color)}
            >
              {customColor === color && (
                <Ionicons name="checkmark" size={16} color={colors.textOnPrimary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Preview */}
      <View style={styles.previewContainer}>
        <Text style={styles.previewLabel}>Preview</Text>
        <View style={styles.previewRow}>
          <View style={[styles.previewIcon, { backgroundColor: `${customColor}20` }]}>
            <Ionicons name={customIcon as any} size={24} color={customColor} />
          </View>
          <View style={styles.previewContent}>
            <Text style={styles.previewName}>{customName || 'Your Drink'}</Text>
            <Text style={styles.previewDetails}>
              {customVolume || '---'}{volumeUnit} · {customAbv || '---'}%
            </Text>
          </View>
        </View>
      </View>
    </BottomSheetScrollView>
  );

  // Dynamic snap points based on current view
  const snapPoints = useMemo(
    () => ['90%'],
    []
  );

  // Render config/detail view content
  const renderConfigContent = () => {
    if (!configDrink) return null;

    return (
      <BottomSheetScrollView style={styles.configScrollView} contentContainerStyle={styles.configContent}>
        {/* Drink Icon and Name */}
        <View style={styles.configDrinkHeader}>
          <View style={[styles.configDrinkIcon, { backgroundColor: `${configDrink.color}20` }]}>
            <Ionicons name={configDrink.icon as any} size={32} color={configDrink.color} />
          </View>
          <Text style={styles.configDrinkName}>{configDrink.name}</Text>
        </View>

        {/* Volume Section */}
        <View style={styles.configSection}>
          <Text style={styles.configSectionLabel}>AMOUNT</Text>
          <View style={styles.configInputRow}>
            <Text style={styles.configInputLabel}>Volume</Text>
            <View style={styles.configInputWrapper}>
              <BottomSheetTextInput
                style={styles.configInput}
                value={configVolume}
                onChangeText={setConfigVolume}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textLight}
              />
              <Text style={styles.configInputUnit}>{getVolumeUnitLabel(volumeUnit)}</Text>
            </View>
          </View>
          {/* Volume Presets */}
          {featureFlags.volumePresets && (
            <View style={styles.volumePresetsRow}>
              {getVolumePresets(configDrink.category).map((presetMl) => {
                const displayValue = volumeForDisplay(presetMl, volumeUnit);
                const isSelected = configVolume === displayValue.toString();
                return (
                  <TouchableOpacity
                    key={presetMl}
                    style={[
                      styles.volumePresetButton,
                      isSelected && styles.volumePresetButtonSelected,
                    ]}
                    onPress={() => setConfigVolume(displayValue.toString())}
                  >
                    <Text
                      style={[
                        styles.volumePresetText,
                        isSelected && styles.volumePresetTextSelected,
                      ]}
                    >
                      {displayValue} {volumeUnit === 'oz' ? 'fl oz' : 'ml'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* ABV Section */}
        <View style={styles.configSection}>
          <Text style={styles.configSectionLabel}>ALCOHOL</Text>
          <View style={styles.configInputRow}>
            <Text style={styles.configInputLabel}>Alcohol By Volume</Text>
            <View style={styles.configInputWrapper}>
              <BottomSheetTextInput
                style={styles.configInput}
                value={configAbv}
                onChangeText={setConfigAbv}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textLight}
              />
              <Text style={styles.configInputUnit}>vol %</Text>
            </View>
          </View>
        </View>

        {/* DateTime Section */}
        <View style={styles.configSection}>
          <Text style={styles.configSectionLabel}>DATE</Text>
          <TouchableOpacity
            style={styles.configDateTimeRow}
            onPress={() => setPickerMode('date')}
          >
            <Text style={styles.configInputLabel}>Date</Text>
            <View style={styles.configDateTimeValue}>
              <Text style={styles.configDateTimeText}>
                {format(selectedDateTime, 'd. MMM yyyy')}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.configDateTimeRow}
            onPress={() => setPickerMode('time')}
          >
            <Text style={styles.configInputLabel}>Time</Text>
            <View style={styles.configDateTimeValue}>
              <Text style={styles.configDateTimeText}>
                {selectedDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Delete Button - only shown in edit mode */}
        {editingDrink && onDelete && (
          <TouchableOpacity
            onPress={onDelete}
            style={styles.configDeleteButton}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={styles.deleteButtonText}>Delete Drink</Text>
          </TouchableOpacity>
        )}
      </BottomSheetScrollView>
    );
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
    >
      {showCustomForm ? (
        <>
          {/* Custom Drink Form Header */}
          <ModalHeader
            title="Create Custom Drink"
            onClose={() => setShowCustomForm(false)}
            onSave={handleSaveCustomDrink}
            saveDisabled={!isCustomFormValid || isSavingCustom}
          />
          {renderCustomFormContent()}
        </>
      ) : configDrink ? (
        <>
          {/* Config/Detail View Header */}
          <ModalHeader
            title={editingDrink ? 'Update Drink' : 'Add new drink'}
            onClose={handleBackFromConfig}
            closeIcon="chevron-back"
            onSave={handleSaveFromConfig}
            saveDisabled={!isConfigFormValid || isLoading}
          />
          {renderConfigContent()}
        </>
      ) : (
        <>
          {/* Header */}
          <ModalHeader
            title={editingDrink ? 'Edit Drink' : 'Add Drink'}
            onClose={onClose}
          />

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <BottomSheetTextInput
              style={styles.searchInput}
              placeholder="Search drinks..."
              placeholderTextColor={colors.textLight}
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Chips */}
          <CategoryChips
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
            favoritesCount={favoriteDrinkIds.length}
            recentCount={recentDrinksDisplay.length}
            myDrinksCount={customDrinksDisplay.length}
            showFavorites={featureFlags.drinkFavorites}
          />

          {/* Drink List */}
          <BottomSheetFlatList
        data={filteredDrinks}
        keyExtractor={(item: DisplayDrink) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={
          filteredDrinks.length === 0
            ? styles.listContentEmpty
            : styles.listContent
        }
        keyboardShouldPersistTaps="handled"
      />

      {/* Delete Button - only shown in edit mode */}
      {editingDrink && onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={styles.deleteButtonText}>Delete Drink</Text>
        </TouchableOpacity>
      )}

        </>
      )}

      {/* DateTime Picker Modal - iOS (shared across all views) */}
      {pickerMode && Platform.OS === 'ios' && (
        <Modal
          transparent
          animationType="slide"
          visible={pickerMode !== null}
          onRequestClose={() => setPickerMode(null)}
        >
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setPickerMode(null)}>
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>
                  {pickerMode === 'date' ? 'Select Date' : 'Select Time'}
                </Text>
                <TouchableOpacity onPress={() => setPickerMode(null)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDateTime}
                mode={pickerMode}
                display="spinner"
                maximumDate={new Date()}
                onChange={(_, date) => {
                  if (date) setSelectedDateTime(date);
                }}
                style={styles.timePicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* DateTime Picker - Android (shared across all views) */}
      {pickerMode && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedDateTime}
          mode={pickerMode}
          display="default"
          maximumDate={new Date()}
          onChange={(_, date) => {
            setPickerMode(null);
            if (date) setSelectedDateTime(date);
          }}
        />
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.background,
  },
  handleIndicator: {
    backgroundColor: colors.border,
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: spacing.xs,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  createCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  createCustomText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xl,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  pickerCancelText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  pickerDoneText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  timePicker: {
    height: 200,
  },
  // Custom drink form styles
  customFormScrollView: {
    flex: 1,
  },
  customFormContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  customInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  iconRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconOptionSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  colorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  previewContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  previewLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    marginLeft: spacing.md,
  },
  previewName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  previewDetails: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  deleteButtonText: {
    fontSize: fontSize.md,
    color: colors.error,
    fontWeight: fontWeight.medium,
  },
  // Config/Detail view styles
  configScrollView: {
    flex: 1,
  },
  configContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  configDrinkHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  configDrinkIcon: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  configDrinkName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  configSection: {
    marginBottom: spacing.lg,
  },
  configSectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  configInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  configInputLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  configInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  configInput: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.text,
    textAlign: 'right',
    minWidth: 60,
    padding: spacing.sm,
  },
  configInputUnit: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  volumePresetsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  volumePresetButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  volumePresetButtonSelected: {
    backgroundColor: colors.background,
    borderColor: colors.text,
    borderWidth: 2,
  },
  volumePresetText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  volumePresetTextSelected: {
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  configDateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  configDateTimeValue: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  configDateTimeText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  configDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },
});
