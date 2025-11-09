# Pre-Launch Testing Checklist

Complete testing guide to verify all features work correctly before App Store submission.

**Test on BOTH:**
- iOS device (iPhone)
- Android device

**Test in BOTH modes:**
- Fresh install (new user)
- Existing user (with data)

---

## Testing Status

| Category | iOS | Android | Priority |
|----------|-----|---------|----------|
| Authentication |  Not Tested |  Not Tested | CRITICAL |
| Dashboard/Home |  Not Tested |  Not Tested | CRITICAL |
| Workouts |  Not Tested |  Not Tested | CRITICAL |
| Nutrition |  Not Tested |  Not Tested | CRITICAL |
| Progress/Stats |  Not Tested |  Not Tested | CRITICAL |
| Profile/Settings |  Not Tested |  Not Tested | HIGH |
| Gamification |  Not Tested |  Not Tested | HIGH |
| Cloud Sync |  Not Tested |  Not Tested | HIGH |
| UI/UX |  Not Tested |  Not Tested | MEDIUM |
| Performance |  Not Tested |  Not Tested | MEDIUM |

**Legend:**
-  Not Tested
-  Passed
- L Failed (needs fix)
-   Minor Issue (fix if time allows)

---

## Part 1: Authentication & Onboarding

### Sign Up (New User)
- [ ] iOS: Can create new account with email/password
- [ ] Android: Can create new account with email/password
- [ ] Validation works (weak passwords rejected)
- [ ] Confirmation email sent (if applicable)
- [ ] Tour/onboarding appears on first launch
- [ ] Can skip tour
- [ ] Tour explains key features clearly

### Sign In (Returning User)
- [ ] iOS: Can log in with existing credentials
- [ ] Android: Can log in with existing credentials
- [ ] "Forgot Password" flow works
- [ ] Invalid credentials show error message
- [ ] Session persists (doesn't require login every time)

### Sign Out
- [ ] iOS: Can sign out successfully
- [ ] Android: Can sign out successfully
- [ ] Returns to login screen after sign out
- [ ] Local data cleared after sign out (or retained appropriately)

---

## Part 2: Dashboard/Home Screen

### Initial Load
- [ ] iOS: Dashboard loads without errors
- [ ] Android: Dashboard loads without errors
- [ ] Streak counter displays correctly
- [ ] XP/level displays correctly
- [ ] Current day's workout shows (if applicable)
- [ ] Navigation bar works (all tabs clickable)

### Streak Display
- [ ] Streak counter updates after completing workout
- [ ] **CRITICAL:** Fire icon turns ORANGE after workout completion
- [ ] Fire icon stays GRAY before workout
- [ ] Streak resets if day missed (or maintains based on your logic)
- [ ] Tapping streak icon navigates to Streak screen

### Header Navigation
- [ ] Logo tap navigates to Settings
- [ ] Dumbbell icon navigates to Workout screen
- [ ] Fire icon navigates to Streak screen
- [ ] Diamond icon navigates to Progress screen
- [ ] Account icon navigates to Profile screen

### Tour System
- [ ] Tour does NOT force-show on every visit
- [ ] Tour only shows on FIRST visit
- [ ] No test buttons visible in production build
- [ ] Tour can be dismissed
- [ ] Tour state persists (doesn't reappear)

---

## Part 3: Workout Features

### Workout List
- [ ] iOS: Workout plan loads correctly
- [ ] Android: Workout plan loads correctly
- [ ] All 7 days of week displayed
- [ ] Exercises show correct details (name, sets, reps)
- [ ] Rest days indicated clearly
- [ ] Can navigate between days

### Starting a Workout
- [ ] Can tap "Start Workout" button
- [ ] Workout timer starts (if applicable)
- [ ] Exercise instructions visible
- [ ] Can track sets/reps/weight
- [ ] Progress saves between sets
- [ ] Can skip exercises

### Completing a Workout
- [ ] Can mark sets as complete
- [ ] Can complete entire workout
- [ ] Completion triggers:
  - [ ] XP gain
  - [ ] Streak update
  - [ ] Achievement unlock (if first time)
- [ ] Completion state persists (marked as done)
- [ ] Cannot re-complete same workout on same day (or allows based on logic)

### Workout History
- [ ] Can view past workouts
- [ ] History shows correct dates
- [ ] Progress graphs display (if implemented)

---

## Part 4: Nutrition Tracking

### Calorie Tracking
- [ ] iOS: Calorie circle displays correctly
- [ ] Android: Calorie circle displays correctly
- [ ] **CRITICAL:** Circle fills as calories increase (NOT entire circle at once)
- [ ] Calorie goal displayed
- [ ] Current intake vs goal shown clearly
- [ ] Percentage calculated correctly

### Adding Meals
- [ ] Can add breakfast items
- [ ] Can add lunch items
- [ ] Can add dinner items
- [ ] Can add snacks
- [ ] Food search works (if API-based)
- [ ] Manual food entry works
- [ ] Calories and macros calculated correctly

### Meal Display
- [ ] Logged meals show in list
- [ ] Meal times displayed
- [ ] Can edit logged meals
- [ ] Can delete logged meals
- [ ] Totals update after edit/delete

### Macronutrient Tracking
- [ ] Protein tracking works
- [ ] Carbs tracking works
- [ ] Fats tracking works
- [ ] Macro breakdown displays correctly
- [ ] Pie chart or visual display works (if implemented)

---

## Part 5: Progress & Stats

### XP System
- [ ] XP displays correctly on dashboard
- [ ] XP increases after workout completion
- [ ] Level-up notification appears
- [ ] Level calculation correct
- [ ] XP bar fills proportionally

### Achievements
- [ ] Achievements list displays
- [ ] Unlocked achievements highlighted
- [ ] Locked achievements grayed out
- [ ] Achievement unlock animation works
- [ ] Achievement descriptions clear

### Progress Charts
- [ ] Weight tracking chart loads
- [ ] Workout history chart loads
- [ ] Calorie intake chart loads
- [ ] Date ranges work (week, month, all time)
- [ ] Data points accurate
- [ ] No crashes when viewing charts

### Streak Screen
- [ ] Calendar view displays
- [ ] Completed days highlighted
- [ ] Current streak shown
- [ ] Longest streak shown
- [ ] Motivational messages display

---

## Part 6: Profile & Settings

### Profile Information
- [ ] iOS: Profile loads correctly
- [ ] Android: Profile loads correctly
- [ ] Can view user stats (workouts completed, total XP, etc.)
- [ ] Can edit display name
- [ ] Can upload profile picture (if implemented)
- [ ] Changes save successfully

### Settings
- [ ] Dark mode toggle works
- [ ] Light mode displays correctly
- [ ] Dark mode displays correctly
- [ ] Theme persists after app restart
- [ ] Language selector works (English/Hebrew)
- [ ] Language changes apply immediately
- [ ] Notification settings work (if implemented)

### Account Management
- [ ] Can change password
- [ ] Can update email
- [ ] Can delete account
- [ ] Account deletion confirmation prompt shows
- [ ] Privacy policy link works
- [ ] Terms of service link works

---

## Part 7: Cloud Sync

### Data Synchronization
- [ ] iOS: Data syncs to Firebase
- [ ] Android: Data syncs to Firebase
- [ ] Workout completion syncs across devices
- [ ] Nutrition data syncs across devices
- [ ] Profile changes sync across devices
- [ ] Settings sync across devices

### Offline Mode
- [ ] App works without internet connection
- [ ] Data saved locally when offline
- [ ] Data syncs when connection restored
- [ ] No crashes when offline
- [ ] Appropriate offline indicator shown (if implemented)

### Conflict Resolution
- [ ] Multiple device edits handled correctly
- [ ] No data loss when syncing
- [ ] Latest changes preserved

---

## Part 8: UI/UX Testing

### Navigation
- [ ] All tabs work correctly
- [ ] Back button works (Android)
- [ ] Swipe gestures work (if implemented)
- [ ] No navigation loops or dead ends
- [ ] Breadcrumbs/navigation clear

### Visual Design
- [ ] Brand colors consistent (#FF6B35, #1CB0F6, #FFB800)
- [ ] Text readable in both themes
- [ ] Icons display correctly
- [ ] Images load properly
- [ ] No UI overlaps or cutoffs
- [ ] Responsive to different screen sizes

### Accessibility
- [ ] Text size adjusts with system settings
- [ ] High contrast mode works (if supported)
- [ ] Screen reader compatible (test with VoiceOver/TalkBack)
- [ ] Touch targets large enough (minimum 44x44 points)

### Animations
- [ ] Page transitions smooth
- [ ] Loading indicators show during API calls
- [ ] Achievement unlock animation smooth
- [ ] Level-up animation smooth
- [ ] No stuttering or lag

---

## Part 9: Edge Cases & Error Handling

### Network Errors
- [ ] Handles no internet connection gracefully
- [ ] Shows error message when API fails
- [ ] Retry mechanism works
- [ ] Doesn't crash on timeout

### Invalid Input
- [ ] Negative numbers rejected (weight, reps, calories)
- [ ] Empty form fields validated
- [ ] Special characters handled
- [ ] Very large numbers handled

### Data Limits
- [ ] Handles large workout history
- [ ] Handles large meal logs
- [ ] Doesn't crash with 100+ entries
- [ ] Pagination works (if implemented)

### App States
- [ ] App restores state after minimize
- [ ] No data loss when app backgrounded
- [ ] Handles phone calls during use
- [ ] Handles notifications during use
- [ ] Handles low memory situations

---

## Part 10: Performance Testing

### Load Times
- [ ] App launches in under 3 seconds
- [ ] Dashboard loads in under 2 seconds
- [ ] Workout screen loads quickly
- [ ] Nutrition screen loads quickly
- [ ] No noticeable lag when navigating

### Memory Usage
- [ ] No memory leaks (check with dev tools)
- [ ] Memory usage stable over time
- [ ] App doesn't crash after extended use
- [ ] Images load efficiently

### Battery Usage
- [ ] No excessive battery drain
- [ ] Background processes minimal
- [ ] Location services not running (if not needed)

---

## Part 11: Localization (English & Hebrew)

### English Translation
- [ ] All screens translated
- [ ] Navigation labels correct
- [ ] Button text clear
- [ ] Error messages translated
- [ ] No placeholder text ("Lorem ipsum")

### Hebrew Translation
- [ ] All screens translated
- [ ] Right-to-left layout works correctly
- [ ] Text alignment proper for RTL
- [ ] Navigation labels correct
- [ ] No mixed LTR/RTL issues
- [ ] Punctuation displays correctly

### Language Switching
- [ ] Can switch between English and Hebrew
- [ ] UI updates immediately
- [ ] No text cutoffs after language change
- [ ] Layout adjusts for text length differences

---

## Part 12: Production-Specific Testing

### No Debug Code Visible
- [ ] No test buttons visible
- [ ] No "FORCE TOUR" buttons
- [ ] No debug console logs in production (use logger utility)
- [ ] No developer menus accessible

### Privacy & Security
- [ ] Password not visible when typing
- [ ] Sensitive data encrypted
- [ ] No data leaks in logs
- [ ] Privacy policy accessible
- [ ] Terms of service accessible

### App Store Compliance
- [ ] No prohibited content
- [ ] Age rating accurate (13+ or 16+ for EU)
- [ ] App name matches submission
- [ ] Bundle ID correct
- [ ] Version number correct

---

## Part 13: Critical Bugs to Check

Based on your app history, verify these specific issues are FIXED:

### Streak Icon Issue
- [ ] **CRITICAL:** Fire icon turns ORANGE (not stays gray) after workout completion
- [ ] Check on Dashboard screen
- [ ] Check on all tabs (Home, Workouts, Nutrition, etc.)
- [ ] Verify after app restart
- [ ] Verify after cloud sync

### Calorie Circle Issue
- [ ] **CRITICAL:** Circle fills proportionally (not entire circle at once)
- [ ] Test with 0 calories
- [ ] Test with 50% of goal
- [ ] Test with 100% of goal
- [ ] Test with over 100% of goal

### Tour System
- [ ] Tour does NOT show on every launch
- [ ] Tour shows only on first launch
- [ ] Tour can be dismissed
- [ ] No forced tour triggers

---

## Testing Process

### Phase 1: Fresh Install Testing (NEW USER)
1. Uninstall app completely
2. Reinstall from build
3. Create new account
4. Complete onboarding
5. Test all features as first-time user
6. **Goal:** Verify first-time user experience is smooth

### Phase 2: Existing User Testing
1. Log in with existing account
2. Verify data synced correctly
3. Test all features with pre-populated data
4. Complete workout and verify updates
5. **Goal:** Verify returning user experience works

### Phase 3: Cross-Device Testing
1. Log in on iOS device
2. Make changes (complete workout, log meal)
3. Log in on Android device
4. Verify changes synced
5. **Goal:** Verify cloud sync works correctly

### Phase 4: Stress Testing
1. Add 100+ meals
2. Complete 30+ workouts
3. Navigate rapidly between screens
4. Background/foreground app repeatedly
5. **Goal:** Verify app stable under heavy use

---

## Bug Reporting Template

When you find a bug, document it like this:

```markdown
**Bug:** [Brief description]
**Severity:** Critical / High / Medium / Low
**Device:** iOS/Android
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected:** [What should happen]
**Actual:** [What actually happens]
**Screenshots:** [Attach if applicable]
```

---

## Final Checklist Before Submission

- [ ] All CRITICAL tests passed on iOS
- [ ] All CRITICAL tests passed on Android
- [ ] No crashes encountered
- [ ] No data loss scenarios
- [ ] Performance acceptable
- [ ] UI looks professional
- [ ] Translations complete and accurate
- [ ] Privacy policy and terms accessible
- [ ] Test accounts work
- [ ] Screenshots captured
- [ ] Feature graphic created
- [ ] App description written

---

## Testing Tools

### iOS
```bash
# Build for iOS device
npx expo run:ios --device

# View console logs
# Xcode: Window ’ Devices and Simulators ’ Open Console
```

### Android
```bash
# Build for Android device
npx expo run:android --device

# View logs
adb logcat | grep "ReactNativeJS"
```

### Performance Monitoring
- Use React DevTools for component rendering
- Use Flipper for network debugging
- Check Firebase Console for cloud sync issues

---

## Summary

**Total Tests:** ~150+ items
**Estimated Time:** 4-6 hours (full testing on both platforms)
**Priority:** Test CRITICAL items first

**Recommendation:**
1. Test all CRITICAL features first (2 hours)
2. Test HIGH priority features (1 hour)
3. Test remaining features (2-3 hours)
4. Fix any bugs found
5. Re-test fixed items

**When Ready:**
Once all CRITICAL and HIGH priority tests pass with no major bugs, you're ready for App Store submission!

**Need Help?**
If you encounter issues during testing, document them using the bug template above and we can fix them before launch.
