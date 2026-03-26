import React from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PaywallContent } from '../../src/ui/components';
import { appConfig } from '../../src/config/appConfig';
import { colors } from '../../src/ui/theme';

export default function PaywallModal() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PaywallContent
        title={`Upgrade ${appConfig.appName}`}
        subtitle="Unlock the full template experience"
        showBackButton={true}
        onBack={() => router.back()}
        onPurchaseSuccess={() => router.back()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
