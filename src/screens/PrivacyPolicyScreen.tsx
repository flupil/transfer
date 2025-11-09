import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

const PrivacyPolicyScreen = () => {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Privacy Policy</Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>Last Updated: October 11, 2025</Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Introduction</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          Fit&Power ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Information We Collect</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>Personal Information</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          • Account Information: Email address, name, profile photo{'\n'}
          • Fitness Data: Weight, height, age, gender, activity level{'\n'}
          • Nutrition Data: Food intake, calorie consumption, macros{'\n'}
          • Workout Data: Exercise routines, workout history{'\n'}
          • Health Metrics: Steps, water intake, sleep data
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>How We Use Your Information</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          We use the collected information to:{'\n\n'}
          • Provide and maintain our fitness tracking services{'\n'}
          • Calculate personalized calorie and nutrition targets{'\n'}
          • Generate workout plans based on your goals{'\n'}
          • Track your progress and provide insights{'\n'}
          • Improve app functionality and user experience{'\n'}
          • Send notifications (if you opt-in)
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Storage and Security</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          • Local Storage: Most data is stored locally on your device{'\n'}
          • Cloud Backup: We use Firebase to backup and sync data{'\n'}
          • Security: Industry-standard security measures{'\n'}
          • Encryption: Data transmission is encrypted using HTTPS/TLS
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Sharing</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          We DO NOT sell your personal information. We may share data only:{'\n\n'}
          • With your explicit consent{'\n'}
          • With service providers (Firebase, Google Analytics){'\n'}
          • If required by law or to protect our rights
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Rights</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          You have the right to:{'\n\n'}
          • Access: Request a copy of your data{'\n'}
          • Correction: Update or correct your information{'\n'}
          • Deletion: Request deletion of your account and data{'\n'}
          • Opt-Out: Disable notifications or AI features{'\n'}
          • Export: Download your fitness and nutrition data
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Assistant Disclaimer</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          Our AI assistant is for informational purposes only. It should not replace professional medical, nutritional, or fitness advice. Always consult healthcare professionals before starting new diet or exercise programs.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Us</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          If you have questions about this Privacy Policy:{'\n\n'}
          Email: support@fitandpower.com{'\n'}
          Website: www.fitandpower.com
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Consent</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          By using Fit&Power, you consent to this Privacy Policy and agree to its terms.
        </Text>

        <Text style={[styles.footer, { color: colors.textSecondary }]}>
          © 2025 Fit&Power. All rights reserved.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
  footer: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
});

export default PrivacyPolicyScreen;
