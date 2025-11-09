// import * as Sentry from '@sentry/react-native'; // Disabled for Expo Go

// Initialize Sentry for crash reporting and error tracking
// Get your DSN from: https://sentry.io/settings/projects/

export const initializeSentry = () => {
  // Sentry.init({
  //   dsn: 'YOUR_SENTRY_DSN_HERE',
  //   // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  //   tracesSampleRate: 0.2,
  //   environment: __DEV__ ? 'development' : 'production',
  //   enabled: !__DEV__, // Only enable in production
  // });
  // Disabled for Expo Go - requires native code
  console.log('Sentry disabled for Expo Go');
};
