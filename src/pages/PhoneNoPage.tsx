import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import CallInitiator from '../components/CallInitiator';
import { EditIcon, PhoneIcon, ImportIcon, ArrowUpRightIcon } from '../constants';
import { PhoneNumber, PhoneProvider, VoiceAgent } from '../types';
import { phoneNumberService } from '../services/phoneNumberService';
import { agentService } from '../services/agentService';
import { twilioNumberService } from '../services/twilioNumberService';
import { twilioBasicService } from '../services/twilioBasicService';
import { useAuth } from '../contexts/AuthContext';
import { getApiBaseUrl } from '../utils/api';

const ImportPhoneNumberModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void;
  user: any;
  onPhoneNumberImported: (phoneNumber: PhoneNumber) => void;
}> = ({ isOpen, onClose, user, onPhoneNumberImported }) => {
    const PROVIDERS = ['TWILIO']; // Only Twilio provider
    const [activeProvider, setActiveProvider] = useState('TWILIO');
    const [formData, setFormData] = useState({
        region: 'us-west',
        country: 'us',
        phoneNumber: '',
        twilioSid: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(''); // Clear error when user types
    };

    const handleImport = async () => {
        try {
            setLoading(true);
            setError('');
            
            if (!user) {
                throw new Error('User not authenticated');
            }
            
            // Validate phone number format
            if (!formData.phoneNumber || formData.phoneNumber.trim().length === 0) {
                throw new Error('Phone number is required');
            }
            
            // Basic format validation - should contain at least numbers
            if (!/[\d\+\-\(\)\s]{7,}/.test(formData.phoneNumber)) {
                throw new Error('Invalid phone number format');
            }
            
            // Call the phone number service to import the phone number
            // The backend will validate with Twilio if credentials are available
            const newPhoneNumber = await phoneNumberService.importPhoneNumber(user.id, formData);
            
            // Notify the parent component about the new phone number
            onPhoneNumberImported(newPhoneNumber);
            
            // Reset form and close modal
            setFormData({
                region: 'us-west',
                country: 'us',
                phoneNumber: '',
                twilioSid: '',
            });
            onClose();
            
            alert('Phone number imported successfully!');
        } catch (error) {
            console.error('Error importing phone number:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div 
                className="bg-darkbg text-slate-200 rounded-lg shadow-xl w-full max-w-2xl transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                {/* Tabs - Only Twilio */}
                <div className="border-b border-slate-700">
                    <nav className="-mb-px flex space-x-8 px-6">
                        <button
                            onClick={() => setActiveProvider('TWILIO')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeProvider === 'TWILIO'
                                    ? 'border-primary text-white'
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                            }`}
                        >
                            TWILIO
                        </button>
                    </nav>
                </div>

                {/* Form */}
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    <div>
                        <label htmlFor="region" className="block text-sm font-medium mb-1">Region</label>
                        <select
                            id="region"
                            name="region"
                            value={formData.region}
                            onChange={handleInputChange}
                            className="w-full bg-darkbg-light border border-slate-600 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                        >
                            <option value="us-west">us-west</option>
                            <option value="us-east">us-east</option>
                            <option value="eu-central-1">eu-central-1</option>
                        </select>
                        <p className="text-xs text-slate-400 mt-1">Select the region matching your Twilio account region. If unsure, choose based on call destination.</p>
                    </div>
                    
                    <div>
                        <label htmlFor="country" className="block text-sm font-medium mb-1">Country</label>
                        <select
                            id="country"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            className="w-full bg-darkbg-light border border-slate-600 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                        >
                            <option value="us">United States (+1)</option>
                            <option value="gb">United Kingdom (+44)</option>
                            <option value="ca">Canada (+1)</option>
                        </select>
                    </div>
                    
                    <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1">Phone Number</label>
                        <input
                            type="text"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            placeholder="+1234567890"
                            className="w-full bg-darkbg-light border border-slate-600 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="twilioSid" className="block text-sm font-medium mb-1">Twilio SID (Optional)</label>
                        <input
                            type="text"
                            id="twilioSid"
                            name="twilioSid"
                            value={formData.twilioSid}
                            onChange={handleInputChange}
                            placeholder="PNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                            className="w-full bg-darkbg-light border border-slate-600 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                        />
                        <p className="text-xs text-slate-400 mt-1">Enter the Twilio SID for this phone number (starts with PN).</p>
                    </div>
                    
                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-900/30 border border-red-500 rounded text-red-200 text-sm">
                            ❌ {error}
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div className="px-6 py-4 bg-darkbg-light flex justify-between items-center rounded-b-lg">
                    <a href="#" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline flex items-center">
                        Tutorials
                        <ArrowUpRightIcon className="h-4 w-4 ml-1" />
                    </a>
                    <div className="flex space-x-3">
                        <button 
                            onClick={onClose} 
                            disabled={loading}
                            className="text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Close
                        </button>
                        <button 
                            onClick={handleImport} 
                            disabled={loading}
                            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Importing...
                                </>
                            ) : (
                                'Import'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Connect Twilio Number Modal - Integrated Setup
const ConnectTwilioNumberModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onNumberAdded: () => void;
}> = ({ isOpen, onClose, user, onNumberAdded }) => {
  const [formData, setFormData] = useState({
    twilioAccountSid: '',
    twilioAuthToken: '',
    phoneNumber: '',
    region: 'us-west'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1); // Step 1: Credentials, Step 2: Phone Number
  const [availableNumbers, setAvailableNumbers] = useState<Array<{ phoneNumber: string; friendlyName: string; capabilities: any; sid: string }>>([]);
  const [fetchingNumbers, setFetchingNumbers] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateCredentials = async () => {
    try {
      setLoading(true);
      setError('');

      if (!formData.twilioAccountSid || !formData.twilioAuthToken) {
        throw new Error('Both Account SID and Auth Token are required');
      }

      if (!formData.twilioAccountSid.startsWith('AC')) {
        throw new Error('Account SID should start with "AC"');
      }

      if (formData.twilioAuthToken.length < 32) {
        throw new Error('Auth Token appears to be invalid (too short)');
      }

      // Validate credentials by making an API call to the backend
      const response = await fetch(`${getApiBaseUrl()}/validate-twilio-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountSid: formData.twilioAccountSid,
          authToken: formData.twilioAuthToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to validate Twilio credentials');
      }

      setSuccess('✅ Credentials validated successfully! Fetching your phone numbers...');
      
      // Fetch available phone numbers from Twilio
      setFetchingNumbers(true);
      try {
        const numbers = await twilioNumberService.fetchAvailableNumbers(
          formData.twilioAccountSid,
          formData.twilioAuthToken
        );
        setAvailableNumbers(numbers);
        
        if (numbers.length === 0) {
          setError('No phone numbers found in your Twilio account. Please purchase a number first.');
          setSuccess('');
        } else {
          setTimeout(() => {
            setSuccess('');
            setStep(2);
          }, 1000);
        }
      } catch (fetchError: any) {
        console.error('Error fetching numbers:', fetchError);
        setError('Failed to fetch phone numbers: ' + fetchError.message);
        setSuccess('');
      } finally {
        setFetchingNumbers(false);
      }
    } catch (error: any) {
      console.error('Error validating credentials:', error);
      setError(error.message || 'Failed to validate credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectNumber = async () => {
    try {
      setLoading(true);
      setError('');

      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!formData.phoneNumber) {
        throw new Error('Phone number is required');
      }

      if (!formData.phoneNumber.startsWith('+')) {
        throw new Error('Phone number must start with + (E.164 format)');
      }

      // Add the Twilio number with credentials
      const result = await twilioNumberService.addTwilioNumber(
        user.id,
        formData.phoneNumber,
        formData.region,
        formData.twilioAccountSid,
        formData.twilioAuthToken
      );

      setSuccess('✅ Twilio number connected successfully!');
      setTimeout(() => {
        onNumberAdded();
        handleClose();
      }, 1500);
    } catch (error: any) {
      console.error('Error connecting Twilio number:', error);
      setError(error.message || 'Failed to connect Twilio number');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      twilioAccountSid: '',
      twilioAuthToken: '',
      phoneNumber: '',
      region: 'us-west'
    });
    setError('');
    setSuccess('');
    setStep(1);
    setAvailableNumbers([]);
    setFetchingNumbers(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={handleClose}>
      <div
        className="bg-darkbg text-slate-200 rounded-lg shadow-xl w-full max-w-2xl transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Connect Twilio Number</h2>
            <span className="text-sm text-slate-400">Step {step} of 2</span>
          </div>
          
          <p className="text-sm text-slate-400 mb-4">
            {step === 1 
              ? 'Enter your Twilio Account SID and Auth Token to authenticate. You can find these in your Twilio Console.'
              : `Select a phone number from your Twilio account (${availableNumbers.length} number${availableNumbers.length !== 1 ? 's' : ''} available).`}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded text-red-200">
              ❌ {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-500 rounded text-green-200">
              {success}
            </div>
          )}

          <div className="space-y-4">
            {step === 1 ? (
              <>
                <div>
                  <label htmlFor="twilioAccountSid" className="block text-sm font-medium mb-1">
                    Twilio Account SID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="twilioAccountSid"
                    name="twilioAccountSid"
                    value={formData.twilioAccountSid}
                    onChange={handleInputChange}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-darkbg-light border border-slate-600 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Find this in your Twilio Console under Account Info (starts with AC)
                  </p>
                </div>

                <div>
                  <label htmlFor="twilioAuthToken" className="block text-sm font-medium mb-1">
                    Twilio Auth Token <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="twilioAuthToken"
                    name="twilioAuthToken"
                    value={formData.twilioAuthToken}
                    onChange={handleInputChange}
                    placeholder="Your Auth Token"
                    className="w-full bg-darkbg-light border border-slate-600 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Your Auth Token is displayed in your Twilio Console. Keep this secure!
                  </p>
                </div>
              </>
            ) : (
              <>
                {fetchingNumbers ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                    <p className="text-slate-400">Fetching your Twilio phone numbers...</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="region" className="block text-sm font-medium mb-1">
                        Region <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="region"
                        name="region"
                        value={formData.region}
                        onChange={handleInputChange}
                        className="w-full bg-darkbg-light border border-slate-600 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="us-west">US West</option>
                        <option value="us-east">US East</option>
                        <option value="eu-central-1">EU Central</option>
                        <option value="ie">Ireland</option>
                        <option value="sg">Singapore</option>
                        <option value="au">Australia</option>
                      </select>
                      <p className="mt-1 text-xs text-slate-400">
                        Select the region closest to your call destinations
                      </p>
                    </div>

                    <div>
                      <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="w-full bg-darkbg-light border border-slate-600 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="">-- Select a phone number --</option>
                        {availableNumbers.map((num) => (
                          <option key={num.sid} value={num.phoneNumber}>
                            {num.phoneNumber} {num.friendlyName ? `(${num.friendlyName})` : ''}
                            {num.capabilities?.voice ? ' • Voice' : ''}
                            {num.capabilities?.sms ? ' • SMS' : ''}
                            {num.capabilities?.mms ? ' • MMS' : ''}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-slate-400">
                        Select a phone number from your Twilio account to connect.
                      </p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-darkbg-light flex justify-between items-center rounded-b-lg">
          <button
            onClick={step === 1 ? handleClose : () => setStep(1)}
            className="text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-700"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={step === 1 ? validateCredentials : handleConnectNumber}
            disabled={loading || (step === 1 && (!formData.twilioAccountSid || !formData.twilioAuthToken)) || (step === 2 && !formData.phoneNumber)}
            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (step === 1 ? 'Validating...' : 'Connecting...') : (step === 1 ? 'Validate Credentials' : 'Connect Number')}
          </button>
        </div>
      </div>
    </div>
  );
};


const PhoneNoPage: React.FC = () => {
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
    const [agents, setAgents] = useState<VoiceAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [editingPhoneNumber, setEditingPhoneNumber] = useState<PhoneNumber | null>(null);
    const [selectedAgentId, setSelectedAgentId] = useState('');
    const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [isAddTwilioModalOpen, setAddTwilioModalOpen] = useState(false);
    const [isCallModalOpen, setCallModalOpen] = useState(false);
    const [isMakeCallModalOpen, setMakeCallModalOpen] = useState(false);
    const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<PhoneNumber | null>(null);
    const [twilioPhoneNumbers, setTwilioPhoneNumbers] = useState<any[]>([]);
    const [callHistory, setCallHistory] = useState<any[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            loadPhoneNumbers();
            loadAgents();
            loadTwilioPhoneNumbers();
            loadCallHistory();
        }
    }, [user]);
    
    const loadTwilioPhoneNumbers = async () => {
        if (!user) return;
        try {
            const numbers = await twilioBasicService.getPhoneNumbers(user.id);
            setTwilioPhoneNumbers(numbers);
        } catch (error) {
            console.error('Error loading Twilio phone numbers:', error);
        }
    };
    
    const loadCallHistory = async () => {
        if (!user) return;
        try {
            const calls = await twilioBasicService.getCalls(user.id, 20);
            setCallHistory(calls);
        } catch (error) {
            console.error('Error loading call history:', error);
            // Don't show alert to user as it might be confusing
            // Call history section will simply not be displayed if there's an error
        }
    };

    const loadPhoneNumbers = async () => {
        try {
            setLoading(true);
            if (!user) {
                throw new Error('User not authenticated');
            }
            const data = await phoneNumberService.getPhoneNumbers(user.id);
            console.log('Raw phone numbers from API:', data);
            
            // Map database column names to frontend property names
            const mappedData = data.map((phone: any) => {
                const mapped = {
                    ...phone,
                    createdDate: phone.created_at || phone.createdDate || phone.purchased_at,
                    agentId: phone.agent_id || phone.agentId,
                    agentName: phone.agent_name || phone.agentName,
                    countryCode: phone.country_code || phone.countryCode,
                    nextCycle: phone.next_cycle || phone.nextCycle,
                    twilioSid: phone.twilio_sid || phone.twilioSid
                };
                console.log('Mapped phone number:', mapped);
                return mapped;
            });
            setPhoneNumbers(mappedData);
        } catch (error) {
            console.error('Error loading phone numbers:', error);
            alert('Failed to load phone numbers');
        } finally {
            setLoading(false);
        }
    };

    const loadAgents = async () => {
        try {
            if (!user) {
                throw new Error('User not authenticated');
            }
            const agentData = await agentService.getAgents(user.id);
            setAgents(agentData);
        } catch (error) {
            console.error('Error loading agents:', error);
            // Don't show alert here as it might be confusing to show two alerts
        }
    };
    
    useEffect(() => {
        const handleClickOutside = () => {
            setActiveDropdown(null);
        };
        window.addEventListener('click', handleClickOutside);
        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const formatDateTime = (isoString: string) => {
        if (!isoString) {
            return { date: 'N/A', time: 'N/A' };
        }
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) {
                return { date: 'Invalid Date', time: '' };
            }
            const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            const timePart = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
            return { date: datePart, time: timePart };
        } catch (error) {
            console.error('Error formatting date:', error, isoString);
            return { date: 'Invalid Date', time: '' };
        }
    };

    const handleToggleDropdown = (e: React.MouseEvent, numberId: string) => {
        e.stopPropagation();
        setActiveDropdown(activeDropdown === numberId ? null : numberId);
    };

    const openEditModal = (phoneNumber: PhoneNumber) => {
        setEditingPhoneNumber(phoneNumber);
        setSelectedAgentId(phoneNumber.agentId || '');
        setEditModalOpen(true);
        setActiveDropdown(null);
    };

    const openCallModal = (phoneNumber: PhoneNumber) => {
        setSelectedPhoneNumber(phoneNumber);
        setCallModalOpen(true);
        setActiveDropdown(null);
    };
    
    const openMakeCallModal = (phoneNumber: any) => {
        setSelectedPhoneNumber({ ...phoneNumber, number: phoneNumber.number } as PhoneNumber);
        setMakeCallModalOpen(true);
        setActiveDropdown(null);
    };
    
    const handleMakeCall = async (from: string, to: string, agentId: string) => {
        if (!user) {
            alert('User not authenticated');
            return;
        }
        
        try {
            const call = await twilioBasicService.makeCall(user.id, from, to, agentId);
            alert(`Call initiated with agent! Call SID: ${call.callSid}`);
            setMakeCallModalOpen(false);
            loadCallHistory();
        } catch (error: any) {
            alert('Failed to make call: ' + error.message);
        }
    };

    const handleSaveAgentAssignment = async () => {
        if (!editingPhoneNumber) return;
        
        try {
            console.log('Saving agent assignment:', { 
                userId: user!.id, 
                phoneNumberId: editingPhoneNumber.id, 
                selectedAgentId: selectedAgentId
            });
            
            let updateData: Partial<any> = {};
            
            if (!selectedAgentId) {
                // Unassigning agent
                updateData = {
                    agentId: null,
                    agentName: ''
                };
            } else {
                // Assigning agent
                const selectedAgent = agents.find(a => a.id === selectedAgentId);
                if (!selectedAgent) {
                    throw new Error('Selected agent not found');
                }
                updateData = {
                    agentId: selectedAgentId,
                    agentName: selectedAgent.name
                };
            }
            
            const updatedPhoneNumber = await phoneNumberService.updatePhoneNumber(user!.id, editingPhoneNumber.id, updateData);
            
            // Map the returned data to match frontend field names
            const mappedPhoneNumber = {
                ...updatedPhoneNumber,
                createdDate: updatedPhoneNumber.created_at || updatedPhoneNumber.createdDate,
                agentId: updatedPhoneNumber.agent_id || updatedPhoneNumber.agentId,
                agentName: updatedPhoneNumber.agent_name || updatedPhoneNumber.agentName,
                countryCode: updatedPhoneNumber.country_code || updatedPhoneNumber.countryCode,
                nextCycle: updatedPhoneNumber.next_cycle || updatedPhoneNumber.nextCycle,
                twilioSid: updatedPhoneNumber.twilio_sid || updatedPhoneNumber.twilioSid
            };
            
            setPhoneNumbers(phoneNumbers.map(pn => 
                pn.id === editingPhoneNumber.id ? mappedPhoneNumber : pn
            ));
            
            setEditModalOpen(false);
            setEditingPhoneNumber(null);
        } catch (error) {
            console.error('Error updating phone number:', error);
            alert('Failed to update phone number: ' + (error as Error).message);
        }
    };
    
    const handleDeleteNumber = async (numberId: string) => {
        if (window.confirm("Are you sure you want to delete this phone number?")) {
            try {
                await phoneNumberService.deletePhoneNumber(user!.id, numberId);
                setPhoneNumbers(phoneNumbers.filter(pn => pn.id !== numberId));
            } catch (error) {
                console.error('Error deleting phone number:', error);
                alert('Failed to delete phone number');
            }
        }
        setActiveDropdown(null);
    };

    // Handle redirect to Twilio for purchasing numbers
    const handleBuyNumber = () => {
        // Redirect to Twilio's phone number purchasing page
        window.open('https://www.twilio.com/console/phone-numbers/search', '_blank');
        setPurchaseModalOpen(false);
    };

    const handleCallStarted = (callId: string) => {
        console.log('Call started with ID:', callId);
        // In a real implementation, you might want to track the call or update UI
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <>
            <Header title="Phone Numbers">
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => setAddTwilioModalOpen(true)}
                        className="btn-animate bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg flex items-center transition"
                    >
                        <PhoneIcon className="h-5 w-5 mr-2" />
                        <span className="hidden sm:inline">Add Twilio Number</span>
                        <span className="sm:hidden">Add Twilio</span>
                    </button>
                    <button
                        onClick={() => setImportModalOpen(true)}
                        className="btn-animate bg-white dark:bg-darkbg-light border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-darkbg text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg flex items-center transition"
                    >
                         <ImportIcon className="h-5 w-5 mr-2" />
                        <span className="hidden sm:inline">Import Number</span>
                        <span className="sm:hidden">Import</span>
                    </button>
                    <button
                        onClick={handleBuyNumber}
                        className="btn-animate bg-white dark:bg-darkbg-light border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-darkbg text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg flex items-center transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        <span className="hidden sm:inline">Buy Number</span>
                        <span className="sm:hidden">Buy</span>
                    </button>
                </div>
            </Header>

            <div className="bg-white dark:bg-darkbg-light rounded-lg shadow-md overflow-x-auto card-animate animate-fade-in">
                <div className="min-w-[900px]">
                    {/* Table Header */}
                    <div className="flex px-3 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold tracking-wider">
                        <div className="w-[30%]">Phone</div>
                        <div className="w-[20%]">Agent</div>
                        <div className="w-[15%]">Region</div>
                        <div className="w-[15%]">Created</div>
                        <div className="w-[15%]">Next Cycle</div>
                        <div className="w-[5%]"></div>
                    </div>

                    {/* Table Body */}
                    <div className="stagger-children">
                        {phoneNumbers.map((phone, idx) => (
                            <div key={phone.id} style={{ animationDelay: `${idx * 0.05}s` }} className="flex items-center px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 last:border-b-0 hover:bg-slate-50 dark:hover:bg-darkbg transition-colors duration-150">
                                {/* Phone */}
                                <div className="w-[30%] flex items-center pr-4">
                                    <div className="flex-shrink-0 w-8 sm:w-10 h-8 sm:h-10 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center mr-2 sm:mr-4">
                                        <PhoneIcon className="h-4 sm:h-5 w-4 sm:w-5 text-slate-500 dark:text-slate-400" />
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="uppercase text-xs font-bold bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md">{phone.countryCode}</span>
                                        <span className="font-mono text-slate-800 dark:text-slate-100 text-xs sm:text-sm">{phone.number}</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md">{phone.source}</span>
                                    </div>
                                </div>
                                
                                {/* Agent */}
                                <div className="w-[20%] text-xs sm:text-sm flex items-center">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mr-2">
                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                        </svg>
                                    </div>
                                    <span className="font-medium mr-2 text-slate-800 dark:text-slate-100">{phone.agentName || 'Unassigned'}</span>
                                    <button onClick={() => openEditModal(phone)} className="text-slate-500 hover:text-primary transform hover:scale-110"><EditIcon className="h-4 w-4"/></button>
                                </div>

                                {/* Region */}
                                <div className="w-[15%] text-xs sm:text-sm text-slate-600 dark:text-slate-300">{phone.region}</div>

                                {/* Created */}
                                 <div className="w-[15%] text-xs sm:text-sm">
                                    <div className="text-slate-800 dark:text-slate-100">{formatDateTime(phone.createdDate).date}</div>
                                    <div className="text-slate-500 dark:text-slate-400 text-xs">{formatDateTime(phone.createdDate).time}</div>
                                </div>

                                {/* Next Cycle */}
                                <div className="w-[15%] text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                                    {phone.nextCycle ? (
                                        (() => {
                                            try {
                                                const date = new Date(phone.nextCycle);
                                                return isNaN(date.getTime()) ? 'Invalid cycle' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                            } catch (e) {
                                                return 'Invalid cycle';
                                            }
                                        })()
                                    ) : 'N/A'}
                                </div>


                                {/* Actions */}
                                <div className="w-[5%] flex justify-end relative">
                                    <button onClick={(e) => handleToggleDropdown(e, phone.id)} className="p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors transform hover:scale-110">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                                    </button>
                                    {activeDropdown === phone.id && (
                                        <div
                                            className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-darkbg-light border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-50"
                                            onClick={(e) => e.stopPropagation()} 
                                        >
                                            <ul className="py-1">
                                                <li><a href="#" onClick={(e) => { e.preventDefault(); openEditModal(phone); }} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkbg">Re-assign Agent</a></li>
                                                <li><a href="#" onClick={(e) => { e.preventDefault(); openCallModal(phone); }} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkbg">Start AI Call</a></li>
                                                <li><a href="#" onClick={(e) => { e.preventDefault(); openMakeCallModal(phone); }} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkbg">Make Call</a></li>
                                                <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Releasing number..."); setActiveDropdown(null); }} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkbg">Release Number</a></li>
                                                <li><a href="#" onClick={(e) => { e.preventDefault(); handleDeleteNumber(phone.id); }} className="block px-4 py-2 text-sm text-red-500 hover:bg-slate-100 dark:hover:bg-darkbg">Delete</a></li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <ConnectTwilioNumberModal
              isOpen={isAddTwilioModalOpen}
              onClose={() => setAddTwilioModalOpen(false)}
              user={user}
              onNumberAdded={() => {
                loadPhoneNumbers();
                loadTwilioPhoneNumbers();
              }}
            />
            
            {/* Twilio Phone Numbers Section */}
            {twilioPhoneNumbers.length > 0 && (
                <div className="bg-white dark:bg-darkbg-light rounded-lg shadow-md mt-6">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Connected Twilio Numbers</h2>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {twilioPhoneNumbers.map((phone) => (
                            <div key={phone.id} className="px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <PhoneIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white">{phone.number}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Region: {phone.region}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => openMakeCallModal(phone)}
                                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium"
                                >
                                    Make Call
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Call History Section */}
            {callHistory && callHistory.length > 0 && (
                <div className="bg-white dark:bg-darkbg-light rounded-lg shadow-md mt-6">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Recent Calls</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">From</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">To</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Direction</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {callHistory.map((call) => (
                                    <tr key={call.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                        <td className="px-6 py-4 text-sm text-slate-800 dark:text-white">{call.fromNumber}</td>
                                        <td className="px-6 py-4 text-sm text-slate-800 dark:text-white">{call.toNumber}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs ${
                                                call.direction === 'inbound' 
                                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' 
                                                    : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                            }`}>
                                                {call.direction}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-800 dark:text-white">{call.status}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                            {new Date(call.timestamp).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            <ImportPhoneNumberModal 
              isOpen={isImportModalOpen} 
              onClose={() => setImportModalOpen(false)} 
              user={user}
              onPhoneNumberImported={(phoneNumber) => setPhoneNumbers(prev => [...prev, phoneNumber])}
            />

            <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Re-assign Agent">
                <div>
                    <p className="mb-4">Select a new agent for the number <span className="font-mono font-semibold">{editingPhoneNumber?.number}</span>.</p>
                    <select
                        value={selectedAgentId}
                        onChange={(e) => setSelectedAgentId(e.target.value)}
                        className="w-full mt-1 p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-primary focus:border-primary"
                    >
                        <option value="">Unassigned</option>
                        {agents.map(agent => (
                            <option key={agent.id} value={agent.id}>
                                {agent.name}
                            </option>
                        ))}
                    </select>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button onClick={() => setEditModalOpen(false)} className="bg-slate-200 dark:bg-slate-600 px-4 py-2 rounded-md font-semibold">Cancel</button>
                        <button onClick={handleSaveAgentAssignment} className="bg-primary text-white px-4 py-2 rounded-md font-semibold">Save Changes</button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isPurchaseModalOpen}
                onClose={() => setPurchaseModalOpen(false)}
                title="Purchase Phone Number"
            >
                <div>
                    <p className="text-slate-600 dark:text-slate-300">
                        You will be redirected to Twilio's website to purchase a phone number.
                    </p>
                    <div className="flex justify-end items-center gap-4 mt-8">
                        <button
                            onClick={() => setPurchaseModalOpen(false)}
                            className="py-2 px-4 rounded-lg font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-darkbg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleBuyNumber}
                            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition"
                        >
                            Continue to Twilio
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isCallModalOpen}
                onClose={() => setCallModalOpen(false)}
                title="Start AI Call"
            >
                <div>
                    {selectedPhoneNumber && (
                        <CallInitiator
                            fromNumber={selectedPhoneNumber.number}
                            toNumber="+1234567890" // This would be user input in a real implementation
                            agentId={selectedPhoneNumber.agentId || ''}
                            onCallStarted={handleCallStarted}
                        />
                    )}
                </div>
            </Modal>
            
            {/* Make Call Modal */}
            <Modal
                isOpen={isMakeCallModalOpen}
                onClose={() => setMakeCallModalOpen(false)}
                title="Make Call"
            >
                <MakeCallModal
                    phoneNumber={selectedPhoneNumber}
                    onMakeCall={handleMakeCall}
                    onClose={() => setMakeCallModalOpen(false)}
                />
            </Modal>
        </>
    );
};

// Make Call Modal Component
const MakeCallModal: React.FC<{
    phoneNumber: PhoneNumber | null;
    onMakeCall: (from: string, to: string, agentId: string) => void;
    onClose: () => void;
}> = ({ phoneNumber, onMakeCall, onClose }) => {
    const [toNumber, setToNumber] = useState('');
    const [selectedAgentId, setSelectedAgentId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [agents, setAgents] = useState<any[]>([]);
    const { user } = useAuth();

    // Load agents on component mount
    React.useEffect(() => {
        const loadAgents = async () => {
            if (!user) return;
            try {
                const agentData = await agentService.getAgents(user.id);
                setAgents(agentData);
                
                // If phone number has a pre-assigned agent, use that
                if (phoneNumber?.agentId) {
                    setSelectedAgentId(phoneNumber.agentId);
                } else if (agentData.length > 0) {
                    // Otherwise auto-select first agent if available
                    setSelectedAgentId(agentData[0].id);
                }
            } catch (err) {
                console.error('Failed to load agents:', err);
            }
        };
        loadAgents();
    }, [user, phoneNumber]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber || !toNumber) {
            setError('Please enter a destination number');
            return;
        }
        if (!selectedAgentId) {
            setError('Please select an agent');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            await onMakeCall(phoneNumber.number, toNumber, selectedAgentId);
            setToNumber('');
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-800 dark:text-red-200 text-sm">
                    {error}
                </div>
            )}
            
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    From Number
                </label>
                <input
                    type="text"
                    value={phoneNumber?.number || ''}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-600 dark:text-slate-400"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Select Agent <span className="text-red-500">*</span>
                </label>
                {agents.length === 0 ? (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-yellow-800 dark:text-yellow-200 text-sm">
                        No agents available. Please create an agent first.
                    </div>
                ) : (
                    <select
                        value={selectedAgentId}
                        onChange={(e) => setSelectedAgentId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-primary focus:border-primary"
                        required
                    >
                        <option value="">-- Select an Agent --</option>
                        {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                                {agent.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    To Number <span className="text-red-500">*</span>
                </label>
                <input
                    type="tel"
                    value={toNumber}
                    onChange={(e) => {
                        setToNumber(e.target.value);
                        setError('');
                    }}
                    placeholder="+919xxxxxxxxx"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-primary focus:border-primary"
                    required
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Enter the destination number in E.164 format
                </p>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading || !toNumber || !selectedAgentId || agents.length === 0}
                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg disabled:opacity-50"
                >
                    {loading ? 'Calling...' : 'Make Call'}
                </button>
            </div>
        </form>
    );
};

export default PhoneNoPage;