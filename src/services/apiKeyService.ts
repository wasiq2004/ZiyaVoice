import { getApiBaseUrl } from '../utils/api';

export interface UserApiKey {
  id: string;
  userId: string;
  serviceName: string;
  createdAt: string;
  updatedAt: string;
}

export const apiKeyService = {
  // Get all API keys for a user
  async getUserApiKeys(userId: string): Promise<UserApiKey[]> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/user-api-keys/${userId}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch user API keys');
      }
      
      return result.apiKeys;
    } catch (error) {
      console.error('Error fetching user API keys:', error);
      throw new Error('Failed to fetch user API keys');
    }
  },

  // Get a specific API key for a user and service
  async getUserApiKey(userId: string, serviceName: string): Promise<string | null> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/user-api-keys/${userId}/${serviceName}`);
      const result = await response.json();
      
      if (!result.success) {
        if (response.status === 404) {
          // API key not found, which is not an error
          return null;
        }
        throw new Error(result.message || 'Failed to fetch user API key');
      }
      
      return result.apiKey;
    } catch (error) {
      console.error('Error fetching user API key:', error);
      throw new Error('Failed to fetch user API key');
    }
  },

  // Save or update an API key for a user
  async saveUserApiKey(userId: string, serviceName: string, apiKey: string): Promise<void> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/user-api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, serviceName, apiKey })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to save user API key');
      }
    } catch (error) {
      console.error('Error saving user API key:', error);
      throw new Error('Failed to save user API key');
    }
  },

  // Delete an API key for a user and service
  async deleteUserApiKey(userId: string, serviceName: string): Promise<void> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/user-api-keys/${userId}/${serviceName}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete user API key');
      }
    } catch (error) {
      console.error('Error deleting user API key:', error);
      throw new Error('Failed to delete user API key');
    }
  },

  // Validate an API key
  async validateApiKey(userId: string, serviceName: string, apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/validate-api-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, serviceName, apiKey })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to validate API key');
      }
      
      return result.valid;
    } catch (error) {
      console.error('Error validating API key:', error);
      throw new Error('Failed to validate API key');
    }
  }
};