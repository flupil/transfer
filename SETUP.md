# FitGym App Setup Instructions

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Studio/Emulator (Windows/Mac/Linux)
- Expo Go app on your physical device (optional)

## Installation Steps

1. **Install Dependencies**
```bash
cd fit-app
npm install
```

2. **Start the Development Server**
```bash
npx expo start
```

3. **Run on Platform**
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app for physical device

## Test Credentials

### Admin Account
- Email: admin@fitgym.com
- Password: admin123

### Coach Account
- Email: coach@fitgym.com
- Password: coach123

### User Account
- Email: user@fitgym.com
- Password: user123

## Features Available in MVP

### User Features
✅ Email/Password Authentication
✅ Google/Apple Sign-in (configured)
✅ Dashboard with workout/nutrition overview
✅ Offline-first SQLite database
✅ Role-based navigation (Admin/Coach/User)
✅ Profile management
✅ Theme switching (Light/Dark)
✅ Biometric authentication setup

### Partial Implementation
🔨 Workout tracking (UI ready, logic partially implemented)
🔨 Nutrition tracking (UI ready, basic search implemented)
🔨 Calendar integration (structure ready)
🔨 Progress charts (placeholder)
🔨 Push notifications (configured)
🔨 Admin/Coach features (navigation ready)

## Project Structure
```
fit-app/
├── App.tsx                    # Main app entry
├── src/
│   ├── components/           # Reusable components
│   ├── contexts/            # Auth, Theme, Database contexts
│   ├── database/            # SQLite schema
│   ├── navigation/          # Role-based navigators
│   ├── screens/             # All app screens
│   ├── services/            # API and sync services
│   ├── store/               # Zustand state management
│   └── types/               # TypeScript definitions
└── assets/                  # Images and icons
```

## Development Notes

1. **Offline Sync**: The app uses SQLite for offline storage with a sync queue system
2. **Authentication**: Mock authentication is implemented for testing
3. **Database**: Initial seed data is loaded on first launch
4. **Navigation**: Role-based navigation automatically switches based on user role
5. **State Management**: Uses Zustand for global state

## Common Issues & Solutions

### Build Errors
- Clear cache: `npx expo start --clear`
- Reset Metro: `npx expo start -c`

### Database Issues
- Database is automatically created on first launch
- Seed data includes sample exercises and foods

### Navigation Issues
- Ensure all screens are properly imported in navigators
- Check role-based routing in AppNavigator.tsx

## Next Steps for Production

1. **Backend API**: Connect to real backend API endpoints
2. **Authentication**: Implement real OAuth providers
3. **Wearables**: Complete Apple Health/Google Fit integration
4. **Calendar**: Implement two-way calendar sync
5. **Notifications**: Set up push notification server
6. **NFC**: Add NFC check-in functionality
7. **Barcode**: Complete barcode scanning for foods
8. **Testing**: Add unit and integration tests
9. **Analytics**: Implement analytics tracking
10. **Performance**: Optimize list rendering and image loading

## Support

For development questions, refer to:
- Expo Documentation: https://docs.expo.dev
- React Native: https://reactnative.dev
- React Navigation: https://reactnavigation.org