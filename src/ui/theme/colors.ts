export const colors = {
  // Primary colors (Black)
  primary: '#111111',
  primaryLight: '#333333',
  primaryDark: '#000000',

  // Background colors
  background: '#F9FAFB',
  backgroundSecondary: '#F5F7FA',
  card: '#FFFFFF',
  cardAlt: '#FFFFFF',

  // Text colors
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Status colors
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',

  // Calendar status colors
  sober: '#10B981', // Green
  moderate: '#F59E0B', // Yellow/Orange
  overLimit: '#EF4444', // Red

  // Calendar soft colors (for dots and legend - 65% opacity)
  soberSoft: '#10B981A6',
  moderateSoft: '#F59E0BA6',
  overLimitSoft: '#EF4444A6',

  // Border colors
  border: '#FFFFFF',
  borderLight: '#FFFFFF',

  // Shadow
  shadow: 'rgba(0, 0, 0, 0.1)',

  // Transparent
  transparent: 'transparent',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Chart colors
  chartLine: '#111111',
  chartFill: 'rgba(33, 150, 243, 0.2)',
  chartGrid: '#E5E7EB',

  // Onboarding/Feature colors
  info: '#3B82F6',           // Blue - trust, personalization
  infoLight: '#DBEAFE',      // Light blue background
  wine: '#8B5CF6',           // Purple - premium, drink theme
  wineLight: '#EDE9FE',      // Light purple background
  yellow: '#FDE047',         // Bright sunny yellow - positive, welcoming
  yellowLight: '#FEF9C3',    // Light yellow background

  // Award tier colors (7 unique tiers for clear progression)
  awardBronze: '#CD7F32',
  awardSilver: '#A8A8A8',
  awardGold: '#FFD700',
  awardPlatinum: '#B8D4E3',
  awardDiamond: '#B9F2FF',    // Light cyan/diamond blue
  awardSapphire: '#0F52BA',   // Deep sapphire blue
  awardRuby: '#E0115F',       // Ruby red

  // Award tier background colors (subtle)
  awardBronzeBg: '#FDF4E6',
  awardSilverBg: '#F5F5F5',
  awardGoldBg: '#FFFBF0',
  awardPlatinumBg: '#F0F7FA',
  awardDiamondBg: '#F0FBFF',  // Very light cyan
  awardSapphireBg: '#E8F0FF', // Very light sapphire blue
  awardRubyBg: '#FFF0F5',     // Lavender blush

  // Streak widget colors (Green = growth, success, motivation)
  streakActive: '#22C55E',      // Vibrant green for active streaks (Duolingo-style)
  streakActiveBg: '#DCFCE7',    // Light green background
  streakInactive: '#9CA3AF',    // Gray for inactive/broken streaks
  streakInactiveBg: '#F3F4F6',  // Light gray background
} as const;

export type ColorKey = keyof typeof colors;
