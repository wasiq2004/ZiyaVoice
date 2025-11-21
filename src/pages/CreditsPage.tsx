import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { creditService, CreditTransaction } from '../services/creditService';
import { apiKeyService } from '../services/apiKeyService';
import { fetchRealCreditBalances } from '../services/realCreditService';

const CreditsPage: React.FC = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState({
    elevenlabs: null as number | null,
    gemini: null as number | null,
    twilio: null as number | null,
    deepgram: null as number | null
  });
  const [configuredKeys, setConfiguredKeys] = useState({
    elevenlabs: false,
    gemini: false,
    deepgram: false
  });
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showApiKey, setShowApiKey] = useState<{service: 'elevenlabs' | 'gemini', key: string} | null>(null);
  
  // Form states
  const [purchaseAmount, setPurchaseAmount] = useState(0);
  const [purchaseService, setPurchaseService] = useState<'gemini' | 'elevenlabs' | 'platform'>('platform');
  const [deleteService, setDeleteService] = useState<'elevenlabs' | 'gemini'>('elevenlabs');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Listen for API key updates from other components
  useEffect(() => {
    const handleApiKeysUpdated = (event: CustomEvent) => {
      console.log('API keys updated, refreshing credits');
      fetchRealCredits();
      checkConfiguredKeys();
    };

    // Add event listener
    window.addEventListener('apiKeysUpdated', handleApiKeysUpdated as EventListener);

    // Check for recent API key updates in localStorage
    const apiKeysUpdated = localStorage.getItem('apiKeysUpdated');
    if (apiKeysUpdated) {
      try {
        const updateInfo = JSON.parse(apiKeysUpdated);
        // If the update was recent (within last 5 seconds), refresh credits
        if (Date.now() - updateInfo.timestamp < 5000) {
          fetchRealCredits();
          checkConfiguredKeys();
        }
        // Clean up the flag
        localStorage.removeItem('apiKeysUpdated');
      } catch (e) {
        console.error('Error parsing apiKeysUpdated data:', e);
      }
    }

    // Cleanup event listener
    return () => {
      window.removeEventListener('apiKeysUpdated', handleApiKeysUpdated as EventListener);
    };
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchRealCredits(),
        fetchTransactions(),
        checkConfiguredKeys()
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const checkConfiguredKeys = async () => {
    if (!user) return;
    
    try {
      const apiKeys = await apiKeyService.getUserApiKeys(user.id);
      const elevenlabsConfigured = apiKeys.some(key => key.serviceName === '11labs');
      const geminiConfigured = apiKeys.some(key => key.serviceName === 'gemini');
      const deepgramConfigured = apiKeys.some(key => key.serviceName === 'deepgram');
      
      setConfiguredKeys({
        elevenlabs: elevenlabsConfigured,
        gemini: geminiConfigured,
        deepgram: deepgramConfigured
      });
    } catch (err: any) {
      console.error('Error checking configured API keys:', err);
    }
  };

  const fetchRealCredits = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Fetch credits using the new simplified function
      const creditBalances = await fetchRealCreditBalances(user.id);
      
      setCredits({
        elevenlabs: creditBalances.elevenlabsCredits,
        gemini: creditBalances.geminiCredits,
        twilio: creditBalances.twilioCredits,
        deepgram: creditBalances.deepgramCredits
      });
      
      // Check configured keys after fetching credits
      await checkConfiguredKeys();
    } catch (err: any) {
      setError(err.message || 'Failed to fetch real credits');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      const userTransactions = await creditService.getCreditTransactions(user.id);
      setTransactions(userTransactions);
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to fetch credit transactions');
      // Don't block the whole page if transactions fail - just show empty list
      setTransactions([]);
    }
  };

  const handlePurchase = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // In a real implementation, you would call the purchase API
      // For now, we'll just refresh the data
      await loadData();
      setShowPurchaseModal(false);
      setPurchaseAmount(0);
    } catch (err: any) {
      setError(err.message || 'Failed to purchase credits');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async (service: 'elevenlabs' | 'gemini') => {
    if (!user) return;
    
    try {
      setLoading(true);
      await apiKeyService.deleteUserApiKey(user.id, service === 'elevenlabs' ? '11labs' : 'gemini');
      
      // Update the configured keys state
      setConfiguredKeys(prev => ({
        ...prev,
        [service]: false
      }));
      
      // Reset the credits for this service
      setCredits(prev => ({
        ...prev,
        [service]: null
      }));
      
      // Close the confirmation dialog
      setShowDeleteConfirm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to delete API key');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirm = (service: 'elevenlabs' | 'gemini') => {
    setDeleteService(service);
    setShowDeleteConfirm(true);
  };

  const handleShowApiKey = async (service: 'elevenlabs' | 'gemini') => {
    if (!user) return;
    
    try {
      const serviceName = service === 'elevenlabs' ? '11labs' : 'gemini';
      const apiKey = await apiKeyService.getUserApiKey(user.id, serviceName);
      if (apiKey) {
        setShowApiKey({ service, key: apiKey });
      }
    } catch (err: any) {
      console.error('Error fetching API key:', err);
      setError(err.message || 'Failed to fetch API key');
    }
  };

  const formatServiceName = (service: string) => {
    switch (service) {
      case 'gemini': return 'Google Gemini';
      case 'elevenlabs': return 'ElevenLabs';
      case 'platform': return 'Platform';
      default: return service;
    }
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'purchase': return 'Purchase';
      case 'usage': return 'Usage';
      default: return type;
    }
  };

  if (loading && !credits) {
    return (
      <div className="min-h-screen bg-lightbg dark:bg-darkbg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-lightbg dark:bg-darkbg p-6">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Credits & Usage">
        <button
          onClick={() => setShowPurchaseModal(true)}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 btn-animate w-full sm:w-auto"
        >
          Buy More Credits
        </button>
      </Header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 stagger-children">
        {/* ElevenLabs Credits */}
        <div className="bg-white dark:bg-darkbg-light rounded-lg shadow-sm p-4 md:p-6 card-animate">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base md:text-lg font-medium text-slate-800 dark:text-white">ElevenLabs Credits</h3>
              <p className="text-xs md:text-sm text-slate-500 mt-1">For text-to-speech</p>
              <p className="text-2xl md:text-3xl font-bold mt-2 text-blue-600 dark:text-blue-400 animate-pulse-soft">
                {credits.elevenlabs !== null ? (
                  typeof credits.elevenlabs === 'number' ? 
                    credits.elevenlabs.toLocaleString() : 
                    <span className="text-blue-500">{credits.elevenlabs}</span>
                ) : (
                  configuredKeys.elevenlabs ? (
                    <span className="text-blue-500">Key configured, credits unavailable</span>
                  ) : (
                    <span className="text-gray-500">No API key configured</span>
                  )
                )}
              </p>
            </div>
            {configuredKeys.elevenlabs && (
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleShowApiKey('elevenlabs')}
                  className="text-blue-500 hover:text-blue-700 transition-all duration-300 transform hover:scale-125"
                  title="Show API Key"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button 
                  onClick={() => openDeleteConfirm('elevenlabs')}
                  className="text-red-500 hover:text-red-700 transition-all duration-300 transform hover:scale-125"
                  title="Delete API Key"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Gemini Credits */}
        <div className="bg-white dark:bg-darkbg-light rounded-lg shadow-sm p-4 md:p-6 card-animate">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base md:text-lg font-medium text-slate-800 dark:text-white">Gemini Credits</h3>
              <p className="text-xs md:text-sm text-slate-500 mt-1">For AI processing</p>
              <p className="text-2xl md:text-3xl font-bold mt-2 text-purple-600 dark:text-purple-400 animate-pulse-soft">
                {credits.gemini !== null ? (
                  typeof credits.gemini === 'number' ? 
                    credits.gemini.toLocaleString() : 
                    <span className="text-purple-500">{credits.gemini}</span>
                ) : (
                  configuredKeys.gemini ? (
                    <span className="text-purple-500">Key configured, credits unavailable</span>
                  ) : (
                    <span className="text-gray-500">No API key configured</span>
                  )
                )}
              </p>
            </div>
            {configuredKeys.gemini && (
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleShowApiKey('gemini')}
                  className="text-blue-500 hover:text-blue-700 transition-all duration-300 transform hover:scale-125"
                  title="Show API Key"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button 
                  onClick={() => openDeleteConfirm('gemini')}
                  className="text-red-500 hover:text-red-700 transition-all duration-300 transform hover:scale-125"
                  title="Delete API Key"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Deepgram Credits */}
        <div className="bg-white dark:bg-darkbg-light rounded-lg shadow-sm p-4 md:p-6 card-animate">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base md:text-lg font-medium text-slate-800 dark:text-white">Deepgram Credits</h3>
              <p className="text-xs md:text-sm text-slate-500 mt-1">For speech recognition</p>
              <p className="text-2xl md:text-3xl font-bold mt-2 text-orange-600 dark:text-orange-400 animate-pulse-soft">
                {credits.deepgram !== null ? (
                  typeof credits.deepgram === 'number' ? 
                    `$${credits.deepgram.toFixed(2)}` : 
                    <span className="text-orange-500">{credits.deepgram}</span>
                ) : (
                  configuredKeys.deepgram ? (
                    <span className="text-orange-500">Key configured, credits unavailable</span>
                  ) : (
                    <span className="text-gray-500">No API key configured</span>
                  )
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-darkbg-light rounded-lg shadow-sm p-4 md:p-6 card-animate animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <h2 className="text-lg md:text-xl font-semibold text-slate-800 dark:text-white mb-6">Usage Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ElevenLabs Usage */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 dark:text-white">ElevenLabs</h3>
              <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">Text-to-Speech</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300">Available Credits:</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {credits.elevenlabs !== null ? (
                    typeof credits.elevenlabs === 'number' ? 
                      credits.elevenlabs.toLocaleString() : 
                      <span className="text-sm">Unavailable</span>
                  ) : (
                    <span className="text-sm">Not configured</span>
                  )}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {configuredKeys.elevenlabs ? '✓ API Key Configured' : '✗ API Key Not Configured'}
              </div>
            </div>
          </div>

          {/* Gemini Usage */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 dark:text-white">Google Gemini</h3>
              <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">AI Models</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300">Available Models:</span>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {credits.gemini !== null ? (
                    typeof credits.gemini === 'number' ? 
                      credits.gemini : 
                      <span className="text-sm">Unavailable</span>
                  ) : (
                    <span className="text-sm">Not configured</span>
                  )}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {configuredKeys.gemini ? '✓ API Key Configured' : '✗ API Key Not Configured'}
              </div>
            </div>
          </div>

          {/* Deepgram Usage */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 dark:text-white">Deepgram</h3>
              <span className="text-xs bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">Speech-to-Text</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300">Account Balance:</span>
                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {credits.deepgram !== null ? (
                    typeof credits.deepgram === 'number' ? 
                      `$${credits.deepgram.toFixed(2)}` : 
                      <span className="text-sm">Unavailable</span>
                  ) : (
                    <span className="text-sm">Not configured</span>
                  )}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {configuredKeys.deepgram ? '✓ API Key Configured' : '✗ API Key Not Configured'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-darkbg-light rounded-lg shadow-xl max-w-md w-full animate-scale-in">
            <div className="p-6">
              <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-4 animate-slide-down">Purchase Credits</h3>
              <div className="space-y-4 stagger-children">
                <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Service
                  </label>
                  <select
                    value={purchaseService}
                    onChange={(e) => setPurchaseService(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary transition-all duration-300 input-animate"
                  >
                    <option value="platform">Platform Credits</option>
                    <option value="elevenlabs">ElevenLabs Credits</option>
                    <option value="gemini">Google Gemini Credits</option>
                  </select>
                </div>
                <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary transition-all duration-300 input-animate"
                    min="1"
                  />
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-all duration-300 btn-animate"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md transition-all duration-300 btn-animate"
                >
                  Purchase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-darkbg-light rounded-lg shadow-xl max-w-md w-full animate-scale-in">
            <div className="p-6">
              <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-4 animate-slide-down">Confirm Deletion</h3>
              <p className="text-slate-600 dark:text-slate-300 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Are you sure you want to delete your {formatServiceName(deleteService)} API key? This action cannot be undone.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-all duration-300 btn-animate"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteApiKey(deleteService)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-all duration-300 btn-animate"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show API Key Modal */}
      {showApiKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-darkbg-light rounded-lg shadow-xl max-w-md w-full animate-scale-in">
            <div className="p-6">
              <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-4 animate-slide-down">API Key</h3>
              <div className="mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {formatServiceName(showApiKey.service)} API Key
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={showApiKey.key}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(showApiKey.key)}
                    className="px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-all duration-300 btn-animate whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="flex justify-end animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <button
                  onClick={() => setShowApiKey(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-all duration-300 btn-animate"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditsPage;