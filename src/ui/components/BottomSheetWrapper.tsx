import React, { useCallback, useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { colors, borderRadius } from '../theme';

export interface BottomSheetWrapperRef {
  present: () => void;
  dismiss: () => void;
}

interface BottomSheetWrapperProps {
  children: React.ReactNode;
  /** Snap points for the sheet. Use percentages like ['50%', '90%'] or 'dynamic' for auto-sizing */
  snapPoints?: (string | number)[];
  /** Enable dynamic sizing based on content (ignores snapPoints when true) */
  enableDynamicSizing?: boolean;
  /** Maximum height when using dynamic sizing */
  maxDynamicContentSize?: number;
  /** Called when sheet is dismissed */
  onDismiss?: () => void;
  /** Enable scrolling for content */
  scrollable?: boolean;
  /** Show drag handle indicator */
  showHandle?: boolean;
}

export const BottomSheetWrapper = forwardRef<BottomSheetWrapperRef, BottomSheetWrapperProps>(
  (
    {
      children,
      snapPoints: customSnapPoints,
      enableDynamicSizing = true,
      maxDynamicContentSize,
      onDismiss,
      scrollable = false,
      showHandle = true,
    },
    ref
  ) => {
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    // Default snap points when not using dynamic sizing
    const snapPoints = useMemo(
      () => customSnapPoints ?? ['50%', '90%'],
      [customSnapPoints]
    );

    useImperativeHandle(ref, () => ({
      present: () => {
        bottomSheetModalRef.current?.present();
      },
      dismiss: () => {
        bottomSheetModalRef.current?.dismiss();
      },
    }));

    const handleSheetChanges = useCallback(
      (index: number) => {
        if (index === -1) {
          onDismiss?.();
        }
      },
      [onDismiss]
    );

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    const ContentWrapper = scrollable ? BottomSheetScrollView : BottomSheetView;

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={enableDynamicSizing ? undefined : snapPoints}
        enableDynamicSizing={enableDynamicSizing}
        maxDynamicContentSize={maxDynamicContentSize}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
        handleIndicatorStyle={showHandle ? styles.handleIndicator : styles.handleHidden}
        backgroundStyle={styles.sheetBackground}
      >
        <ContentWrapper style={scrollable ? styles.scrollContent : styles.viewContent}>
          {children}
        </ContentWrapper>
      </BottomSheetModal>
    );
  }
);

BottomSheetWrapper.displayName = 'BottomSheetWrapper';

const styles = StyleSheet.create({
  handleIndicator: {
    backgroundColor: colors.textLight,
    width: 40,
  },
  handleHidden: {
    opacity: 0,
  },
  sheetBackground: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  scrollContent: {
    flex: 1,
  },
  viewContent: {
    flex: 0,
  },
});
