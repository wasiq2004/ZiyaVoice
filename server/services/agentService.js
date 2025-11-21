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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentService = void 0;
var database_js_1 = require("../config/database.js");
var uuid_1 = require("uuid");
var AgentService = /** @class */ (function () {
    function AgentService() {
    }
    // Get all agents for a user
    AgentService.getAgents = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var rows, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, database_js_1.default.execute('SELECT * FROM agents WHERE user_id = ? ORDER BY created_at DESC', [userId])];
                    case 1:
                        rows = (_a.sent())[0];
                        // Parse JSON settings if they exist and transform field names
                        return [2 /*return*/, rows.map(function (agent) { return ({
                                id: agent.id,
                                user_id: agent.user_id,
                                name: agent.name,
                                identity: agent.identity,
                                createdDate: agent.created_at,
                                status: agent.status,
                                model: agent.model,
                                voiceId: agent.voice_id,
                                language: agent.language,
                                settings: agent.settings ? _this.parseJsonSafely(agent.settings) : _this.getDefaultSettings(),
                                updatedDate: agent.updated_at
                            }); })];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error fetching agents:', error_1);
                        throw new Error('Failed to fetch agents');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get a specific agent by ID
    AgentService.getAgentById = function (userId, id) {
        return __awaiter(this, void 0, void 0, function () {
            var rows, agent, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, database_js_1.default.execute('SELECT * FROM agents WHERE user_id = ? AND id = ?', [userId, id])];
                    case 1:
                        rows = (_a.sent())[0];
                        if (rows.length > 0) {
                            agent = rows[0];
                            // Parse JSON settings if they exist and transform field names
                            return [2 /*return*/, {
                                    id: agent.id,
                                    user_id: agent.user_id,
                                    name: agent.name,
                                    identity: agent.identity,
                                    createdDate: agent.created_at,
                                    status: agent.status,
                                    model: agent.model,
                                    voiceId: agent.voice_id,
                                    language: agent.language,
                                    settings: agent.settings ? this.parseJsonSafely(agent.settings) : this.getDefaultSettings(),
                                    updatedDate: agent.updated_at
                                }];
                        }
                        return [2 /*return*/, null];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error fetching agent:', error_2);
                        throw new Error('Failed to fetch agent');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Create a new agent
    AgentService.createAgent = function (userId, agentData) {
        return __awaiter(this, void 0, void 0, function () {
            var id, createdAt, agent, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = (0, uuid_1.v4)();
                        // Convert ISO datetime to MySQL-compatible format (YYYY-MM-DD HH:MM:SS)
                        createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
                        agent = {
                            id: id,
                            user_id: userId,
                            name: agentData.name,
                            identity: agentData.identity,
                            status: agentData.status,
                            model: agentData.model,
                            voice_id: agentData.voiceId,
                            language: agentData.language,
                            settings: agentData.settings ? JSON.stringify(agentData.settings) : JSON.stringify(this.getDefaultSettings()),
                            created_at: createdAt
                        };
                        // Insert into database
                        return [4 /*yield*/, database_js_1.default.execute("INSERT INTO agents (id, user_id, name, identity, status, model, voice_id, language, settings, created_at) \n         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
                                agent.id,
                                agent.user_id,
                                agent.name,
                                agent.identity,
                                agent.status,
                                agent.model,
                                agent.voice_id,
                                agent.language,
                                agent.settings,
                                agent.created_at
                            ])];
                    case 1:
                        // Insert into database
                        _a.sent();
                        // Return the created agent with transformed field names
                        return [2 /*return*/, {
                                id: agent.id,
                                name: agent.name,
                                identity: agent.identity,
                                createdDate: agent.created_at,
                                status: agent.status,
                                model: agent.model,
                                voiceId: agent.voice_id,
                                language: agent.language,
                                settings: agent.settings ? this.parseJsonSafely(agent.settings) : this.getDefaultSettings(),
                                updatedDate: agent.created_at
                            }];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Error creating agent:', error_3);
                        console.error('Error message:', error_3.message);
                        console.error('Error code:', error_3.code);
                        console.error('Error sql:', error_3.sql);
                        throw new Error('Failed to create agent: ' + (error_3.message || 'Unknown error'));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Update an existing agent
    AgentService.updateAgent = function (userId, id, updateData) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, fields_1, values_1, fieldMapping_1, query, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, this.getAgentById(userId, id)];
                    case 1:
                        existing = _a.sent();
                        if (!existing) {
                            throw new Error('Agent not found');
                        }
                        fields_1 = [];
                        values_1 = [];
                        fieldMapping_1 = {
                            'agentId': 'agent_id',
                            'agentName': 'agent_name',
                            'voiceId': 'voice_id',
                            'userId': 'user_id'
                        };
                        Object.keys(updateData).forEach(function (key) {
                            if (key !== 'id' && key !== 'userId') { // Don't allow updating these fields
                                // Map the field name if needed
                                var dbField = fieldMapping_1[key] || key;
                                // Skip userId as it should not be updated
                                if (dbField === 'user_id')
                                    return;
                                // Handle special fields
                                if (key === 'settings') {
                                    fields_1.push("".concat(dbField, " = ?"));
                                    values_1.push(JSON.stringify(updateData[key]));
                                }
                                else if (key === 'voiceId') {
                                    fields_1.push('voice_id = ?');
                                    values_1.push(updateData[key]);
                                }
                                else {
                                    fields_1.push("".concat(dbField, " = ?"));
                                    values_1.push(updateData[key]);
                                }
                            }
                        });
                        // Only update updated_at if the column exists (skip for now to maintain compatibility)
                        // fields_1.push('updated_at = ?');
                        // values_1.push(new Date().toISOString());
                        // Add the id for the WHERE clause
                        values_1.push(id);
                        values_1.push(userId);
                        if (!(fields_1.length > 1)) return [3 /*break*/, 3];
                        query = "UPDATE agents SET ".concat(fields_1.join(', '), " WHERE id = ? AND user_id = ?");
                        return [4 /*yield*/, database_js_1.default.execute(query, values_1)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.getAgentById(userId, id)];
                    case 4: 
                    // Return the updated agent
                    return [2 /*return*/, _a.sent()];
                    case 5:
                        error_4 = _a.sent();
                        console.error('Error updating agent:', error_4);
                        throw new Error('Failed to update agent: ' + error_4.message);
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // Delete an agent
    AgentService.deleteAgent = function (userId, id) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getAgentById(userId, id)];
                    case 1:
                        existing = _a.sent();
                        if (!existing) {
                            throw new Error('Agent not found');
                        }
                        // Delete from database
                        return [4 /*yield*/, database_js_1.default.execute('DELETE FROM agents WHERE id = ? AND user_id = ?', [id, userId])];
                    case 2:
                        // Delete from database
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _a.sent();
                        console.error('Error deleting agent:', error_5);
                        throw new Error('Failed to delete agent');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Helper method to safely parse JSON
    AgentService.parseJsonSafely = function (jsonString) {
        try {
            // If it's already an object, return it as is
            if (typeof jsonString === 'object' && jsonString !== null) {
                return jsonString;
            }
            // If it's a string, parse it
            if (typeof jsonString === 'string') {
                return JSON.parse(jsonString);
            }
            // For other types, return as is
            return jsonString;
        }
        catch (error) {
            console.error('Error parsing JSON:', error);
            return null;
        }
    };
    // Helper method to get default settings
    AgentService.getDefaultSettings = function () {
        return {
            userStartsFirst: false,
            greetingLine: "Welcome! How can I help you?",
            responseDelay: false,
            inactivityHandling: true,
            agentCanTerminateCall: false,
            voicemailDetection: true,
            callTransfer: true,
            dtmfDial: false,
            agentTimezone: 'America/New_York',
            voiceDetectionConfidenceThreshold: 0.5,
            overrideVAD: false,
            backgroundAmbientSound: 'None',
            callRecording: true,
            sessionTimeoutFixedDuration: 3600,
            sessionTimeoutNoVoiceActivity: 300,
            sessionTimeoutEndMessage: "Your session has ended.",
            dataPrivacyOptOut: false,
            doNotCallDetection: true,
            prefetchDataWebhook: '',
            endOfCallWebhook: '',
            preActionPhrases: [],
            tools: []
        };
    };
    return AgentService;
}());
exports.AgentService = AgentService;
