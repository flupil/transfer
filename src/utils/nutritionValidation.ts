/**
 * Nutrition Data Validation Utilities
 *
 * Prevents invalid data entry (negative values, unrealistic amounts)
 * and ensures data integrity across the nutrition tracking system.
 */

import { Alert } from 'react-native';
import { NutritionInfo } from '../types/nutrition.types';

/**
 * Validation limits for nutrition values
 */
export const NUTRITION_LIMITS = {
  // Macronutrients (per day)
  calories: { min: 0, max: 10000, name: 'Calories' },
  protein: { min: 0, max: 500, name: 'Protein' },
  carbs: { min: 0, max: 1000, name: 'Carbs' },
  fat: { min: 0, max: 500, name: 'Fat' },

  // Micronutrients (per day)
  fiber: { min: 0, max: 200, name: 'Fiber' },
  sugar: { min: 0, max: 500, name: 'Sugar' },
  saturatedFat: { min: 0, max: 200, name: 'Saturated Fat' },
  sodium: { min: 0, max: 10000, name: 'Sodium' }, // mg

  // Hydration
  water: { min: 0, max: 20000, name: 'Water' }, // ml

  // Activity
  steps: { min: 0, max: 100000, name: 'Steps' },
  distance: { min: 0, max: 200, name: 'Distance' }, // km

  // Body metrics
  weight: { min: 20, max: 500, name: 'Weight' }, // kg
  height: { min: 50, max: 300, name: 'Height' }, // cm
};

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a single numeric value against limits
 */
export function validateValue(
  value: number,
  fieldName: keyof typeof NUTRITION_LIMITS
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  const limits = NUTRITION_LIMITS[fieldName];

  if (!limits) {
    result.errors.push(`Unknown field: ${fieldName}`);
    result.isValid = false;
    return result;
  }

  // Check if value is a valid number
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    result.errors.push(`${limits.name} must be a valid number`);
    result.isValid = false;
    return result;
  }

  // Check minimum
  if (value < limits.min) {
    result.errors.push(`${limits.name} cannot be less than ${limits.min}`);
    result.isValid = false;
  }

  // Check maximum
  if (value > limits.max) {
    result.errors.push(`${limits.name} cannot exceed ${limits.max}`);
    result.isValid = false;
  }

  // Add warnings for unusually high values (80% of max)
  const warningThreshold = limits.max * 0.8;
  if (value > warningThreshold && value <= limits.max) {
    result.warnings.push(`${limits.name} is unusually high (${value}). Please verify.`);
  }

  return result;
}

/**
 * Validate complete nutrition info object
 */
export function validateNutritionInfo(nutrition: Partial<NutritionInfo> | null | undefined): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // If nutrition is null/undefined, return valid (defensive)
  if (!nutrition) {
    return result;
  }

  // Validate each field that exists
  const fieldsToValidate: Array<keyof NutritionInfo> = [
    'calories',
    'protein',
    'carbs',
    'fat',
    'fiber',
    'sugar',
    'saturatedFat',
    'sodium',
  ];

  try {
    for (const field of fieldsToValidate) {
      if (nutrition[field] !== undefined && nutrition[field] !== null) {
        const fieldResult = validateValue(nutrition[field] as number, field);

        if (!fieldResult.isValid) {
          result.isValid = false;
          result.errors.push(...fieldResult.errors);
        }

        result.warnings.push(...fieldResult.warnings);
      }
    }
  } catch (error) {
    console.error('Error in validateNutritionInfo:', error);
    // Return valid to not block the operation
    return { isValid: true, errors: [], warnings: [] };
  }

  return result;
}

/**
 * Validate water intake
 */
export function validateWaterIntake(amount: number): ValidationResult {
  return validateValue(amount, 'water');
}

/**
 * Validate steps count
 */
export function validateSteps(steps: number): ValidationResult {
  return validateValue(steps, 'steps');
}

/**
 * Validate distance
 */
export function validateDistance(distance: number): ValidationResult {
  return validateValue(distance, 'distance');
}

/**
 * Validate weight
 */
export function validateWeight(weight: number): ValidationResult {
  return validateValue(weight, 'weight');
}

/**
 * Validate height
 */
export function validateHeight(height: number): ValidationResult {
  return validateValue(height, 'height');
}

/**
 * Sanitize nutrition values (clamp to valid range)
 * Use this when you want to auto-correct invalid values instead of rejecting them
 */
export function sanitizeNutritionValue(
  value: number,
  fieldName: keyof typeof NUTRITION_LIMITS
): number {
  const limits = NUTRITION_LIMITS[fieldName];

  if (!limits) {
    console.warn(`Unknown field for sanitization: ${fieldName}`);
    return 0;
  }

  // Handle invalid numbers
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return 0;
  }

  // Clamp to valid range
  return Math.max(limits.min, Math.min(limits.max, value));
}

/**
 * Sanitize entire nutrition info object
 */
export function sanitizeNutritionInfo(nutrition: Partial<NutritionInfo>): NutritionInfo {
  return {
    calories: sanitizeNutritionValue(nutrition.calories ?? 0, 'calories'),
    protein: sanitizeNutritionValue(nutrition.protein ?? 0, 'protein'),
    carbs: sanitizeNutritionValue(nutrition.carbs ?? 0, 'carbs'),
    fat: sanitizeNutritionValue(nutrition.fat ?? 0, 'fat'),
    fiber: sanitizeNutritionValue(nutrition.fiber ?? 0, 'fiber'),
    sugar: sanitizeNutritionValue(nutrition.sugar ?? 0, 'sugar'),
    saturatedFat: sanitizeNutritionValue(nutrition.saturatedFat ?? 0, 'saturatedFat'),
    sodium: sanitizeNutritionValue(nutrition.sodium ?? 0, 'sodium'),
  };
}

/**
 * Show validation errors to user with Alert
 */
export function showValidationErrors(result: ValidationResult, title: string = 'Invalid Input'): void {
  if (!result.isValid && result.errors.length > 0) {
    Alert.alert(title, result.errors.join('\n'));
  }
}

/**
 * Show validation warnings to user with Alert
 */
export function showValidationWarnings(result: ValidationResult, title: string = 'Unusual Values'): void {
  if (result.warnings.length > 0) {
    Alert.alert(title, result.warnings.join('\n'), [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue Anyway', style: 'default' },
    ]);
  }
}

/**
 * Validate and sanitize nutrition data with user feedback
 * Returns sanitized data if valid, or null if user cancels
 */
export async function validateAndSanitizeWithFeedback(
  nutrition: Partial<NutritionInfo>,
  showWarnings: boolean = true
): Promise<NutritionInfo | null> {
  const validationResult = validateNutritionInfo(nutrition);

  // Show errors and reject
  if (!validationResult.isValid) {
    showValidationErrors(validationResult);
    return null;
  }

  // Show warnings if enabled
  if (showWarnings && validationResult.warnings.length > 0) {
    return new Promise((resolve) => {
      Alert.alert(
        'Unusual Values Detected',
        validationResult.warnings.join('\n') + '\n\nDo you want to continue?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
          {
            text: 'Continue',
            style: 'default',
            onPress: () => resolve(sanitizeNutritionInfo(nutrition)),
          },
        ]
      );
    });
  }

  // No errors or warnings - return sanitized data
  return sanitizeNutritionInfo(nutrition);
}
