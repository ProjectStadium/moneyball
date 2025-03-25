import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Initialize Stripe with the publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY, {
  apiVersion: '2023-10-16',
  stripeAccount: undefined,
  betas: undefined,
  locale: undefined,
  __privateApiUrl: undefined,
});

interface PaymentIntent {
  clientSecret: string;
  subscriptionId?: string;
}

interface PaymentResult {
  success: boolean;
  error?: string;
  subscriptionId?: string;
}

export class PaymentService {
  private static async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    type: 'subscription' | 'report'
  ): Promise<PaymentIntent> {
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  private static async handlePayment(
    clientSecret: string,
    subscriptionId?: string
  ): Promise<PaymentResult> {
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          // Card details will be handled by Stripe Elements
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        subscriptionId,
      };
    } catch (error) {
      console.error('Payment error:', error);
      return {
        success: false,
        error: 'Payment failed. Please try again.',
      };
    }
  }

  public static async processSubscription(
    tierId: string,
    price: number
  ): Promise<PaymentResult> {
    try {
      const { clientSecret, subscriptionId } = await this.createPaymentIntent(
        price,
        'usd',
        'subscription'
      );

      return await this.handlePayment(clientSecret, subscriptionId);
    } catch (error) {
      console.error('Subscription error:', error);
      return {
        success: false,
        error: 'Failed to process subscription. Please try again.',
      };
    }
  }

  public static async processReportPurchase(
    reportId: string,
    price: number
  ): Promise<PaymentResult> {
    try {
      const { clientSecret } = await this.createPaymentIntent(
        price,
        'usd',
        'report'
      );

      return await this.handlePayment(clientSecret);
    } catch (error) {
      console.error('Report purchase error:', error);
      return {
        success: false,
        error: 'Failed to process report purchase. Please try again.',
      };
    }
  }

  public static async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      });

      return response.ok;
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      return false;
    }
  }
} 