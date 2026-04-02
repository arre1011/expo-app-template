import React, { useState } from 'react';
import { Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/ui/theme';
import {
  BottomSheetExample,
  SearchSheetExample,
  WheelPickerExample,
  FormValidationExample,
  CardsExample,
} from '@/features/_showcase/components';

type ExampleId = 'bottom-sheet' | 'search-sheet' | 'wheel-picker' | 'form-validation' | 'cards';

const EXAMPLES: { id: ExampleId; title: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'bottom-sheet', title: 'Bottom Sheet Modal', description: 'Simple modal with save action', icon: 'layers-outline' },
  { id: 'search-sheet', title: 'Search Sheet', description: 'Modal with search, filter chips & list', icon: 'search-outline' },
  { id: 'wheel-picker', title: 'Wheel Picker', description: 'Time picker in bottom sheet', icon: 'options-outline' },
  { id: 'form-validation', title: 'Form Validation', description: 'Inline errors, never disabled buttons', icon: 'create-outline' },
  { id: 'cards', title: 'Cards', description: 'Card variants and layouts', icon: 'card-outline' },
];

export default function ShowcaseScreen() {
  const [activeSheet, setActiveSheet] = useState<ExampleId | null>(null);
  const [showCards, setShowCards] = useState(false);

  const handlePress = (id: ExampleId) => {
    if (id === 'cards') {
      setShowCards(true);
    } else {
      setActiveSheet(id);
    }
  };

  if (showCards) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => setShowCards(false)}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Examples</Text>
        </TouchableOpacity>
        <CardsExample />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Examples</Text>
      <Text style={styles.subtitle}>Reusable component patterns</Text>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {EXAMPLES.map((example) => (
          <TouchableOpacity key={example.id} style={styles.card} onPress={() => handlePress(example.id)}>
            <Ionicons name={example.icon} size={22} color={colors.primary} style={styles.cardIcon} />
            <Text style={styles.cardTitle}>{example.title}</Text>
            <Text style={styles.cardDescription}>{example.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <BottomSheetExample open={activeSheet === 'bottom-sheet'} onClose={() => setActiveSheet(null)} />
      <SearchSheetExample open={activeSheet === 'search-sheet'} onClose={() => setActiveSheet(null)} />
      <WheelPickerExample open={activeSheet === 'wheel-picker'} onClose={() => setActiveSheet(null)} />
      <FormValidationExample open={activeSheet === 'form-validation'} onClose={() => setActiveSheet(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardIcon: {
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  backText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
});
