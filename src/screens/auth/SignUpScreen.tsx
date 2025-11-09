import React, { useState } from 'react';
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
  RadioButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useForm, Controller } from 'react-hook-form';
import * as AppleAuthentication from 'expo-apple-authentication';

interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'user' | 'coach';
}

const SignUpScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { signUp, signInWithGoogle, signInWithApple, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: SignUpFormData) => {
    try {
      await signUp(data.email, data.password, data.name, data.role);
    } catch (error: any) {
      Alert.alert(t('auth.signUpFailed'), error.message);
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
            Join FitGym
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Start Your Fitness Journey Today
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            rules={{
              required: 'Name is required',
              minLength: {
                value: 2,
                message: 'Name must be at least 2 characters',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label={t('auth.fullName')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                left={<TextInput.Icon icon="account" />}
                error={!!errors.name}
              />
            )}
            name="name"
          />
          {errors.name && (
            <HelperText type="error">{errors.name.message}</HelperText>
          )}

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
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Password must contain uppercase, lowercase, and number',
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

          <Controller
            control={control}
            rules={{
              required: 'Please confirm your password',
              validate: (value) =>
                value === password || 'Passwords do not match',
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label={t('auth.confirmPassword')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                secureTextEntry={!showConfirmPassword}
                left={<TextInput.Icon icon="lock-check" />}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
                error={!!errors.confirmPassword}
              />
            )}
            name="confirmPassword"
          />
          {errors.confirmPassword && (
            <HelperText type="error">{errors.confirmPassword.message}</HelperText>
          )}

          <View style={styles.roleSection}>
            <Text variant="bodyLarge" style={styles.roleTitle}>
              I am a:
            </Text>
            <Controller
              control={control}
              render={({ field: { onChange, value } }) => (
                <RadioButton.Group onValueChange={onChange} value={value}>
                  <View style={styles.radioRow}>
                    <RadioButton value="user" />
                    <Text>Gym Member</Text>
                  </View>
                  <View style={styles.radioRow}>
                    <RadioButton value="coach" />
                    <Text>Coach/Trainer</Text>
                  </View>
                </RadioButton.Group>
              )}
              name="role"
            />
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Create Account
          </Button>

          <Divider style={styles.divider} />
          <Text variant="bodyMedium" style={styles.orText}>
            {t('auth.orContinueWith')}
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
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={5}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
            )}
          </View>

          <View style={styles.footer}>
            <Text variant="bodyMedium">{t('auth.alreadyHaveAccount')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text variant="bodyMedium" style={styles.link}>
                {t('auth.signIn')}
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
    marginBottom: 30,
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
  roleSection: {
    marginVertical: 15,
  },
  roleTitle: {
    marginBottom: 10,
    fontWeight: '600',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  button: {
    marginTop: 20,
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
});

export default SignUpScreen;