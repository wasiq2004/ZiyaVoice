import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface CallInitiatorProps {
  fromNumber: string;
  toNumber: string;
  agentId: string;
  onCallStarted: (callId: string) => void;
}

const CallInitiator: React.FC<CallInitiatorProps> = ({ 
  fromNumber, 
  toNumber, 
  agentId,
  onCallStarted 
}) => {
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState('');
  const { user } = useAuth();

  const startCall = async () => {
    if (!user) {
      setCallStatus('You must be logged in to make calls');
      return;
    }

    setIsCalling(true);
    setCallStatus('Initiating call...');

    try {
      // In a real implementation, you would get these from the agent configuration
      const provider = 'twilio';
      const model = 'gemini-2.5-flash'; // Default to Gemini
      const voiceId = 'eleven-rachel'; // Default voice

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
      const response = await fetch(`${apiBaseUrl}/call/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromNumber,
          to: toNumber,
          provider,
          model,
          voiceId,
          userId: user.id,
          agentId
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCallStatus(`Call initiated successfully. Call ID: ${result.data.callId}`);
        onCallStarted(result.data.callId);
      } else {
        setCallStatus(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error starting call:', error);
      setCallStatus('Failed to initiate call');
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <div className="bg-white dark:bg-darkbg-light rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Start AI Call</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">From Number</label>
          <input
            type="text"
            value={fromNumber}
            readOnly
            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-100 dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">To Number</label>
          <input
            type="text"
            value={toNumber}
            readOnly
            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-100 dark:bg-slate-800"
          />
        </div>
        <button
          onClick={startCall}
          disabled={isCalling}
          className={`w-full py-2 px-4 rounded-md font-semibold ${
            isCalling
              ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed'
              : 'bg-primary hover:bg-primary-dark text-white'
          }`}
        >
          {isCalling ? 'Calling...' : 'Start AI Call'}
        </button>
        {callStatus && (
          <div className="mt-4 p-3 rounded-md bg-slate-100 dark:bg-slate-800">
            <p className="text-sm">{callStatus}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallInitiator;