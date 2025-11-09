# Testing Guide - What YOU Need to Do

## Before You Start
1. Make sure the app is running: npx expo start
2. Open the app on your physical device or simulator
3. Sign in or create a test account

## Test 1: Offline Queue Functionality (5 minutes)

**Purpose:** Verify food/water entries are saved when offline and synced when back online

Steps:
1. Enable airplane mode on your device
2. Try to add a food item (go to Nutrition tab > Add Food)
3. You should see: Queued for Sync alert
4. Try to add water (tap the water + button on dashboard)
5. You should see: Queued for Sync alert
6. Disable airplane mode (reconnect to WiFi/data)
7. Wait 5-10 seconds
8. Check if the food and water appear in your diary

**Expected Result:** Food and water should automatically sync and appear after reconnecting

## Test 2: Debouncing (Dashboard Refresh) (2 minutes)

**Purpose:** Ensure rapid water additions do not cause multiple Firebase calls

Steps:
1. Go to the Dashboard (Home tab)
2. Quickly tap the water + button 5 times in a row (as fast as possible)
3. Watch the water count increase
4. Open Chrome DevTools or Firebase Console to check network activity

**Expected Result:** Water increases smoothly, no lag or freezing, only 1 dashboard reload after 400ms

## Test 3: Water Addition from All Components (3 minutes)

**Purpose:** Verify water tracking works from all 3 entry points using NutritionContext

Steps:
1. Reset water to 0ml (if possible, or note current water intake)
2. Test Entry Point 1 - Dashboard:
   - Go to Home tab (Dashboard)
   - Tap the water + button (should add 250ml)
   - Verify water count increased by 250ml
3. Test Entry Point 2 - WaterTracker Component:
   - Scroll down to see the full water tracker card
   - Tap Glass (250ml) quick add button
   - Verify water increased by another 250ml (total 500ml)
4. Test Entry Point 3 - SimpleHealthTracking:
   - Find the simple health tracking section
   - Add water from this component
   - Verify water increased by 250ml (total 750ml)
5. Navigate to Nutrition tab and back to Dashboard
6. Verify water count persists at 750ml

**Expected Result:** All 3 entry points successfully add water and update the same shared state

## Test 4: General App Stability (5 minutes)

**Purpose:** Make sure recent changes did not introduce crashes

Steps:
1. Navigate through all tabs: Home, Nutrition, Workout, Progress, Settings
2. Add a food item from the Nutrition tab
3. Start a workout from the Workout tab
4. Check progress charts in the Progress tab
5. Toggle dark mode in Settings
6. Change language in Settings (if available)

**Expected Result:** No crashes, no freezes, smooth navigation

## Reporting Issues

If you find bugs:
1. Note the exact steps to reproduce
2. Check the console for error messages: npx expo start then press R to reload
3. Take a screenshot if possible
4. Let me know and I will fix it\!
