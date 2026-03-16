import React from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { featureFlags } from '../../config/featureFlags';
import { bacForDisplay, getBACUnitSymbol } from '../../domain/utils/bacConversion';
import { useBACUnit } from '../hooks/useAppStore';
import type { BACUnit } from '../../domain/utils/bacConversion';

interface BACDisplayProps {
  currentBAC: number;
  isActive?: boolean;
  peakBAC?: number;
  showDisclaimer?: boolean;
}

const showBACInfoAlert = () => {
  Alert.alert(
    'What is Alcohol Level?',
    'Alcohol Level shows the estimated alcohol concentration in your blood.\n\nThis value is calculated based on your weight, sex, and the drinks you\'ve logged using the Widmark formula.\n\nExample: A glass of wine (150ml, 12% ABV) results in approximately 0.2‰ for an 80kg male.\n\nNote: Alcohol takes 15-45 minutes to be fully absorbed. Your alcohol level rises gradually after a drink – it won\'t jump immediately.',
    [{ text: 'Got it', style: 'default' }]
  );
};

const showDisclaimerAlert = () => {
  Alert.alert(
    'Why is this an estimate?',
    'This estimate is based on the Widmark model and may differ from your actual alcohol level.\n\nFactors not accounted for:\n• Food consumption\n• Medications\n• Individual metabolism differences\n• Hydration levels\n• Body composition\n\nNever use this value to decide whether you are safe to drive.',
    [{ text: 'I understand', style: 'default' }]
  );
};

/**
 * Format BAC value for the main display only
 * Uses 3 decimal places for percent, 2 for permille
 */
const formatBACForDisplay = (bacPermille: number, unit: BACUnit): string => {
  const displayValue = bacForDisplay(bacPermille, unit);
  const decimals = unit === 'percent' ? 3 : 2;
  return displayValue.toFixed(decimals);
};

export function BACDisplay({ currentBAC, isActive = true, peakBAC, showDisclaimer = featureFlags.estimateDisclaimer }: BACDisplayProps) {
  const bacUnit = useBACUnit();
  const displayValue = isActive ? currentBAC : (peakBAC ?? 0);
  const label = isActive ? 'Current Alcohol Level' : 'Peak Alcohol Level';
  const unitSymbol = getBACUnitSymbol(bacUnit);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.labelContainer} onPress={showBACInfoAlert} activeOpacity={0.7}>
        <Text style={styles.label}>{label}</Text>
        <Ionicons name="information-circle-outline" size={16} color={colors.textLight} />
      </TouchableOpacity>
      <Text style={styles.bacValue}>{formatBACForDisplay(displayValue, bacUnit)}<Text style={styles.permilleSymbol}>{unitSymbol}</Text></Text>

      {showDisclaimer && (
        <TouchableOpacity style={styles.disclaimerContainer} onPress={showDisclaimerAlert} activeOpacity={0.7}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textLight} />
          <Text style={styles.disclaimerText}>
            Estimate only – not for driving decisions
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  bacValue: {
    fontSize: 56,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    lineHeight: 64,
  },
  permilleSymbol: {
    fontSize: 28,
    fontWeight: fontWeight.normal,
    color: colors.primary,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  disclaimerText: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    fontWeight: fontWeight.medium,
  },
});
