# Firebase Setup Guide

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Name it "fit-gym-app" or similar
4. Enable Google Analytics (optional)

## Step 2: Enable Authentication

1. In Firebase Console, go to Authentication
2. Click "Get started"
3. Enable these providers:
   - Email/Password
   - Google
   - Apple (requires Apple Developer account)

## Step 3: Create Firestore Database

1. Go to Firestore Database
2. Click "Create database"
3. Start in test mode (for development)
4. Choose your region

## Step 4: Get Configuration

1. Go to Project Settings (gear icon)
2. Under "Your apps", click Web icon (</>)
3. Register app with nickname "FitGym Web"
4. Copy the configuration object

## Step 5: Update Your Config

Replace the placeholder in `src/config/firebase.ts` with your actual config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## Step 6: Google Sign-In Setup

1. Get your Web Client ID from Firebase Console
2. For Expo, add to `app.json`:
```json
{
  "expo": {
    "plugins": [
      "@react-native-google-signin/google-signin",
      {
        "iosClientId": "YOUR_IOS_CLIENT_ID",
        "androidClientId": "YOUR_ANDROID_CLIENT_ID"
      }
    ]
  }
}
```

## Step 7: Environment Variables

Create a `.env` file:
```
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-auth-domain
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-storage-bucket
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id

# Food APIs
NUTRITIONIX_APP_ID=your-nutritionix-app-id
NUTRITIONIX_API_KEY=your-nutritionix-api-key
USDA_API_KEY=your-usda-api-key
```

## API Keys to Obtain

1. **Nutritionix API**:
   - Sign up at https://developer.nutritionix.com
   - Get App ID and API Key

2. **USDA FoodData Central**:
   - Sign up at https://fdc.nal.usda.gov/api-key-signup.html
   - Get API Key

3. **Open Food Facts** (free, no key needed):
   - API endpoint: https://world.openfoodfacts.org