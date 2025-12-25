/**
 * Brand Colors - Dynamic based on Gym Branding
 * Colors are loaded from GymBrandingContext
 */

import { GYM_BRANDING } from './gymBranding';

export const BRAND_COLORS = {
  // PRIMARY COLORS - Background/text NEVER change, only accent changes per gym
  background: '#2A2A2A',      // ALWAYS dark gray
  text: '#F4F1EF',            // ALWAYS cream
  accent: GYM_BRANDING.colors.primary || '#E94E1B',
  secondary: GYM_BRANDING.colors.secondary || '#192892',  // Secondary color from gym branding
  secondaryMuted: `${GYM_BRANDING.colors.secondary || '#192892'}80`,  // Muted secondary (50% opacity)
  info: '#3B82F6',            // Blue - for progress charts/data visualization

  // Derived Colors (variations of gym colors)
  backgroundLight: '#4E4E50', // Lighter background for cards
  backgroundDark: '#2A2A2A',  // ALWAYS dark gray
  textSecondary: '#C5C2BF',   // ALWAYS light gray
  textDisabled: '#8B8886',    // Disabled text

  // Accent variations - Based on gym primary color
  accentLight: GYM_BRANDING.colors.accent || '#FF6B35',
  accentDark: '#D43E11',      // Darker version (TODO: calculate from primary)
  accentSubtle: `${GYM_BRANDING.colors.primary || '#E94E1B'}20`,  // 12% opacity

  // ALL functional colors map to gym's primary color
  success: GYM_BRANDING.colors.primary || '#E94E1B',
  warning: GYM_BRANDING.colors.primary || '#E94E1B',
  error: GYM_BRANDING.colors.primary || '#E94E1B',
  secondaryAction: GYM_BRANDING.colors.primary || '#E94E1B',

  // Borders and dividers
  border: '#5A5A5A',
  divider: '#4A4A4A',

  // Overlays
  overlay: '#2A2A2AAA',
  modalBackground: '#1A1A1A',
} as const;

export type BrandColor = keyof typeof BRAND_COLORS;

// Semantic color mappings for easier use
export const SEMANTIC_COLORS = {
  primary: BRAND_COLORS.accent,
  primaryText: BRAND_COLORS.text,
  secondaryText: BRAND_COLORS.textSecondary,
  surface: BRAND_COLORS.backgroundLight,
  background: BRAND_COLORS.background,
} as const;
