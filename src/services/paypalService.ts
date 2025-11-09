import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translate } from '../contexts/LanguageContext';

// PayPal Configuration
export const PAYPAL_CONFIG = {
  // Sandbox (test) credentials
  CLIENT_ID: 'YOUR_PAYPAL_CLIENT_ID',
  CLIENT_SECRET: 'YOUR_PAYPAL_CLIENT_SECRET',

  // Switch to 'live' for production
  ENVIRONMENT: 'sandbox',

  // Your server endpoint
  API_BASE_URL: 'https://your-server.com/api',
};

class PayPalService {
  private accessToken: string = '';

  // Initialize PayPal
  async initialize() {
    try {
      // In production, get access token from your server
      console.log('PayPal service initialized');
      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize PayPal. Please try again.');

      console.error('Failed to initialize PayPal:', error);
      return false;
    }
  }

  // Create a payment
  async createPayment(amount: number, currency: string = 'ILS') {
    try {
      // Simulate PayPal payment creation
      await new Promise(resolve => setTimeout(resolve, 1500));

      const paymentId = 'PAY-' + Math.random().toString(36).substr(2, 9);

      return {
        success: true,
        paymentId,
        approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${paymentId}`,
        amount,
        currency,
      };
    } catch (error) {
      Alert.alert('Error', 'PayPal payment creation failed. Please try again.');

      console.error('PayPal payment creation failed:', error);
      throw error;
    }
  }

  // Execute payment after user approval
  async executePayment(paymentId: string, payerId: string) {
    try {
      // Simulate payment execution
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Save payment confirmation
      await AsyncStorage.setItem('lastPayment', JSON.stringify({
        paymentId,
        payerId,
        timestamp: new Date().toISOString(),
        status: 'completed',
      }));

      return {
        success: true,
        transactionId: 'TXN-' + Math.random().toString(36).substr(2, 9),
      };
    } catch (error) {
      Alert.alert('Error', 'PayPal payment execution failed. Please try again.');

      console.error('PayPal payment execution failed:', error);
      throw error;
    }
  }

  // Create subscription
  async createSubscription(planId: string, amount: number) {
    try {
      // For Israeli market, use ILS (Israeli Shekel)
      const currency = 'ILS';
      const convertedAmount = amount * 3.7; // Approximate USD to ILS conversion

      await new Promise(resolve => setTimeout(resolve, 1500));

      const subscriptionId = 'SUB-' + Math.random().toString(36).substr(2, 9);

      // Save subscription locally
      await AsyncStorage.setItem('activeSubscription', JSON.stringify({
        subscriptionId,
        planId,
        amount: convertedAmount,
        currency,
        status: 'active',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }));

      return {
        success: true,
        subscriptionId,
        amount: convertedAmount,
        currency,
      };
    } catch (error) {
      Alert.alert('Error', 'Subscription creation failed. Please try again.');

      console.error('Subscription creation failed:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string) {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      await AsyncStorage.setItem('activeSubscription', JSON.stringify({
        subscriptionId,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
      }));

      return { success: true };
    } catch (error) {
      Alert.alert('Error', 'Subscription cancellation failed. Please try again.');

      console.error('Subscription cancellation failed:', error);
      throw error;
    }
  }

  // Get payment history
  async getPaymentHistory() {
    try {
      // In production, fetch from your server
      return [
        {
          id: '1',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 37, // ILS
          currency: 'ILS',
          status: 'completed',
          description: 'Premium Subscription',
        },
      ];
    } catch (error) {
      Alert.alert('Error', 'Failed to get payment history. Please try again.');

      console.error('Failed to get payment history:', error);
      return [];
    }
  }
}

export const paypalService = new PayPalService();

// Helper functions for easy access
export const initializePayPal = () => paypalService.initialize();
export const createPayPalPayment = (amount: number, currency?: string) =>
  paypalService.createPayment(amount, currency);
export const createPayPalSubscription = (planId: string, amount: number) =>
  paypalService.createSubscription(planId, amount);