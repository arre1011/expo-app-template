import type { DeferredDeepLinkProvider, ResolvedOffer } from './deep-links';

/**
 * Deferred provider seam for future SDK integrations.
 *
 * DeepLinkNow was removed because its native dependency was breaking Android
 * builds. Keep this file as the only place that needs to change when a
 * replacement provider such as AppsFlyer is introduced.
 */
const deferredDeepLinkProvider: DeferredDeepLinkProvider = {
  async initialize() {
    if (__DEV__) {
      console.log('Deep links: deferred provider disabled. Placeholder for future AppsFlyer integration.');
    }
  },

  async findDeferredOffer(): Promise<ResolvedOffer | null> {
    return null;
  },
};

export async function initializeDeepLinkProvider(): Promise<void> {
  await deferredDeepLinkProvider.initialize();
}

export async function findDeferredOffer(): Promise<ResolvedOffer | null> {
  return deferredDeepLinkProvider.findDeferredOffer();
}
