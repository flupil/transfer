import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { User, UserRole } from '../types';
import firebaseAuth from '../services/firebaseAuth';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  setBiometricAuth: (enabled: boolean) => Promise<void>;
  authenticateWithBiometrics: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Google OAuth is now configured with real credentials!
  const googleConfigured = true; // Set to true - we have valid client IDs

  // Use real Google OAuth config
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '546533248897-id29ab7gpnj83u41r7s41rfaakpdet35.apps.googleusercontent.com',
    iosClientId: '546533248897-id29ab7gpnj83u41r7s41rfaakpdet35.apps.googleusercontent.com',
    androidClientId: '546533248897-id29ab7gpnj83u41r7s41rfaakpdet35.apps.googleusercontent.com',
    webClientId: '546533248897-id29ab7gpnj83u41r7s41rfaakpdet35.apps.googleusercontent.com',
  });

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (userData) => {
      try {
        if (userData) {
          setUser(userData);
          setIsLoading(false);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
        setIsLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleAuth(authentication?.accessToken);
    }
  }, [response]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // Use Firebase auth
      const { user: userData, token } = await firebaseAuth.signIn(email, password);
      await AsyncStorage.setItem('authToken', token);

      // Convert to app User type
      const appUser: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        gymId: userData.gymId || 'gym_1',
        coachId: userData.coachId,
        units: userData.units || { weight: 'kg' as 'kg' | 'lb', height: 'cm' as 'cm' | 'in' },
        notificationPreferences: userData.notificationPreferences || {
          workoutReminders: true,
          mealReminders: true,
          announcements: true,
          progressUpdates: true,
        },
        lastActiveAt: new Date(),
        createdAt: userData.createdAt,
        isActive: true,
      };

      setUser(appUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (!googleConfigured) {
        // Use mock Google sign-in when not configured
        const mockGoogleUser = {
          email: 'google.user@gmail.com',
          password: 'google123',
          name: 'Google User',
        };
        await signIn(mockGoogleUser.email, mockGoogleUser.password);
        return;
      }
      await promptAsync();
    } catch (error) {
      Alert.alert('Error', 'Google sign-in failed. Please try again.');
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const handleGoogleAuth = async (accessToken?: string) => {
    if (!accessToken) return;

    try {
      setIsLoading(true);

      // Get ID token from the response authentication object
      const idToken = response?.authentication?.idToken;
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Use Firebase auth to sign in with Google
      const { user: userData, token } = await firebaseAuth.signInWithGoogle(idToken, accessToken);
      await AsyncStorage.setItem('authToken', token);

      // Convert to app User type
      const appUser: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        gymId: userData.gymId || 'gym_1',
        coachId: userData.coachId,
        units: userData.units || { weight: 'kg' as 'kg' | 'lb', height: 'cm' as 'cm' | 'in' },
        notificationPreferences: userData.notificationPreferences || {
          workoutReminders: true,
          mealReminders: true,
          announcements: true,
          progressUpdates: true,
        },
        lastActiveAt: new Date(),
        createdAt: userData.createdAt,
        isActive: true,
      };

      setUser(appUser);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to authenticate with Google. Please try again.');
      console.error('Google auth error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // TODO: Implement Apple Sign-In with Firebase
      Alert.alert('Info', 'Apple Sign-In is configured but needs backend implementation.');
    } catch (error) {
      Alert.alert('Error', 'Apple sign-in failed. Please try again.');
      console.error('Apple sign-in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole = 'user') => {
    try {
      setIsLoading(true);
      // Use Firebase auth
      const { user: userData, token } = await firebaseAuth.signUp(email, password, name, role);
      await AsyncStorage.setItem('authToken', token);

      // Convert to app User type
      const appUser: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        gymId: userData.gymId || 'gym_1',
        coachId: userData.coachId,
        units: userData.units || { weight: 'kg' as 'kg' | 'lb', height: 'cm' as 'cm' | 'in' },
        notificationPreferences: userData.notificationPreferences || {
          workoutReminders: true,
          mealReminders: true,
          announcements: true,
          progressUpdates: true,
        },
        lastActiveAt: new Date(),
        createdAt: userData.createdAt,
        isActive: true,
      };

      setUser(appUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseAuth.signOut();
      await AsyncStorage.multiRemove(['authToken', 'biometricEnabled']);
      setUser(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      // Update user locally for now
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      // TODO: Sync with Firebase
    } catch (error) {
      Alert.alert('Error', 'Failed to update your profile. Please try again.');
      console.error('Update user error:', error);
      throw error;
    }
  };

  const setBiometricAuth = async (enabled: boolean) => {
    try {
      if (enabled) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          throw new Error('Biometric authentication not available');
        }
      }

      await AsyncStorage.setItem('biometricEnabled', enabled.toString());
    } catch (error) {
      Alert.alert('Error', 'Failed to configure biometric authentication.');
      console.error('Set biometric auth error:', error);
      throw error;
    }
  };

  const authenticateWithBiometrics = async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access FitGym',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
      });

      return result.success;
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication failed. Please try again.');
      console.error('Biometric authentication error:', error);
      return false;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await firebaseAuth.resetPassword(email);
    } catch (error) {
      Alert.alert('Error', 'Failed to send password reset email. Please try again.');
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    signIn,
    signInWithGoogle,
    signInWithApple,
    signUp,
    signOut,
    updateUser,
    setBiometricAuth,
    authenticateWithBiometrics,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};