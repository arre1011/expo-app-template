import React, { useRef, useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetFlatList, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { ModalHeader } from '../ui/components/ModalHeader';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../ui/theme';

interface SearchSheetExampleProps {
  open: boolean;
  onClose: () => void;
}

const SAMPLE_ITEMS = [
  { id: '1', title: 'Apple', category: 'fruit', icon: 'nutrition-outline' as const },
  { id: '2', title: 'Banana', category: 'fruit', icon: 'nutrition-outline' as const },
  { id: '3', title: 'Carrot', category: 'vegetable', icon: 'leaf-outline' as const },
  { id: '4', title: 'Tomato', category: 'vegetable', icon: 'leaf-outline' as const },
  { id: '5', title: 'Salmon', category: 'protein', icon: 'fish-outline' as const },
  { id: '6', title: 'Chicken', category: 'protein', icon: 'restaurant-outline' as const },
  { id: '7', title: 'Rice', category: 'grain', icon: 'grid-outline' as const },
  { id: '8', title: 'Bread', category: 'grain', icon: 'grid-outline' as const },
  { id: '9', title: 'Milk', category: 'dairy', icon: 'water-outline' as const },
  { id: '10', title: 'Cheese', category: 'dairy', icon: 'ellipse-outline' as const },
];

const CATEGORIES = ['all', 'fruit', 'vegetable', 'protein', 'grain', 'dairy'] as const;

export function SearchSheetExample({ open, onClose }: SearchSheetExampleProps) {
  const ref = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['90%'], []);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  React.useEffect(() => {
    if (open) {
      ref.current?.present();
      setSearch('');
      setCategory('all');
    } else {
      ref.current?.dismiss();
    }
  }, [open]);

  const handleClose = useCallback(() => {
    ref.current?.dismiss();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} pressBehavior="close" />
    ),
    []
  );

  const filtered = useMemo(() => {
    return SAMPLE_ITEMS.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'all' || item.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  const renderItem = useCallback(({ item }: { item: typeof SAMPLE_ITEMS[0] }) => (
    <TouchableOpacity style={styles.item} onPress={() => {}}>
      <View style={styles.itemIcon}>
        <Ionicons name={item.icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemCategory}>{item.category}</Text>
      </View>
    </TouchableOpacity>
  ), []);

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      <ModalHeader title="Search Example" onClose={handleClose} />

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.textLight} style={styles.searchIcon} />
        <BottomSheetTextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor={colors.textLight}
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            if (text.length > 0) setCategory('all');
          }}
        />
      </View>

      <View style={styles.chips}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat && styles.chipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <BottomSheetFlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No results found</Text>
          </View>
        }
      />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundSecondary,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textOnPrimary,
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  itemCategory: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textLight,
  },
});
