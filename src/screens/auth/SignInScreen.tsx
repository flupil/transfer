import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Divider,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useForm, Controller } from 'react-hook-form';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SignInFormData {
  email: string;
  password: string;
}

const SignInScreen = ({ navigation }: any) => {
  const { signIn, signInWithGoogle, signInWithApple, isLoading, authenticateWithBiometrics } = useAuth();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const biometricEnabled = await AsyncStorage.getItem('biometricEnabled');

      setBiometricAvailable(hasHardware && isEnrolled && biometricEnabled === 'true');
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setBiometricAvailable(false);
    }
  };

  const handleBiometricSignIn = async () => {
    try {
      const result = await authenticateWithBiometrics();
      if (result) {
        // Biometric auth successful - user will be auto-signed in by AuthContext
        // The AuthContext already handles the sign-in after successful biometric
      }
    } catch (error: any) {
      Alert.alert('Authentication Failed', 'Biometric authentication failed. Please try again.');
    }
  };

  const onSubmit = async (data: SignInFormData) => {
    try {
      await signIn(data.email, data.password);
    } catch (error: any) {
      Alert.alert(t('auth.signInFailed'), error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      Alert.alert(
        t('auth.demoMode'),
        t('auth.googleDemoMessage'),
        [{ text: t('button.continue'), onPress: async () => {
          try {
            await signInWithGoogle();
          } catch (error: any) {
            Alert.alert(t('auth.signInFailed'), error.message);
          }
        }}]
      );
    } catch (error: any) {
      Alert.alert(t('auth.googleSignInFailed'), error.message);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      Alert.alert(
        t('auth.appleSignIn'),
        t('auth.appleDemoMessage'),
        [{ text: t('alert.ok') }]
      );
    } catch (error: any) {
      Alert.alert('Apple Sign In Failed', error.message);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <MaterialCommunityIcons name="dumbbell" size={60} color="#4CAF50" />
          <Text variant="headlineLarge" style={styles.title}>
            FitGym
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Track Your Fitness Journey
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            rules={{
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label={t('auth.email')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                autoCapitalize="none"
                keyboardType="email-address"
                left={<TextInput.Icon icon="email" />}
                error={!!errors.email}
              />
            )}
            name="email"
          />
          {errors.email && (
            <HelperText type="error">{errors.email.message}</HelperText>
          )}

          <Controller
            control={control}
            rules={{
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label={t('auth.password')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                secureTextEntry={!showPassword}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                error={!!errors.password}
              />
            )}
            name="password"
          />
          {errors.password && (
            <HelperText type="error">{errors.password.message}</HelperText>
          )}

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotPassword}
          >
            <Text variant="bodyMedium" style={styles.link}>
              {t('auth.forgotPassword')}
            </Text>
          </TouchableOpacity>

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {t('auth.signIn')}
          </Button>

          {biometricAvailable && (
            <TouchableOpacity
              onPress={handleBiometricSignIn}
              style={styles.biometricButton}
            >
              <MaterialCommunityIcons name="fingerprint" size={32} color="#4CAF50" />
              <Text variant="bodyMedium" style={styles.biometricText}>
                Sign in with fingerprint
              </Text>
            </TouchableOpacity>
          )}

          <Divider style={styles.divider} />
          <Text variant="bodyMedium" style={styles.orText}>
            Or continue with
          </Text>

          <View style={styles.socialButtons}>
            <Button
              mode="outlined"
              onPress={handleGoogleSignIn}
              style={styles.socialButton}
              icon={() => (
                <MaterialCommunityIcons name="google" size={20} color="#4285F4" />
              )}
            >
              Google
            </Button>

            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={5}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
            )}
          </View>

          <View style={styles.footer}>
            <Text variant="bodyMedium">{t('auth.dontHaveAccount')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text variant="bodyMedium" style={styles.link}>
                {t('auth.signUp')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    marginTop: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    marginTop: 5,
    color: '#666',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 5,
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 20,
  },
  orText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 15,
  },
  socialButtons: {
    gap: 10,
  },
  socialButton: {
    borderColor: '#E0E0E0',
  },
  appleButton: {
    width: '100%',
    height: 44,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  link: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  biometricButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginTop: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  biometricText: {
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 5,
  },
});

export default SignInScreen;