# RevenueCat Setup Checklist

Step-by-step guide to configure RevenueCat for the Drink Monitoring app.

## Prerequisites

- ✅ RevenueCat account created
- ✅ iOS App Store Connect account (for iOS)
- ✅ Google Play Console account (for Android)

## Quick Start

The SDK is already installed and integrated. You just need to configure the products in RevenueCat Dashboard.

### Current Status

✅ **Already Completed:**
- npm packages installed (`react-native-purchases`, `react-native-purchases-ui`)
- Service layer created
- State management configured
- Paywall UI implemented
- Customer Center integrated
- Settings screen updated

⏳ **Requires Configuration:**
- RevenueCat Dashboard setup
- App Store Connect products (iOS)
- Google Play Console products (Android)
- API keys updated for production

---

## Step 1: RevenueCat Dashboard Setup

### 1.1 Create a Project

1. Log in to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Click **"Create a new project"**
3. Enter project name: `Drink Monitoring`
4. Click **Create**

### 1.2 Add Your Apps

**For iOS:**
1. Go to **Project Settings** → **Apps**
2. Click **+ App**
3. Select **Apple App Store**
4. Enter:
   - **App name:** `Drink Monitoring iOS`
   - **Bundle ID:** Your iOS bundle identifier (e.g., `com.yourcompany.drinkmonitoring`)
5. Click **Save**

**For Android:**
1. Go to **Project Settings** → **Apps**
2. Click **+ App**
3. Select **Google Play Store**
4. Enter:
   - **App name:** `Drink Monitoring Android`
   - **Package name:** Your Android package name (e.g., `com.yourcompany.drinkmonitoring`)
5. Click **Save**

### 1.3 Get API Keys

1. Go to **Project Settings** → **API Keys**
2. Copy the API keys:
   - **Public App-specific API Key** (for iOS)
   - **Public App-specific API Key** (for Android)
   - Or use **Public SDK Key** (cross-platform)

**Current Test Key:**
```
test_RIYJBdoDAPQadpVSUJeJekGGsDx
```

**Update for production in:**
```
src/services/revenueCatService.ts
```

---

## Step 2: Create Products

### 2.1 In RevenueCat Dashboard

1. Go to **Products** in sidebar
2. Click **+ New** for each product

**Product 1: Monthly Subscription**
- Product ID: `monthly`
- Type: Subscription
- Duration: 1 month

**Product 2: Annual Subscription**
- Product ID: `yearly`
- Type: Subscription
- Duration: 12 months

**Product 3: Lifetime Purchase**
- Product ID: `lifetime`
- Type: Non-subscription
- Duration: Lifetime

### 2.2 In App Store Connect (iOS)

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to **Features** → **In-App Purchases**
4. Click **+** to add new

**For each product:**

**Monthly ($9.99/month):**
- Product ID: `monthly` (must match RevenueCat)
- Type: Auto-Renewable Subscription
- Subscription Group: Create "Pro Subscriptions"
- Price: $9.99
- Billing Period: 1 month

**Annual ($79.99/year):**
- Product ID: `yearly`
- Type: Auto-Renewable Subscription
- Subscription Group: "Pro Subscriptions"
- Price: $79.99
- Billing Period: 1 year

**Lifetime ($199.99):**
- Product ID: `lifetime`
- Type: Non-Consumable
- Price: $199.99

### 2.3 In Google Play Console (Android)

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Go to **Monetize** → **Products** → **Subscriptions**
4. Click **Create subscription**

**For each subscription:**

**Monthly:**
- Product ID: `monthly`
- Name: Monthly Pro
- Billing period: 1 month
- Price: $9.99

**Annual:**
- Product ID: `yearly`
- Name: Annual Pro
- Billing period: 1 year
- Price: $79.99

**For Lifetime (In-app product):**
1. Go to **Monetize** → **Products** → **In-app products**
2. Click **Create product**
3. Product ID: `lifetime`
4. Price: $199.99

### 2.4 Link Products in RevenueCat

1. Back in RevenueCat Dashboard → **Products**
2. For each product, click **Configure**
3. Link to App Store and Play Store product IDs
4. Save

---

## Step 3: Create Entitlement

Entitlements represent the access level users get.

1. Go to **Entitlements** in RevenueCat Dashboard
2. Click **+ New Entitlement**
3. Enter:
   - **Identifier:** `Drink monitoring Pro` (must match exactly in code)
   - **Description:** Pro features access
4. Click **Save**
5. Click the entitlement to open
6. Click **Attach products**
7. Select all three products: `monthly`, `yearly`, `lifetime`
8. Click **Save**

---

## Step 4: Create Offering

Offerings group products together for display in the app.

1. Go to **Offerings** in RevenueCat Dashboard
2. Click **+ New Offering**
3. Enter:
   - **Identifier:** `default`
   - **Description:** Default offering
4. Click **Create**

### Add Packages

1. Click **+ Add package** for each product

**Package 1: Monthly**
- Package ID: `monthly`
- Product: Select `monthly`

**Package 2: Annual**
- Package ID: `yearly`
- Product: Select `yearly`

**Package 3: Lifetime**
- Package ID: `lifetime`
- Product: Select `lifetime`

### Set as Current

1. Click the **•••** menu on the offering
2. Select **Make current**

This makes the offering active and available in your app.

---

## Step 5: Configure Paywall (Optional)

RevenueCat Paywalls provide pre-built UI templates.

1. Go to **Paywalls** in RevenueCat Dashboard
2. Click **+ New Paywall**
3. Choose a template (e.g., "Minimalist", "Bold")
4. Customize:
   - Header text: "Upgrade to Pro"
   - Subtitle: "Unlock advanced drink tracking features"
   - Feature list: Add Pro features
   - Colors: Match your app theme
5. Link to offering: Select `default`
6. Click **Save**

The app already uses `PaywallFooterContainerView` which will display your configured paywall.

---

## Step 6: Platform-Specific Configuration

### iOS Setup

**6.1 App Store Connect API Key (Recommended)**

1. In App Store Connect, go to **Users and Access**
2. Click **Keys** → **App Store Connect API**
3. Click **+** to generate new key
4. Download the `.p8` key file
5. In RevenueCat Dashboard:
   - Go to **Project Settings** → **Apps** → Your iOS app
   - Click **Service Credentials**
   - Upload the `.p8` file
   - Enter Issuer ID and Key ID

**6.2 Enable In-App Purchase Capability**

In Xcode:
1. Select your project
2. Go to **Signing & Capabilities**
3. Click **+ Capability**
4. Add **In-App Purchase**

### Android Setup

**6.1 Service Account JSON**

1. In Google Play Console, go to **Setup** → **API access**
2. Link to Google Cloud project
3. Create service account
4. Grant permissions: **Finance** (view only)
5. Download JSON key file
6. In RevenueCat Dashboard:
   - Go to **Project Settings** → **Apps** → Your Android app
   - Click **Service Credentials**
   - Upload the JSON file

**6.2 Enable In-App Billing**

In your `AndroidManifest.xml`:
```xml
<uses-permission android:name="com.android.vending.BILLING" />
```

(This should already be added by the SDK)

---

## Step 7: Testing

### Test in Sandbox Mode

**iOS:**
1. Create a Sandbox tester account in App Store Connect
2. Sign out of App Store on device
3. Run the app from Xcode
4. When prompted, sign in with sandbox account
5. Test purchases (free in sandbox)

**Android:**
1. Add test account in Google Play Console
2. Install signed APK on device (debug or internal testing track)
3. Test purchases (free with test account)

### Verify Integration

1. **Launch app** → Should see console log:
   ```
   ✅ RevenueCat initialized successfully
   ```

2. **Navigate to Settings** → Should see "Upgrade zu Pro" button

3. **Tap Upgrade** → Should see paywall with packages and pricing

4. **Make test purchase** → Should complete successfully

5. **Check Pro status** → User should now be Pro

6. **Force quit app** → Relaunch → Pro status should persist

7. **Uninstall and reinstall** → Tap "Restore Purchases" → Pro status should restore

---

## Step 8: Production Checklist

Before releasing to production:

### Update API Keys

**In `src/services/revenueCatService.ts`:**

```typescript
// Replace test key with production key
const API_KEY = 'your_production_api_key_here';
```

### Platform-specific keys (optional)

```typescript
import { Platform } from 'react-native';

const API_KEY = Platform.select({
  ios: 'appl_your_ios_key',
  android: 'goog_your_android_key',
}) ?? 'your_default_key';
```

### Verify Configuration

- ✅ Products created in App Store Connect
- ✅ Products created in Google Play Console
- ✅ Products linked in RevenueCat
- ✅ Entitlement created and products attached
- ✅ Offering created and set as current
- ✅ Service credentials uploaded (App Store Connect API key, Play Store JSON)
- ✅ API keys updated to production
- ✅ Sandbox testing completed
- ✅ Restore purchases tested

### App Store Review

**Important:** Apple requires a way to manage subscriptions

✅ The app includes:
- Settings → "Abonnement verwalten" (for Pro users)
- Customer Center screen for subscription management
- Restore Purchases button on paywall

---

## Troubleshooting

### "No packages available"

1. Check offering is "Current" in dashboard
2. Verify products are linked to offering
3. Check internet connection
4. Wait a few minutes for cache to refresh

### "Invalid product ID"

1. Verify product IDs match exactly:
   - Code: `monthly`, `yearly`, `lifetime`
   - RevenueCat: Same IDs
   - App Store/Play Store: Same IDs
2. Check products are approved (App Store)
3. Check products are active (Play Store)

### "Receipt validation failed"

1. Verify service credentials are uploaded
2. Check App Store Connect API key permissions
3. Ensure JSON key has Finance role (Android)

### Paywall shows but purchases fail

1. Check bundle ID / package name matches
2. Verify In-App Purchase capability enabled
3. Check you're signed in with sandbox account
4. Ensure products are approved for sandbox testing

---

## Support Resources

- [RevenueCat Dashboard](https://app.revenuecat.com)
- [RevenueCat Docs](https://www.revenuecat.com/docs)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
- [RevenueCat Support](https://support.revenuecat.com)

---

## Quick Command Reference

```bash
# Check installed packages
npm ls react-native-purchases

# Reinstall if needed
npm install react-native-purchases react-native-purchases-ui --legacy-peer-deps

# Clean and rebuild (iOS)
cd ios && pod install && cd ..
npx react-native run-ios

# Clean and rebuild (Android)
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

---

## Summary

Your app is **production-ready** for subscriptions. The integration is complete, you just need to:

1. ✅ Set up products in RevenueCat Dashboard
2. ✅ Create products in App Store Connect / Play Console
3. ✅ Link products and create entitlement
4. ✅ Create and activate offering
5. ✅ Test in sandbox
6. ✅ Update API keys for production
7. ✅ Submit to App Store / Play Store

The code is ready and follows all RevenueCat best practices!
