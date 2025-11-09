import { StyleSheet } from 'react-native';

export const COLORS = {
  primary: '#FF6B35',       // Your app's orange
  secondary: '#FF8A65',      // Lighter orange
  accent: '#FFB74D',         // Golden accent

  // Background gradients
  darkBg: '#0F0F14',
  darkBg2: '#1A1A20',
  lightBg: '#FFFFFF',
  lightBg2: '#F8F9FA',

  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B8',
  textDark: '#2C2C35',

  // UI elements
  cardDark: '#1E1E26',
  cardLight: '#FFFFFF',
  borderDark: '#2A2A35',
  borderLight: '#E0E0E0',

  success: '#FF6B35',
  error: '#FF5252',
  warning: '#FFC107',
  info: '#7E57C2',          // Purple for info
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
  },

  gradientContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    zIndex: 10,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  progressContainer: {
    flex: 1,
  },

  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  progressSteps: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  progressPercent: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
  },

  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  iconHeader: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
    lineHeight: 38,
  },

  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
    lineHeight: 24,
  },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    paddingTop: 20,
  },

  button: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,

    // Shadow for iOS
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,

    // Shadow for Android
    elevation: 8,
  },

  buttonDisabled: {
    backgroundColor: '#3A3A42',
    shadowOpacity: 0,
    elevation: 0,
  },

  buttonText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  skipButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },

  skipText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },

  // Option cards
  optionCard: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,

    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
  },

  optionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  optionContent: {
    flex: 1,
  },

  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },

  optionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  checkmark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Input styles
  inputContainer: {
    marginBottom: 32,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  input: {
    flex: 1,
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
  },

  inputFocused: {
    borderBottomColor: COLORS.primary,
  },

  unitToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
  },

  unitButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },

  unitButtonActive: {
    backgroundColor: COLORS.primary,
  },

  unitText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  unitTextActive: {
    color: COLORS.textPrimary,
  },

  // Info boxes
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.15)',
  },

  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});