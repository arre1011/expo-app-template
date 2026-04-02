import React, { useRef, useCallback, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { ModalHeader } from '@/ui/components/ModalHeader';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/ui/theme';

interface FormValidationExampleProps {
  open: boolean;
  onClose: () => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  age?: string;
}

export function FormValidationExample({ open, onClose }: FormValidationExampleProps) {
  const ref = useRef<BottomSheetModal>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  React.useEffect(() => {
    if (open) {
      ref.current?.present();
      setName('');
      setEmail('');
      setAge('');
      setErrors({});
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

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    const ageNum = parseInt(age, 10);
    if (!age.trim()) {
      newErrors.age = 'Age is required';
    } else if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
      newErrors.age = 'Enter a valid age (1-150)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    Alert.alert('Success', `Name: ${name}\nEmail: ${email}\nAge: ${age}`);
    ref.current?.dismiss();
  };

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      enablePanDownToClose
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetView style={styles.contentContainer}>
        <ModalHeader title="Form Validation" onClose={handleClose} onSave={handleSave} />
        <View style={styles.content}>
          <Text style={styles.description}>
            Buttons stay active. Validation runs on save. Errors clear as you type.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={name}
              onChangeText={(text) => { setName(text); clearError('name'); }}
              placeholder="Enter your name"
              placeholderTextColor={colors.textLight}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={email}
              onChangeText={(text) => { setEmail(text); clearError('email'); }}
              placeholder="you@example.com"
              placeholderTextColor={colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={[styles.input, errors.age && styles.inputError]}
              value={age}
              onChangeText={(text) => { setAge(text); clearError('age'); }}
              placeholder="25"
              placeholderTextColor={colors.textLight}
              keyboardType="number-pad"
            />
            {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
          </View>
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
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.transparent,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.error,
  },
});
