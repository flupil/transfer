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
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { BRAND_COLORS } from '../../constants/brandColors';
import { useForm, Controller } from 'react-hook-form';

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPasswordScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { resetPassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsSubmitting(true);
      await resetPassword(data.email);
      setEmailSent(true);
      Alert.alert(
        t('auth.emailSent'),
        t('auth.resetInstructions'),
        [
          {
            text: t('alert.ok'),
            onPress: () => navigation.navigate('SignIn'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(t('auth.resetFailed'), error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
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
          <MaterialCommunityIcons
            name={emailSent ? "check-circle" : "lock-reset"}
            size={80}
            color={emailSent ? BRAND_COLORS.accent : BRAND_COLORS.accentLight}
          />
          <Text variant="headlineLarge" style={styles.title}>
            {emailSent ? t('auth.checkYourEmail') : t('auth.resetPassword')}
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {emailSent
              ? t('auth.emailSentSubtitle')
              : t('auth.enterEmailSubtitle')
            }
          </Text>
        </View>

        {!emailSent && (
          <View style={styles.form}>
            <Controller
              control={control}
              rules={{
                required: t('auth.emailRequired'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('auth.invalidEmail'),
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t('auth.emailAddress')}
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

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              {t('auth.sendResetEmail')}
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('SignIn')}
              style={styles.backButton}
            >
              {t('auth.backToSignIn')}
            </Button>
          </View>
        )}

        {emailSent && (
          <View style={styles.form}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('SignIn')}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              {t('auth.goToSignIn')}
            </Button>

            <Button
              mode="text"
              onPress={() => {
                setEmailSent(false);
              }}
              style={styles.backButton}
            >
              {t('auth.resendEmail')}
            </Button>
          </View>
        )}

        <View style={styles.infoSection}>
          <MaterialCommunityIcons name="information-outline" size={20} color="#666" />
          <Text variant="bodySmall" style={styles.infoText}>
            {t('auth.resetPasswordInfo')}
          </Text>
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
    marginTop: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    marginTop: 10,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  button: {
    marginTop: 20,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  backButton: {
    marginTop: 15,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 40,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  infoText: {
    marginLeft: 10,
    flex: 1,
    color: '#666',
    lineHeight: 18,
  },
});

export default ForgotPasswordScreen;