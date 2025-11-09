# Production Deployment Guide for Fit&Power

## Pre-Deployment Checklist

### 1. Environment Setup

#### A. Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

#### B. Login to Expo
```bash
npx eas login
```

#### C. Set Environment Secrets
You MUST set these secrets before building:

```bash
cd "C:\Users\jgola\Downloads\fit app\fit app\fit-app"

# Set HuggingFace Token
npx eas secret:create --name HUGGING_FACE_TOKEN --value YOUR_TOKEN_HERE --type string

# Optional: Set other API keys as secrets
npx eas secret:create --name NUTRITIONIX_APP_ID --value YOUR_APP_ID --type string
npx eas secret:create --name NUTRITIONIX_API_KEY --value YOUR_API_KEY --type string
```

**IMPORTANT:** Never commit your .env file to git! The .gitignore is already configured to exclude it.

### 2. Update Contact Information

#### A. Privacy Policy
Edit `PRIVACY_POLICY.md` and replace ALL placeholders:
- `[YOUR_EMAIL@example.com]` - Your actual support email
- `[https://your-actual-website.com]` - Your actual website
- `[https://your-actual-website.com/privacy]` - URL where privacy policy will be hosted
- `[https://your-actual-website.com/support]` - Your support page URL

#### B. Upload Privacy Policy
1. Create a page on your website at `/privacy`
2. Copy the content from `PRIVACY_POLICY.md` (after updating it)
3. Ensure it's publicly accessible

#### C. App Store Listings
Update the store listing URLs in `APP_STORE_READY.md`:
- Support URL
- Privacy Policy URL
- Marketing URL (if applicable)

### 3. Build Configuration

#### Android Production Build
```bash
npx eas build --platform android --profile production
```

This will create an `.aab` (Android App Bundle) file required for Google Play Store.

#### iOS Production Build
```bash
npx eas build --platform ios --profile production
```

This will create an `.ipa` file required for Apple App Store.

**Note:** iOS builds require an Apple Developer account ($99/year)

### 4. Important Features Configured

✅ **Console.log Removal**: Production builds automatically strip all console.log statements via babel-plugin-transform-remove-console

✅ **Environment Variables**: Configured in eas.json with NODE_ENV=production for production builds

✅ **App Bundle**: Android builds use app-bundle format (required by Play Store)

✅ **Security**: No hardcoded API tokens in source code

## Deployment Steps

### Google Play Store

1. **Create Developer Account**
   - Go to https://play.google.com/console
   - Pay one-time $25 registration fee
   - Complete account setup

2. **Create App**
   - Click "Create App"
   - Enter app name: "Fit&Power"
   - Select language and app/game designation

3. **Upload Build**
   - Go to Release > Production
   - Click "Create new release"
   - Upload the `.aab` file from EAS build
   - Fill in release notes

4. **Store Listing**
   - App name: Fit&Power
   - Short description: Track workouts, nutrition, and reach your fitness goals with AI assistance
   - Full description: Use content from APP_STORE_READY.md
   - Upload screenshots (at least 2, recommended 3-8)
   - Upload app icon (512x512 PNG)
   - Select category: Health & Fitness

5. **Content Rating**
   - Complete IARC questionnaire
   - Should result in Everyone/PEGI 3 rating

6. **Pricing & Distribution**
   - Set as Free
   - Select countries
   - Agree to policies

7. **Submit for Review**
   - Review time: 1-3 days typically

### Apple App Store

1. **Prerequisites**
   - Apple Developer account ($99/year)
   - macOS recommended for App Store Connect
   - Install Transporter app for uploading build

2. **Create App in App Store Connect**
   - Go to https://appstoreconnect.apple.com
   - Click "+" to create new app
   - Platform: iOS
   - Name: Fit&Power
   - Bundle ID: com.fitandpower.app (must match app.json)

3. **Upload Build**
   - Download Transporter app
   - Upload the `.ipa` file from EAS build
   - Wait for processing (5-30 minutes)

4. **App Information**
   - Name: Fit&Power
   - Subtitle: Your Complete Fitness Companion
   - Category: Health & Fitness
   - Privacy Policy URL: Your actual URL
   - Support URL: Your actual URL

5. **Pricing**
   - Set as Free
   - Select countries

6. **App Store Description**
   - Use content from APP_STORE_READY.md
   - Add keywords for SEO

7. **Screenshots**
   - Required: At least 3 screenshots for 6.5" display
   - Size: 1284 x 2778 pixels
   - Show key features: Dashboard, Workout, Nutrition, Progress

8. **Submit for Review**
   - Fill in "What to test" section
   - Provide test account if needed
   - Review time: 1-2 days typically

## Post-Submission Checklist

- [ ] Monitor review status in developer consoles
- [ ] Test the published app after approval
- [ ] Set up Firebase Analytics for tracking
- [ ] Monitor crash reports (Expo and Firebase)
- [ ] Respond to user reviews promptly
- [ ] Plan first update based on feedback

## Troubleshooting

### Build Fails
- Check that all environment secrets are set
- Verify app.json configuration is valid
- Check EAS build logs for specific errors

### Review Rejection
- **Google Play**: Usually due to privacy policy issues or permissions not explained
- **Apple**: Common issues include broken features, misleading screenshots, incomplete metadata

### Environment Variables Not Working
- Ensure secrets are created with correct names
- Rebuild after adding secrets
- Check babel.config.js has react-native-dotenv configured

## Support & Resources

- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **Google Play Console**: https://play.google.com/console
- **App Store Connect**: https://appstoreconnect.apple.com
- **Expo Status**: https://status.expo.dev/

## Version Updates

When preparing updates:

1. Update version in `app.json`:
   - iOS: Increment `buildNumber`
   - Android: Increment `versionCode`
   - Both: Update `version` string (e.g., "1.0.0" → "1.0.1")

2. Rebuild and submit new version

3. Include changelog in store listing

## Security Reminders

- ✅ .env file is git-ignored
- ✅ API keys loaded from EAS secrets
- ✅ No sensitive data in source code
- ✅ Firebase security rules configured
- ✅ HTTPS used for all API calls

## Next Steps After Launch

1. **Analytics**: Set up Firebase Analytics or similar
2. **Crash Reporting**: Monitor Expo and Firebase crash reports
3. **User Feedback**: Set up feedback mechanism in app
4. **Marketing**: Announce launch on social media
5. **Updates**: Plan regular updates with new features
6. **Monetization**: Consider premium features (if planned)

---

**You're Ready to Deploy!**

Follow this guide step by step, and you'll have your app published in no time. Good luck with your launch! 🚀
