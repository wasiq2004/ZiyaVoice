"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaStreamHandler = void 0;
var sdk_1 = require("@deepgram/sdk");
var llmService_js_1 = require("./llmService.js");
var ulaw = require("node-ulaw");
var sessions = new Map();
var MediaStreamHandler = /** @class */ (function () {
    function MediaStreamHandler(deepgramApiKey, geminiApiKey, campaignService) {
        this.deepgramClient = (0, sdk_1.createClient)(deepgramApiKey);
        this.llmService = new llmService_js_1.LLMService(geminiApiKey);
        this.campaignService = campaignService;
    }
    // Create a new session for a call
    MediaStreamHandler.prototype.createSession = function (campaignId, contactId, agentPrompt, ws) {
        var sessionId = "".concat(campaignId, "-").concat(contactId);
        var session = {
            campaignId: campaignId,
            contactId: contactId,
            context: [],
            sttStream: null,
            agentPrompt: agentPrompt,
            ws: ws
        };
        sessions.set(sessionId, session);
        console.log("Created session for campaign ".concat(campaignId, " and contact ").concat(contactId));
        return session;
    };
    // End a session and clean up resources
    MediaStreamHandler.prototype.endSession = function (campaignId, contactId) {
        var sessionId = "".concat(campaignId, "-").concat(contactId);
        var session = sessions.get(sessionId);
        if (session) {
            if (session.sttStream) {
                session.sttStream.removeAllListeners();
            }
            sessions.delete(sessionId);
            console.log("Ended session for campaign ".concat(campaignId, " and contact ").concat(contactId));
        }
    };
    // Append text to the conversation context
    MediaStreamHandler.prototype.appendToContext = function (session, text, role) {
        session.context.push({ role: role, parts: [{ text: text }] });
        console.log("Added ".concat(role, " message to context: ").concat(text));
    };
    // Handle WebSocket connection
    MediaStreamHandler.prototype.handleConnection = function (ws, req) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, campaignId_1, contactId_1, campaignData, agentPrompt, session_1, deepgramLive, error_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        _a = req.query, campaignId_1 = _a.campaignId, contactId_1 = _a.contactId;
                        if (!campaignId_1 || !contactId_1) {
                            console.error('Missing campaignId or contactId in WebSocket connection');
                            ws.close();
                            return [2 /*return*/];
                        }
                        console.log("WebSocket connection established for campaign ".concat(campaignId_1, " and contact ").concat(contactId_1));
                        return [4 /*yield*/, this.campaignService.getCampaignWithRecords(campaignId_1, 'user_id')];
                    case 1:
                        campaignData = _b.sent();
                        agentPrompt = (campaignData === null || campaignData === void 0 ? void 0 : campaignData.campaign.name) || 'You are a helpful assistant';
                        session_1 = this.createSession(campaignId_1, contactId_1, agentPrompt, ws);
                        deepgramLive = this.deepgramClient.listen.live({
                            encoding: 'mulaw',
                            sample_rate: 8000,
                            model: 'nova-2-phonecall',
                            smart_format: true,
                            interim_results: false,
                            utterance_end_ms: 1000
                        });
                        session_1.sttStream = deepgramLive;
                        // Handle Deepgram transcription results
                        deepgramLive.on(sdk_1.LiveTranscriptionEvents.Transcript, function (data) { return __awaiter(_this, void 0, void 0, function () {
                            var transcript, llmResponse, ttsAudio, error_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 4, , 5]);
                                        transcript = data.channel.alternatives[0].transcript;
                                        if (!transcript.trim()) return [3 /*break*/, 3];
                                        console.log("Transcribed text: ".concat(transcript));
                                        // Add user utterance to context
                                        this.appendToContext(session_1, transcript, 'user');
                                        return [4 /*yield*/, this.callLLM(session_1)];
                                    case 1:
                                        llmResponse = _a.sent();
                                        // Add agent response to context
                                        this.appendToContext(session_1, llmResponse, 'agent');
                                        return [4 /*yield*/, this.synthesizeTTS(llmResponse)];
                                    case 2:
                                        ttsAudio = _a.sent();
                                        // Send audio back through WebSocket
                                        if (ttsAudio) {
                                            this.sendAudioToTwilio(ws, ttsAudio);
                                        }
                                        _a.label = 3;
                                    case 3: return [3 /*break*/, 5];
                                    case 4:
                                        error_2 = _a.sent();
                                        console.error('Error processing transcription:', error_2);
                                        return [3 /*break*/, 5];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        }); });
                        // Handle Deepgram errors
                        deepgramLive.on(sdk_1.LiveTranscriptionEvents.Error, function (error) {
                            console.error('Deepgram error:', error);
                        });
                        // Handle Deepgram close
                        deepgramLive.on(sdk_1.LiveTranscriptionEvents.Close, function () {
                            console.log('Deepgram connection closed');
                        });
                        // Handle incoming messages from Twilio
                        ws.on('message', function (message) { return __awaiter(_this, void 0, void 0, function () {
                            var data, pcm;
                            return __generator(this, function (_a) {
                                try {
                                    data = JSON.parse(message.toString());
                                    // Handle different types of media stream events
                                    switch (data.event) {
                                        case 'connected':
                                            console.log('Media stream connected:', data);
                                            break;
                                        case 'start':
                                            console.log('Media stream started:', data);
                                            break;
                                        case 'media':
                                            // This is where you would process the audio data
                                            // data.media.payload contains base64 encoded audio
                                            if (session_1.sttStream) {
                                                pcm = this.decodeMulawToPcm(data.media.payload);
                                                // Feed PCM data to STT stream
                                                session_1.sttStream.send(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.byteLength));
                                            }
                                            break;
                                        case 'stop':
                                            console.log('Media stream stopped:', data);
                                            break;
                                        default:
                                            console.log('Unknown media stream event:', data);
                                    }
                                }
                                catch (error) {
                                    console.error('Error processing WebSocket message:', error);
                                }
                                return [2 /*return*/];
                            });
                        }); });
                        // Handle WebSocket connection close
                        ws.on('close', function () {
                            console.log("WebSocket connection closed for campaign ".concat(campaignId_1, " and contact ").concat(contactId_1));
                            _this.endSession(campaignId_1, contactId_1);
                        });
                        // Handle WebSocket errors
                        ws.on('error', function (error) {
                            console.error("WebSocket error for campaign ".concat(campaignId_1, " and contact ").concat(contactId_1, ":"), error);
                            _this.endSession(campaignId_1, contactId_1);
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _b.sent();
                        console.error('Error handling WebSocket connection:', error_1);
                        ws.close();
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Decode µ-law encoded audio to PCM
    MediaStreamHandler.prototype.decodeMulawToPcm = function (base64Audio) {
        try {
            // Convert base64 to buffer
            var audioBuffer = Buffer.from(base64Audio, 'base64');
            // Decode µ-law to PCM using the node-ulaw library
            var pcmBuffer = ulaw.decode(audioBuffer);
            return pcmBuffer;
        }
        catch (error) {
            console.error('Error decoding µ-law audio:', error);
            return Buffer.alloc(0);
        }
    };
    // Call LLM with agent prompt and conversation context
    MediaStreamHandler.prototype.callLLM = function (session) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.llmService.generateContent({
                                model: 'gemini-1.5-flash',
                                contents: session.context,
                                config: {
                                    systemInstruction: session.agentPrompt
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.text];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Error calling LLM:', error_3);
                        return [2 /*return*/, 'Sorry, I encountered an error processing your request.'];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Synthesize text to speech using ElevenLabs
    MediaStreamHandler.prototype.synthesizeTTS = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            var elevenLabsApiKey, ElevenLabsClient, elevenlabs, voiceId, audio, chunks, _a, audio_1, audio_1_1, chunk, e_1_1, error_4;
            var _b, e_1, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 15, , 16]);
                        elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
                        if (!elevenLabsApiKey) {
                            console.error('ElevenLabs API key not found in environment variables');
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('elevenlabs'); })];
                    case 1:
                        ElevenLabsClient = (_e.sent()).ElevenLabsClient;
                        elevenlabs = new ElevenLabsClient({ apiKey: elevenLabsApiKey });
                        voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
                        return [4 /*yield*/, elevenlabs.textToSpeech.convert(voiceId, {
                                text: text,
                                model_id: 'eleven_multilingual_v2'
                            })];
                    case 2:
                        audio = _e.sent();
                        chunks = [];
                        _e.label = 3;
                    case 3:
                        _e.trys.push([3, 8, 9, 14]);
                        _a = true, audio_1 = __asyncValues(audio);
                        _e.label = 4;
                    case 4: return [4 /*yield*/, audio_1.next()];
                    case 5:
                        if (!(audio_1_1 = _e.sent(), _b = audio_1_1.done, !_b)) return [3 /*break*/, 7];
                        _d = audio_1_1.value;
                        _a = false;
                        chunk = _d;
                        chunks.push(chunk);
                        _e.label = 6;
                    case 6:
                        _a = true;
                        return [3 /*break*/, 4];
                    case 7: return [3 /*break*/, 14];
                    case 8:
                        e_1_1 = _e.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 14];
                    case 9:
                        _e.trys.push([9, , 12, 13]);
                        if (!(!_a && !_b && (_c = audio_1.return))) return [3 /*break*/, 11];
                        return [4 /*yield*/, _c.call(audio_1)];
                    case 10:
                        _e.sent();
                        _e.label = 11;
                    case 11: return [3 /*break*/, 13];
                    case 12:
                        if (e_1) throw e_1.error;
                        return [7 /*endfinally*/];
                    case 13: return [7 /*endfinally*/];
                    case 14: return [2 /*return*/, Buffer.concat(chunks)];
                    case 15:
                        error_4 = _e.sent();
                        console.error('Error synthesizing TTS:', error_4);
                        return [2 /*return*/, null];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    // Send audio back to Twilio through WebSocket
    MediaStreamHandler.prototype.sendAudioToTwilio = function (ws, audioBuffer) {
        try {
            // Convert audio buffer to base64
            var base64Audio = audioBuffer.toString('base64');
            // Split audio into chunks for streaming
            var chunkSize = 320; // 20ms of audio at 8kHz
            for (var i = 0; i < base64Audio.length; i += chunkSize) {
                var chunk = base64Audio.substring(i, i + chunkSize);
                // Send audio chunk to Twilio
                ws.send(JSON.stringify({
                    event: 'media',
                    media: {
                        payload: chunk
                    }
                }));
            }
            // Send mark event to indicate end of audio
            ws.send(JSON.stringify({
                event: 'mark',
                mark: {
                    name: 'audio_end'
                }
            }));
        }
        catch (error) {
            console.error('Error sending audio to Twilio:', error);
        }
    };
    return MediaStreamHandler;
}());
exports.MediaStreamHandler = MediaStreamHandler;
