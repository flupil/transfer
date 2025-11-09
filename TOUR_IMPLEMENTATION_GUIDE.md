# App Tour Implementation Guide

## Overview
A comprehensive guided tour system has been implemented for your React Native fitness app using **rn-tourguide**. The tour system is designed to be user-friendly for non-tech-savvy users and provides a professional, customizable experience.

## What Was Implemented

### 1. Library Installation
- **Package**: `rn-tourguide` (13 packages installed)
- **Why this library**:
  - Specifically designed for sequential multi-step walkthroughs
  - Supports multiple tours with different keys
  - Customizable tooltip components and styling
  - SVG morphing animations
  - Hook-based control with `useTourGuideController`
  - Better maintained than alternatives like react-native-copilot

### 2. Core System Files

#### A. TourContext (`src/contexts/TourContext.tsx`)
**Purpose**: Manages tour state and completion tracking using AsyncStorage

**Features**:
- `isFirstVisit(screen)` - Check if user has seen a tour
- `markTourComplete(screen)` - Mark a tour as completed
- `resetAllTours()` - Reset all tours (for Settings option)
- `resetTour(screen)` - Reset a specific tour
- `getTourStatus(screen)` - Get completion status

**Supported Screens**:
- `TestingScreen` (Main Workout) - IMPLEMENTED
- `WorkoutPlanSelection` - Ready to implement
- `NutritionScreen` - Ready to implement
- `ProgressScreen` - Ready to implement
- `ProfileScreen` - Ready to implement

#### B. Translation Keys (`src/contexts/LanguageContext.tsx`)
Added comprehensive translations for both English and Hebrew:

**General Tour Controls**:
- `tour.skip` - "Skip Tour" / "דלג על הסיור"
- `tour.next` - "Next" / "הבא"
- `tour.previous` - "Back" / "חזור"
- `tour.finish` - "Got it!" / "הבנתי!"

**TestingScreen Tour** (5 steps):
1. `tour.workout.step1` - Change workout plan
2. `tour.workout.step2` - Navigate weeks
3. `tour.workout.step3` - Start workout
4. `tour.workout.step4` - Quick actions
5. `tour.workout.step5` - Weekly challenge

**Additional Screens** (Ready to use):
- Workout Plan Selection (3 steps)
- Nutrition Screen (3 steps)
- Progress Screen (2 steps)

**Settings**:
- `settings.showTour` - "Show App Tour"
- `settings.showTourDesc` - "Watch the guided tour again"
- `settings.tourReset` - "Tour Reset"
- `settings.tourResetSuccess` - Success message

### 3. App Integration

#### A. App.js
- Added `TourProvider` to the provider hierarchy
- Wraps entire app to make tour functionality available everywhere

#### B. TestingScreen.tsx (Main Workout Screen)
**Fully Implemented Tour with 5 Steps**:

**Step 1 - Change Plan Button**:
```tsx
<TourGuideZone zone={1} text={t('tour.workout.step1')} borderRadius={12}>
  <TouchableOpacity onPress={() => navigate('WorkoutPlanSelection')}>
    {/* Plan selection UI */}
  </TouchableOpacity>
</TourGuideZone>
```

**Step 2 - Week Navigation**:
```tsx
<TourGuideZone zone={2} text={t('tour.workout.step2')} borderRadius={12}>
  <View style={styles.weekLabel}>
    {/* Week selector UI */}
  </View>
</TourGuideZone>
```

**Step 3 - Workout Honeycomb**:
```tsx
<TourGuideZone zone={3} text={t('tour.workout.step3')} shape="circle">
  {renderHoneycomb()}
</TourGuideZone>
```

**Step 4 - Quick Actions**:
```tsx
<TourGuideZone zone={4} text={t('tour.workout.step4')} borderRadius={16}>
  <View style={styles.quickActionsSection}>
    {/* Log, Records, Library, Edit buttons */}
  </View>
</TourGuideZone>
```

**Step 5 - Weekly Challenge**:
```tsx
<TourGuideZone zone={5} text={t('tour.workout.step5')} borderRadius={16}>
  <View style={styles.challengeSection}>
    {/* Challenge UI */}
  </View>
</TourGuideZone>
```

**Tour Initialization Logic**:
```tsx
useEffect(() => {
  const initTour = async () => {
    const isFirst = await isFirstVisit('TestingScreen');
    if (isFirst && canStart) {
      setTimeout(() => start(), 800); // Delay for UI rendering
    }
  };

  initTour();

  // Mark complete when user finishes/skips
  const handleStop = () => markTourComplete('TestingScreen');
  eventEmitter?.on('stop', handleStop);

  return () => eventEmitter?.off('stop', handleStop);
}, [canStart]);
```

**Custom Tooltip Styling**:
- Matches app theme (dark/light mode)
- Uses app's color scheme (primaryAction, cardBackground, etc.)
- Beautiful rounded corners and shadows
- Large, readable text for non-tech users
- Clear button hierarchy (Skip, Previous, Next/Finish)

#### C. SettingsScreen.tsx
**Added "Show App Tour" Option**:
- Located in "Help & Support" section
- Icon: map-marker-path (blue color)
- Resets all tour completion flags
- Shows success alert when reset
- User can revisit any screen to see tour again

### 4. Styling & UX

**Professional Design**:
- Dark overlay (80% opacity) to focus attention
- Spotlight effect on highlighted elements
- Custom tooltip with:
  - 16px padding
  - Rounded corners (16px)
  - App theme colors
  - Shadow effects for depth
  - Readable 16px font size

**Navigation**:
- Sequential step progression
- "Previous" button (except on first step)
- "Next" button (changes to "Finish" on last step)
- "Skip Tour" option always visible

**Animations**:
- Smooth transitions between steps
- SVG morphing for spotlight shapes
- 800ms delay before tour starts (ensures UI is rendered)

## How to Test

### Testing the Main Workout Screen Tour:

1. **First Visit**:
   ```bash
   # Clear AsyncStorage to simulate first visit
   # In your app, navigate to: Settings > Help & Support > Show App Tour
   # Then navigate to the main workout screen
   ```

2. **Expected Behavior**:
   - Tour starts automatically after 800ms
   - Step 1 highlights "Change plan" button
   - Tap "Next" to progress through 5 steps
   - Tap "Skip Tour" to cancel anytime
   - Tour marks as complete after finishing/skipping
   - Won't show again on subsequent visits

3. **Resetting the Tour**:
   - Go to Settings
   - Scroll to "Help & Support"
   - Tap "Show App Tour"
   - See success alert
   - Navigate to TestingScreen to see tour again

### Testing Different Languages:

1. **Switch to Hebrew**:
   - Settings > Language > עברית
   - Restart app
   - Tour will display in Hebrew

2. **Switch to English**:
   - Settings > Language > English
   - Restart app
   - Tour will display in English

## How to Add Tours to Other Screens

### Example: Adding Tour to NutritionScreen

1. **Import Dependencies**:
```tsx
import { useTour } from '../contexts/TourContext';
import { TourGuideProvider, TourGuideZone, useTourGuideController } from 'rn-tourguide';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
```

2. **Create Content Component**:
```tsx
const NutritionScreenContent: React.FC = () => {
  const { isFirstVisit, markTourComplete } = useTour();
  const { start, canStart, eventEmitter } = useTourGuideController();
  const { t } = useLanguage();

  // Initialize tour
  useEffect(() => {
    const initTour = async () => {
      const isFirst = await isFirstVisit('NutritionScreen');
      if (isFirst && canStart) {
        setTimeout(() => start(), 800);
      }
    };

    initTour();

    const handleStop = () => markTourComplete('NutritionScreen');
    eventEmitter?.on('stop', handleStop);

    return () => eventEmitter?.off('stop', handleStop);
  }, [canStart]);

  return (
    <View>
      {/* Step 1 - Meal Logging */}
      <TourGuideZone zone={1} text={t('tour.nutrition.step1')}>
        {/* Meal logging UI */}
      </TourGuideZone>

      {/* Step 2 - Calorie Tracker */}
      <TourGuideZone zone={2} text={t('tour.nutrition.step2')}>
        {/* Calorie tracker UI */}
      </TourGuideZone>

      {/* Step 3 - Meal Plans */}
      <TourGuideZone zone={3} text={t('tour.nutrition.step3')}>
        {/* Meal plans UI */}
      </TourGuideZone>
    </View>
  );
};
```

3. **Wrap with Provider**:
```tsx
const NutritionScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <TourGuideProvider
      androidStatusBarVisible={true}
      backdropColor="rgba(0, 0, 0, 0.8)"
      labels={{
        skip: t('tour.skip'),
        next: t('tour.next'),
        previous: t('tour.previous'),
        finish: t('tour.finish'),
      }}
      tooltipComponent={(props) => (
        {/* Same custom tooltip as TestingScreen */}
      )}
    >
      <NutritionScreenContent />
    </TourGuideProvider>
  );
};
```

## Translation Keys Available

All translation keys are ready to use in both English and Hebrew:

### Workout Plan Selection:
- `tour.planSelection.step1` - "Use these filters to find plans by difficulty level"
- `tour.planSelection.step2` - "Let AI create a personalized workout plan for you"
- `tour.planSelection.step3` - "Tap any plan card to view details and get started"

### Nutrition Screen:
- `tour.nutrition.step1` - "Track your daily meals by logging them here"
- `tour.nutrition.step2` - "Monitor your daily calorie intake and macros"
- `tour.nutrition.step3` - "Browse and select from healthy meal plans"

### Progress Screen:
- `tour.progress.step1` - "Take progress photos to track your transformation"
- `tour.progress.step2` - "View your workout stats and achievements"

## Files Modified/Created

### Created:
1. `src/contexts/TourContext.tsx` - Tour state management

### Modified:
1. `App.js` - Added TourProvider
2. `src/contexts/LanguageContext.tsx` - Added tour translations (English + Hebrew)
3. `src/screens/TestingScreen.tsx` - Implemented full tour with 5 steps
4. `src/screens/SettingsScreen.tsx` - Added tour reset option

### Dependencies:
1. `package.json` - Added rn-tourguide and dependencies

## Remaining Work

### Screens That Need Tours Implemented:
1. **WorkoutPlanSelectionScreen** - 3 steps ready (translations done)
2. **NutritionScreen** - 3 steps ready (translations done)
3. **ProgressScreen** - 2 steps ready (translations done)
4. **ProfileScreen** - Needs translation keys defined

### To Implement:
Simply follow the pattern from TestingScreen.tsx:
1. Import tour dependencies
2. Split screen into Content component
3. Add TourGuideZones around key UI elements
4. Wrap with TourGuideProvider
5. Initialize tour on first visit

## Customization Options

### Change Tour Behavior:
- **Auto-start delay**: Change `setTimeout(() => start(), 800)` to different ms
- **Backdrop opacity**: Change `backdropColor="rgba(0, 0, 0, 0.8)"` alpha value
- **Shape**: Use `shape="circle"` or `shape="rectangle"` on TourGuideZone
- **Border radius**: Add `borderRadius={X}` to TourGuideZone

### Styling the Tooltip:
Edit the `tooltipComponent` prop in TourGuideProvider to customize:
- Background color
- Text size and color
- Button styles
- Shadows and borders
- Layout and spacing

## Best Practices

1. **Always show tour on first visit only** - Don't be intrusive
2. **Keep steps short and clear** - 3-5 steps per screen max
3. **Use simple language** - Remember users are not tech-savvy
4. **Test both languages** - Ensure translations make sense in context
5. **Allow skipping** - Users should never feel trapped
6. **Match app theme** - Tour should feel native to the app
7. **Test on different screen sizes** - Ensure tooltips don't overflow

## Troubleshooting

### Tour Not Starting:
- Check if `isFirstVisit` returns true
- Verify `canStart` is true
- Ensure UI is rendered before calling `start()`
- Check console for errors

### Tour Doesn't Mark as Complete:
- Verify `eventEmitter?.on('stop', handleStop)` is set up
- Check `markTourComplete` is being called
- Verify AsyncStorage permissions

### Translations Not Showing:
- Verify translation keys exist in LanguageContext
- Check current language with `console.log(language)`
- Ensure `t()` function is being used correctly

## Support

For issues or questions about the tour implementation:
1. Check rn-tourguide documentation: https://github.com/xcarpentier/rn-tourguide
2. Review TourContext.tsx for state management
3. Look at TestingScreen.tsx for complete example

---

**Implementation Status**: ✅ Complete for TestingScreen (Main Workout)
**Ready for**: WorkoutPlanSelection, Nutrition, Progress, Profile screens
**Testing**: Full manual testing recommended in both English and Hebrew
