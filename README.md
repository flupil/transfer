# FitGym - Mobile Fitness Tracking App

A comprehensive fitness tracking mobile application for iOS and Android, designed for gym members to track workouts, nutrition, and progress with coach/admin oversight.

## Features

### Core Features
- **Multi-role Authentication**: Admin, Coach, and User roles with email/password and social sign-in (Google, Apple)
- **Biometric Authentication**: Face ID/Touch ID support for secure access
- **Offline-First Architecture**: All data syncs automatically when online
- **Dashboard**: Real-time view of workout progress, nutrition macros, attendance, and activity data
- **Workout Tracking**:
  - Pre-built and custom workout plans
  - Exercise library with categories and muscle groups
  - Set/rep/weight logging with rest timer
  - Personal Records (PR) tracking
- **Nutrition Tracking**:
  - Global food database with search
  - Meal planning and logging
  - Automatic macro calculation
  - Barcode scanning (future)
- **Progress Analytics**:
  - Weight, body metrics, and macro tracking
  - Visual graphs and charts
  - Monthly summaries
- **Calendar Integration**: Two-way sync with device calendars
- **Wearable Integration**: Apple Health and Google Fit data
- **Push Notifications**: Workout/meal reminders and announcements
- **Admin Console**: User management, analytics, and CSV exports

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Database**: SQLite (offline-first)
- **State Management**: Zustand
- **Navigation**: React Navigation
- **UI Components**: React Native Paper
- **Authentication**: Expo Auth Session
- **Charts**: React Native Chart Kit
- **Notifications**: Expo Notifications

## Installation

1. Clone the repository
2. Install dependencies:
```bash
cd fit-app
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on iOS:
```bash
npm run ios
```

5. Run on Android:
```bash
npm run android
```

## Project Structure

```
fit-app/
├── App.tsx                 # Main app entry point
├── src/
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts (Auth, Theme, Database)
│   ├── database/          # SQLite schema and operations
│   ├── navigation/        # Navigation configuration
│   ├── screens/           # App screens
│   ├── services/          # API and external services
│   ├── store/             # Zustand state stores
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── assets/                # Images and static assets
└── app.json              # Expo configuration
```

## Key Screens

### User Screens
- **Dashboard**: Overview of daily progress
- **Workout**: Plan selection, exercise logging, PR tracking
- **Nutrition**: Food search, meal logging, macro tracking
- **Progress**: Charts and analytics
- **Calendar**: Schedule and event management
- **Profile**: Settings and preferences

### Coach Screens
- **Trainee Management**: View and manage assigned users
- **Plan Builder**: Create workout and meal plans
- **Analytics**: Trainee progress tracking
- **Announcements**: Send notifications to trainees

### Admin Screens
- **User Management**: Add/remove users and coaches
- **Plan Management**: Global exercise and meal libraries
- **Analytics Dashboard**: Gym-wide statistics
- **Export**: CSV data exports
- **Settings**: Gym configuration

## Database Schema

The app uses SQLite with the following main tables:
- users
- exercises
- workout_plans
- workout_logs
- food_items
- meal_plans
- nutrition_logs
- calendar_events
- attendance
- announcements
- progress_metrics
- monthly_summaries
- wearable_data

## Offline Sync

The app implements an offline-first approach:
- All data is stored locally in SQLite
- Changes are queued when offline
- Automatic sync when connection is restored
- Conflict resolution using last-write-wins

## Security

- Role-based access control (RBAC)
- Secure token storage
- Biometric authentication
- Data encryption for sensitive information
- GDPR-compliant data deletion

## Future Enhancements

- NFC check-in at gym entrance
- Barcode scanning for food items
- Smart scale integration
- Video exercise demonstrations
- AI-powered workout recommendations
- Multi-gym support
- In-app payments

## Development

### Running Tests
```bash
npm test
```

### Building for Production

iOS:
```bash
expo build:ios
```

Android:
```bash
expo build:android
```

## License

MIT

## Support

For issues and feature requests, please contact support@fitgym.com