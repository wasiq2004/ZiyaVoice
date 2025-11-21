import { getApiBaseUrl } from '../utils/api';

// Interface for real credit balances
export interface RealCreditBalances {
  elevenlabsCredits: number | null;
  geminiCredits: number | null;
  twilioCredits: number | null;
  deepgramCredits: number | null;
}

// Function to fetch ElevenLabs credit balance
export const fetchElevenLabsCredits = async (userId: string): Promise<number | null> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/credits/elevenlabs/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch ElevenLabs credits');
    }
    
    return result.credits;
  } catch (error) {
    console.error('Error fetching ElevenLabs credits:', error);
    return null;
  }
};

// Function to fetch Google Gemini credit balance
export const fetchGeminiCredits = async (userId: string): Promise<number | null> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/credits/gemini/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch Google Gemini credits');
    }
    
    return result.credits;
  } catch (error) {
    console.error('Error fetching Google Gemini credits:', error);
    return null;
  }
};

// Function to fetch Deepgram credit balance
export const fetchDeepgramCredits = async (userId: string): Promise<number | null> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/credits/deepgram/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch Deepgram credits');
    }
    
    return result.credits;
  } catch (error) {
    console.error('Error fetching Deepgram credits:', error);
    return null;
  }
};

// Function to fetch Twilio credit balance
export const fetchTwilioCredits = async (userId: string): Promise<number | null> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/credits/twilio/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch Twilio credits');
    }
    
    return result.credits;
  } catch (error) {
    console.error('Error fetching Twilio credits:', error);
    return null;
  }
};

// Function to fetch all real credit balances
export const fetchRealCreditBalances = async (userId: string): Promise<RealCreditBalances> => {
  try {
    const [elevenlabsCredits, geminiCredits, twilioCredits, deepgramCredits] = await Promise.all([
      fetchElevenLabsCredits(userId),
      fetchGeminiCredits(userId),
      fetchTwilioCredits(userId),
      fetchDeepgramCredits(userId)
    ]);
    
    return {
      elevenlabsCredits,
      geminiCredits,
      twilioCredits,
      deepgramCredits
    };
  } catch (error) {
    console.error('Error fetching real credit balances:', error);
    return {
      elevenlabsCredits: null,
      geminiCredits: null,
      twilioCredits: null,
      deepgramCredits: null
    };
  }
};