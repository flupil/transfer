// Authentication Configuration
// TODO: Replace these with your actual OAuth client IDs

export const authConfig = {
  // Google OAuth Configuration
  // Get these from: https://console.cloud.google.com/apis/credentials
  google: {
    expoClientId: '546533248897-id29ab7gpnj83u41r7s41rfaakpdet35.apps.googleusercontent.com',
    iosClientId: '546533248897-id29ab7gpnj83u41r7s41rfaakpdet35.apps.googleusercontent.com', // Using web client for iOS
    androidClientId: '546533248897-id29ab7gpnj83u41r7s41rfaakpdet35.apps.googleusercontent.com', // Using web client for Android
    webClientId: '546533248897-id29ab7gpnj83u41r7s41rfaakpdet35.apps.googleusercontent.com',
  },

  // Apple Sign In Configuration
  // Configured automatically via Expo, but you need to:
  // 1. Enable "Sign in with Apple" capability in your app's provisioning profile
  // 2. Configure in App Store Connect
  apple: {
    // No additional configuration needed for basic Apple Sign In with Expo
  },

  // Firebase Configuration
  // Already configured in firebase.ts
};

// Instructions for setup:
//
// Google Sign-In:
// 1. Go to https://console.cloud.google.com/
// 2. Create a new project or select existing
// 3. Enable Google+ API
// 4. Create OAuth 2.0 Client IDs for:
//    - Web application (for Expo Go)
//    - iOS application (for standalone iOS app)
//    - Android application (for standalone Android app)
// 5. Add authorized redirect URIs for Expo
// 6. Copy the client IDs to this file
//
// Apple Sign-In:
// 1. Requires Apple Developer account
// 2. Enable "Sign in with Apple" capability in Xcode
// 3. Configure in App Store Connect
// 4. Works automatically with Expo managed workflow