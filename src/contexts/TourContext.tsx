import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TourScreen =
  | 'Dashboard'
  | 'TestingScreen'
  | 'WorkoutPlanSelection'
  | 'Nutrition'
  | 'ProgressScreen'
  | 'ProfileScreen';

interface TourContextType {
  isFirstVisit: (screen: TourScreen) => Promise<boolean>;
  markTourComplete: (screen: TourScreen) => Promise<void>;
  resetAllTours: () => Promise<void>;
  resetTour: (screen: TourScreen) => Promise<void>;
  getTourStatus: (screen: TourScreen) => Promise<boolean>;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within TourProvider');
  }
  return context;
};

interface TourProviderProps {
  children: ReactNode;
}

const TOUR_STORAGE_PREFIX = '@tour_completed_';

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  /**
   * Check if this is the first visit to a screen
   * @param screen - The screen identifier
   * @returns true if first visit, false if tour already completed
   */
  const isFirstVisit = async (screen: TourScreen): Promise<boolean> => {
    // TOURS DISABLED - Always return false to never show tours
    return false;
    // try {
    //   const completed = await AsyncStorage.getItem(`${TOUR_STORAGE_PREFIX}${screen}`);
    //   return completed === null; // Return true if no record exists (first visit)
    // } catch (error) {
    //   console.error('Error checking tour status:', error);
    //   return false; // Default to not showing tour on error
    // }
  };

  /**
   * Mark a tour as completed for a specific screen
   * @param screen - The screen identifier
   */
  const markTourComplete = async (screen: TourScreen): Promise<void> => {
    try {
      await AsyncStorage.setItem(`${TOUR_STORAGE_PREFIX}${screen}`, 'true');
    } catch (error) {
      console.error('Error marking tour complete:', error);
    }
  };

  /**
   * Reset all tours (show them again)
   */
  const resetAllTours = async (): Promise<void> => {
    try {
      const screens: TourScreen[] = [
        'Dashboard',
        'TestingScreen',
        'WorkoutPlanSelection',
        'Nutrition',
        'ProgressScreen',
        'ProfileScreen'
      ];

      await Promise.all(
        screens.map(screen =>
          AsyncStorage.removeItem(`${TOUR_STORAGE_PREFIX}${screen}`)
        )
      );
      console.log('All tours reset successfully');
    } catch (error) {
      console.error('Error resetting all tours:', error);
      throw error;
    }
  };

  /**
   * Reset a specific tour
   * @param screen - The screen identifier
   */
  const resetTour = async (screen: TourScreen): Promise<void> => {
    try {
      await AsyncStorage.removeItem(`${TOUR_STORAGE_PREFIX}${screen}`);
    } catch (error) {
      console.error('Error resetting tour:', error);
    }
  };

  /**
   * Get tour completion status for a screen
   * @param screen - The screen identifier
   * @returns true if tour completed, false if not
   */
  const getTourStatus = async (screen: TourScreen): Promise<boolean> => {
    try {
      const completed = await AsyncStorage.getItem(`${TOUR_STORAGE_PREFIX}${screen}`);
      return completed === 'true';
    } catch (error) {
      console.error('Error getting tour status:', error);
      return false;
    }
  };

  const value: TourContextType = {
    isFirstVisit,
    markTourComplete,
    resetAllTours,
    resetTour,
    getTourStatus,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};
