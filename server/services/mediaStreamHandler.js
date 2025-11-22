"use strict";

const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const { LLMService } = require("../llmService.js");
const ulaw = require("node-ulaw");

// Do NOT check env here (problem solved)
const sessions = new Map();

class MediaStreamHandler {
    constructor(deepgramApiKey, geminiApiKey, campaignService) {
        // If keys are missing, the constructor will throw an error
        if (!deepgramApiKey) throw new Error("Missing Deepgram API Key in constructor");
        if (!geminiApiKey) throw new Error("Missing Gemini API Key in constructor");

        this.deepgramClient = createClient(deepgramApiKey);
        this.llmService = new LLMService(geminiApiKey);
        this.campaignService = campaignService;
    }

    // Create a new session for a call
    createSession(campaignId, contactId, agentPrompt, ws) {
        const sessionId = `${campaignId}-${contactId}`;
        const session = {
            campaignId,
            contactId,
            context: [],
            sttStream: null,
            agentPrompt,
            ws,
        };
        sessions.set(sessionId, session);
        console.log(`Created session for campaign ${campaignId} and contact ${contactId}`);
        return session;
    }

    endSession(campaignId, contactId) {
        const sessionId = `${campaignId}-${contactId}`;
        const session = sessions.get(sessionId);
        if (session) {
            if (session.sttStream) {
                session.sttStream.removeAllListeners();
            }
            sessions.delete(sessionId);
            console.log(`Ended session for campaign ${campaignId} and contact ${contactId}`);
        }
    }

    appendToContext(session, text, role) {
        session.context.push({ role, parts: [{ text }] });
        console.log(`Added ${role} message to context: ${text}`);
    }

    async handleConnection(ws, req) {
        try {
            const { campaignId, contactId } = req.query;

            if (!campaignId || !contactId) {
                console.error("Missing campaignId or contactId");
                ws.close();
                return;
            }

            const campaignData = await this.campaignService.getCampaignWithRecords(
                campaignId,
                "user_id"
            );

            const agentPrompt =
                campaignData?.campaign.name || "You are a helpful assistant";

            const session = this.createSession(
                campaignId,
                contactId,
                agentPrompt,
                ws
            );

            const deepgramLive = this.deepgramClient.listen.live({
                encoding: "mulaw",
                sample_rate: 8000,
                model: "nova-2-phonecall",
                smart_format: true,
                interim_results: false,
                utterance_end_ms: 1000,
            });

            session.sttStream = deepgramLive;

            deepgramLive.on(LiveTranscriptionEvents.Transcript, async (data) => {
                try {
                    const transcript = data.channel.alternatives[0].transcript;
                    if (!transcript.trim()) return;

                    this.appendToContext(session, transcript, "user");

                    const llmResponse = await this.callLLM(session);
                    this.appendToContext(session, llmResponse, "agent");

                    const ttsAudio = await this.synthesizeTTS(llmResponse);
                    if (ttsAudio) {
                        this.sendAudioToTwilio(ws, ttsAudio);
                    }
                } catch (err) {
                    console.error("Error in transcript handler:", err);
                }
            });

            deepgramLive.on(LiveTranscriptionEvents.Error, (error) => {
                console.error("Deepgram error:", error);
            });

            deepgramLive.on(LiveTranscriptionEvents.Close, () => {
                console.log("Deepgram connection closed");
            });

            ws.on("message", async (message) => {
                try {
                    const data = JSON.parse(message.toString());

                    if (data.event === "media") {
                        if (session.sttStream) {
                            const pcm = this.decodeMulawToPcm(data.media.payload);
                            session.sttStream.send(
                                pcm.buffer.slice(
                                    pcm.byteOffset,
                                    pcm.byteOffset + pcm.byteLength
                                )
                            );
                        }
                    }
                } catch (err) {
                    console.error("WS message error:", err);
                }
            });

            ws.on("close", () => {
                this.endSession(campaignId, contactId);
            });
        } catch (err) {
            console.error("Error handling WS connection:", err);
            ws.close();
        }
    }

    decodeMulawToPcm(base64Audio) {
        try {
            const audioBuffer = Buffer.from(base64Audio, "base64");
            return ulaw.decode(audioBuffer);
        } catch (err) {
            console.error("µLaw decode error:", err);
            return Buffer.alloc(0);
        }
    }

    async callLLM(session) {
        try {
            const response = await this.llmService.generateContent({
                model: "gemini-1.5-flash",
                contents: session.context,
                config: { systemInstruction: session.agentPrompt },
            });

            return response.text;
        } catch (err) {
            console.error("LLM error:", err);
            return "Sorry, something went wrong.";
        }
    }

    async synthesizeTTS(text) {
        try {
            const apiKey = process.env.ELEVENLABS_API_KEY;
            if (!apiKey) {
                console.error("Missing ElevenLabs API key");
                return null;
            }

            const { ElevenLabsClient } = require("elevenlabs");
            const elevenlabs = new ElevenLabsClient({ apiKey });

            const voiceId =
                process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

            const audio = await elevenlabs.textToSpeech.convert(voiceId, {
                text,
                model_id: "eleven_multilingual_v2",
            });

            const chunks = [];
            for await (const chunk of audio) {
                chunks.push(chunk);
            }

            return Buffer.concat(chunks);
        } catch (err) {
            console.error("TTS error:", err);
            return null;
        }
    }

    sendAudioToTwilio(ws, audioBuffer) {
        try {
            const base64Audio = audioBuffer.toString("base64");
            const chunkSize = 320;

            for (let i = 0; i < base64Audio.length; i += chunkSize) {
                ws.send(
                    JSON.stringify({
                        event: "media",
                        media: { payload: base64Audio.slice(i, i + chunkSize) },
                    })
                );
            }

            ws.send(
                JSON.stringify({
                    event: "mark",
                    mark: { name: "audio_end" },
                })
            );
        } catch (err) {
            console.error("Error sending audio to Twilio:", err);
        }
    }
}

module.exports = { MediaStreamHandler };
