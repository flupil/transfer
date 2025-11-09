import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { paypalService } from './paypalService';
import { translate } from '../contexts/LanguageContext';

// Payment configuration
export const PAYMENT_CONFIG = {
  // These would come from your environment variables in production
  STRIPE_PUBLISHABLE_KEY: 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY',

  // Your backend API endpoint for payment processing
  API_BASE_URL: 'https://your-api.com/api',

  // Subscription price IDs from Stripe Dashboard
  PRICE_IDS: {
    premium_monthly: 'price_premium_monthly',
    pro_monthly: 'price_pro_monthly',
    premium_yearly: 'price_premium_yearly',
  }
};

interface PaymentMethod {
  id: string;
  type: 'card' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
}

class PaymentService {
  // Initialize Stripe (call this in App.tsx)
  async initializePayments() {
    try {
      // In production, initialize Stripe here
      // await initStripe({
      //   publishableKey: PAYMENT_CONFIG.STRIPE_PUBLISHABLE_KEY,
      //   merchantIdentifier: 'merchant.com.yourapp.fitness',
      //   urlScheme: 'your-app-scheme',
      // });

      console.log('Payment service initialized');
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize payments. Please try again.');

      console.error('Failed to initialize payments:', error);
    }
  }

  // Create a subscription
  async createSubscription(planId: string, paymentMethodId: string) {
    try {
      // In production, this would call your backend API
      const response = await this.mockApiCall('/subscriptions/create', {
        planId,
        paymentMethodId,
      });

      if (response.success) {
        // Save subscription info locally
        await AsyncStorage.setItem('userSubscription', planId);
        await AsyncStorage.setItem('subscriptionStatus', 'active');

        return {
          success: true,
          subscriptionId: response.subscriptionId,
        };
      }

      throw new Error(response.error || 'Payment failed');
    } catch (error: any) {
      Alert.alert('Error', 'Subscription creation failed. Please try again.');

      console.error('Subscription creation failed:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string) {
    try {
      const response = await this.mockApiCall('/subscriptions/cancel', {
        subscriptionId,
      });

      if (response.success) {
        await AsyncStorage.setItem('userSubscription', 'free');
        await AsyncStorage.setItem('subscriptionStatus', 'cancelled');

        return { success: true };
      }

      throw new Error(response.error || 'Cancellation failed');
    } catch (error) {
      Alert.alert('Error', 'Subscription cancellation failed. Please try again.');

      console.error('Subscription cancellation failed:', error);
      throw error;
    }
  }

  // Update payment method
  async updatePaymentMethod(paymentMethodId: string) {
    try {
      const response = await this.mockApiCall('/payment-methods/update', {
        paymentMethodId,
      });

      return response;
    } catch (error) {
      Alert.alert('Error', 'Payment method update failed. Please try again.');

      console.error('Payment method update failed:', error);
      throw error;
    }
  }

  // Get subscription status
  async getSubscriptionStatus() {
    try {
      const status = await AsyncStorage.getItem('subscriptionStatus');
      const planId = await AsyncStorage.getItem('userSubscription');

      return {
        status: status || 'inactive',
        planId: planId || 'free',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    } catch (error) {
      Alert.alert('Error', 'Failed to get subscription status. Please try again.');

      console.error('Failed to get subscription status:', error);
      return {
        status: 'inactive',
        planId: 'free',
        nextBillingDate: null,
      };
    }
  }

  // Process payment with Stripe
  async processStripePayment(amount: number, currency: string = 'USD') {
    try {
      // In production, this would use Stripe SDK
      // const { paymentIntent, error } = await confirmPayment(clientSecret, {
      //   type: 'Card',
      //   billingDetails: {
      //     email: userEmail,
      //   },
      // });

      // Simulated payment processing
      return await this.simulatePaymentProcessing(amount);
    } catch (error: any) {
      Alert.alert('Error', 'Stripe payment failed. Please try again.');

      console.error('Stripe payment failed:', error);
      throw error;
    }
  }

  // Process Apple Pay
  async processApplePay(amount: number, currency: string = 'USD') {
    try {
      // In production:
      // const { error, paymentMethod } = await presentApplePay({
      //   cartItems: [{ label: 'FitApp Subscription', amount: amount.toString() }],
      //   currency: currency,
      //   country: 'US',
      // });

      return await this.simulatePaymentProcessing(amount);
    } catch (error) {
      Alert.alert('Error', 'Apple Pay failed. Please try again.');

      console.error('Apple Pay failed:', error);
      throw error;
    }
  }

  // Process Google Pay
  async processGooglePay(amount: number, currency: string = 'USD') {
    try {
      // In production:
      // const { error, paymentMethod } = await presentGooglePay({
      //   price: amount,
      //   currency: currency,
      // });

      return await this.simulatePaymentProcessing(amount);
    } catch (error) {
      Alert.alert('Error', 'Google Pay failed. Please try again.');

      console.error('Google Pay failed:', error);
      throw error;
    }
  }

  // Validate payment method
  validatePaymentMethod(method: string): boolean {
    const validMethods = ['card', 'apple_pay', 'google_pay', 'paypal'];
    return validMethods.includes(method.toLowerCase());
  }

  // Get payment history
  async getPaymentHistory() {
    try {
      // In production, fetch from your backend
      return [
        {
          id: '1',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 9.99,
          status: 'succeeded',
          description: 'Premium Monthly Subscription',
        },
        {
          id: '2',
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 9.99,
          status: 'succeeded',
          description: 'Premium Monthly Subscription',
        },
      ];
    } catch (error) {
      Alert.alert('Error', 'Failed to get payment history. Please try again.');

      console.error('Failed to get payment history:', error);
      return [];
    }
  }

  // Helper: Simulate API call (replace with real API in production)
  private async mockApiCall(endpoint: string, data: any): Promise<any> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate success/failure
    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      return {
        success: true,
        subscriptionId: 'sub_' + Math.random().toString(36).substr(2, 9),
        ...data,
      };
    } else {
      throw new Error('Payment processing failed. Please try again.');
    }
  }

  // Helper: Simulate payment processing
  private async simulatePaymentProcessing(amount: number): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const success = Math.random() > 0.05; // 95% success rate

    if (success) {
      return {
        success: true,
        transactionId: 'txn_' + Math.random().toString(36).substr(2, 9),
        amount,
        timestamp: new Date().toISOString(),
      };
    } else {
      throw new Error('Payment failed. Please check your payment method and try again.');
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

// Export helper functions for easy access
export const createSubscription = (planId: string, paymentMethodId: string) =>
  paymentService.createSubscription(planId, paymentMethodId);

export const cancelSubscription = (subscriptionId: string) =>
  paymentService.cancelSubscription(subscriptionId);

export const getSubscriptionStatus = () =>
  paymentService.getSubscriptionStatus();

export const processPayment = async (method: string, amount: number) => {
  switch (method.toLowerCase()) {
    case 'paypal':
      // Use PayPal for Israeli market
      const payment = await paypalService.createPayment(amount, 'ILS');
      if (payment.success) {
        // In production, redirect to PayPal approval URL
        console.log('PayPal approval URL:', payment.approvalUrl);
        // Simulate approval
        return await paypalService.executePayment(payment.paymentId, 'PAYER123');
      }
      throw new Error('PayPal payment failed');
    case 'apple pay':
      return paymentService.processApplePay(amount);
    case 'google pay':
      return paymentService.processGooglePay(amount);
    case 'credit card':
    default:
      return paymentService.processStripePayment(amount);
  }
};