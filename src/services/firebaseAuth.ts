import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { COLLECTIONS } from '../config/firebaseConstants';
import { User } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Firebase Authentication Service
 * Handles user authentication, registration, and profile management
 */
class FirebaseAuthService {
  /**
   * Register a new user account
   * Creates Firebase auth user, Firestore profile, and stores credentials locally
   * @param email - User's email address
   * @param password - User's password
   * @param name - User's display name
   * @param role - User role (default: 'user')
   * @returns Promise with user object and authentication token
   * @throws Error if signup fails
   */
  async signUp(
    email: string,
    password: string,
    name: string,
    role: string = 'user'
  ): Promise<{ user: User; token: string }> {
    try {
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update display name
      await updateProfile(firebaseUser, {
        displayName: name
      });

      // Create user document in Firestore
      const userData: Omit<User, 'id'> = {
        email,
        name,
        role: role as 'user' | 'coach' | 'admin',
        gymId: 'gym_1', // Default gym
        units: { weight: 'kg', height: 'cm' },
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

      await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        lastActiveAt: serverTimestamp()
      });

      const token = await firebaseUser.getIdToken();

      const user: User = {
        id: firebaseUser.uid,
        ...userData
      };

      // Store auth info locally
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userId', firebaseUser.uid);

      return { user, token };
    } catch (error: any) {
      console.error('Firebase signup error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  }

  /**
   * Sign in an existing user
   * Authenticates user, fetches Firestore profile, and stores credentials locally
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise with user object and authentication token
   * @throws Error if signin fails or user profile not found
   */
  async signIn(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));

      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data() as Omit<User, 'id'>;
      const token = await firebaseUser.getIdToken();

      const user: User = {
        id: firebaseUser.uid,
        ...userData
      };

      // Update last active
      await updateDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
        lastActiveAt: serverTimestamp()
      });

      // Store auth info locally
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userId', firebaseUser.uid);

      return { user, token };
    } catch (error: any) {
      console.error('Firebase signin error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  }

  /**
   * Sign out the current user
   * Clears Firebase authentication and removes local credentials
   * @throws Error if signout fails
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      await AsyncStorage.multiRemove(['authToken', 'userId', 'userData']);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param email - User's email address
   * @throws Error if email sending fails
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Failed to send reset email');
    }
  }

  /**
   * Get the current authenticated user's profile
   * @returns Promise with user object or null if not authenticated
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        return null;
      }

      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));

      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data() as Omit<User, 'id'>;

      return {
        id: firebaseUser.uid,
        ...userData
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Update user profile information
   * Updates both Firestore document and Firebase auth display name
   * @param userId - User's unique identifier
   * @param updates - Partial user object with fields to update
   * @throws Error if update fails
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
        ...updates,
        lastActiveAt: serverTimestamp()
      });

      // Update display name if name changed
      if (updates.name && auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: updates.name
        });
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to authentication state changes
   * Calls callback with user object when authenticated, null when signed out
   * @param callback - Function to call when auth state changes
   * @returns Unsubscribe function to stop listening to auth changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  }
}

export default new FirebaseAuthService();