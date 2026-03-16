/**
 * Store Review Service
 *
 * Safely requests an App Store / Play Store review using expo-store-review.
 * Handles the case where the native module is not available (e.g., in Expo Go
 * without a native rebuild).
 */

/**
 * Request an app store review if the native module is available.
 * Silently does nothing if the module is missing or the platform
 * doesn't support in-app reviews.
 */
export async function requestStoreReview(): Promise<void> {
  try {
    const StoreReview = require('expo-store-review');
    const isAvailable = await StoreReview.isAvailableAsync();
    if (isAvailable) {
      await StoreReview.requestReview();
    }
  } catch {
    // Silently ignore — native module may not be available or review not supported
  }
}
