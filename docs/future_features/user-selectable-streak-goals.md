# User-Selectable Streak Goals (Option B)

**Status:** Planned for v2.0
**Priority:** Medium
**Estimated Effort:** 4-6 hours

## Overview

Allow users to set their own streak goals instead of automatically progressing through milestones. Research shows that manually confirming a goal builds stronger commitment and increases retention.

## Problem Statement

With automatic milestones (current MVP implementation), users have no ownership over their goals. Some users may want:
- Smaller, more achievable goals after a streak break
- Larger goals if they're highly motivated
- Custom goals that match their personal circumstances

## Proposed Solution

### Goal Selection UI

Users can choose their streak goal:
- During onboarding (optional)
- In Settings
- After reaching a milestone

### Goal Options

```
┌─────────────────────────────────────────────────────┐
│         🎯 Set Your Streak Goal                     │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  ○  7 days    - "One Week Wonder" 🌱        │   │
│  │               Good for getting started       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  ●  14 days   - "Two Week Champion" 🌿      │   │
│  │               Building momentum (Recommended)│   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  ○  30 days   - "Monthly Master" 🌳         │   │
│  │               A real commitment              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  ○  Custom    - Set your own goal           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│           ┌───────────────────────┐                │
│           │    Confirm Goal       │                │
│           └───────────────────────┘                │
└─────────────────────────────────────────────────────┘
```

### Streak Card with User Goal

```
┌─────────────────────────────────────────────────────┐
│  🎯 YOUR GOAL: 14 Days                     [Edit ✏️]│
│                                                     │
│     🔥  Day 5                                       │
│                                                     │
│  ━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░━━━━━━━━━━━━━━━  │
│  |-------- 36% --------|                            │
│                                                     │
│  9 days to reach your goal                          │
│                                                     │
│  ┌────────────────────────────────────────────┐    │
│  │ 🏆 Best: 100 days                          │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Goal Reached Flow

```
┌─────────────────────────────────────────────────────┐
│         🎉 GOAL REACHED!                            │
│                                                     │
│              🏆                                     │
│           14 DAYS                                   │
│     Two Week Champion!                              │
│                                                     │
│  ─────────────────────────────────────────────     │
│                                                     │
│     Ready for your next challenge?                 │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  🎯  Go for 30 days (Recommended)           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  📝  Set a different goal                   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  ⏸️  Keep current goal (14 days)            │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Data Model Changes

### New Table: `user_streak_goal`

```sql
CREATE TABLE user_streak_goal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  award_id TEXT NOT NULL,           -- e.g., 'limit_keeper'
  goal_value INTEGER NOT NULL,      -- e.g., 14
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### UserProfile Extension (Alternative)

```typescript
interface UserProfile {
  // ... existing fields
  streakGoals?: Record<AwardId, number>;
}
```

## Implementation Steps

### Phase 1: Core Functionality
1. Add `user_streak_goal` table to database schema
2. Create `streakGoalRepository.ts` with CRUD operations
3. Update `AwardState` type to include `userGoal?: number`
4. Update `awardService.ts` to use user goal for progress calculation

### Phase 2: UI Components
1. Create `GoalSelectionModal.tsx` component
2. Add "Edit Goal" button to streak cards
3. Update `AwardsSection.tsx` to show user's custom goal
4. Create `GoalReachedModal.tsx` for goal completion flow

### Phase 3: Integration
1. Add goal selection to onboarding (optional step)
2. Add goal settings to Settings screen
3. Update celebration modal to offer next goal

## Research & References

### Duolingo's Approach
- Users can choose learning intensity (Casual, Regular, Serious, Intense)
- "Manually confirming a goal builds stronger commitment"
- Users who set their own goals are 60% more likely to maintain streaks

### Best Practices
- Offer 3-4 preset options + custom
- Show "Recommended" label on middle option
- Allow goal changes at any time (no penalty)
- After reaching goal, suggest next level but don't force

### Sources
- [Duolingo Blog: Improving the Streak](https://blog.duolingo.com/improving-the-streak/)
- [Yu-kai Chou: Master Streak Design](https://yukaichou.com/gamification-study/master-art-streak-design/)
- [UX Magazine: Psychology of Hot Streak Design](https://uxmag.com/articles/the-psychology-of-hot-streak-game-design)

## Success Metrics

- **Retention after streak break**: Compare users with/without custom goals
- **Goal completion rate**: % of users who reach their self-set goals
- **Goal adjustment frequency**: How often users change their goals
- **User satisfaction**: Survey feedback on goal-setting feature

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Users set goals too easy | Suggest "recommended" goal, show comparison to average |
| Users set goals too hard | Allow easy goal adjustment, no shame messaging |
| Feature complexity | Keep UI simple, default to automatic if user doesn't engage |
| Data migration | Make user goal optional, fall back to automatic milestones |

## Open Questions

1. Should goals apply to all streak types or just `limit_keeper`?
2. Should we gamify goal completion with special badges?
3. How to handle goal changes mid-streak? (Reset progress bar but keep streak count?)
4. Should we show how the user's goal compares to others?

---

*This feature was researched and documented as part of the awards system redesign. See also: [Option A implementation](../../src/ui/components/AwardsSection.tsx) (automatic milestones, shipped in MVP).*
