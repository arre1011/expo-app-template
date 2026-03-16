// Unit Types
export type WeightUnit = 'kg' | 'lb';
export type VolumeUnit = 'ml' | 'oz';
export type BACUnit = 'permille' | 'percent';

// Sex Type - biological profile for BAC calculation
export type Sex = 'male' | 'female' | 'other' | null;

// User Motivation Types - reasons for using the app
export type UserMotivation =
  | 'healthier_lifestyle'
  | 'mental_health'
  | 'physical_health'
  | 'active_weekends'
  | 'productivity'
  | 'regain_control'
  | 'mindful_consumption';

// User Motivations stored in DB
export interface UserMotivations {
  id: number;
  motivations: UserMotivation[];
  createdAt: string;
  updatedAt: string;
}

// User Profile Types
export interface UserProfile {
  id: number;
  weightKg: number;
  sex: Sex;
  bodyWaterConstantR: number; // Körperwasseranteil (r-Wert)
  eliminationRatePermillePerHour: number;
  weightUnit: WeightUnit; // User's preferred weight unit for display
  volumeUnit: VolumeUnit; // User's preferred volume unit for display
  bacUnit: BACUnit; // User's preferred BAC unit for display (permille or percent)
  createdAt: string;
  updatedAt: string;
}

export type CreateUserProfile = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserProfile = Partial<CreateUserProfile>;

// Drink Category Type (alphabetically sorted)
export type DrinkCategory = 'beer' | 'cocktails' | 'longdrinks' | 'spirits' | 'wine';

// Drink Entry Types
export type DrinkType = 'beer_small' | 'beer_large' | 'wine' | 'longdrink' | 'shot' | 'custom';

// Drink Catalog Item - Extended preset for the new DrinkPicker
export interface DrinkCatalogItem {
  id: string;                    // Unique identifier (e.g., 'beer_pint')
  name: string;                  // Display name
  category: DrinkCategory;       // Category for filtering
  volumeMl: number;              // Default volume in ml (metric regions)
  volumeOz?: number;             // Default volume in oz (US regions) - uses natural sizes, not conversion
  abvPercent: number;            // Alcohol by volume percentage
  icon: string;                  // Ionicons name
  color: string;                 // Hex color for icon background
}

// Custom Drink - User-created drinks stored in database
export interface CustomDrink {
  id: number;
  name: string;
  volumeMl: number;
  abvPercent: number;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateCustomDrink = Omit<CustomDrink, 'id' | 'createdAt' | 'updatedAt'>;

export interface DrinkEntry {
  id: number;
  timestamp: string; // ISO 8601 date string
  type: DrinkType;
  volumeMl: number;
  abvPercent: number;
  label: string | null;
  notes: string | null;
  sessionId: number | null; // Reference to session this drink belongs to
  createdAt: string;
  updatedAt: string;
}

export type CreateDrinkEntry = Omit<DrinkEntry, 'id' | 'sessionId' | 'createdAt' | 'updatedAt'>;
export type UpdateDrinkEntry = Partial<CreateDrinkEntry>;

// Session Types
// A session spans from the first drink until BAC returns to 0
export interface Session {
  id: number;
  startTime: string; // ISO 8601 timestamp of first drink
  endTime: string; // ISO 8601 timestamp when BAC = 0 (calculated)
  peakBAC: number; // Highest BAC reached during session
  peakTime: string; // ISO 8601 timestamp of peak BAC
  totalStandardUnits: number; // Total standard units consumed
  createdAt: string;
  updatedAt: string;
}

export type CreateSession = Omit<Session, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSession = Partial<CreateSession>;

// Session with drinks for UI display
export interface SessionWithDrinks extends Session {
  drinks: DrinkEntry[];
}

// Helper function to determine if session is active (endTime > now)
export function isSessionActive(session: Session): boolean {
  return new Date() < new Date(session.endTime);
}

// Daily Goal Types
export interface DailyGoal {
  id: number;
  date: string; // YYYY-MM-DD format
  maxBAC: number; // BAC limit in permille (‰), e.g., 0.5
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateDailyGoal = Omit<DailyGoal, 'id' | 'createdAt' | 'updatedAt'>;

// BAC Calculation Types
export interface BACDataPoint {
  timestamp: Date;
  bac: number; // BAC in permille (‰)
}

export interface BACTimeSeries {
  dataPoints: BACDataPoint[];
  currentBAC: number;
  peakBAC: number;
  peakTime: Date | null;
  soberTime: Date | null; // When BAC reaches 0
}

// Drink Preset Types
export interface DrinkPreset {
  type: DrinkType;
  name: string;
  description: string;
  volumeMl: number;
  abvPercent: number;
  icon: string;
}

// Statistics Types
export interface DailyStats {
  date: string;
  drinkCount: number;
  totalAlcoholGrams: number;
  peakBAC: number;
  withinGoal: boolean | null; // null if no goal set
}

export interface PeriodStats {
  totalDrinks: number;
  drinkingDays: number;
  soberDays: number;
  peakBAC: number;
  averagePeakBAC: number;
  goalAchievementRate: number | null; // percentage, null if no goals
  underLimitDays: number; // days where drinking occurred but stayed under limit
  overLimitDays: number; // days where limit was exceeded
}

// Calendar Day Status
export type DayStatus = 'sober' | 'moderate' | 'over_limit' | 'no_data';

// Journal Entry Types
export type MoodType = 'very_happy' | 'happy' | 'neutral' | 'sad' | 'very_sad';

export interface JournalEntry {
  id: number;
  date: string; // YYYY-MM-DD format
  content: string | null; // Freitext-Notiz
  mood: MoodType | null; // Stimmung als Emoji
  sleepQuality: number | null; // 1-5 Sterne
  createdAt: string;
  updatedAt: string;
}

export type CreateJournalEntry = Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateJournalEntry = Partial<CreateJournalEntry>;

// Recent Drink Template for Quick-Add
// Aggregated from drink_entry, grouped by (type, volumeMl, abvPercent, label)
export interface RecentDrinkTemplate {
  // Unique identifier (hash of type+volume+abv+label)
  id: string;
  type: DrinkType;
  volumeMl: number;
  abvPercent: number;
  label: string | null;
  // Metadata
  usageCount: number;
  lastUsedAt: string; // ISO 8601 timestamp
}

// Chart Types for Statistics
export type ChartPeriodType = 'day' | 'week' | 'month' | 'sixMonth' | 'year';

export interface ChartBarData {
  /** Unique identifier for the bar (date string or week/month identifier) */
  id: string;
  /** Standard Units value for this bar */
  standardUnits: number;
  /** Grams of pure alcohol */
  alcoholGrams: number;
  /** Display label for the bar (shown on X-axis) */
  label: string;
  /** Full label for tooltip/detail view */
  fullLabel: string;
  /** Start date of this bar's period */
  startDate: Date;
  /** End date of this bar's period */
  endDate: Date;
  /** Number of drinks in this period */
  drinkCount: number;
}

export interface ChartXAxisTick {
  /** Index of the bar this tick is associated with */
  barIndex: number;
  /** Label to display */
  label: string;
}

export interface ChartData {
  /** All bars for the chart */
  bars: ChartBarData[];
  /** Tick marks for X-axis (sparse labeling) */
  xAxisTicks: ChartXAxisTick[];
  /** Maximum SU value for Y-axis scaling */
  maxValue: number;
  /** Title for the period (e.g., "KW 52", "Oktober 2025") */
  periodTitle: string;
  /** Subtitle or date range */
  periodSubtitle: string;
}

// ==========================================
// AWARDS SYSTEM TYPES
// ==========================================

// Award tier levels (colors defined in theme)
// Each milestone gets a unique tier for clear progression
// Standard progression: Bronze → Silver → Gold → Platinum → Diamond → Sapphire → Ruby
export type AwardTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'sapphire' | 'ruby';

// Award IDs (streak awards only)
export type AwardId =
  | 'limit_keeper'           // Streak Award: Consecutive days under limit
  | 'mindful_drinker';       // Streak Award: Consecutive sessions under limit

// Award category
export type AwardCategory = 'streak';

// Calculated streak data (from awardCalculator)
export interface CalculatedStreak {
  awardId: AwardId;
  currentStreak: number;       // Current consecutive count
  bestStreak?: number;         // Historical best streak (calculated from all data)
  milestonesReached: number[]; // Thresholds passed (e.g., [7, 14, 30])
}

// Persistent award progress (stored in DB)
export interface AwardProgress {
  id: number;
  awardId: AwardId;
  bestStreak: number;         // Best streak ever achieved
  totalCount: number;         // For milestone-based awards
  lastUpdatedAt: string;      // ISO 8601
  createdAt: string;
  updatedAt: string;
}

export type CreateAwardProgress = Omit<AwardProgress, 'id' | 'createdAt' | 'updatedAt'>;

// Milestone achievement record (stored in DB when user reaches threshold)
export interface AwardMilestone {
  id: number;
  awardId: AwardId;
  milestoneValue: number;     // Numeric threshold (e.g., 7, 14, 30)
  tier: AwardTier;            // Bronze/Silver/Gold/Platinum
  achievedAt: string;         // ISO 8601 timestamp when milestone was reached
  celebrated: boolean;        // Whether celebration has been shown to user
  createdAt: string;
  updatedAt: string;
}

export type CreateAwardMilestone = Omit<AwardMilestone, 'id' | 'createdAt' | 'updatedAt'>;

// Complete award state for UI (combines calculated + persistent data)
export interface AwardState {
  awardId: AwardId;
  currentStreak: number;        // Calculated from sessions
  bestStreak: number;           // From DB
  progressPercent: number;      // Progress to next milestone (0-100)
  nextMilestoneValue: number;   // Next milestone to reach
  achievedMilestones: AwardMilestone[]; // From DB
  currentTier: AwardTier | null; // Highest tier achieved (null if none)
}
