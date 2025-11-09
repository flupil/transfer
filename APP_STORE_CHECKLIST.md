# App Store Submission Checklist

## What I (Claude) Did For You

- [x] Installed offline queue with retry mechanism
- [x] Fixed TypeScript errors from recent changes
- [x] Verified app starts without crashes
- [x] Secured API keys (environment variables)
- [x] Created .env.example template
- [x] Created Privacy Policy document
- [x] Created Terms of Service document
- [x] Installed and configured Sentry crash reporting

## What YOU Need to Do

### 1. Testing (Use TESTING_GUIDE.md)
- [ ] Test offline queue functionality
- [ ] Test debouncing on dashboard
- [ ] Test water addition from all 3 components
- [ ] Test app on physical device (iOS/Android)
- [ ] Navigate through all tabs (no crashes)

### 2. Sentry Setup
- [ ] Create account at https://sentry.io/signup/
- [ ] Create new React Native project
- [ ] Copy your DSN
- [ ] Edit src/config/sentry.ts - replace YOUR_SENTRY_DSN_HERE
- [ ] Test crash reporting works

### 3. Host Legal Documents
- [ ] Upload PRIVACY_POLICY.md to your website
- [ ] Upload TERMS_OF_SERVICE.md to your website
- [ ] Get URLs for both (required by App Store)
- [ ] Suggested: https://fitandpower.com/privacy
- [ ] Suggested: https://fitandpower.com/terms

### 4. Screenshots (Use SCREENSHOT_GUIDE.md)
- [ ] Dashboard with data filled in
- [ ] Nutrition tracking with meals
- [ ] Workout screen
- [ ] Progress/analytics charts
- [ ] Food search or barcode scanner
- [ ] Minimum 5 screenshots, maximum 10

### 5. EAS Build Setup
- [ ] Run: npx eas build:configure
- [ ] Add secrets: npx eas secret:create
- [ ] Add all environment variables from .env
- [ ] Build iOS: npx eas build --platform ios
- [ ] Test production build

### 6. Apple App Store
- [ ] Enroll in Apple Developer Program ($99/year)
- [ ] Create app in App Store Connect
- [ ] Submit build: npx eas submit --platform ios
- [ ] Fill app info (name, description, category)
- [ ] Upload screenshots
- [ ] Add Privacy Policy URL
- [ ] Add Terms URL
- [ ] Submit for review

### 7. Post-Launch
- [ ] Monitor Sentry for crashes
- [ ] Respond to reviews
- [ ] Plan updates

## App Review Time
- Apple: 1-3 days
- Google: Few hours to 7 days

## Useful Commands

# Start dev server
npx expo start

# Build for production
npx eas build --platform ios
npx eas build --platform android

# Submit to stores
npx eas submit --platform ios
npx eas submit --platform android

# Add environment secrets to EAS
npx eas secret:create --name FIREBASE_API_KEY --value "your_value"

## Need Help?
- EAS Build: https://docs.expo.dev/build/introduction/
- App Store: https://developer.apple.com/app-store-connect/
- Google Play: https://support.google.com/googleplay/android-developer/
