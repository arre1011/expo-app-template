import React, { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';

// Mock BottomSheetModal
const BottomSheetModal = forwardRef(({ children, ...props }, ref) => {
  const [isVisible, setIsVisible] = React.useState(false);

  useImperativeHandle(ref, () => ({
    present: () => setIsVisible(true),
    dismiss: () => setIsVisible(false),
    snapToIndex: jest.fn(),
    snapToPosition: jest.fn(),
    expand: jest.fn(),
    collapse: jest.fn(),
    close: jest.fn(),
    forceClose: jest.fn(),
  }));

  if (!isVisible) return null;

  return <View testID="bottom-sheet-modal" {...props}>{children}</View>;
});

// Mock BottomSheet
const BottomSheet = forwardRef(({ children, ...props }, ref) => {
  useImperativeHandle(ref, () => ({
    snapToIndex: jest.fn(),
    snapToPosition: jest.fn(),
    expand: jest.fn(),
    collapse: jest.fn(),
    close: jest.fn(),
    forceClose: jest.fn(),
  }));

  return <View testID="bottom-sheet" {...props}>{children}</View>;
});

// Mock BottomSheetView
const BottomSheetView = ({ children, ...props }) => (
  <View testID="bottom-sheet-view" {...props}>{children}</View>
);

// Mock BottomSheetScrollView
const BottomSheetScrollView = ({ children, ...props }) => (
  <View testID="bottom-sheet-scroll-view" {...props}>{children}</View>
);

// Mock BottomSheetBackdrop
const BottomSheetBackdrop = ({ ...props }) => (
  <View testID="bottom-sheet-backdrop" {...props} />
);

// Mock BottomSheetModalProvider
const BottomSheetModalProvider = ({ children }) => (
  <View testID="bottom-sheet-modal-provider">{children}</View>
);

// Mock hooks
const useBottomSheet = () => ({
  snapToIndex: jest.fn(),
  snapToPosition: jest.fn(),
  expand: jest.fn(),
  collapse: jest.fn(),
  close: jest.fn(),
  forceClose: jest.fn(),
  animatedIndex: { value: 0 },
  animatedPosition: { value: 0 },
});

const useBottomSheetModal = () => ({
  dismiss: jest.fn(),
  dismissAll: jest.fn(),
});

const useBottomSheetDynamicSnapPoints = (initialSnapPoints) => ({
  animatedHandleHeight: { value: 0 },
  animatedSnapPoints: initialSnapPoints,
  animatedContentHeight: { value: 0 },
  handleContentLayout: jest.fn(),
});

module.exports = {
  default: BottomSheet,
  BottomSheet,
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetModalProvider,
  useBottomSheet,
  useBottomSheetModal,
  useBottomSheetDynamicSnapPoints,
};
