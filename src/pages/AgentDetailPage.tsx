import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceAgent, ToolType, PreActionPhraseMode, Tool, VoiceAgentSettings, ToolHeader, ToolParameter } from '../types';
import {
    DocumentDuplicateIcon,
    EditIcon,
    ModelIcon,
    VoiceIcon,
    LanguageIcon,
    ToolsIcon,
    AVAILABLE_VOICE_PROVIDERS,
    AVAILABLE_VOICES,
    getVoiceNameById,
    AVAILABLE_MODELS,
    AVAILABLE_LANGUAGES,
    TrashIcon,
    EmbedIcon,
    CustomLlmIcon,
    SipPhoneIcon,
    KnowledgeIcon,
    WebhookIcon,
    PlayIcon,
    CheckIcon,
    MicrophoneIcon,
    getVoiceProviderById,
    AVAILABLE_LANGUAGES_BY_PROVIDER
} from '../constants';
import { PlusIcon, ArrowUpTrayIcon, DocumentTextIcon, XMarkIcon, StopIcon } from '@heroicons/react/24/outline';
import Modal from '../components/Modal';
import { GoogleGenAI, Chat, Modality, LiveServerMessage, type Blob } from '@google/genai';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { LLMService } from '../services/llmService';
import { DocumentService } from '../services/documentService';
import { ToolExecutionService } from '../services/toolExecutionService';
import { useAuth } from '../contexts/AuthContext';
import { encode, decode } from './audioHelpers';

interface AgentDetailPageProps {
    agent: VoiceAgent;
    onBack: () => void;
    updateAgent: (updatedAgent: VoiceAgent) => void;
    onDuplicate: (agent: VoiceAgent) => void;
    onDelete: (agentId: string) => void;
    userId?: string;
}

const SettingsCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-white dark:bg-darkbg-light rounded-lg shadow-sm">
        <div className="p-6">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-6">{title}</h3>
            <div className="space-y-6">{children}</div>
        </div>
    </div>
);

interface SettingsToggleProps {
    label: string;
    description: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    name: string;
    isBeta?: boolean;
    warning?: string;
}

const SettingsToggle: React.FC<SettingsToggleProps> = ({ label, description, checked, onChange, name, isBeta, warning }) => (
    <div className="flex items-start justify-between">
        <div>
            <label htmlFor={name} className="font-medium text-slate-700 dark:text-slate-200 flex items-center">
                {label}
                {isBeta && <span className="ml-2 text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Beta</span>}
            </label>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
            {warning && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Warning: {warning}</p>}
        </div>
        <label className="flex items-center cursor-pointer">
            <div className="relative">
                <input type="checkbox" id={name} name={name} className="sr-only" checked={checked} onChange={onChange} />
                <div className={`block w-11 h-6 rounded-full transition ${checked ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`}></div>
            </div>
        </label>
    </div>
);


const AgentDetailPage: React.FC<AgentDetailPageProps> = ({ agent: initialAgent, onBack, updateAgent, onDuplicate, onDelete, userId }) => {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    const [agent, setAgent] = useState<VoiceAgent>(initialAgent);
    const [editedAgent, setEditedAgent] = useState<VoiceAgent>(initialAgent);
    const [isEditingPrompt, setIsEditingPrompt] = useState(false);
    const [isActionsDropdownOpen, setActionsDropdownOpen] = useState(false);
    
    const [isModelModalOpen, setModelModalOpen] = useState(false);
    const [isVoiceModalOpen, setVoiceModalOpen] = useState(false);
    const [isLanguageModalOpen, setLanguageModalOpen] = useState(false);

    const [isToolsModalOpen, setToolsModalOpen] = useState(false);
    const [editingTool, setEditingTool] = useState<Tool | null>(null);

    const [isKnowledgeModalOpen, setKnowledgeModalOpen] = useState(false);
    
    // Voice preview state
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);
    const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
    
    // Call Agent State
    const [callAgentTab, setCallAgentTab] = useState<'web' | 'chat'>('web');
    const [isCallActive, setIsCallActive] = useState(false);
    
    // Add a useEffect to log when isCallActive changes
    useEffect(() => {
        console.log('isCallActive changed to:', isCallActive);
        // Update the debug ref to track the actual call state
        callActiveDebugRef.current = isCallActive;
    }, [isCallActive]);
    const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'agent', text: string }[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isAgentReplying, setIsAgentReplying] = useState(false);
    const [geminiChatSession, setGeminiChatSession] = useState<Chat | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    
    // Conversation history for voice calls
    const conversationHistoryRef = useRef<{ role: string; text: string }[]>([]);
    const greetingSentRef = useRef<boolean>(false);
    const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const callActiveDebugRef = useRef<boolean>(false);
    const webSocketRef = useRef<WebSocket | null>(null);  // Add this line for WebSocket connection
    
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const microphoneStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef<number>(0);

    const initialNewToolState: Omit<Tool, 'id' | 'preActionPhrases'> & { preActionPhrases: string } = {
        name: '', description: '', type: ToolType.Webhook, webhookUrl: '', method: 'POST',
        runAfterCall: false, preActionPhrasesMode: PreActionPhraseMode.Flexible, preActionPhrases: '', 
        parameters: [],
        headers: [],
    };
    const [newTool, setNewTool] = useState(initialNewToolState);
    const [newToolFunctionType, setNewToolFunctionType] = useState<'Webhook' | 'WebForm' | 'GoogleSheets'>('Webhook');

    const actionsDropdownRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages, isAgentReplying]);
    useEffect(() => {
        // For Gemini models, we don't need a persistent chat session since it's stateless
        const isGeminiModel = editedAgent.model.startsWith('gemini');
        
        // Only initialize a real chat session for compatible Gemini models
        if (editedAgent && editedAgent.identity && isGeminiModel) {
            if (!API_KEY) {
                setChatMessages([{ sender: 'agent' as const, text: 'The API_KEY is not configured. Chat and voice features are disabled.' }]);
                setGeminiChatSession(null);
                return;
            }
            
            try {
                const ai = new GoogleGenAI({ apiKey: API_KEY });
                const chat = ai.chats.create({
                    model: editedAgent.model,
                    config: { systemInstruction: editedAgent.identity },
                    history: [],
                });
                setGeminiChatSession(chat);
                setChatMessages([]); // Reset chat on agent/model change
            } catch (error) {
                console.error("Failed to initialize Gemini chat session:", error);
                setChatMessages([{ sender: 'agent' as const, text: 'Error: Could not connect to the AI model.' }]);
                setGeminiChatSession(null);
            }
        } else {
            // For other models or when identity is missing
            setGeminiChatSession(null);
            setChatMessages([]);
            // Clear conversation history
            conversationHistoryRef.current = [];
        }
    }, [editedAgent.id, editedAgent.identity, editedAgent.model, API_KEY]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(event.target as Node)) {
                setActionsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Audio helper functions

    const decodeAudioData = async (
        data: Uint8Array,
        ctx: AudioContext,
        sampleRate: number,
        numChannels: number,
    ): Promise<AudioBuffer> => {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
            }
        }
        return buffer;
    };
    
    const createBlob = (data: Float32Array): Blob => {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = data[i] * 32768;
        }
        return {
            data: encode(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
        };
    };
    
    // Helper functions to pause and resume speech recognition
    const pauseRecognition = () => {
      try { speechRecognitionRef.current?.stop(); } catch {}
    };

    const resumeRecognition = () => {
      // Add a small delay before resuming to ensure TTS has fully ended
      setTimeout(() => {
        const isCallActuallyActive = isCallActive || callActiveDebugRef.current;
        if (isCallActuallyActive) {
          try { 
            if (speechRecognitionRef.current) {
              speechRecognitionRef.current.start();
              console.log('Speech recognition resumed successfully');
            }
          } catch (error) {
            console.error('Error resuming speech recognition:', error);
            // If we can't resume due to invalid state, try to reinitialize
            if (error.name === 'InvalidStateError') {
              try {
                if (speechRecognitionRef.current) {
                  try {
                    speechRecognitionRef.current.stop();
                  } catch (stopError) {
                    // Ignore stop errors
                  }
                }
                speechRecognitionRef.current = initializeSpeechRecognition();
                if (speechRecognitionRef.current) {
                  speechRecognitionRef.current.start();
                  console.log('Speech recognition reinitialized and started after resume error');
                }
              } catch (reinitError) {
                console.error('Failed to reinitialize speech recognition after resume error:', reinitError);
              }
            }
          }
        } else {
          console.log('Skipping speech recognition resume - call is no longer active');
        }
      }, 150); // Small delay to ensure TTS has fully ended
    };

    // Function to convert text to speech using Eleven Labs
    const convertTextToSpeech = async (text: string) => {
        try {
            // Get Eleven Labs API key from environment variables
            const elevenLabsApiKey = import.meta.env.VITE_ELEVEN_LABS_API_KEY;
            if (!elevenLabsApiKey) {
                throw new Error('Eleven Labs API key is not configured');
            }
            
            // Create Eleven Labs client
            // @ts-ignore
            const elevenLabsClient = new ElevenLabsClient({
                apiKey: elevenLabsApiKey
            });
            
            // Map voice IDs to Eleven Labs voice IDs
            const elevenLabsVoiceMap: { [key: string]: string } = {
                'eleven-rachel': '21m00Tcm4TlvDq8ikWAM',
                'eleven-drew': '29vD33N1CtxCmqQRPOHJ',
                'eleven-clyde': '2EiwWnXFnvU5JabPnv8n',
                'eleven-zara': 'D38z5RcWu1voky8WS1ja',
                'eleven-indian-monika': '1qEiC6qsybMkmnNdVMbK',
                'eleven-indian-sagar': 'Qc0h5B5Mqs8oaH4sFZ9X'
            };
            
            const elevenLabsVoiceId = elevenLabsVoiceMap[editedAgent.voiceId] || editedAgent.voiceId;
            
            // Convert text to speech using Eleven Labs
            // @ts-ignore
            const audioStream = await elevenLabsClient.textToSpeech.convert(
                elevenLabsVoiceId,
                {
                    text: text,
                    modelId: 'eleven_multilingual_v2',
                    voiceSettings: {
                        stability: 0.5,
                        similarityBoost: 0.5
                    }
                }
            );
            
            // Play the audio
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const arrayBuffer = await new Response(audioStream).arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            
            // Ensure playback happens only once by using a flag
            let playbackStarted = false;
            return new Promise<void>((resolve) => {
                source.onended = () => {
                    if (!playbackStarted) {
                        playbackStarted = true;
                        resolve();
                    }
                };
                // Additional safety to prevent multiple starts
                if (!playbackStarted) {
                    playbackStarted = true;
                    source.start();
                }
            });
        } catch (error) {
            console.error('Error converting text to speech:', error);
            throw error;
        }
    };
    
    // Helper function to convert Float32Array to WAV format
    const convertFloat32ToWav = async (float32Array: Float32Array, sampleRate: number): Promise<ArrayBuffer> => {
        const buffer = new ArrayBuffer(44 + float32Array.length * 2);
        const view = new DataView(buffer);
        
        // WAV header
        const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + float32Array.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, float32Array.length * 2, true);
        
        // Convert float32 to int16
        let offset = 44;
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            offset += 2;
        }
        
        return buffer;
    };
    
    // Voice preview functions
    const playVoicePreview = async (voiceId: string) => {
        try {
            setIsPlayingPreview(true);
            
            // Stop any currently playing preview
            if (previewAudio) {
                previewAudio.pause();
                setPreviewAudio(null);
            }
            
            // Generate preview audio
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
            const response = await fetch(`${apiBaseUrl}/voices/elevenlabs/preview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: "Hello, this is a preview of the selected voice.",
                    voiceId: voiceId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Create audio from base64 data
                const audio = new Audio(`data:audio/mpeg;base64,${result.audioData}`);
                audio.play();
                
                // Set up event listeners
                audio.onended = () => {
                    setIsPlayingPreview(false);
                    setPreviewAudio(null);
                };
                
                audio.onerror = () => {
                    setIsPlayingPreview(false);
                    setPreviewAudio(null);
                };
                
                setPreviewAudio(audio);
            } else {
                throw new Error(result.message || 'Failed to generate voice preview');
            }
        } catch (error) {
            console.error('Error playing voice preview:', error);
            alert('Failed to play voice preview: ' + (error instanceof Error ? error.message : 'Unknown error'));
            setIsPlayingPreview(false);
        }
    };

    const stopVoicePreview = () => {
        if (previewAudio) {
            previewAudio.pause();
            setPreviewAudio(null);
        }
        setIsPlayingPreview(false);
    };
    
    // Speech recognition reference
    const speechRecognitionRef = useRef<any>(null);
    // Speech recognition retry count for exponential backoff
    const speechRecognitionRetryCountRef = useRef<number>(0);
    const speechRecognitionMaxRetries = 5;

    // Function to initialize speech recognition
    // NOTE: We're removing browser-based speech recognition and will use ElevenLabs STT through backend
    const initializeSpeechRecognition = useCallback(() => {
        // For ElevenLabs STT, we don't initialize browser speech recognition
        // Instead, we'll handle audio streaming through WebSocket to backend
        console.log('Using ElevenLabs STT through backend WebSocket connection');
        return null;
    }, [editedAgent]);

    // Enhanced startCall function with ElevenLabs STT and TTS through WebSocket
    const startCall = async () => {
        console.log('API_KEY:', API_KEY);
        console.log('Eleven Labs API Key:', import.meta.env.VITE_ELEVEN_LABS_API_KEY);
        
        // Only require API_KEY for Gemini models
        if (!API_KEY) {
            alert("Voice call feature is disabled because the API_KEY is not configured.");
            return;
        }
        
        // Get Eleven Labs API key from environment variables
        const elevenLabsApiKey = import.meta.env.VITE_ELEVEN_LABS_API_KEY;
        if (!elevenLabsApiKey) {
            alert('Eleven Labs API key is not configured. Please add VITE_ELEVEN_LABS_API_KEY to your .env.local file.');
            return;
        }
        
        console.log('Setting isCallActive to true');
        console.log('Call stack for setting isCallActive to true:', new Error().stack);
        // Set a flag to prevent immediate false setting
        callActiveDebugRef.current = true;
        setIsCallActive(true);
        
        // Clear any existing timeouts
        if (sessionTimeoutRef.current) {
            clearTimeout(sessionTimeoutRef.current);
            sessionTimeoutRef.current = null;
        }
        
        // Set up session timeout if enabled
        console.log('Setting up session timeout. Duration:', editedAgent.settings.sessionTimeoutFixedDuration);
        if (editedAgent.settings.sessionTimeoutFixedDuration > 0) {
            const timeoutMs = editedAgent.settings.sessionTimeoutFixedDuration * 1000;
            console.log('Session timeout will trigger in', editedAgent.settings.sessionTimeoutFixedDuration, 'seconds (', timeoutMs, 'ms)');
            // Make sure the timeout is reasonable (at least 1 second)
            if (timeoutMs >= 1000) {
                sessionTimeoutRef.current = setTimeout(() => {
                    console.log('Session timeout triggered');
                    const isCallActuallyActive = isCallActive || callActiveDebugRef.current;
                    if (isCallActuallyActive) {
                        alert(editedAgent.settings.sessionTimeoutEndMessage || "Your session has ended.");
                        // Don't automatically stop the call
                        // The user should explicitly click the stop button
                        // stopCall();
                    }
                }, timeoutMs);
            } else {
                console.log('Skipping session timeout setup because duration is too short:', timeoutMs, 'ms');
            }
        } else {
            console.log('No session timeout set or duration is 0');
        }
        
        try {
            // Set up audio processing for the live session
            console.log('Setting up audio processing for live session');
            
            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                microphoneStreamRef.current = stream;
            } catch (error) {
                console.error('Failed to get microphone access:', error);
                alert('Microphone access is required for voice calls. Please enable microphone permissions and try again.');
                // Set isCallActive to false since we couldn't get microphone access
                setIsCallActive(false);
                return;
            }

            try {
                inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                const source = inputAudioContextRef.current.createMediaStreamSource(stream);
                // TODO: Replace ScriptProcessorNode with AudioWorkletNode for better performance
                // ScriptProcessorNode is deprecated but still widely supported
                // AudioWorkletNode would provide better performance and is the recommended approach
                scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                source.connect(scriptProcessorRef.current);
                scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                
                // DO NOT set up audio processing yet - wait for WebSocket connection
                // It will be set up after WebSocket connects
            } catch (error) {
                console.error('Failed to create audio context:', error);
                alert('Failed to initialize audio processing. Please try again.');
                // Set isCallActive to false since we couldn't initialize audio processing
                setIsCallActive(false);
                return;
            }

            // Initialize WebSocket connection to backend for ElevenLabs STT/TTS processing
            try {
                const isCallActuallyActive = isCallActive || callActiveDebugRef.current;
                console.log('Initializing WebSocket connection for ElevenLabs processing. isCallActuallyActive:', isCallActuallyActive);
                
                if (isCallActuallyActive) {
                    // Ensure we have microphone access before starting
                    console.log('Starting WebSocket connection. Microphone stream available:', !!microphoneStreamRef.current);
                    if (microphoneStreamRef.current) {
                        // Add a small delay to ensure everything is ready
                        setTimeout(() => {
                            try {
                                // Check if the call is still active before starting
                                const isCallStillActive = isCallActive || callActiveDebugRef.current;
                                if (isCallStillActive) {
                                    // Establish WebSocket connection to backend
                                    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                                    const apiHostUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || 'http://localhost:5000';
                                    const wsHost = new URL(apiHostUrl).host;
                                    // Pass the agent's voice ID and identity as query parameters
                                    const voiceId = editedAgent.voiceId || 'default';
                                    const agentId = editedAgent.id;
                                    const agentIdentity = encodeURIComponent(editedAgent.identity || '');
                                    const wsUrl = `${wsProtocol}//${wsHost}/voice-stream?voiceId=${encodeURIComponent(voiceId)}&agentId=${agentId}&identity=${agentIdentity}`;
                                    console.log('Connecting to WebSocket with voiceId:', voiceId, 'agentId:', agentId);
                                    webSocketRef.current = new WebSocket(wsUrl);
                                    
                                    webSocketRef.current.onopen = () => {
                                        console.log('WebSocket connection established successfully for voice stream');
                                        console.log('WebSocket readyState:', webSocketRef.current?.readyState);
                                        // Reset retry count on successful start
                                        speechRecognitionRetryCountRef.current = 0;
                                        
                                        // NOW set up audio processing after WebSocket is connected
                                        if (scriptProcessorRef.current) {
                                            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                                                // Send audio data to backend via WebSocket for voice stream processing
                                                if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
                                                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                                                    
                                                    // Check if there's actual audio data
                                                    let hasAudio = false;
                                                    for (let i = 0; i < inputData.length; i++) {
                                                        if (Math.abs(inputData[i]) > 0.01) {
                                                            hasAudio = true;
                                                            break;
                                                        }
                                                    }
                                                    
                                                    if (hasAudio) {
                                                        console.log('Audio detected, sending to server');
                                                    }
                                                    
                                                    // Convert float32 to int16
                                                    const int16Data = new Int16Array(inputData.length);
                                                    for (let i = 0; i < inputData.length; i++) {
                                                        int16Data[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
                                                    }
                                                    
                                                    // Send audio data as base64
                                                    const base64Data = btoa(String.fromCharCode(...new Uint8Array(int16Data.buffer)));
                                                    webSocketRef.current.send(JSON.stringify({
                                                        event: 'audio',
                                                        data: base64Data
                                                    }));
                                                } else {
                                                    console.log('WebSocket not ready for audio. State:', webSocketRef.current?.readyState);
                                                }
                                            };
                                            console.log('Audio processing enabled after WebSocket connected');
                                        }
                                        
                                        // Set up heartbeat to keep connection alive
                                        const heartbeatInterval = setInterval(() => {
                                            if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
                                                webSocketRef.current.send(JSON.stringify({ event: 'ping' }));
                                            }
                                        }, 30000); // Send ping every 30 seconds
                                        
                                        // Store interval ID so we can clear it later
                                        (webSocketRef.current as any).heartbeatInterval = heartbeatInterval;
                                    };
                                    
                                    webSocketRef.current.onmessage = async (event) => {
                                        const data = JSON.parse(event.data);
                                        console.log('Received message from server:', data.event, data.text || data.message || '');
                                        
                                        // Handle error messages
                                        if (data.event === 'error') {
                                            console.error('Server error:', data.message);
                                            return;
                                        }
                                        
                                        // Handle ping/pong messages
                                        if (data.event === 'ping') {
                                            // Respond to server ping with pong
                                            if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
                                                webSocketRef.current.send(JSON.stringify({ event: 'pong' }));
                                            }
                                            return;
                                        }
                                        
                                        if (data.event === 'pong') {
                                            console.log('Received pong from server');
                                            return;
                                        }
                                        
                                        if (data.event === 'transcript' && data.text) {
                                            // Process the transcript through the conversation flow
                                            try {
                                                const agentResponse = await processConversationTurn(data.text);
                                                console.log('Agent response:', agentResponse);
                                            } catch (error) {
                                                console.error('Error processing conversation turn:', error);
                                            }
                                        } else if (data.event === 'audio' && data.audio) {
                                            // Play audio response from backend
                                            try {
                                                console.log('Playing agent response audio');
                                                
                                                // Use the output audio context we already have
                                                if (!outputAudioContextRef.current) {
                                                    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                                                }
                                                
                                                const audioContext = outputAudioContextRef.current;
                                                const binary = atob(data.audio);
                                                const array = new Uint8Array(binary.length);
                                                for (let i = 0; i < binary.length; i++) {
                                                    array[i] = binary.charCodeAt(i);
                                                }
                                                
                                                const audioBuffer = await audioContext.decodeAudioData(array.buffer);
                                                const source = audioContext.createBufferSource();
                                                source.buffer = audioBuffer;
                                                source.connect(audioContext.destination);
                                                
                                                // Store reference to stop previous audio if needed
                                                audioSourcesRef.current.forEach(prevSource => {
                                                    try {
                                                        prevSource.stop();
                                                    } catch (error) {
                                                        console.error('Error stopping previous audio:', error);
                                                    }
                                                });
                                                audioSourcesRef.current.clear();
                                                
                                                // Store this source and play it
                                                audioSourcesRef.current.add(source);
                                                source.start();
                                                console.log('Agent audio started playing');
                                            } catch (error) {
                                                console.error('Error playing audio response:', error);
                                            }
                                        }
                                    };
                                    
                                    webSocketRef.current.onerror = (error) => {
                                        console.error('WebSocket error:', error);
                                        // Try to reconnect on error
                                        setTimeout(() => {
                                            const isCallStillActive = isCallActive || callActiveDebugRef.current;
                                            if (isCallStillActive && !webSocketRef.current) {
                                                console.log('Attempting to reconnect WebSocket...');
                                                // Re-establish WebSocket connection
                                                const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                                                const apiHostUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || 'http://localhost:5000';
                                                const wsHost = new URL(apiHostUrl).host;
                                                const voiceId = editedAgent.voiceId || 'default';
                                                const agentId = editedAgent.id;
                                                const agentIdentity = encodeURIComponent(editedAgent.identity || '');
                                                const wsUrl = `${wsProtocol}//${wsHost}/voice-stream?voiceId=${encodeURIComponent(voiceId)}&agentId=${agentId}&identity=${agentIdentity}`;
                                                webSocketRef.current = new WebSocket(wsUrl);
                                            }
                                        }, 1000);
                                    };
                                    
                                    webSocketRef.current.onclose = (event) => {
                                        console.log('WebSocket connection closed', event);
                                        console.log('Close code:', event.code);
                                        console.log('Close reason:', event.reason);
                                        console.log('Was clean:', event.wasClean);
                                        // Clear heartbeat interval
                                        if (webSocketRef.current && (webSocketRef.current as any).heartbeatInterval) {
                                            clearInterval((webSocketRef.current as any).heartbeatInterval);
                                        }
                                        // Clear reference on close
                                        webSocketRef.current = null;
                                    };
                                } else {
                                    console.log('Skipping WebSocket connection - call no longer active');
                                }
                            } catch (startError) {
                                console.error('Error establishing WebSocket connection:', startError);
                            }
                        }, 750); // Increased delay to 750ms to ensure everything is ready
                    } else {
                        console.error('Cannot start WebSocket connection: No microphone stream available');
                    }
                } else {
                    console.log('WebSocket connection not started. Call active:', isCallActuallyActive);
                }
            } catch (error) {
                console.error('Error initializing WebSocket connection:', error);
                // Don't let connection errors kill the entire call
                console.log('WebSocket connection failed to initialize, but continuing call');
            };
            
            console.log('Audio processing started successfully');
        } catch (error) {
            console.error('Failed to start call:', error);
            alert('Could not start the call. Please ensure you have given microphone permissions.');
            // Only set isCallActive to false if it was true, to avoid timing issues
            const isCallActuallyActive = isCallActive || callActiveDebugRef.current;
            if (isCallActuallyActive) {
                console.log('Setting isCallActive to false in error handler');
                console.log('Call stack for setting isCallActive to false in error handler:', new Error().stack);
                setIsCallActive(false);
            }
        }
    };
    
    // The Web Speech API is used for real-time speech recognition instead of ElevenLabs STT
    // ElevenLabs STT is designed for file transcription, not real-time streaming

    const stopCall = useCallback(() => {
        console.log('Stopping call...');
        console.log('Setting isCallActive to false');
        console.log('Call stack for setting isCallActive to false:', new Error().stack);
        setIsCallActive(false);
        // Reset the greeting sent flag when stopping the call
        greetingSentRef.current = false;

        // Stop audio processing
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.onaudioprocess = null;
        }

        // Close WebSocket connection if active
        if (webSocketRef.current) {
            webSocketRef.current.close();
            webSocketRef.current = null;
            console.log('Closed WebSocket connection for ElevenLabs processing');
        }
        
        // Reset speech recognition retry count
        speechRecognitionRetryCountRef.current = 0;
        
        // Clear any existing timeouts
        if (sessionTimeoutRef.current) {
            clearTimeout(sessionTimeoutRef.current);
            sessionTimeoutRef.current = null;
        }
        
        // Reset audio sources
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        
        if (outputAudioContextRef.current) {
            try {
                outputAudioContextRef.current.close();
            } catch (error) {
                console.error('Error closing output audio context:', error);
                // Continue cleanup even if there's an error
            }
        }
        outputAudioContextRef.current = null;
        
        // Clear conversation history when call ends
        conversationHistoryRef.current = [];
    }, []);

    // Cleanup effect for voice call resources
    useEffect(() => {
        return () => {
            // Cleanup when component unmounts
            console.log('Cleaning up voice call resources');
            
            // Clear any existing timeouts
            if (sessionTimeoutRef.current) {
                clearTimeout(sessionTimeoutRef.current);
                sessionTimeoutRef.current = null;
            }
            
            try {
                microphoneStreamRef.current?.getTracks().forEach(track => track.stop());
            } catch (error) {
                console.error('Error stopping microphone tracks:', error);
                // Continue cleanup even if there's an error
            }
            microphoneStreamRef.current = null;
            
            try {
                scriptProcessorRef.current?.disconnect();
            } catch (error) {
                console.error('Error disconnecting script processor:', error);
                // Continue cleanup even if there's an error
            }
            scriptProcessorRef.current = null;
            
            if (inputAudioContextRef.current) {
                try {
                    inputAudioContextRef.current.close();
                } catch (error) {
                    console.error('Error closing input audio context:', error);
                    // Continue cleanup even if there's an error
                }
            }
            inputAudioContextRef.current = null;

            audioSourcesRef.current.forEach(source => {
                try {
                    source.stop();
                } catch (error) {
                    console.error('Error stopping audio source:', error);
                    // Continue cleanup even if there's an error
                }
            });
            
            // Reset the greeting sent flag
            greetingSentRef.current = false;
            
            // Reset speech recognition retry count
            speechRecognitionRetryCountRef.current = 0;
        }
    }, []);

    // Initialize the call with AI greeting if userStartsFirst is false
    useEffect(() => {
        const isCallActuallyActive = isCallActive || callActiveDebugRef.current;
        if (isCallActuallyActive && !editedAgent.settings.userStartsFirst) {
            // Use a ref to ensure the greeting is only sent once
            if (!greetingSentRef.current) {
                greetingSentRef.current = true;
                
                // Send initial greeting from the agent
                const sendInitialGreeting = async () => {
                    try {
                        // Get Eleven Labs API key from environment variables
                        const elevenLabsApiKey = import.meta.env.VITE_ELEVEN_LABS_API_KEY;
                        if (!elevenLabsApiKey) {
                            throw new Error('Eleven Labs API key is not configured');
                        }
                        
                        // Create Eleven Labs client
                        // @ts-ignore
                        const elevenLabsClient = new ElevenLabsClient({
                            apiKey: elevenLabsApiKey
                        });
                        
                        // Map voice IDs to Eleven Labs voice IDs
                        const elevenLabsVoiceMap: { [key: string]: string } = {
                            'eleven-rachel': '21m00Tcm4TlvDq8ikWAM',
                            'eleven-drew': '29vD33N1CtxCmqQRPOHJ',
                            'eleven-clyde': '2EiwWnXFnvU5JabPnv8n',
                            'eleven-zara': 'D38z5RcWu1voky8WS1ja',
                            'eleven-indian-monika': '1qEiC6qsybMkmnNdVMbK',
                            'eleven-indian-sagar': 'Qc0h5B5Mqs8oaH4sFZ9X'
                        };
                        
                        const elevenLabsVoiceId = elevenLabsVoiceMap[editedAgent.voiceId] || editedAgent.voiceId;
                        
                        // Convert greeting to speech using Eleven Labs
                        // @ts-ignore
                        const audioStream = await elevenLabsClient.textToSpeech.convert(
                            elevenLabsVoiceId,
                            {
                                text: editedAgent.settings.greetingLine,
                                modelId: 'eleven_multilingual_v2',
                                voiceSettings: {
                                    stability: 0.5,
                                    similarityBoost: 0.5
                                }
                            }
                        );
                        
                        // Play the greeting
                        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                        const arrayBuffer = await new Response(audioStream).arrayBuffer();
                        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                        const source = audioContext.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(audioContext.destination);
                        
                        pauseRecognition();
                        source.start();
                        source.onended = () => resumeRecognition();
                    } catch (error) {
                        console.error('Error sending initial greeting:', error);
                    }
                };
                
                // Send the initial greeting when the call starts
                sendInitialGreeting();
            }
        } else {
            // Reset the greeting sent flag when call is not active
            greetingSentRef.current = false;
        }
    }, [isCallActive, editedAgent.settings.userStartsFirst, editedAgent.voiceId, editedAgent.settings.greetingLine]);
    
    // Enhanced conversation processing with knowledge base integration
    const processConversationTurn = async (userInput: string) => {
        try {
            // Add user input to conversation history
            conversationHistoryRef.current.push({ role: 'user', text: userInput });
            
            // Fetch knowledge base documents if any are linked to this agent
            let knowledgeBaseContent = '';
            if (editedAgent.settings.knowledgeDocIds && editedAgent.settings.knowledgeDocIds.length > 0 && userId) {
                try {
                    const documentService = new DocumentService();
                    const docContents = await Promise.all(
                        editedAgent.settings.knowledgeDocIds.map(docId => 
                            documentService.getDocumentContent(docId)
                        )
                    );
                    knowledgeBaseContent = docContents.filter(content => content).join('\n\n');
                } catch (error) {
                    console.error('Error fetching knowledge base documents:', error);
                }
            }
            
            // Send text to LLM for response with full conversation history
            const llmService = new LLMService(import.meta.env.VITE_GEMINI_API_KEY);
            
            // Prepare contents for API with complete conversation history
            const contentsForApi = conversationHistoryRef.current.map(msg => ({
                role: msg.role === 'agent' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            }));
            
            // Enhance system instruction with knowledge base content if available
            let systemInstruction = editedAgent.identity;
            if (knowledgeBaseContent) {
                systemInstruction += `\n\nKnowledge Base:\n${knowledgeBaseContent}`;
            }
            
            // Add tool information to system instruction if tools are configured
            if (editedAgent.settings.tools && editedAgent.settings.tools.length > 0) {
                const toolDescriptions = editedAgent.settings.tools.map(tool => 
                    `- ${tool.name}: ${tool.description} (Parameters: ${tool.parameters?.map(p => `${p.name} (${p.type})${p.required ? ' [required]' : ''}`).join(', ') || 'None'})`
                ).join('\n');
                
                systemInstruction += `

Available Tools:
${toolDescriptions}

When you need to collect information from the user, ask for the required parameters. When all required information is collected, respond with a JSON object in the format: {"tool": "tool_name", "data": {"param1": "value1", "param2": "value2"}}`;
            }
            
            // Generate response using LLM with conversation context
            const result = await llmService.generateContent({
                model: editedAgent.model,
                contents: contentsForApi,
                config: { systemInstruction }
            });
            
            let agentResponse = result.text;
            
            // Check if the response contains tool execution instructions
            try {
                const jsonResponse = JSON.parse(agentResponse);
                if (jsonResponse.tool && jsonResponse.data) {
                    // Execute the tool
                    const toolExecutionService = new ToolExecutionService();
                    const tool = editedAgent.settings.tools.find(t => t.name === jsonResponse.tool);
                    
                    if (tool) {
                        const success = await toolExecutionService.executeTool(tool, jsonResponse.data);
                        
                        if (success) {
                            agentResponse = `I've successfully collected that information and saved it to ${tool.name}.`;
                        } else {
                            agentResponse = `I encountered an issue while saving your information to ${tool.name}. Let's try again.`;
                        }
                    } else {
                        agentResponse = `I couldn't find the tool "${jsonResponse.tool}". Let's continue our conversation.`;
                    }
                }
            } catch (e) {
                // Not a JSON response, continue with normal response
            }
            
            // Add agent response to conversation history
            conversationHistoryRef.current.push({ role: 'agent', text: agentResponse });
            
            // Get Eleven Labs API key from environment variables
            const elevenLabsApiKey = import.meta.env.VITE_ELEVEN_LABS_API_KEY;
            if (!elevenLabsApiKey) {
                throw new Error('Eleven Labs API key is not configured');
            }
            
            // Create Eleven Labs client
            // @ts-ignore
            const elevenLabsClient = new ElevenLabsClient({
                apiKey: elevenLabsApiKey
            });
            
            // Map voice IDs to Eleven Labs voice IDs
            const elevenLabsVoiceMap: { [key: string]: string } = {
                'eleven-rachel': '21m00Tcm4TlvDq8ikWAM',
                'eleven-drew': '29vD33N1CtxCmqQRPOHJ',
                'eleven-clyde': '2EiwWnXFnvU5JabPnv8n',
                'eleven-zara': 'D38z5RcWu1voky8WS1ja',
                'eleven-indian-monika': '1qEiC6qsybMkmnNdVMbK',
                'eleven-indian-sagar': 'Qc0h5B5Mqs8oaH4sFZ9X'
            };
            
            const elevenLabsVoiceId = elevenLabsVoiceMap[editedAgent.voiceId] || editedAgent.voiceId;
            
            // Convert response to speech using Eleven Labs
            // @ts-ignore
            const audioStream = await elevenLabsClient.textToSpeech.convert(
                elevenLabsVoiceId,
                {
                    text: agentResponse,
                    modelId: 'eleven_multilingual_v2',
                    voiceSettings: {
                        stability: 0.5,
                        similarityBoost: 0.5
                    }
                }
            );
            
            // Play the response with race condition protection
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const arrayBuffer = await new Response(audioStream).arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            
            // Prevent race conditions by ensuring playback happens only once
            let playbackStarted = false;
            const startPlayback = () => {
                if (!playbackStarted) {
                    playbackStarted = true;
                    pauseRecognition();
                    source.start();
                }
            };
            
            // Set up completion handler
            source.onended = () => {
                if (playbackStarted) {
                    resumeRecognition();
                }
            };
            
            // Start playback
            startPlayback();
            
            console.log('Conversation turn processed:', { userInput, agentResponse });
            return agentResponse;
        } catch (error) {
            console.error('Error processing conversation turn:', error);
            // Still resume recognition even if there's an error
            resumeRecognition();
            throw error;
        }
    };
    
    const handleSettingsChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        const nameParts = name.split('.');
        setEditedAgent(prev => {
            // Create a safe copy of the agent object
            const newAgent = {...prev};
            
            // Ensure settings object exists
            if (!newAgent.settings) {
                newAgent.settings = {};
            }
            
            let currentLevel: any = newAgent;
            
            for (let i = 0; i < nameParts.length - 1; i++) {
                if (!currentLevel[nameParts[i]]) {
                    currentLevel[nameParts[i]] = {};
                }
                currentLevel = currentLevel[nameParts[i]];
            }
            
            const finalKey = nameParts[nameParts.length - 1];

            if (type === 'checkbox') {
                currentLevel[finalKey] = (e.target as HTMLInputElement).checked;
            } else if (type === 'number' || e.target.dataset.type === 'number') {
                currentLevel[finalKey] = parseFloat(value) || 0;
            } else {
                currentLevel[finalKey] = value;
            }
            
            // Update the agent with error handling
            try {
                updateAgent(newAgent);
            } catch (error) {
                console.error('Error updating agent settings:', error);
                // Don't prevent the UI from updating even if the backend fails
            }
            
            return newAgent;
        });
    }, [updateAgent]);

    const updateDataCollectionTool = (sheetUrl: string) => {
        // Define the data collection parameters
        const dataCollectionParams = [
            { name: 'Name', type: 'string' as const, required: true },
            { name: 'PhoneNumber', type: 'string' as const, required: true },
            { name: 'Email', type: 'string' as const, required: false },
            { name: 'Requirement', type: 'string' as const, required: true },
            { name: 'Purpose', type: 'string' as const, required: false },
        ];
        
        setEditedAgent(prev => {
            const agent = { ...prev };
            // Check if data collection tool already exists
            const existingToolIndex = agent.settings.tools.findIndex(t => t.name === 'Data Collection');
            
            const newTool: Tool = {
                id: existingToolIndex >= 0 ? agent.settings.tools[existingToolIndex].id : `datacollection-${Date.now()}`,
                name: 'Data Collection',
                description: 'Collects caller information including name, phone, email, requirement, and purpose',
                type: ToolType.GoogleSheets,
                webhookUrl: sheetUrl,
                method: 'POST',
                runAfterCall: false,
                preActionPhrasesMode: PreActionPhraseMode.Flexible,
                preActionPhrases: ['Collecting your information', 'I need to get some information from you'],
                parameters: dataCollectionParams,
                headers: []
            };
            
            const updatedTools = existingToolIndex >= 0
                ? agent.settings.tools.map((t, i) => i === existingToolIndex ? newTool : t)
                : [...agent.settings.tools, newTool];
            
            agent.settings.tools = updatedTools;
            updateAgent(agent);
            return agent;
        });
    };
    
    const removeDataCollectionTool = () => {
        setEditedAgent(prev => {
            const agent = { ...prev };
            const updatedTools = agent.settings.tools.filter(t => t.name !== 'Data Collection');
            agent.settings.tools = updatedTools;
            updateAgent(agent);
            return agent;
        });
    };
    
    const copyToClipboard = (text: string, type: string) => navigator.clipboard.writeText(text).then(() => alert(`${type} copied to clipboard!`));
    
    const handleSavePrompt = () => {
        setIsEditingPrompt(false);
        updateAgent(editedAgent);
    };
    const handleCancelPrompt = () => { setEditedAgent(p => ({ ...p, identity: agent.identity })); setIsEditingPrompt(false); };
    
    const handleSaveModel = (newModelId: string) => {
        const updatedAgent = { ...editedAgent, model: newModelId };
        setEditedAgent(updatedAgent);
        updateAgent(updatedAgent);
        setModelModalOpen(false);
    };

    const handleSaveVoice = (newVoiceId: string) => {
        let updatedAgent = { ...editedAgent, voiceId: newVoiceId };
    
        // Auto-update language if the current one is not supported by the new voice provider
        const newProviderId = getVoiceProviderById(newVoiceId);
        const supportedLanguages = AVAILABLE_LANGUAGES_BY_PROVIDER[newProviderId] || AVAILABLE_LANGUAGES;
        const isCurrentLanguageSupported = supportedLanguages.some(lang => lang.id === updatedAgent.language);
    
        if (!isCurrentLanguageSupported) {
            updatedAgent.language = supportedLanguages[0].id; // Default to the first supported language
        }
    
        setEditedAgent(updatedAgent);
        updateAgent(updatedAgent);
        setVoiceModalOpen(false);
    };

    const handleSaveLanguage = (newLanguageId: string) => {
        const updatedAgent = { ...editedAgent, language: newLanguageId };
        setEditedAgent(updatedAgent);
        updateAgent(updatedAgent);
        setLanguageModalOpen(false);
    };

    const handleSubmitTool = () => {
        let finalTool: Tool;
        
        if (newToolFunctionType === 'GoogleSheets') {
            // For Google Sheets, we create a special tool
            finalTool = { 
                ...newTool, 
                id: editingTool ? editingTool.id : `tool-${Date.now()}`, 
                type: ToolType.GoogleSheets, // Use proper Google Sheets type
                method: 'POST', // Not used for Google Sheets
                headers: [], // Not used for Google Sheets
                preActionPhrases: newTool.preActionPhrases.split(',').map(p => p.trim()).filter(p => p) 
            };
        } else {
            // For regular Webhook and WebForm
            finalTool = { 
                ...newTool, 
                id: editingTool ? editingTool.id : `tool-${Date.now()}`, 
                type: newToolFunctionType === 'Webhook' ? ToolType.Webhook : ToolType.WebForm, 
                preActionPhrases: newTool.preActionPhrases.split(',').map(p => p.trim()).filter(p => p) 
            };
        }
        
        const updatedAgent = editingTool 
            ? { ...editedAgent, settings: { ...editedAgent.settings, tools: editedAgent.settings.tools.map(t => t.id === editingTool.id ? finalTool : t) } }
            : { ...editedAgent, settings: { ...editedAgent.settings, tools: [...editedAgent.settings.tools, finalTool] } };

        setEditedAgent(updatedAgent);
        updateAgent(updatedAgent);
        setToolsModalOpen(false); 
        setNewTool(initialNewToolState); 
        setEditingTool(null);
    };

    const handleNewToolChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewTool(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleEditTool = (tool: Tool) => {
        setEditingTool(tool);
        setNewTool({ 
            ...tool, 
            preActionPhrases: tool.preActionPhrases.join(', '),
            headers: tool.headers || [],
            parameters: tool.parameters || [],
        });
        setNewToolFunctionType(
            tool.type === ToolType.WebForm ? 'WebForm' : 
            tool.type === ToolType.GoogleSheets ? 'GoogleSheets' : 'Webhook'
        );
        setToolsModalOpen(true);
    };
    const handleDeleteTool = (toolId: string) => { 
        if (window.confirm("Are you sure you want to delete this tool?")) {
            const updatedAgent = { ...editedAgent, settings: { ...editedAgent.settings, tools: editedAgent.settings.tools.filter(t => t.id !== toolId) } };
            setEditedAgent(updatedAgent);
            updateAgent(updatedAgent);
        } 
    };

    // Tool Headers and Parameters handlers
    const handleAddHeader = () => setNewTool(prev => ({ ...prev, headers: [...(prev.headers || []), { key: '', value: '' }] }));
    const handleDeleteHeader = (index: number) => setNewTool(prev => ({ ...prev, headers: (prev.headers || []).filter((_, i) => i !== index) }));
    const handleHeaderChange = (index: number, field: keyof ToolHeader, value: string) => {
        setNewTool(prev => {
            const newHeaders = JSON.parse(JSON.stringify(prev.headers || []));
            newHeaders[index][field] = value;
            return { ...prev, headers: newHeaders };
        });
    };
    
    const handleAddParameter = () => setNewTool(prev => ({ ...prev, parameters: [...(prev.parameters || []), { name: '', type: 'string', required: false }] }));
    const handleDeleteParameter = (index: number) => setNewTool(prev => ({ ...prev, parameters: (prev.parameters || []).filter((_, i) => i !== index) }));
    const handleParameterChange = (index: number, field: keyof ToolParameter, value: string | boolean) => {
        setNewTool(prev => {
            const newParams = JSON.parse(JSON.stringify(prev.parameters || []));
            newParams[index][field] = value;
            return { ...prev, parameters: newParams };
        });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const message = currentMessage.trim();
        if (!message || isAgentReplying) return;

        const newMessages = [...chatMessages, { sender: 'user' as const, text: message }];
        setChatMessages(newMessages);
        setCurrentMessage('');
        setIsAgentReplying(true);

        if (geminiChatSession) {
            // Handle real Gemini chat session
            try {
                const stream = await geminiChatSession.sendMessageStream({ message });
                let agentResponseText = '';
                setChatMessages(prev => [...prev, { sender: 'agent' as const, text: '' }]);

                for await (const chunk of stream) {
                    agentResponseText += chunk.text;
                    setChatMessages(prev => {
                        const updatedMessages = [...prev];
                        updatedMessages[updatedMessages.length - 1].text = agentResponseText;
                        return updatedMessages;
                    });
                }
                
                // Check if the response contains tool execution instructions
                try {
                    const jsonResponse = JSON.parse(agentResponseText);
                    if (jsonResponse.tool && jsonResponse.data) {
                        // Execute the tool
                        const toolExecutionService = new ToolExecutionService();
                        const tool = editedAgent.settings.tools.find(t => t.name === jsonResponse.tool);
                        
                        if (tool) {
                            const success = await toolExecutionService.executeTool(tool, jsonResponse.data);
                            
                            const toolResponse = success 
                                ? `I've successfully collected that information and saved it to ${tool.name}.`
                                : `I encountered an issue while saving your information to ${tool.name}. Let's try again.`;
                                
                            setChatMessages(prev => {
                                const updatedMessages = [...prev];
                                updatedMessages[updatedMessages.length - 1].text = toolResponse;
                                return updatedMessages;
                            });
                        }
                    }
                } catch (e) {
                    // Not a JSON response, continue with normal response
                }
            } catch (error) {
                console.error("Gemini API call failed:", error);
                const errorMsg = 'Sorry, an error occurred while trying to respond.';
                setChatMessages(prev => {
                    const updatedMessages = [...prev];
                    if (updatedMessages[updatedMessages.length - 1]?.sender === 'agent') {
                        updatedMessages[updatedMessages.length - 1].text = errorMsg;
                    } else {
                        updatedMessages.push({ sender: 'agent' as const, text: errorMsg });
                    }
                    return updatedMessages;
                });
            } finally {
                setIsAgentReplying(false);
            }
        } else {
            // Handle simulated chat for non-Gemini models using a one-off Gemini call
            if (!API_KEY) {
                setChatMessages(prev => [...prev, { sender: 'agent' as const, text: 'Cannot simulate response. API_KEY is not configured.' }]);
                setIsAgentReplying(false);
                return;
            }
            try {
                // Prepare system instruction with tool information if tools are configured
                let systemInstruction = `You are simulating an AI agent. The user has selected the model named '${editedAgent.model}'. Your instructions are defined by the following identity:\n\n${editedAgent.identity}`;
                
                // Add tool information to system instruction if tools are configured
                if (editedAgent.settings.tools && editedAgent.settings.tools.length > 0) {
                    const toolDescriptions = editedAgent.settings.tools.map(tool => 
                        `- ${tool.name}: ${tool.description} (Parameters: ${tool.parameters?.map(p => `${p.name} (${p.type})${p.required ? ' [required]' : ''}`).join(', ') || 'None'})`
                    ).join('\n');
                    
                    systemInstruction += `

Available Tools:
${toolDescriptions}

When you need to collect information from the user, ask for the required parameters. When all required information is collected, respond with a JSON object in the format: {"tool": "tool_name", "data": {"param1": "value1", "param2": "value2"}}`;
                }
                
                const ai = new GoogleGenAI({ apiKey: API_KEY });
                const contentsForApi = newMessages.map(msg => ({
                    role: msg.sender === 'agent' ? 'model' : 'user',
                    parts: [{ text: msg.text }]
                }));

                const stream = await ai.models.generateContentStream({
                    model: 'gemini-2.5-flash',
                    contents: contentsForApi,
                    config: {
                        systemInstruction
                    }
                });

                let agentResponseText = '';
                setChatMessages(prev => [...prev, { sender: 'agent' as const, text: '' }]);

                for await (const chunk of stream) {
                    agentResponseText += chunk.text;
                    setChatMessages(prev => {
                        const updatedMessages = [...prev];
                        updatedMessages[updatedMessages.length - 1].text = agentResponseText;
                        return updatedMessages;
                    });
                }
                
                // Check if the response contains tool execution instructions
                try {
                    const jsonResponse = JSON.parse(agentResponseText);
                    if (jsonResponse.tool && jsonResponse.data) {
                        // Execute the tool
                        const toolExecutionService = new ToolExecutionService();
                        const tool = editedAgent.settings.tools.find(t => t.name === jsonResponse.tool);
                        
                        if (tool) {
                            const success = await toolExecutionService.executeTool(tool, jsonResponse.data);
                            
                            const toolResponse = success 
                                ? `I've successfully collected that information and saved it to ${tool.name}.`
                                : `I encountered an issue while saving your information to ${tool.name}. Let's try again.`;
                                
                            setChatMessages(prev => {
                                const updatedMessages = [...prev];
                                updatedMessages[updatedMessages.length - 1].text = toolResponse;
                                return updatedMessages;
                            });
                        }
                    }
                } catch (e) {
                    // Not a JSON response, continue with normal response
                }
            } catch (error) {
                console.error("Simulated API call failed:", error);
                setChatMessages(prev => [...prev, { sender: 'agent' as const, text: 'Sorry, an error occurred during the simulation.' }]);
            } finally {
                setIsAgentReplying(false);
            }
        }
    };
    
    const preActionPhraseOptions = [
        { id: PreActionPhraseMode.Disable, label: 'disable', description: 'The agent will execute the action silently without saying anything.' },
        { id: PreActionPhraseMode.Flexible, label: 'flexible', description: 'The agent will generate a phrase based on the examples provided, adjusting for context and language.' },
        { id: PreActionPhraseMode.Strict, label: 'strict', description: 'The agent will say exactly one of the phrases provided, regardless of language.' }
    ];

    const ModelSelectionModal: React.FC<{
        onClose: () => void;
        onSave: (modelId: string) => void;
        currentModelId: string;
    }> = ({ onClose, onSave, currentModelId }) => {
        const [selectedModel, setSelectedModel] = useState(currentModelId);
    
        return (
            <Modal isOpen={true} onClose={onClose} title="Select Language Model">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {AVAILABLE_MODELS.map(model => (
                        <div
                            key={model.id}
                            onClick={() => setSelectedModel(model.id)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedModel === model.id ? 'border-primary ring-2 ring-primary bg-primary/5' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'}`}
                        >
                            <div className="flex items-center">
                                <model.icon className="h-8 w-8 mr-4 text-slate-600 dark:text-slate-300 flex-shrink-0" />
                                <div className="flex-grow">
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">{model.name}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{model.description}</p>
                                </div>
                                <div className="ml-4 flex items-center justify-center w-6 h-6">
                                  {selectedModel === model.id && (
                                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                  )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={onClose} className="bg-slate-200 dark:bg-slate-600 px-4 py-2 rounded-md font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(selectedModel)}
                        className="bg-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-primary-dark transition-colors"
                    >
                        Save
                    </button>
                </div>
            </Modal>
        );
    };
    
    const VoiceSelectionModal: React.FC<{
        onClose: () => void;
        onSave: (voiceId: string) => void;
        currentVoiceId: string;
    }> = ({ onClose, onSave, currentVoiceId }) => {
        const [selectedProvider, setSelectedProvider] = useState(() => getVoiceProviderById(currentVoiceId));
        const [selectedVoice, setSelectedVoice] = useState(currentVoiceId);
    
        useEffect(() => {
            const voicesForProvider = AVAILABLE_VOICES[selectedProvider] || [];
            if (!voicesForProvider.some(v => v.id === selectedVoice)) {
                setSelectedVoice(voicesForProvider[0]?.id || '');
            }
        }, [selectedProvider, selectedVoice]);
    
        return (
            <Modal isOpen={true} onClose={onClose} title="Select Voice">
                 <div className="space-y-4">
                    <div className="border-b border-slate-200 dark:border-slate-700">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            {AVAILABLE_VOICE_PROVIDERS.map(provider => (
                                <button
                                    key={provider.id}
                                    onClick={() => setSelectedProvider(provider.id)}
                                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        selectedProvider === provider.id
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    {provider.name}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 mt-4">Available Voices</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-md p-2">
                            {(AVAILABLE_VOICES[selectedProvider] || []).map(voice => (
                                <div
                                    key={voice.id}
                                    onClick={() => setSelectedVoice(voice.id)}
                                    className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${selectedVoice === voice.id ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                >
                                    <div className="w-8 h-8 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 mr-3">
                                        {voice.name.charAt(0)}
                                    </div>
                                    <span className="flex-grow font-medium">{voice.name}</span>
                                    {selectedProvider === 'eleven-labs' && (
                                        <button onClick={(e) => { e.stopPropagation(); alert(`Cloning voice: ${voice.name}`);}} className="p-1 text-slate-500 hover:text-primary-dark dark:hover:text-primary-light"><DocumentDuplicateIcon className="w-5 h-5" /></button>
                                    )}
                                    <button 
                                                                            onClick={(e) => { 
                                                                                e.stopPropagation(); 
                                                                                if (isPlayingPreview) {
                                                                                    stopVoicePreview();
                                                                                } else {
                                                                                    playVoicePreview(voice.id);
                                                                                }
                                                                            }} 
                                                                            className="p-1 text-slate-500 hover:text-primary-dark dark:hover:text-primary-light"
                                                                            disabled={isPlayingPreview}
                                                                        >
                                                                            {isPlayingPreview ? (
                                                                                <StopIcon className="w-5 h-5" />
                                                                            ) : (
                                                                                <PlayIcon className="w-5 h-5" />
                                                                            )}
                                                                        </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={onClose} className="bg-slate-200 dark:bg-slate-600 px-4 py-2 rounded-md font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(selectedVoice)}
                        className="bg-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-primary-dark transition-colors"
                    >
                        Save
                    </button>
                </div>
            </Modal>
        )
    };

    const LanguageSelectionModal: React.FC<{
        onClose: () => void;
        onSave: (languageId: string) => void;
        currentLanguageId: string;
        voiceProviderId: string;
    }> = ({ onClose, onSave, currentLanguageId, voiceProviderId }) => {
        const [selectedLanguage, setSelectedLanguage] = useState(currentLanguageId);
        const languagesToShow = AVAILABLE_LANGUAGES_BY_PROVIDER[voiceProviderId] || AVAILABLE_LANGUAGES;

        useEffect(() => {
            // If the currently selected language is not supported by the provider, default to the first available one.
            if (!languagesToShow.some(lang => lang.id === selectedLanguage)) {
                setSelectedLanguage(languagesToShow[0]?.id || AVAILABLE_LANGUAGES[0].id);
            }
        }, [voiceProviderId, languagesToShow, selectedLanguage]);

        return (
            <Modal isOpen={true} onClose={onClose} title="Select Language">
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {languagesToShow.map(lang => (
                        <div
                            key={lang.id}
                            onClick={() => setSelectedLanguage(lang.id)}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedLanguage === lang.id ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <span className="font-medium">{lang.name}</span>
                            {selectedLanguage === lang.id && (
                                <CheckIcon className="h-5 w-5 text-primary" />
                            )}
                        </div>
                    ))}
                </div>
                 <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={onClose} className="bg-slate-200 dark:bg-slate-600 px-4 py-2 rounded-md font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(selectedLanguage)}
                        className="bg-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-primary-dark transition-colors"
                    >
                        Save
                    </button>
                </div>
            </Modal>
        )
    };
    
    const KnowledgeModal: React.FC<{
        isOpen: boolean;
        onClose: () => void;
        agent: VoiceAgent;
        onSave: (updatedSettings: VoiceAgentSettings) => void;
        userId: string;
    }> = ({ isOpen, onClose, agent, onSave, userId }) => {
        const [activeTab, setActiveTab] = useState<'knowledge' | 'config'>('knowledge');
        const [localSettings, setLocalSettings] = useState<VoiceAgentSettings>(agent.settings);
        const [availableDocs, setAvailableDocs] = useState<{id: string; name: string; size: string; uploadedDate: string}[]>([]);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const fileInputRef = useRef<HTMLInputElement>(null);
        
        const documentService = new DocumentService();

        useEffect(() => {
            if (isOpen && userId) {
                // Validate userId
                if (!userId || userId.trim() === '') {
                    console.error('UserId is missing or empty');
                    setError('User authentication error. Please refresh the page and try again.');
                    return;
                }
                
                setLocalSettings(JSON.parse(JSON.stringify(agent.settings)));
                loadDocuments();
            }
        }, [agent, isOpen, userId]);

        const loadDocuments = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Validate userId before making the request
                if (!userId || userId.trim() === '') {
                    throw new Error('User ID is required to load documents');
                }
                
                // Get documents for this user and agent
                const docs = await documentService.getDocuments(userId, agent.id);
                
                // Format documents for display
                const formattedDocs = docs.map(doc => ({
                    id: doc.id,
                    name: doc.name,
                    size: 'Unknown', // We don't store size in our database
                    uploadedDate: new Date(doc.uploadedAt).toISOString().split('T')[0]
                }));
                
                setAvailableDocs(formattedDocs);
            } catch (err) {
                console.error('Error loading documents:', err);
                setError('Failed to load documents: ' + (err instanceof Error ? err.message : 'Unknown error'));
            } finally {
                setLoading(false);
            }
        };

        if (!isOpen) return null;
        
        // Don't render if userId is not available
        if (!userId || userId.trim() === '') {
            return null;
        }
        
        const formatFileSize = (bytes: number): string => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
        };

        const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
            if (event.target.files && userId) {
                try {
                    // Validate userId before uploading
                    if (!userId || userId.trim() === '') {
                        throw new Error('User ID is required to upload documents');
                    }
                    
                    setLoading(true);
                    setError(null);
                    
                    const files = Array.from(event.target.files) as File[];
                    
                    // Check if any file exceeds size limit
                    const maxSize = 10 * 1024 * 1024; // 10MB
                    for (const file of files) {
                        if (file.size > maxSize) {
                            throw new Error(`File "${file.name}" exceeds size limit of 10MB. Please choose a smaller file.`);
                        }
                    }
                    
                    // Upload each file
                    const uploadPromises = files.map(file => 
                        documentService.uploadDocument(userId, file, agent.id)
                    );
                    
                    const uploadedDocs = await Promise.all(uploadPromises);
                    
                    // Format uploaded documents for display
                    const newDocs = uploadedDocs.map(doc => ({
                        id: doc.id,
                        name: doc.name,
                        size: 'Unknown', // We don't store size in our database
                        uploadedDate: new Date(doc.uploadedAt).toISOString().split('T')[0]
                    }));
                    
                    setAvailableDocs(prev => [...prev, ...newDocs]);
                    
                    // Clear the input value to allow uploading the same file again
                    event.target.value = '';
                } catch (err) {
                    console.error('Error uploading files:', err);
                    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred while uploading files';
                    setError(`Failed to upload files: ${errorMessage}`);
                    // Show alert to user for better visibility of the error
                    alert(`Failed to upload files: ${errorMessage}`);
                } finally {
                    setLoading(false);
                }
            }
        };
        
        const handleUploadClick = () => {
            fileInputRef.current?.click();
        };

        const handleSave = async () => {
            try {
                // First save the settings
                onSave(localSettings);
                
                // Then close the modal
                onClose();
            } catch (err) {
                console.error('Error saving knowledge settings:', err);
                setError('Failed to save knowledge settings: ' + (err instanceof Error ? err.message : 'Unknown error'));
            }
        };

        const handleAddDoc = (docId: string) => {
            setLocalSettings(prev => ({ ...prev, knowledgeDocIds: [...(prev.knowledgeDocIds || []), docId] }));
        };
        
        const handleRemoveDoc = (docId: string) => {
            setLocalSettings(prev => ({ ...prev, knowledgeDocIds: (prev.knowledgeDocIds || []).filter(id => id !== docId) }));
        };

        const addedDocIds = new Set(localSettings.knowledgeDocIds || []);
        const addedDocuments = availableDocs.filter(d => addedDocIds.has(d.id));
        const availableDocumentsPool = availableDocs.filter(d => !addedDocIds.has(d.id));

        return (
            <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center p-4" onClick={onClose}>
                <div className="bg-[#0F172A] text-slate-200 rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        multiple
                        accept=".pdf,.doc,.docx,.txt,.md,.csv"
                    />
                    <div className="px-8 py-5">
                        <h2 className="text-2xl font-semibold">Update Agent Knowledge</h2>
                    </div>
                    <div className="px-8 border-b border-slate-700">
                        <nav className="-mb-px flex space-x-8">
                            <button onClick={() => setActiveTab('knowledge')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'knowledge' ? 'border-primary text-white' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'}`}>Knowledge Base</button>
                            <button onClick={() => setActiveTab('config')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'config' ? 'border-primary text-white' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'}`}>Configurations</button>
                        </nav>
                    </div>
                    <div className="p-8 space-y-8 overflow-y-auto flex-1">
                        {loading && (
                            <div className="flex justify-center items-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        )}
                        
                        {error && (
                            <div className="bg-red-900 text-red-100 p-3 rounded-md">
                                {error}
                            </div>
                        )}
                        
                        {activeTab === 'knowledge' && !loading && (
                            <>
                                <div className="bg-[#1E293B] p-6 rounded-lg">
                                    <h3 className="font-semibold text-lg">Added Documents</h3>
                                    <p className="text-sm text-slate-400 mt-1">Documents that the agent has already added as knowledge</p>
                                    <div className="mt-4">
                                        {addedDocuments.length === 0 ? (
                                            <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-700 rounded-lg">No files selected</div>
                                        ) : (
                                            <div className="space-y-2">
                                                {addedDocuments.map(doc => (
                                                    <div key={doc.id} className="bg-[#0F172A] p-3 rounded-md flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <DocumentTextIcon className="h-6 w-6 text-slate-400" />
                                                            <span className="font-medium">{doc.name}</span>
                                                        </div>
                                                        <button onClick={() => handleRemoveDoc(doc.id)} className="text-slate-400 hover:text-white"><XMarkIcon className="h-5 w-5"/></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-[#1E293B] p-6 rounded-lg">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-semibold text-lg">Available Documents</h3>
                                        <button onClick={handleUploadClick} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-3 rounded-lg flex items-center text-sm"><ArrowUpTrayIcon className="h-4 w-4 mr-2"/>Upload New Document</button>
                                    </div>
                                    {availableDocs.length === 0 ? (
                                        <div className="text-center py-10 border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center">
                                            <p className="text-slate-400 mb-4">No documents available</p>
                                            <button onClick={handleUploadClick} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg flex items-center"><PlusIcon className="h-5 w-5 mr-2"/>Upload</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {availableDocumentsPool.map(doc => (
                                                 <div key={doc.id} className="bg-[#0F172A] p-3 rounded-md flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <DocumentTextIcon className="h-6 w-6 text-slate-400" />
                                                        <span className="font-medium">{doc.name}</span>
                                                    </div>
                                                    <button onClick={() => handleAddDoc(doc.id)} className="text-primary hover:text-emerald-400 font-semibold text-sm">Add</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                        
                        {activeTab === 'config' && !loading && (
                            <div className="bg-[#1E293B] p-6 rounded-lg">
                                <h3 className="font-semibold text-lg">Pre-Action Phrases</h3>
                                <p className="text-sm text-slate-400 mt-1">Define the phrases your agent will say before searching for knowledge base. If left blank, the system will use pre-defined English* phrases like: "Let me check", "One sec", "Let me see", "Hold on", "Checking now", "One moment please" etc.</p>
                                <div className="mt-4">
                                     <input
                                        type="text"
                                        value={(localSettings.preActionPhrases || []).join(', ')}
                                        onChange={e => {
                                            const phrases = e.target.value.split(',').map(p => p.trim()).filter(p => p);
                                            setLocalSettings(prev => ({ ...prev, preActionPhrases: phrases }));
                                        }}
                                        placeholder="Enter phrases separated by commas"
                                        className="w-full bg-[#0F172A] border border-slate-600 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="px-8 py-5 bg-[#1E293B] flex justify-end space-x-3 rounded-b-lg">
                        <button onClick={onClose} className="text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-700">Cancel</button>
                        <button onClick={handleSave} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">Save</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderToolsModal = () => (
        <div className={`fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-start py-10 ${isToolsModalOpen ? '' : 'hidden'}`} onClick={() => setToolsModalOpen(false)}>
            <div className="bg-[#1A222C] text-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-700">
                    <h3 className="text-xl font-semibold">{editingTool ? 'Edit Function' : 'Create Function'}</h3>
                </div>
                <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {/* Function Name & Description */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Function Name</label>
                        <input type="text" placeholder="Enter function name" name="name" value={newTool.name} onChange={handleNewToolChange} className="w-full bg-[#243140] border border-gray-600 rounded-md px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea placeholder="Enter function description" name="description" value={newTool.description} onChange={(e) => setNewTool(p => ({...p, description: e.target.value}))} rows={4} className="w-full bg-[#243140] border border-gray-600 rounded-md px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"></textarea>
                    </div>
                    
                    <div className="bg-[#243140] p-3 rounded-md">
                        <p className="text-sm text-emerald-300">Tip: Use the "Required" checkbox for parameters that the agent must collect from the user during the conversation.</p>
                    </div>
                    
                    {/* Function Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Select Function Type</label>
                        <div className="flex bg-[#243140] p-1 rounded-md">
                            {[{ value: 'Webhook', label: 'Webhook' }, { value: 'WebForm', label: 'Web Form' }, { value: 'GoogleSheets', label: 'Google Sheets' }].map((type) => (
                                <button 
                                    key={type.value}
                                    onClick={() => setNewToolFunctionType(type.value as 'Webhook' | 'WebForm' | 'GoogleSheets')} 
                                    className={`flex-1 py-1.5 rounded text-sm ${newToolFunctionType === type.value ? 'bg-emerald-600' : ''}`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Webhook Fields */}
                    {newToolFunctionType === 'Webhook' && (
                        <>
                            <div className="p-4 border border-gray-700 rounded-md space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Webhook URL</label>
                                    <input type="text" placeholder="Enter webhook URL" name="webhookUrl" value={newTool.webhookUrl} onChange={handleNewToolChange} className="w-full bg-[#243140] border border-gray-600 rounded-md px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"/>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium mb-1">Method:</label>
                                    <div className="flex bg-[#243140] p-1 rounded-md w-32">
                                        {[{ value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' }].map((method) => (
                                            <button 
                                                key={method.value}
                                                onClick={() => setNewTool(p => ({...p, method: method.value}))} 
                                                className={`flex-1 py-1 rounded text-sm ${newTool.method === method.value ? 'bg-emerald-600' : ''}`}
                                            >
                                                {method.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-[#243140] p-3 rounded-md">
                                <p className="text-sm text-gray-300">When a parameter is marked as required, the AI agent will compulsorily ask the user for that information during the conversation before calling this webhook.</p>
                            </div>

                            {/* Headers Section */}
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <div className="flex-grow border-t border-gray-700"></div>
                                    <button type="button" onClick={handleAddHeader} className="mx-4 text-emerald-500 font-semibold text-sm">Add Header</button>
                                    <div className="flex-grow border-t border-gray-700"></div>
                                </div>
                                {(newTool.headers || []).length > 0 && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-[1fr_1fr_auto] gap-x-4 items-center">
                                            <label className="text-sm font-medium text-gray-300">Key</label>
                                            <label className="text-sm font-medium text-gray-300">Value</label>
                                            <div></div>
                                        </div>
                                        {(newTool.headers || []).map((header, index) => (
                                            <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-x-4 items-center">
                                                <input type="text" value={header.key} onChange={e => handleHeaderChange(index, 'key', e.target.value)} placeholder="Header key" className="w-full bg-[#243140] border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"/>
                                                <input type="text" value={header.value} onChange={e => handleHeaderChange(index, 'value', e.target.value)} className="w-full bg-[#243140] border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"/>
                                                <button type="button" onClick={() => handleDeleteHeader(index)} className="text-red-500 hover:text-red-400 p-1">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Parameters Section for Webhook */}
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <div className="flex-grow border-t border-gray-700"></div>
                                    <button type="button" onClick={handleAddParameter} className="mx-4 text-emerald-500 font-semibold text-sm">Add Parameter</button>
                                    <div className="flex-grow border-t border-gray-700"></div>
                                </div>
                                {(newTool.parameters || []).length > 0 && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-[2fr_1fr_auto_auto] gap-x-4 items-center">
                                            <label className="text-sm font-medium text-gray-300">Name</label>
                                            <label className="text-sm font-medium text-gray-300">Type</label>
                                            <label className="text-sm font-medium text-gray-300 pl-2">Required</label>
                                            <div></div>
                                        </div>
                                        {(newTool.parameters || []).map((param, index) => (
                                            <div key={index} className="grid grid-cols-[2fr_1fr_auto_auto] gap-x-4 items-center">
                                                <input type="text" value={param.name} onChange={e => handleParameterChange(index, 'name', e.target.value)} placeholder="Parameter name" className="w-full bg-[#243140] border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"/>
                                                <select value={param.type} onChange={e => handleParameterChange(index, 'type', e.target.value)} className="w-full bg-[#243140] border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500">
                                                    {[
                                                        { value: 'string', label: 'string' },
                                                        { value: 'number', label: 'number' },
                                                        { value: 'boolean', label: 'boolean' }
                                                    ].map((type) => (
                                                        <option key={type.value} value={type.value}>{type.label}</option>
                                                    ))}
                                                </select>
                                                <div className="flex items-center justify-center">
                                                   <input type="checkbox" checked={param.required} onChange={e => handleParameterChange(index, 'required', e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-emerald-600 focus:ring-emerald-500"/>
                                                </div>
                                                <button type="button" onClick={() => handleDeleteParameter(index)} className="text-red-500 hover:text-red-400 p-1">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {newToolFunctionType === 'WebForm' && (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-400">Prompt users to enter information, such as email or phone numbers, through a web form. When a parameter is marked as required, the AI agent will compulsorily ask the user for that information during the conversation.</p>
                            
                            {(newTool.parameters || []).map((param, index) => (
                                <div key={index} className="grid grid-cols-[2fr_1fr_auto_auto] gap-x-4 items-end">
                                    <div>
                                        {index === 0 && <label className="block text-sm font-medium mb-1">Name</label>}
                                        <input type="text" value={param.name} onChange={e => handleParameterChange(index, 'name', e.target.value)} placeholder="Parameter name" className="w-full bg-[#243140] border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"/>
                                    </div>
                                    <div>
                                        {index === 0 && <label className="block text-sm font-medium mb-1">Type</label>}
                                        <select value={param.type} onChange={e => handleParameterChange(index, 'type', e.target.value)} className="w-full bg-[#243140] border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500">
                                            {[
                                                { value: 'string', label: 'string' },
                                                { value: 'number', label: 'number' },
                                                { value: 'boolean', label: 'boolean' }
                                            ].map((type) => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        {index === 0 && <label className="block text-sm font-medium mb-1 pl-2">Required</label>}
                                        <input type="checkbox" checked={param.required} onChange={e => handleParameterChange(index, 'required', e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-emerald-600 focus:ring-emerald-500 mt-2"/>
                                    </div>
                                    <button type="button" onClick={() => handleDeleteParameter(index)} className="text-red-500 hover:text-red-400 p-1 mb-1">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            
                            <div className="flex justify-center pt-2">
                                <button type="button" onClick={handleAddParameter} className="text-emerald-500 font-semibold text-sm">Add Parameter</button>
                            </div>
                        </div>
                    )}

                    {newToolFunctionType === 'GoogleSheets' && (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-400">Save collected user data directly to Google Sheets. When a parameter is marked as required, the AI agent will compulsorily ask the user for that information during the conversation.</p>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Google Sheets URL</label>
                                <input 
                                    type="text" 
                                    name="webhookUrl" 
                                    value={newTool.webhookUrl} 
                                    onChange={handleNewToolChange} 
                                    placeholder="Paste the link to your Google Sheet here" 
                                    className="w-full bg-[#243140] border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                <p className="text-xs text-gray-400 mt-1">Share your Google Sheet with edit access to the application to enable data collection.</p>
                            </div>
                            
                            <div className="border-t border-gray-700 pt-3 mt-3">
                                <h4 className="text-sm font-medium mb-2">Data Fields</h4>
                                <p className="text-xs text-gray-400 mb-3">Define the fields you want to collect from users. The AI agent will ask for required fields during the conversation.</p>
                                
                                {(newTool.parameters || []).map((param, index) => (
                                    <div key={index} className="grid grid-cols-[2fr_1fr_auto_auto] gap-x-4 items-end">
                                        <div>
                                            {index === 0 && <label className="block text-sm font-medium mb-1">Field Name</label>}
                                            <input type="text" value={param.name} onChange={e => handleParameterChange(index, 'name', e.target.value)} placeholder="Field name" className="w-full bg-[#243140] border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"/>
                                        </div>
                                        <div>
                                            {index === 0 && <label className="block text-sm font-medium mb-1">Type</label>}
                                            <select value={param.type} onChange={e => handleParameterChange(index, 'type', e.target.value)} className="w-full bg-[#243140] border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500">
                                                {[
                                                    { value: 'string', label: 'string' },
                                                    { value: 'number', label: 'number' },
                                                    { value: 'boolean', label: 'boolean' }
                                                ].map((type) => (
                                                    <option key={type.value} value={type.value}>{type.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center justify-center">
                                            {index === 0 && <label className="block text-sm font-medium mb-1 pl-2">Required</label>}
                                            <input type="checkbox" checked={param.required} onChange={e => handleParameterChange(index, 'required', e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-emerald-600 focus:ring-emerald-500 mt-2"/>
                                        </div>
                                        <button type="button" onClick={() => handleDeleteParameter(index)} className="text-red-500 hover:text-red-400 p-1 mb-1">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                                
                                <div className="flex justify-center pt-2">
                                    <button type="button" onClick={handleAddParameter} className="text-emerald-500 font-semibold text-sm">Add Field</button>
                                </div>
                            </div>
                        </div>
                    )}
                     
                     <div className="space-y-4 !mt-8">
                        <div className="p-4 border border-gray-700 rounded-md flex justify-between items-center">
                            <div>
                                <label className="font-medium">Run Function After Call</label>
                                <p className="text-xs text-gray-400">Set the function to execute after the call ended.</p>
                            </div>
                            <label className="flex items-center cursor-pointer">
                                <div className="relative">
                                    <input type="checkbox" className="sr-only" checked={newTool.runAfterCall} onChange={(e) => setNewTool(p => ({...p, runAfterCall: e.target.checked}))} />
                                    <div className={`block w-10 h-6 rounded-full transition ${newTool.runAfterCall ? 'bg-emerald-600' : 'bg-gray-600'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${newTool.runAfterCall ? 'translate-x-full' : ''}`}></div>
                                </div>
                            </label>
                        </div>
                    </div>


                    {/* Pre-Action Phrases */}
                    <div className="space-y-3">
                        <label className="block font-medium">Pre-Action Phrases</label>
                        <p className="text-sm text-gray-400">Define the phrases your agent will say before calling the function. If left blank, the agent will autonomously come up with phrases.</p>
                        {preActionPhraseOptions.map(opt => (
                            <div key={opt.id} className="flex items-start">
                                <input type="radio" id={opt.id} name="preActionPhrasesMode" value={opt.id} checked={newTool.preActionPhrasesMode === opt.id} onChange={(e) => setNewTool(p => ({...p, preActionPhrasesMode: e.target.value as PreActionPhraseMode}))} className="mt-1 h-4 w-4 text-emerald-600 bg-gray-700 border-gray-600 focus:ring-emerald-500" />
                                <div className="ml-3 text-sm">
                                    <label htmlFor={opt.id} className="font-medium capitalize">{opt.label}</label>
                                    <p className="text-gray-400">{opt.description}</p>
                                </div>
                            </div>
                        ))}
                        {(newTool.preActionPhrasesMode === 'flexible' || newTool.preActionPhrasesMode === 'strict') && (
                            <input type="text" name="preActionPhrases" value={newTool.preActionPhrases} onChange={handleNewToolChange} placeholder="Enter phrases separated by commas" className="w-full bg-[#243140] border border-gray-600 rounded-md px-3 py-2 mt-2 focus:ring-emerald-500 focus:border-emerald-500"/>
                        )}
                    </div>
                </div>
                <div className="px-6 py-4 bg-[#243140] flex justify-end space-x-3">
                    <button onClick={() => { setToolsModalOpen(false); setNewTool(initialNewToolState); setEditingTool(null); }} className="text-white font-semibold py-2 px-4 rounded-lg">Cancel</button>
                    <button onClick={handleSubmitTool} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg">{editingTool ? 'Update' : 'Create'}</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-lightbg-dark dark:bg-darkbg-lighter min-h-full">
            {isModelModalOpen && (
                <ModelSelectionModal
                    onClose={() => setModelModalOpen(false)}
                    onSave={handleSaveModel}
                    currentModelId={editedAgent.model}
                />
            )}
             {isVoiceModalOpen && (
                <VoiceSelectionModal
                    onClose={() => setVoiceModalOpen(false)}
                    onSave={handleSaveVoice}
                    currentVoiceId={editedAgent.voiceId}
                />
            )}
            {isLanguageModalOpen && (
                <LanguageSelectionModal
                    onClose={() => setLanguageModalOpen(false)}
                    onSave={handleSaveLanguage}
                    currentLanguageId={editedAgent.language}
                    voiceProviderId={getVoiceProviderById(editedAgent.voiceId)}
                />
            )}
            {userId && (
              <KnowledgeModal
                isOpen={isKnowledgeModalOpen}
                onClose={() => setKnowledgeModalOpen(false)}
                agent={editedAgent}
                userId={userId}
                onSave={async (newSettings) => {
                  try {
                    const updatedAgent = { ...editedAgent, settings: newSettings };
                    setEditedAgent(updatedAgent);
                    await updateAgent(updatedAgent);
                    setKnowledgeModalOpen(false);
                  } catch (error) {
                    console.error('Error saving knowledge settings:', error);
                  }
                }}
              />
            )}
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4 p-1 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-darkbg-light sticky top-0 z-10">
                <div className="flex items-center">
                    <button onClick={onBack} className="mr-2 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-darkbg"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                    <h2 className="text-2xl font-bold">{editedAgent.name}</h2>
                    <div className="flex items-center gap-2 ml-4">
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full inline-flex items-center bg-green-100 text-green-800"><span className="h-2 w-2 rounded-full mr-1.5 bg-green-500"></span>Active</span>
                        <div className="text-sm text-slate-500 flex items-center bg-slate-100 dark:bg-darkbg-light rounded-md px-2 py-1">
                            <span>ID: {editedAgent.id}</span>
                            <button onClick={() => copyToClipboard(editedAgent.id, 'ID')} className="ml-2 text-slate-400 hover:text-primary"><DocumentDuplicateIcon className="h-4 w-4" /></button>
                        </div>
                    </div>
                </div>
                <div className="relative" ref={actionsDropdownRef}>
                    <button onClick={() => setActionsDropdownOpen(p => !p)} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg flex items-center">Actions <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></button>
                     {isActionsDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-darkbg-light border dark:border-slate-700 rounded-md shadow-lg z-20">
                            <ul className="py-1">
                                {[
                                    { label: 'Duplicate', icon: DocumentDuplicateIcon, action: () => onDuplicate(editedAgent) },
                                    { label: 'Delete', icon: TrashIcon, action: () => onDelete(editedAgent.id), isDestructive: true },
                                ].map((item) => (
                                    <li key={item.label}>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); item.action(); setActionsDropdownOpen(false); }}
                                            className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm ${item.isDestructive ? 'text-red-600 dark:text-red-500' : 'text-slate-700 dark:text-slate-300'} hover:bg-slate-100 dark:hover:bg-darkbg`}
                                        >
                                            <item.icon className="h-5 w-5" />
                                            {item.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
             <div className="border-b border-slate-200 dark:border-slate-800 px-1 bg-white dark:bg-darkbg-light">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <a href="#" className="border-primary text-primary whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">General</a>
                </nav>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 sm:p-6 lg:p-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white dark:bg-darkbg-light rounded-lg shadow-sm">
                        {[
                            { title: 'Model', value: AVAILABLE_MODELS.find(m => m.id === editedAgent.model)?.name || editedAgent.model, icon: ModelIcon, action: () => setModelModalOpen(true) },
                            { title: 'Voice', value: getVoiceNameById(editedAgent.voiceId), icon: VoiceIcon, action: () => setVoiceModalOpen(true) },
                            { title: 'Language', value: AVAILABLE_LANGUAGES.find(l => l.id === editedAgent.language)?.name || editedAgent.language, icon: LanguageIcon, action: () => setLanguageModalOpen(true) },
                        ].map(item => (
                             <button onClick={item.action} key={item.title} className="flex items-center p-2 text-left w-full hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <item.icon className="h-6 w-6 mr-4 text-slate-500 dark:text-slate-400" />
                                <div>
                                    <h4 className="text-sm text-slate-500 dark:text-slate-400">{item.title}</h4>
                                    <p className="font-semibold">{item.value}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="bg-white dark:bg-darkbg-light rounded-lg shadow-sm">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-xl font-semibold">Agent Prompt</h3>
                             {!isEditingPrompt ? (
                                <button onClick={() => setIsEditingPrompt(true)} className="flex items-center text-sm font-semibold text-primary hover:text-primary-dark"><EditIcon className="h-4 w-4 mr-1.5" /> Edit</button>
                            ) : (
                                <div className="space-x-2">
                                    <button onClick={handleCancelPrompt} className="text-sm font-semibold px-3 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-darkbg">Cancel</button>
                                    <button onClick={handleSavePrompt} className="text-sm font-semibold text-white bg-primary px-3 py-1 rounded-md">Save</button>
                                </div>
                            )}
                        </div>
                        <div className="p-6">
                            {isEditingPrompt ? (
                                <textarea name="identity" value={editedAgent.identity} onChange={handleSettingsChange} className="w-full h-64 p-3 font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-primary focus:border-primary" />
                            ) : (
                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">{editedAgent.identity}</p>
                            )}
                        </div>
                    </div>

                    <SettingsCard title="Conversation Flow">
                        <SettingsToggle label="User starts first" description="Agent will wait for user to start first." name="settings.userStartsFirst" checked={editedAgent.settings.userStartsFirst} onChange={handleSettingsChange} />
                        <div>
                            <label htmlFor="greetingLine" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Greeting Line</label>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Set the first message the agent says to start the conversation. Leave blank to disable.</p>
                            <input type="text" id="greetingLine" name="settings.greetingLine" value={editedAgent.settings.greetingLine} onChange={handleSettingsChange} className="mt-2 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                        </div>
                        <SettingsToggle label="Response Delay" description="Set a fixed delay before the agent processes user input and responds." name="settings.responseDelay" checked={editedAgent.settings.responseDelay} onChange={handleSettingsChange} />
                        <SettingsToggle label="Inactivity Handling" description="Configure the agent to prompt the user after a period of inactivity, ensuring the user is still engaged." name="settings.inactivityHandling" checked={editedAgent.settings.inactivityHandling} onChange={handleSettingsChange} />
                        <SettingsToggle label="Agent can terminate call" description="Agent will be able to decide to terminate the call by itself." name="settings.agentCanTerminateCall" checked={editedAgent.settings.agentCanTerminateCall} onChange={handleSettingsChange} isBeta />
                        <SettingsToggle label="Voicemail Detection" description="Agent will be able to detect voicemail and handle it." name="settings.voicemailDetection" checked={editedAgent.settings.voicemailDetection} onChange={handleSettingsChange} isBeta warning="The feature only works with Twilio and Plivo providers." />
                        <SettingsToggle label="Call Transfer" description="Agent will be able to transfer calls to human agents." name="settings.callTransfer" checked={editedAgent.settings.callTransfer} onChange={handleSettingsChange} isBeta />
                        <SettingsToggle label="DTMF Dial" description="Agent will be able to dial dtmf tones to navigate through IVR, voicemail systems, etc." name="settings.dtmfDial" checked={editedAgent.settings.dtmfDial} onChange={handleSettingsChange} isBeta />
                    </SettingsCard>

                    <SettingsCard title="Advanced Settings">
                        <div>
                            <label htmlFor="agentTimezone" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Agent Timezone</label>
                            <select id="agentTimezone" name="settings.agentTimezone" value={editedAgent.settings.agentTimezone} onChange={handleSettingsChange} className="mt-2 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                                {[{ value: '', label: 'Select a timezone' },
                                    { value: 'UTC', label: 'UTC' },
                                    { value: 'America/New_York', label: 'America/New_York' },
                                    { value: 'America/Chicago', label: 'America/Chicago' },
                                    { value: 'America/Denver', label: 'America/Denver' },
                                    { value: 'America/Los_Angeles', label: 'America/Los_Angeles' },
                                    { value: 'Europe/London', label: 'Europe/London' },
                                    { value: 'Europe/Paris', label: 'Europe/Paris' },
                                    { value: 'Europe/Berlin', label: 'Europe/Berlin' },
                                    { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
                                    { value: 'Asia/Shanghai', label: 'Asia/Shanghai' },
                                    { value: 'Asia/Dubai', label: 'Asia/Dubai' },
                                    { value: 'Australia/Sydney', label: 'Australia/Sydney' }
                                ].map((tz) => (
                                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                             <SettingsToggle label="Override" description="Set the confidence level for detecting voice. 1 is the highest confidence, meaning the agent is less likely to detect voice and pause." name="settings.overrideVAD" checked={editedAgent.settings.overrideVAD} onChange={handleSettingsChange} />
                            <div className="flex items-center gap-4 mt-2">
                                <span>0</span>
                                <input type="range" min="0" max="1" step="0.05" name="settings.voiceDetectionConfidenceThreshold" value={editedAgent.settings.voiceDetectionConfidenceThreshold} onChange={handleSettingsChange} data-type="number" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700" />
                                <span>1</span>
                            </div>
                             <div className="text-center text-sm text-slate-500 mt-1">Default: {editedAgent.settings.voiceDetectionConfidenceThreshold}</div>
                        </div>
                         <div>
                            <label htmlFor="backgroundAmbientSound" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Background Ambient Sound</label>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select background ambient sound to play during the call</p>
                            <select id="backgroundAmbientSound" name="settings.backgroundAmbientSound" value={editedAgent.settings.backgroundAmbientSound} onChange={handleSettingsChange} className="mt-2 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                                {[
                                    { value: '', label: 'None' },
                                    { value: 'office', label: 'Office' },
                                    { value: 'cafe', label: 'Cafe' },
                                    { value: 'restaurant', label: 'Restaurant' },
                                    { value: 'park', label: 'Park' },
                                    { value: 'home', label: 'Home' }
                                ].map((sound) => (
                                    <option key={sound.value} value={sound.value}>{sound.label}</option>
                                ))}
                            </select>
                        </div>
                        <SettingsToggle label="Call Recording" description="Enable or disable recording of calls. Recording is disabled by default." name="settings.callRecording" checked={editedAgent.settings.callRecording} onChange={handleSettingsChange} />
                         <div>
                            <h4 className="font-medium text-slate-700 dark:text-slate-200">Session Timeout</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Set the session to automatically end after a fixed duration or following a period of no voice activity.</p>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label htmlFor="sessionTimeoutFixedDuration" className="text-sm text-slate-600 dark:text-slate-300">Fixed Duration: <span className="text-xs">(Max 24 hours)</span></label>
                                    <input type="number" id="sessionTimeoutFixedDuration" name="settings.sessionTimeoutFixedDuration" value={editedAgent.settings.sessionTimeoutFixedDuration} onChange={handleSettingsChange} min="0" max="86400" className="mt-1 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md" placeholder="Enter duration in seconds (max 86400)"/>
                                </div>
                                <div>
                                    <label htmlFor="sessionTimeoutNoVoiceActivity" className="text-sm text-slate-600 dark:text-slate-300">No Voice Activity:</label>
                                    <input type="number" id="sessionTimeoutNoVoiceActivity" name="settings.sessionTimeoutNoVoiceActivity" value={editedAgent.settings.sessionTimeoutNoVoiceActivity} onChange={handleSettingsChange} min="0" max="3600" className="mt-1 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md" placeholder="Enter timeout in seconds (max 3600)"/>
                                </div>
                                <div>
                                    <label htmlFor="sessionTimeoutEndMessage" className="text-sm text-slate-600 dark:text-slate-300">Message the agent says when the session ends</label>
                                    <input type="text" id="sessionTimeoutEndMessage" name="settings.sessionTimeoutEndMessage" value={editedAgent.settings.sessionTimeoutEndMessage} onChange={handleSettingsChange} className="mt-1 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md" />
                                </div>
                            </div>
                        </div>
                    </SettingsCard>
                    <SettingsCard title="Privacy Settings">
                        <SettingsToggle label="Data Privacy Opt-Out" description="Choose to opt-out of storing personal data and conversation history to comply with legal requirements like HIPAA." name="settings.dataPrivacyOptOut" checked={editedAgent.settings.dataPrivacyOptOut} onChange={handleSettingsChange} />
                        <SettingsToggle label="Do Not Call Detection" description="Enable detection of 'Do Not Call' intent to ensure compliance with telemarketing regulations." name="settings.doNotCallDetection" checked={editedAgent.settings.doNotCallDetection} onChange={handleSettingsChange} />
                    </SettingsCard>

                </div>
                {/* Right Column */}
                <div className="lg:col-span-1">
                    <div className="sticky top-28 space-y-6">
                        <details className="bg-white dark:bg-darkbg-light rounded-lg shadow-sm" open>
                           <summary className="flex justify-between items-center p-4 cursor-pointer font-semibold">
                               <span className="flex items-center gap-2"><SipPhoneIcon className="h-5 w-5 text-primary" /> Call Agent</span>
                               <svg className="w-5 h-5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </summary>
                           <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="border-b border-slate-200 dark:border-slate-700">
                                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                                        <button onClick={() => setCallAgentTab('web')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${callAgentTab === 'web' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                                            Web
                                        </button>
                                        <button onClick={() => setCallAgentTab('chat')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${callAgentTab === 'chat' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                                            Chat
                                        </button>
                                    </nav>
                                </div>
                                {callAgentTab === 'web' ? (
                                    <div className="text-center py-8">
                                        <button onClick={isCallActive ? stopCall : startCall} className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isCallActive ? 'bg-red-500 hover:bg-red-600 shadow-lg animate-pulse' : 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600'}`}>
                                            <MicrophoneIcon className="h-10 w-10 text-white" />
                                        </button>
                                        <p className="mt-4 font-semibold text-slate-700 dark:text-slate-200">{isCallActive ? 'Stop' : 'Start'}</p>
                                    </div>
                                ) : (
                                    <div className="pt-4 flex flex-col h-96">
                                        <div ref={chatContainerRef} className="flex-1 space-y-3 overflow-y-auto p-2">
                                            {chatMessages.map((msg, index) => (
                                                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100'}`}>
                                                        {msg.text}
                                                    </div>
                                                </div>
                                            ))}
                                            {isAgentReplying && (
                                                 <div className="flex justify-start">
                                                    <div className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700">
                                                        <div className="flex items-center space-x-1">
                                                            <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                                            <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                                            <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-pulse"></span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <form onSubmit={handleSendMessage} className="mt-2 flex items-center">
                                            <input type="text" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} placeholder="Type your message" className="flex-1 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-l-md focus:outline-none focus:ring-primary focus:border-primary text-sm"/>
                                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-r-md hover:bg-primary-dark disabled:bg-primary/50" disabled={isAgentReplying || !API_KEY}>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                            </button>
                                        </form>
                                    </div>
                                )}
                           </div>
                        </details>
                        
                        <div className="bg-white dark:bg-darkbg-light rounded-lg shadow-sm p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold flex items-center gap-2"><KnowledgeIcon className="h-5 w-5 text-slate-500"/> Knowledge</h3>
                                <button onClick={() => setKnowledgeModalOpen(true)} className="text-sm font-semibold text-primary hover:text-primary-dark">Edit</button>
                            </div>
                            <p className="text-sm text-slate-500">Upload documents to enrich your voice agent's knowledge base. {editedAgent.settings.knowledgeDocIds?.length || 0} document(s) added.</p>
                            <button onClick={() => setKnowledgeModalOpen(true)} className="w-full text-center py-2 px-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:border-primary text-slate-600 dark:text-slate-300 hover:text-primary font-semibold transition">+ Add Document</button>
                        </div>
                        
                        <div className="bg-white dark:bg-darkbg-light rounded-lg shadow-sm p-4 space-y-3">
                            <h3 className="font-semibold flex items-center gap-2"><ToolsIcon className="h-5 w-5 text-slate-500"/> Tools</h3>
                            <p className="text-sm text-slate-500">Define tools to collect user data during conversations. When a parameter is marked as required, the AI agent will compulsorily ask the user for that information. {editedAgent.settings.tools.length} tool(s) configured.</p>
                            
                            {/* Data Collection Tool Section */}
                            <div className="bg-blue-50 dark:bg-slate-800/30 border border-blue-200 dark:border-blue-900 rounded-lg p-3 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-medium text-blue-900 dark:text-blue-100">Data Collection (Excel/Sheets)</h4>
                                        <p className="text-xs text-blue-700 dark:text-blue-300">Automatically collect caller information (name, phone, email, requirement, purpose)</p>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="dataCollectionSheetUrl" className="block text-sm font-medium mb-1">Google Sheets Link</label>
                                    <input 
                                        type="text" 
                                        id="dataCollectionSheetUrl" 
                                        placeholder="Paste your Google Sheets link here (or leave empty to disable)"
                                        value={editedAgent.settings.dataCollectionSheetUrl || ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setEditedAgent(prev => {
                                                const agent = { ...prev };
                                                if (!agent.settings) agent.settings = {} as any;
                                                (agent.settings as any).dataCollectionSheetUrl = value;
                                                if (value) {
                                                    updateDataCollectionTool(value);
                                                } else {
                                                    removeDataCollectionTool();
                                                }
                                                return agent;
                                            });
                                        }}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-blue-300 dark:border-blue-700 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Share your Google Sheet with edit access to enable automatic data collection during calls.</p>
                                </div>
                            </div>
                            
                            <button onClick={() => { setEditingTool(null); setNewTool(initialNewToolState); setNewToolFunctionType('Webhook'); setToolsModalOpen(true); }} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">+ Add Custom Tool</button>
                            {editedAgent.settings.tools.length > 0 && (
                                <div className="space-y-2 pt-2">
                                {editedAgent.settings.tools.map(tool => (
                                    <div key={tool.id} className="text-sm p-2 rounded-md border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                        <div>
                                            <span className="font-medium">{tool.name}</span>
                                            <span className="text-xs ml-2 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                                                {tool.type === ToolType.Webhook ? 'Webhook' : 
                                                 tool.type === ToolType.WebForm ? 'Web Form' : 
                                                 'Google Sheets'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleEditTool(tool)} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600"><EditIcon className="h-4 w-4" /></button>
                                            <button onClick={() => handleDeleteTool(tool.id)} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 text-red-500"><TrashIcon className="h-4 w-4" /></button>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white dark:bg-darkbg-light rounded-lg shadow-sm p-4 space-y-3">
                            <h3 className="font-semibold flex items-center gap-2"><WebhookIcon className="h-5 w-5 text-slate-500"/> Webhook Settings</h3>
                            <div>
                                <label htmlFor="prefetchDataWebhook" className="text-sm font-medium">Prefetch Data Webhook</label>
                                <input type="text" id="prefetchDataWebhook" name="settings.prefetchDataWebhook" value={editedAgent.settings.prefetchDataWebhook} onChange={handleSettingsChange} className="mt-1 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md"/>
                            </div>
                            <div>
                                <label htmlFor="endOfCallWebhook" className="text-sm font-medium">End-of-Call Webhook</label>
                                <input type="text" id="endOfCallWebhook" name="settings.endOfCallWebhook" value={editedAgent.settings.endOfCallWebhook} onChange={handleSettingsChange} className="mt-1 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md"/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {renderToolsModal()}
        </div>
    );
};

export default AgentDetailPage;