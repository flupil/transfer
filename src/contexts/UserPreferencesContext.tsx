import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface UserPreferences {
  appInterest: 'workouts' | 'nutrition' | 'both';
}

interface UserPreferencesContextType {
  preferences: UserPreferences | null;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<void>;
  loadPreferences: () => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      console.log('Loading user preferences for user:', user.id);

      // Try to load from Firebase first
      const userDoc = await getDoc(doc(db, 'users', user.id));
      let appInterest: 'workouts' | 'nutrition' | 'both' = 'both';

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User data from Firebase:', userData);

        // Get appInterest from Firebase (stored during onboarding)
        if (userData.appInterest) {
          appInterest = userData.appInterest;
          console.log('Found appInterest in Firebase:', appInterest);

          // TEMPORARY FIX: If it's nutrition-only, change to both
          if (appInterest === 'nutrition') {
            console.log('Overriding nutrition-only to both');
            appInterest = 'both';

            // Update Firebase to persist this change
            try {
              await updateDoc(doc(db, 'users', user.id), { appInterest: 'both' });
              console.log('Updated Firebase with appInterest: both');
            } catch (error) {
              console.error('Failed to update Firebase:', error);
            }
          }
        }
      } else {
        console.log('No user document found in Firebase, defaulting to both');
      }

      const prefs: UserPreferences = { appInterest };
      setPreferences(prefs);

      // Cache to AsyncStorage for faster future loads
      await AsyncStorage.setItem(`user_preferences_${user.id}`, JSON.stringify(prefs));

      console.log('User preferences loaded:', prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
      // Default preferences on error
      setPreferences({ appInterest: 'both' });
    }
  };

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    if (!user || !preferences) return;

    const updatedPrefs = { ...preferences, ...newPreferences };
    setPreferences(updatedPrefs);

    // Save to AsyncStorage
    await AsyncStorage.setItem(`user_preferences_${user.id}`, JSON.stringify(updatedPrefs));

    // Save to Firebase (you might want to add this to firebaseDailyDataService)
    // await firebaseDailyDataService.updateUserProfile(user.id, { appInterest: updatedPrefs.appInterest });
  };

  return (
    <UserPreferencesContext.Provider value={{ preferences, updatePreferences, loadPreferences }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};