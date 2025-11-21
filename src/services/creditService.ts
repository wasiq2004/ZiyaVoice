// API-based credit service
import { getApiBaseUrl } from '../utils/api';

export interface UserCredits {
  id: string;
  userId: string;
  totalCredits: number;
  usedCredits: number;
  geminiCredits: number;
  elevenlabsCredits: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  transactionType: 'purchase' | 'usage';
  serviceType: 'gemini' | 'elevenlabs' | 'platform';
  amount: number;
  description: string;
  createdAt: string;
}

export const creditService = {
  // Get user credits
  async getUserCredits(userId: string): Promise<UserCredits | null> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/credits/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Check if response is OK
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response from server');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch user credits');
      }
      
      return result.credits;
    } catch (error) {
      console.error('Error fetching user credits:', error);
      throw new Error('Failed to fetch user credits');
    }
  },

  // Purchase credits
  async purchaseCredits(userId: string, amount: number, serviceType: 'gemini' | 'elevenlabs' | 'platform'): Promise<UserCredits | null> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/credits/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, amount, serviceType }),
      });
      
      // Check if response is OK
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response from server');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to purchase credits');
      }
      
      return result.credits;
    } catch (error) {
      console.error('Error purchasing credits:', error);
      throw new Error('Failed to purchase credits');
    }
  },

  // Get credit transactions
  async getCreditTransactions(userId: string): Promise<CreditTransaction[]> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/credits/transactions/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Check if response is OK
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response from server');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch credit transactions');
      }
      
      return result.transactions;
    } catch (error) {
      console.error('Error fetching credit transactions:', error);
      throw new Error('Failed to fetch credit transactions');
    }
  },

  // Deduct credits for service usage
  async deductCredits(userId: string, amount: number, serviceType: 'gemini' | 'elevenlabs' | 'platform', description: string): Promise<UserCredits | null> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/credits/deduct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, amount, serviceType, description }),
      });
      
      // Check if response is OK
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response from server');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to deduct credits');
      }
      
      return result.credits;
    } catch (error) {
      console.error('Error deducting credits:', error);
      throw new Error('Failed to deduct credits');
    }
  }
};