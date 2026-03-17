import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/components/Card';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../ui/theme';

export function CardsExample() {
  const [liked, setLiked] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.section}>Default Card</Text>
      <Card>
        <Text style={styles.cardTitle}>Simple Card</Text>
        <Text style={styles.cardBody}>Default variant with subtle shadow. Good for content sections.</Text>
      </Card>

      <Text style={styles.section}>Elevated Card</Text>
      <Card variant="elevated">
        <Text style={styles.cardTitle}>Elevated Card</Text>
        <Text style={styles.cardBody}>More prominent shadow. Use for floating elements or CTAs.</Text>
      </Card>

      <Text style={styles.section}>Card with Action</Text>
      <Card>
        <View style={styles.actionRow}>
          <View style={styles.actionContent}>
            <Text style={styles.cardTitle}>Interactive Card</Text>
            <Text style={styles.cardBody}>Cards can contain any components.</Text>
          </View>
          <TouchableOpacity onPress={() => setLiked(!liked)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={24} color={liked ? colors.error : colors.textLight} />
          </TouchableOpacity>
        </View>
      </Card>

      <Text style={styles.section}>Stat Cards Row</Text>
      <View style={styles.statRow}>
        <Card style={styles.statCard}>
          <Ionicons name="trending-up-outline" size={24} color={colors.success} />
          <Text style={styles.statValue}>128</Text>
          <Text style={styles.statLabel}>Active</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="time-outline" size={24} color={colors.warning} />
          <Text style={styles.statValue}>24</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={24} color={colors.primary} />
          <Text style={styles.statValue}>512</Text>
          <Text style={styles.statLabel}>Done</Text>
        </Card>
      </View>

      <Text style={styles.section}>List Item Cards</Text>
      {['Settings', 'Profile', 'Notifications'].map((item) => (
        <TouchableOpacity key={item}>
          <Card style={styles.listCard}>
            <View style={styles.listRow}>
              <Text style={styles.listText}>{item}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  section: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardBody: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  listCard: {
    paddingVertical: spacing.sm,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
});
