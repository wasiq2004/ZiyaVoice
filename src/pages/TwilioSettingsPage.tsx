import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../utils/api';

interface TwilioConfig {
  appUrl: string;
  accountSid?: string;
  authToken?: string;
  apiKeySid?: string;
  apiKeySecret?: string;
}

const TwilioSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<TwilioConfig>({
    appUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [user?.id]);

  const loadConfig = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const response = await fetch(`${api.getApiBaseUrl()}/twilio/config?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConfig(data.data || { appUrl: '' });
        }
      }
    } catch (err) {
      console.error('Error loading config:', err);
      setMessage('Failed to load Twilio settings');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!user?.id || !config.appUrl.trim()) {
      setMessage('❌ Please enter a valid webhook URL');
      setMessageType('error');
      return;
    }

    // Validate URL format
    try {
      new URL(config.appUrl);
    } catch {
      setMessage('❌ Invalid URL format. Must start with http:// or https://');
      setMessageType('error');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${api.getApiBaseUrl()}/twilio/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          appUrl: config.appUrl,
          apiKeySid: config.apiKeySid || undefined,
          apiKeySecret: config.apiKeySecret || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage('✅ Webhook URL saved successfully!');
        setMessageType('success');
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage('❌ ' + (data.message || 'Failed to save config'));
        setMessageType('error');
      }
    } catch (err) {
      setMessage('❌ Error saving configuration');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-darkbg text-white min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🔧 Twilio Webhook Settings</h1>
          <p className="text-gray-400">Configure how Twilio communicates with your application</p>
        </div>

        {/* Main Settings Card */}
        <div className="bg-[#1E293B] rounded-lg border border-gray-700 p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <span className="mr-3 text-2xl">🌐</span>
            Webhook URL Configuration
          </h2>

          <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-200">
              <strong>📌 Important:</strong> The webhook URL is where Twilio sends callbacks about your calls (status updates, recordings, etc.)
            </p>
          </div>

          {/* Current Environment Info */}
          <div className="mb-6 p-4 bg-[#0F172A] rounded-lg border border-gray-700">
            <h3 className="font-semibold mb-3 text-sm">📍 Current Environment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Current URL:</span>
                <code className="bg-gray-900 px-3 py-1 rounded text-emerald-400">
                  {config.appUrl || 'Not configured'}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`px-3 py-1 rounded text-xs font-semibold ${
                  config.appUrl ? 'bg-emerald-900 text-emerald-300' : 'bg-gray-700 text-gray-300'
                }`}>
                  {config.appUrl ? '✅ Configured' : '⚠️ Not Set'}
                </span>
              </div>
            </div>
          </div>

          {/* Webhook URL Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3">
              Webhook URL
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              placeholder="https://yourdomain.com (without /api/twilio/webhook)"
              value={config.appUrl}
              onChange={(e) => setConfig({ ...config, appUrl: e.target.value })}
              className="w-full bg-[#0F172A] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
            <p className="text-xs text-gray-400 mt-2">
              Example: <code className="bg-gray-900 px-2 py-1 rounded">https://yourdomain.com</code>
            </p>
          </div>

          {/* Messages */}
          {message && (
            <div className={`rounded-lg p-4 mb-6 border ${
              messageType === 'success'
                ? 'bg-emerald-900 border-emerald-700 text-emerald-200'
                : 'bg-red-900 border-red-700 text-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center ${
              saving
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <span className="mr-2">💾</span>
                Save Webhook URL
              </>
            )}
          </button>
        </div>

        {/* How It Works */}
        <div className="bg-[#1E293B] rounded-lg border border-gray-700 p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <span className="mr-3 text-2xl">📋</span>
            How Webhook URL Works
          </h2>

          <div className="space-y-6">
            {/* Development Setup */}
            <div className="p-4 bg-[#0F172A] rounded-lg border border-gray-700">
              <h3 className="font-semibold mb-3 flex items-center text-yellow-400">
                <span className="mr-2">🧪</span> Development (Localhost)
              </h3>
              <ol className="space-y-2 text-sm text-gray-300 ml-6 list-decimal">
                <li>Download and run <code className="bg-gray-900 px-2 py-1 rounded">ngrok http 3000</code></li>
                <li>Copy the HTTPS URL from ngrok output (e.g., <code className="bg-gray-900 px-2 py-1 rounded">https://abc123.ngrok.io</code>)</li>
                <li>Paste it in the Webhook URL field above</li>
                <li>Click "Save Webhook URL"</li>
                <li>Twilio will send callbacks to: <code className="bg-gray-900 px-2 py-1 rounded">https://abc123.ngrok.io/api/twilio/webhook</code></li>
              </ol>
            </div>

            {/* Production Setup */}
            <div className="p-4 bg-[#0F172A] rounded-lg border border-gray-700">
              <h3 className="font-semibold mb-3 flex items-center text-emerald-400">
                <span className="mr-2">🚀</span> Production (After Deployment)
              </h3>
              <ol className="space-y-2 text-sm text-gray-300 ml-6 list-decimal">
                <li>After deploying your app to a server, you'll have a real domain (e.g., <code className="bg-gray-900 px-2 py-1 rounded">https://yourdomain.com</code>)</li>
                <li>Come back to this page</li>
                <li>Replace the ngrok URL with your real domain</li>
                <li>Click "Save Webhook URL"</li>
                <li>Twilio will now send all callbacks to your production server</li>
              </ol>
            </div>

            {/* Callback Information */}
            <div className="p-4 bg-[#0F172A] rounded-lg border border-gray-700">
              <h3 className="font-semibold mb-3">📨 What Twilio Sends to Your Webhook</h3>
              <div className="text-sm text-gray-300 space-y-2">
                <p><strong>Call Status Updates:</strong> initiated, ringing, answered, completed, failed, busy, no-answer</p>
                <p><strong>Call Details:</strong> Call SID, From number, To number, Duration</p>
                <p><strong>Recordings:</strong> Recording URL when call is recorded</p>
                <p className="text-gray-400 mt-3">Your webhook endpoint (<code className="bg-gray-900 px-2 py-1 rounded">/api/twilio/webhook</code>) processes all these events and updates your database.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Implementation Details */}
        <div className="bg-[#1E293B] rounded-lg border border-gray-700 p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <span className="mr-3 text-2xl">⚙️</span>
            Technical Details
          </h2>

          <div className="space-y-6">
            {/* Webhook Endpoint */}
            <div className="p-4 bg-[#0F172A] rounded-lg border border-gray-700">
              <h3 className="font-semibold mb-3">🔗 Webhook Endpoint</h3>
              <code className="block bg-gray-900 p-4 rounded text-emerald-400 text-sm overflow-x-auto">
                POST {config.appUrl}/api/twilio/webhook
              </code>
              <p className="text-xs text-gray-400 mt-2">
                This endpoint receives all Twilio callbacks automatically (no configuration needed on Twilio side)
              </p>
            </div>

            {/* Environment Variables */}
            <div className="p-4 bg-[#0F172A] rounded-lg border border-gray-700">
              <h3 className="font-semibold mb-3">🔐 Environment Variables (Backend)</h3>
              <div className="bg-gray-900 p-4 rounded text-xs overflow-x-auto">
                <code className="text-blue-400">
VITE_API_BASE_URL=https://yourdomain.com/api<br/>
TWILIO_WEBHOOK_URL=https://yourdomain.com/api/twilio/webhook<br/>
NODE_ENV=production
                </code>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Update these after deploying to production
              </p>
            </div>

            {/* Frontend Configuration */}
            <div className="p-4 bg-[#0F172A] rounded-lg border border-gray-700">
              <h3 className="font-semibold mb-3">📱 Frontend Configuration</h3>
              <div className="bg-gray-900 p-4 rounded text-xs overflow-x-auto">
                <code className="text-blue-400">
# In your .env.production file:<br/>
VITE_API_BASE_URL=https://yourdomain.com/api
                </code>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                The frontend uses this to make API calls to your backend
              </p>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-[#1E293B] rounded-lg border border-gray-700 p-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <span className="mr-3 text-2xl">🔍</span>
            Troubleshooting
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-[#0F172A] rounded-lg border border-gray-700">
              <h3 className="font-semibold text-red-400 mb-2">❌ "Webhook URL not receiving callbacks"</h3>
              <ul className="list-disc ml-6 text-sm text-gray-300 space-y-1">
                <li>Make sure ngrok is running and the URL is active</li>
                <li>Check that your firewall isn't blocking Twilio IPs</li>
                <li>Verify the URL is publicly accessible (try opening it in browser)</li>
              </ul>
            </div>

            <div className="p-4 bg-[#0F172A] rounded-lg border border-gray-700">
              <h3 className="font-semibold text-red-400 mb-2">❌ "Call status not updating"</h3>
              <ul className="list-disc ml-6 text-sm text-gray-300 space-y-1">
                <li>Check server logs for webhook events: <code className="bg-gray-900 px-2 py-1 rounded text-xs">npm run server</code></li>
                <li>Verify database connection is working</li>
                <li>Make sure webhook endpoint is returning 200 status</li>
              </ul>
            </div>

            <div className="p-4 bg-[#0F172A] rounded-lg border border-gray-700">
              <h3 className="font-semibold text-red-400 mb-2">❌ "Certificate error with ngrok"</h3>
              <ul className="list-disc ml-6 text-sm text-gray-300 space-y-1">
                <li>Twilio requires HTTPS (ngrok provides this by default)</li>
                <li>Use the HTTPS URL from ngrok, not HTTP</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Reference */}
        <div className="mt-8 bg-emerald-900 bg-opacity-20 border border-emerald-700 rounded-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center text-emerald-400">
            <span className="mr-2">✨</span>Quick Reference
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 mb-2"><strong>Current Setup (What you see):</strong></p>
              <code className="bg-gray-900 px-3 py-2 rounded block text-xs text-emerald-400">
                Localhost with ngrok
              </code>
            </div>
            <div>
              <p className="text-gray-400 mb-2"><strong>Future Setup (After deployment):</strong></p>
              <code className="bg-gray-900 px-3 py-2 rounded block text-xs text-emerald-400">
                Your real domain
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwilioSettingsPage;
