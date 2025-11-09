import { User } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

class AuthService {
  async signIn(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );

      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password: hashedPassword }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      Alert.alert(translate('alert.notice'), translate('auth.offlineMode'));
      console.error('Sign in error:', error);
      return this.mockSignIn(email, password);
    }
  }

  async signUp(
    email: string,
    password: string,
    name: string,
    role: string
  ): Promise<{ user: User; token: string }> {
    try {
      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );

      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password: hashedPassword, name, role }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      Alert.alert(translate('alert.notice'), translate('auth.offlineModeRegistration'));
      console.error('Sign up error:', error);
      return this.mockSignUp(email, password, name, role);
    }
  }

  async signInWithGoogle(accessToken: string): Promise<{ user: User; token: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
      });

      if (!response.ok) {
        throw new Error('Google authentication failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      Alert.alert(translate('alert.notice'), translate('auth.offlineModeGoogle'));
      console.error('Google auth error:', error);
      return this.mockGoogleSignIn();
    }
  }

  async signInWithApple(credential: any): Promise<{ user: User; token: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/apple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credential),
      });

      if (!response.ok) {
        throw new Error('Apple authentication failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      Alert.alert(translate('alert.notice'), translate('auth.offlineModeApple'));
      console.error('Apple auth error:', error);
      return this.mockAppleSignIn();
    }
  }

  async signOut(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
  }

  async verifyToken(token: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Invalid token');
      }

      const user = await response.json();
      return user;
    } catch (error) {
      Alert.alert(translate('alert.notice'), translate('auth.tokenVerificationFailed'));
      console.error('Token verification error:', error);
      return this.mockVerifyToken();
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Update failed');
      }

      const user = await response.json();
      return user;
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('auth.updateProfileFailed'));
      console.error('Update user error:', error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Reset password failed');
      }
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('auth.resetPasswordFailed'));
      console.error('Reset password error:', error);
    }
  }

  private mockSignIn(email: string, password: string): { user: User; token: string } {
    const mockUser: User = {
      id: '1',
      role: email.includes('admin') ? 'admin' : email.includes('coach') ? 'coach' : 'user',
      gymId: 'gym_1',
      coachId: 'coach_1',
      name: email.split('@')[0],
      email,
      units: {
        weight: 'kg',
        height: 'cm',
      },
      notificationPreferences: {
        workoutReminders: true,
        mealReminders: true,
        announcements: true,
        progressUpdates: true,
      },
      lastActiveAt: new Date(),
      createdAt: new Date(),
      isActive: true,
    };

    return {
      user: mockUser,
      token: 'mock_token_' + Date.now(),
    };
  }

  private mockSignUp(email: string, password: string, name: string, role: string): { user: User; token: string } {
    const mockUser: User = {
      id: String(Date.now()),
      role: role as any,
      gymId: 'gym_1',
      name,
      email,
      units: {
        weight: 'kg',
        height: 'cm',
      },
      notificationPreferences: {
        workoutReminders: true,
        mealReminders: true,
        announcements: true,
        progressUpdates: true,
      },
      lastActiveAt: new Date(),
      createdAt: new Date(),
      isActive: true,
    };

    return {
      user: mockUser,
      token: 'mock_token_' + Date.now(),
    };
  }

  private mockGoogleSignIn(): { user: User; token: string } {
    const mockUser: User = {
      id: String(Date.now()),
      role: 'user',
      gymId: 'gym_1',
      name: 'Google User',
      email: 'user@google.com',
      units: {
        weight: 'kg',
        height: 'cm',
      },
      notificationPreferences: {
        workoutReminders: true,
        mealReminders: true,
        announcements: true,
        progressUpdates: true,
      },
      lastActiveAt: new Date(),
      createdAt: new Date(),
      isActive: true,
    };

    return {
      user: mockUser,
      token: 'mock_google_token_' + Date.now(),
    };
  }

  private mockAppleSignIn(): { user: User; token: string } {
    const mockUser: User = {
      id: String(Date.now()),
      role: 'user',
      gymId: 'gym_1',
      name: 'Apple User',
      email: 'user@apple.com',
      units: {
        weight: 'kg',
        height: 'cm',
      },
      notificationPreferences: {
        workoutReminders: true,
        mealReminders: true,
        announcements: true,
        progressUpdates: true,
      },
      lastActiveAt: new Date(),
      createdAt: new Date(),
      isActive: true,
    };

    return {
      user: mockUser,
      token: 'mock_apple_token_' + Date.now(),
    };
  }

  private mockVerifyToken(): User {
    return {
      id: '1',
      role: 'user',
      gymId: 'gym_1',
      name: 'Test User',
      email: 'user@test.com',
      units: {
        weight: 'kg',
        height: 'cm',
      },
      notificationPreferences: {
        workoutReminders: true,
        mealReminders: true,
        announcements: true,
        progressUpdates: true,
      },
      lastActiveAt: new Date(),
      createdAt: new Date(),
      isActive: true,
    };
  }
}

export const authService = new AuthService();