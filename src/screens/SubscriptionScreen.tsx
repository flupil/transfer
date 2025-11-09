import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  List,
  Chip,
  IconButton,
  Portal,
  Modal,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { paymentService, processPayment, getSubscriptionStatus } from '../services/paymentService';

const { width } = Dimensions.get('window');

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  period: string;
  popular?: boolean;
  features: string[];
  color: string[];
  icon: string;
  savings?: string;
}

const getSubscriptionTiers = (t: (key: string) => string): SubscriptionTier[] => [
  {
    id: 'free',
    name: t('subscription.free'),
    price: 0,
    period: t('subscription.forever'),
    features: [
      t('subscription.feature.basicTracking'),
      t('subscription.feature.limitedLibrary'),
      t('subscription.feature.customWorkouts'),
      t('subscription.feature.basicProgress'),
      t('subscription.feature.communityAccess'),
    ],
    color: ['#9E9E9E', '#757575'],
    icon: 'account-outline',
  },
  {
    id: 'premium',
    name: t('subscription.premium'),
    price: 9.99,
    period: t('subscription.month'),
    popular: true,
    features: [
      t('subscription.feature.everythingFree'),
      t('subscription.feature.unlimitedWorkouts'),
      t('subscription.feature.advancedAnalytics'),
      t('subscription.feature.mealPlanning'),
      t('subscription.feature.trainerChat'),
      t('subscription.feature.noAds'),
      t('subscription.feature.prioritySupport'),
    ],
    color: ['#4CAF50', '#45a049'],
    icon: 'star',
  },
  {
    id: 'pro',
    name: t('subscription.pro'),
    price: 19.99,
    period: t('subscription.month'),
    features: [
      t('subscription.feature.everythingPremium'),
      t('subscription.feature.aiWorkoutPlans'),
      t('subscription.feature.nutritionCoaching'),
      t('subscription.feature.videoConsultations'),
      t('subscription.feature.customMealPlans'),
      t('subscription.feature.bodyComposition'),
      t('subscription.feature.exclusiveContent'),
      t('subscription.feature.vipSupport'),
    ],
    color: ['#FF6B35', '#FF5722'],
    icon: 'crown',
  },
  {
    id: 'yearly',
    name: t('subscription.yearlyPremium'),
    price: 89.99,
    period: t('subscription.year'),
    savings: t('subscription.feature.bestValue'),
    features: [
      t('subscription.feature.allPremiumFeatures'),
      t('subscription.feature.bestValue'),
    ],
    color: ['#9C27B0', '#7B1FA2'],
    icon: 'calendar-check',
  },
];

export const SubscriptionScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();
  const subscriptionTiers = getSubscriptionTiers(t);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    loadCurrentSubscription();
    startAnimation();
  }, []);

  const startAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadCurrentSubscription = async () => {
    try {
      const status = await getSubscriptionStatus();
      setCurrentPlan(status.planId);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

  const handleSelectPlan = (planId: string) => {
    if (planId === currentPlan) {
      Alert.alert(t('subscription.currentPlan'), t('subscription.currentPlanAlert'));
      return;
    }
    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      Alert.alert(t('alert.error'), t('subscription.selectPaymentMethod'));
      return;
    }

    setLoading(true);

    try {
      // Get the selected tier's price
      const selectedTier = subscriptionTiers.find(t => t.id === selectedPlan);
      if (!selectedTier) {
        throw new Error('Invalid plan selected');
      }

      // Process payment based on selected method
      const paymentResult = await processPayment(paymentMethod, selectedTier.price);

      if (paymentResult.success) {
        // Create subscription after successful payment
        const subscriptionResult = await paymentService.createSubscription(
          selectedPlan!,
          paymentResult.transactionId
        );

        if (subscriptionResult.success) {
          setCurrentPlan(selectedPlan!);
          setLoading(false);
          setShowPaymentModal(false);
          Alert.alert(
            t('alert.success'),
            'Your subscription has been activated successfully.',
            [{ text: t('alert.ok') }]
          );
        }
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert(t('subscription.paymentFailed'), error.message || 'Please try again.');
    }
  };

  const renderTierCard = (tier: SubscriptionTier) => {
    const isCurrentPlan = currentPlan === tier.id;
    const scale = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.05],
    });

    return (
      <Animated.View
        key={tier.id}
        style={[
          styles.tierCard,
          tier.popular && {
            transform: [{ scale }],
          },
        ]}
      >
        <LinearGradient
          colors={tier.color as [string, string]}
          style={styles.gradientCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {tier.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>MOST POPULAR</Text>
            </View>
          )}

          {tier.savings && (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>{tier.savings}</Text>
            </View>
          )}

          <View style={styles.tierHeader}>
            <MaterialCommunityIcons
              name={tier.icon as any}
              size={40}
              color="white"
            />
            <Text style={styles.tierName}>{tier.name}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>
                {tier.price === 0 ? 'Free' : `$${tier.price}`}
              </Text>
              {tier.price > 0 && (
                <Text style={styles.period}>/{tier.period}</Text>
              )}
            </View>
          </View>

          <View style={styles.featuresContainer}>
            {tier.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color="white"
                />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.selectButton,
              isCurrentPlan && styles.currentPlanButton,
            ]}
            onPress={() => handleSelectPlan(tier.id)}
            disabled={isCurrentPlan}
          >
            <Text style={styles.selectButtonText}>
              {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Choose Your Plan
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Unlock premium features and take your fitness to the next level
          </Text>
        </View>

        {/* Current Plan Info */}
        {currentPlan !== 'free' && (
          <Card style={styles.currentPlanCard}>
            <Card.Content>
              <View style={styles.currentPlanHeader}>
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={24}
                  color="#4CAF50"
                />
                <Text style={styles.currentPlanText}>
                  Current Plan: {subscriptionTiers.find(t => t.id === currentPlan)?.name}
                </Text>
              </View>
              <Text style={styles.renewalText}>
                Renews on: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Subscription Tiers */}
        <View style={styles.tiersContainer}>
          {subscriptionTiers.map(renderTierCard)}
        </View>

        {/* Benefits Section */}
        <Card style={styles.benefitsCard}>
          <Card.Content>
            <Text style={styles.benefitsTitle}>Why Upgrade?</Text>
            <View style={styles.benefitsList}>
              {[
                { icon: 'trophy', text: 'Reach your goals faster' },
                { icon: 'chart-line', text: 'Advanced progress tracking' },
                { icon: 'food-apple', text: 'Personalized nutrition' },
                { icon: 'account-group', text: 'Expert guidance' },
                { icon: 'lightning-bolt', text: 'Unlimited workouts' },
                { icon: 'shield-check', text: '30-day money back guarantee' },
              ].map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <MaterialCommunityIcons
                    name={benefit.icon as any}
                    size={24}
                    color="#4CAF50"
                  />
                  <Text style={styles.benefitText}>{benefit.text}</Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* FAQ Section */}
        <Card style={styles.faqCard}>
          <Card.Content>
            <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
            <List.Accordion
              title={t('subscription.faqCancelQuestion')}
              left={props => <List.Icon {...props} icon="help-circle" />}
            >
              <Text style={styles.faqAnswer}>
                {t('subscription.faqCancelAnswer')}
              </Text>
            </List.Accordion>
            <List.Accordion
              title={t('subscription.faqPaymentQuestion')}
              left={props => <List.Icon {...props} icon="credit-card" />}
            >
              <Text style={styles.faqAnswer}>
                We accept all major credit cards, PayPal, and Apple/Google Pay.
              </Text>
            </List.Accordion>
            <List.Accordion
              title={t('subscription.faqTrialQuestion')}
              left={props => <List.Icon {...props} icon="gift" />}
            >
              <Text style={styles.faqAnswer}>
                {t('subscription.faqTrialAnswer')}
              </Text>
            </List.Accordion>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Payment Modal */}
      <Portal>
        <Modal
          visible={showPaymentModal}
          onDismiss={() => setShowPaymentModal(false)}
          contentContainerStyle={[
            styles.modalContent,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <Text style={styles.modalTitle}>Complete Your Purchase</Text>

          {selectedPlan && (
            <View style={styles.selectedPlanInfo}>
              <Text style={styles.selectedPlanName}>
                {subscriptionTiers.find(t => t.id === selectedPlan)?.name}
              </Text>
              <Text style={styles.selectedPlanPrice}>
                ${subscriptionTiers.find(t => t.id === selectedPlan)?.price}/
                {subscriptionTiers.find(t => t.id === selectedPlan)?.period}
              </Text>
            </View>
          )}

          <Text style={styles.paymentMethodTitle}>Select Payment Method</Text>

          {['Credit Card', 'PayPal', 'Google Pay', 'Apple Pay'].map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                styles.paymentMethodCard,
                paymentMethod === method && styles.selectedPaymentMethod,
              ]}
              onPress={() => setPaymentMethod(method)}
            >
              <MaterialCommunityIcons
                name={
                  method === 'Credit Card'
                    ? 'credit-card'
                    : method === 'PayPal'
                    ? 'cash'
                    : method === 'Google Pay'
                    ? 'google'
                    : 'apple'
                }
                size={24}
                color={paymentMethod === method ? '#4CAF50' : '#666'}
              />
              <Text style={styles.paymentMethodText}>{method}</Text>
              {paymentMethod === method && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={24}
                  color="#4CAF50"
                />
              )}
            </TouchableOpacity>
          ))}

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowPaymentModal(false)}
              disabled={loading}
            >
              {t('button.cancel')}
            </Button>
            <Button
              mode="contained"
              onPress={handlePayment}
              loading={loading}
              disabled={!paymentMethod || loading}
              buttonColor="#4CAF50"
            >
              {loading ? t('subscription.processing') : t('subscription.confirmPayment')}
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  currentPlanCard: {
    margin: 16,
    backgroundColor: '#E8F5E9',
  },
  currentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPlanText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#2E7D32',
  },
  renewalText: {
    fontSize: 14,
    color: '#666',
  },
  tiersContainer: {
    padding: 16,
  },
  tierCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  gradientCard: {
    padding: 20,
  },
  popularBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  savingsBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  tierHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tierName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  period: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  selectButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  currentPlanButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  benefitsCard: {
    margin: 16,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    marginLeft: 12,
    fontSize: 16,
  },
  faqCard: {
    margin: 16,
    marginBottom: 32,
  },
  faqTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#666',
  },
  modalContent: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  selectedPlanInfo: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  selectedPlanName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedPlanPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  selectedPaymentMethod: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  paymentMethodText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
});

export default SubscriptionScreen;