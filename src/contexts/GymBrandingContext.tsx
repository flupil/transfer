import React, { createContext, useContext, ReactNode } from 'react';
import { GYM_BRANDING, GYM_CONTACT, GYM_ID, GYM_SLUG, GYM_FEATURES, getGymColor, isFeatureEnabled } from '../constants/gymBranding';

interface GymBrandingColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  textSecondary: string;
}

interface GymBranding {
  gymName: string;
  appName: string;
  appSlug: string;
  tagline: string;
  logo: string;
  icon: string;
  splash: string;
  colors: GymBrandingColors;
}

interface GymContact {
  email: string;
  phone: string;
  website: string;
  address: string;
  social: {
    instagram: string;
    facebook: string;
    twitter: string;
  };
}

interface GymFeatures {
  messaging: boolean;
  calendar: boolean;
  barcode: boolean;
  aiCoach: boolean;
  socialStreaks: boolean;
  wearables: boolean;
  mealPlanning: boolean;
}

interface GymBrandingContextType {
  branding: GymBranding;
  contact: GymContact;
  gymId: string;
  gymSlug: string;
  features: GymFeatures;
  getColor: (colorKey: keyof GymBrandingColors) => string;
  isFeatureEnabled: (feature: keyof GymFeatures) => boolean;
}

const GymBrandingContext = createContext<GymBrandingContextType | undefined>(undefined);

interface GymBrandingProviderProps {
  children: ReactNode;
}

export const GymBrandingProvider: React.FC<GymBrandingProviderProps> = ({ children }) => {
  const value: GymBrandingContextType = {
    branding: GYM_BRANDING,
    contact: GYM_CONTACT,
    gymId: GYM_ID,
    gymSlug: GYM_SLUG,
    features: GYM_FEATURES,
    getColor: getGymColor,
    isFeatureEnabled,
  };

  return (
    <GymBrandingContext.Provider value={value}>
      {children}
    </GymBrandingContext.Provider>
  );
};

export const useGymBranding = (): GymBrandingContextType => {
  const context = useContext(GymBrandingContext);
  if (context === undefined) {
    throw new Error('useGymBranding must be used within a GymBrandingProvider');
  }
  return context;
};

// Export types for use in components
export type { GymBranding, GymContact, GymFeatures, GymBrandingColors };
