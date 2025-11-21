import { getApiBaseUrl } from '../utils/api';

export interface TwilioConfig {
  id: string;
  accountSid: string;
  appUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface TwilioPhoneNumber {
  id: string;
  userId: string;
  number: string;
  twilioNumberSid: string;
  provider: string;
  region: string;
  capabilities: any;
  voiceWebhookUrl: string;
  statusWebhookUrl: string;
  createdAt: string;
}

export interface TwilioCall {
  id: string;
  userId: string;
  callSid: string;
  fromNumber: string;
  toNumber: string;
  direction: 'inbound' | 'outbound';
  status: string;
  timestamp: string;
  duration: number;
  recordingUrl?: string;
}

export const twilioBasicService = {
  // Save/Update Twilio Configuration
  async saveConfig(
    userId: string,
    accountSid: string,
    authToken: string,
    appUrl: string,
    apiKeySid?: string,
    apiKeySecret?: string
  ): Promise<void> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/twilio/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          accountSid,
          authToken,
          appUrl,
          apiKeySid,
          apiKeySecret
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save Twilio configuration');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to save Twilio configuration');
      }
    } catch (error) {
      console.error('Error saving Twilio config:', error);
      throw new Error('Failed to save Twilio configuration: ' + (error as Error).message);
    }
  },

  // Get Twilio Configuration
  async getConfig(userId: string): Promise<TwilioConfig | null> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/twilio/config/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch Twilio configuration');
      }

      const result = await response.json();
      if (!result.success) {
        return null;
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching Twilio config:', error);
      return null;
    }
  },

  // Connect/Import Twilio Number
  async connectNumber(userId: string, number: string): Promise<TwilioPhoneNumber> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/twilio/connect-number`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          number
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to connect number');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to connect number');
      }

      return result.data;
    } catch (error) {
      console.error('Error connecting number:', error);
      throw new Error('Failed to connect number: ' + (error as Error).message);
    }
  },

  // Get User's Phone Numbers
  async getPhoneNumbers(userId: string): Promise<TwilioPhoneNumber[]> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/twilio/phone-numbers/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch phone numbers');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch phone numbers');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      throw new Error('Failed to fetch phone numbers');
    }
  },

  // Make Outbound Call
  async makeCall(userId: string, from: string, to: string, agentId?: string): Promise<TwilioCall> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/twilio/make-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          from,
          to,
          ...(agentId && { agentId })
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to make call');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to make call');
      }

      return result.data;
    } catch (error) {
      console.error('Error making call:', error);
      throw new Error('Failed to make call: ' + (error as Error).message);
    }
  },

  // Get Call History
  async getCalls(userId: string, limit: number = 50): Promise<TwilioCall[]> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/twilio/calls/${userId}?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch calls: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch calls');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching calls:', error);
      throw new Error(`Failed to fetch calls: ${(error as Error).message}`);
    }
  }
};

