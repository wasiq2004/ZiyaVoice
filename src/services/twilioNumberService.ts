import { getApiBaseUrl } from '../utils/api';

export interface TwilioNumber {
  id: string;
  userId: string;
  phoneNumber: string;
  region: string;
  provider: string;
  verified: boolean;
  createdAt: string;
}

export const twilioNumberService = {
  // Add a Twilio number
  async addTwilioNumber(
    userId: string,
    phoneNumber: string,
    region: string,
    accountSid: string,
    authToken: string
  ): Promise<{ id: string; verificationCode: string }> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/add-twilio-number`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          phoneNumber,
          region,
          accountSid,
          authToken
        }),
      });

      if (!response.ok) {
        let error;
        try {
          error = await response.json();
        } catch {
          error = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(error.message || 'Failed to add Twilio number');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to add Twilio number');
      }

      return result.data;
    } catch (error) {
      console.error('Error adding Twilio number:', error);
      throw new Error('Failed to add Twilio number: ' + (error as Error).message);
    }
  },

  // Verify Twilio number with OTP
  async verifyTwilioNumber(userId: string, phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/verify-twilio-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          phoneNumber,
          otp
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to verify Twilio number');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to verify Twilio number');
      }

      return result.verified;
    } catch (error) {
      console.error('Error verifying Twilio number:', error);
      throw new Error('Failed to verify Twilio number: ' + (error as Error).message);
    }
  },

  // Get all verified Twilio numbers for a user
  async getVerifiedNumbers(userId: string): Promise<TwilioNumber[]> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/twilio-numbers/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Twilio numbers');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch Twilio numbers');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching Twilio numbers:', error);
      throw new Error('Failed to fetch Twilio numbers');
    }
  },

  // Start a call
  async startCall(params: {
    userId: string;
    twilioNumberId: string;
    to: string;
    agentId: string;
    campaignId?: string;
  }): Promise<{ callId: string; callSid: string }> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/start-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start call');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to start call');
      }

      return result.data;
    } catch (error) {
      console.error('Error starting call:', error);
      throw new Error('Failed to start call: ' + (error as Error).message);
    }
  },

  // Fetch available phone numbers from Twilio account
  async fetchAvailableNumbers(
    accountSid: string,
    authToken: string
  ): Promise<Array<{ phoneNumber: string; friendlyName: string; capabilities: any; sid: string }>> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/fetch-twilio-numbers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountSid,
          authToken
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch available numbers');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch available numbers');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching available numbers:', error);
      throw new Error('Failed to fetch available numbers: ' + (error as Error).message);
    }
  }
};

