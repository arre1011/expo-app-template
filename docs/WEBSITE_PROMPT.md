# Website Generation Prompt for GlassCount

Use this prompt with ChatGPT, Claude, or another AI to generate the Privacy Policy and Terms of Service website for the GlassCount app.

---

## PROMPT START

```
I need you to create a complete, production-ready website for my mobile app "GlassCount". The website should include a Privacy Policy page, Terms of Service page, and a simple landing/home page.

## App Overview

**App Name:** GlassCount
**Purpose:** A personal alcohol consumption tracker that helps users mindfully monitor their drinking and estimate their Blood Alcohol Concentration (BAC). The app follows a harm reduction approach - it supports self-determination and mindful consumption without moralizing.

**Important Disclaimer:** The app explicitly states that BAC values are estimates and must NOT be used to judge fitness to drive or make safety decisions.

**Platform:** iOS and Android (React Native/Expo)
**Business Model:** Freemium with optional Pro subscription (monthly, yearly, or lifetime)

---

## Technical Data Collection Details

### Data Stored LOCALLY on Device (SQLite Database)

The app stores ALL data exclusively on the user's device. No data is sent to any server.

**1. User Profile:**
- Weight (in kg)
- Biological sex (male/female) - used for BAC calculation
- Metabolism rate (elimination rate)
- Created/updated timestamps

**2. Drink Entries:**
- Timestamp of drink
- Type of drink (beer, wine, cocktail, etc.)
- Volume in milliliters
- Alcohol percentage (ABV)
- Optional: custom label and notes
- Created/updated timestamps

**3. Daily Goals:**
- Date
- Maximum BAC limit set by user
- Whether goal is enabled
- Created/updated timestamps

**4. Drinking Sessions:**
- Session start and end time
- Peak BAC reached
- Time of peak BAC
- Total standard units consumed
- Created/updated timestamps

**5. Journal Entries (optional feature):**
- Date
- Content/notes
- Mood rating
- Sleep quality rating
- Created/updated timestamps

### Third-Party Services

**1. RevenueCat (Subscription Management)**
- Purpose: Manages in-app purchases and subscriptions
- Data processed: Purchase receipts, subscription status, anonymous user ID
- RevenueCat Privacy Policy: https://www.revenuecat.com/privacy
- Note: RevenueCat does NOT have access to any drink data or personal health information

**2. Apple App Store / Google Play Store**
- Purpose: Payment processing for subscriptions
- Data processed: Payment information (handled entirely by Apple/Google)
- The app developer never sees or stores payment details

**3. Expo Notifications (Optional)**
- Purpose: Optional reminder notifications (user must opt-in)
- Data processed: Device push token (if notifications enabled)
- Can be disabled at any time in device settings

### What the App Does NOT Do

- ❌ No user accounts or login required
- ❌ No cloud synchronization
- ❌ No server-side data storage
- ❌ No analytics or tracking (no Google Analytics, no Firebase Analytics, etc.)
- ❌ No advertising
- ❌ No data sharing with third parties (except RevenueCat for purchases)
- ❌ No location tracking
- ❌ No access to contacts, photos, or other personal data
- ❌ No social features

---

## Design Requirements

Create a clean, modern, minimalist website that matches the app's design language.

### Color Palette (use these exact colors):

```css
:root {
  /* Primary colors */
  --primary: #111111;
  --primary-light: #333333;
  --primary-dark: #000000;

  /* Background colors */
  --background: #F9FAFB;
  --background-secondary: #F5F7FA;
  --card: #FFFFFF;

  /* Text colors */
  --text: #1A1A2E;
  --text-secondary: #6B7280;
  --text-light: #9CA3AF;
  --text-on-primary: #FFFFFF;

  /* Status colors */
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;

  /* Border and shadow */
  --border: #E5E7EB;
  --shadow: rgba(0, 0, 0, 0.1);
}
```

### Typography:
- Font family: System fonts (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)
- Clean, readable hierarchy
- Font sizes: 14px base, 16-18px for body, 24-32px for headings

### Layout:
- Maximum content width: 800px
- Generous whitespace
- Card-based sections with subtle shadows
- Mobile-responsive (must look good on phones)

### App Icon:
Include the app icon in the header. The icon is a minimalist wine glass outline on a light background.
Use this placeholder or reference: A simple, elegant wine glass silhouette (dark gray outline on white/light gray background).

For the actual icon, use this base64 or reference the file `assets/icon.png` from the app.

---

## Required Pages

### 1. Home Page (index.html)

A simple landing page with:
- App icon and name "GlassCount"
- Tagline: "Track your drinks. Know your limits. Stay mindful."
- Brief description (2-3 sentences about the app)
- Key features list (5-6 bullet points)
- Download buttons placeholder (App Store + Google Play badges)
- Links to Privacy Policy and Terms of Service in footer
- Important disclaimer about BAC estimates

### 2. Privacy Policy Page (privacy.html)

A comprehensive, legally compliant privacy policy that covers:

**Structure:**
1. Introduction
2. Information We Collect
   - Data stored locally on your device
   - Data processed by third-party services
3. How We Use Your Information
4. Data Storage and Security
5. Third-Party Services
   - RevenueCat
   - Apple/Google for payments
6. Your Rights and Choices
   - How to delete your data (uninstall the app)
   - How to manage notifications
   - How to manage subscriptions
7. Children's Privacy (app is 17+ due to alcohol content)
8. Changes to This Policy
9. Contact Information

**Key Points to Emphasize:**
- ALL personal data stays on the device
- No accounts, no cloud sync
- No tracking or analytics
- RevenueCat only handles purchases, not health data
- Data is automatically deleted when app is uninstalled

### 3. Terms of Service Page (terms.html)

A comprehensive terms of service that covers:

**Structure:**
1. Acceptance of Terms
2. Description of Service
3. User Requirements
   - Minimum age requirement (legal drinking age in user's jurisdiction)
   - Age rating: 17+ in App Store
4. Important Disclaimers
   - BAC values are ESTIMATES only
   - App must NOT be used to determine fitness to drive
   - App does not provide medical advice
   - User assumes all responsibility for their actions
5. Subscription Terms
   - Free features vs Pro features
   - Payment processing through Apple/Google
   - Cancellation and refund policy (per Apple/Google policies)
   - Auto-renewal information
6. Intellectual Property
7. Limitation of Liability
8. Indemnification
9. Governing Law
10. Changes to Terms
11. Contact Information

**Critical Disclaimers (MUST be prominent):**
- "GlassCount provides ESTIMATED Blood Alcohol Concentration values based on the Widmark formula. These are approximations only."
- "NEVER use this app to determine whether you are safe to drive or operate machinery."
- "This app is NOT a medical device and does not provide medical advice."
- "Individual BAC can vary significantly based on many factors not accounted for by this app."
- "When in doubt, DO NOT DRIVE. Use alternative transportation."

---

## File Structure

Create these files:
```
/
├── index.html          (Landing page)
├── privacy.html        (Privacy Policy)
├── terms.html          (Terms of Service)
├── styles.css          (Shared stylesheet)
└── assets/
    └── icon.png        (App icon - I will add this)
```

---

## Additional Requirements

1. **Language:** All content must be in English
2. **Last Updated Date:** January 2025
3. **Contact Email:** Use placeholder [CONTACT_EMAIL] - I will replace this
4. **Company/Developer Name:** Use placeholder [DEVELOPER_NAME] - I will replace this
5. **Responsive Design:** Must work on mobile devices
6. **No JavaScript required:** Pure HTML + CSS for simplicity and fast loading
7. **SEO basics:** Proper meta tags, title tags, semantic HTML
8. **Accessibility:** Proper heading hierarchy, sufficient color contrast

---

## Legal Compliance

The privacy policy should be compliant with:
- GDPR (European Union)
- CCPA (California)
- Apple App Store requirements
- Google Play Store requirements

Include standard clauses for:
- Data subject rights (access, deletion, portability)
- Data retention periods
- International data transfers (note: no data leaves device)

---

## Output Format

Please provide:
1. Complete HTML for index.html
2. Complete HTML for privacy.html
3. Complete HTML for terms.html
4. Complete CSS for styles.css

Each file should be production-ready and properly formatted.
```

## PROMPT END

---

## After Generation: Next Steps

1. **Replace placeholders:**
   - `[CONTACT_EMAIL]` → Your support email
   - `[DEVELOPER_NAME]` → Your name or company name

2. **Add the app icon:**
   - Copy `assets/wine_glass.png` to the website's `assets/` folder
   - Or convert to base64 and embed directly

3. **Deploy to Vercel:**
   ```bash
   # Option A: Drag & drop the folder to vercel.com

   # Option B: Using Vercel CLI
   npm i -g vercel
   cd website-folder
   vercel
   ```

4. **Note the URL:**
   - Vercel will give you a URL like: `https://glasscount.vercel.app`
   - Privacy Policy: `https://glasscount.vercel.app/privacy.html`
   - Terms: `https://glasscount.vercel.app/terms.html`

5. **Enter URLs in App Store Connect and Google Play Console**

---

## Quick Reference: Data Summary

| Data Type | Stored Where | Shared With | Can User Delete? |
|-----------|--------------|-------------|------------------|
| Weight, Sex | Device only | Nobody | Yes (uninstall) |
| Drink logs | Device only | Nobody | Yes (uninstall) |
| BAC calculations | Device only | Nobody | Yes (uninstall) |
| Goals & limits | Device only | Nobody | Yes (uninstall) |
| Purchase receipts | RevenueCat | Apple/Google | Via store settings |
| Push token | Device + Expo | Expo (if enabled) | Disable notifications |

---

## Color Reference (for icon matching)

If you need to reference the app's visual style for the AI:

- Background: Almost white (#F9FAFB)
- Primary/Text: Near black (#111111)
- Cards: Pure white (#FFFFFF)
- Accent (success): Green (#10B981)
- Accent (warning): Orange (#F59E0B)
- Accent (error): Red (#EF4444)

The app has a clean, minimalist, health-focused aesthetic.


