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
var express_1 = require("express");
var cors_1 = require("cors");
var database_js_1 = require("./config/database.js");
var apiKeyService_js_1 = require("./services/apiKeyService.js");
var externalApiService_js_1 = require("./services/externalApiService.js");
var phoneNumberService_js_1 = require("./services/phoneNumberService.js");
var agentService_js_1 = require("./services/agentService.js");
var campaignService_js_1 = require("./services/campaignService.js");
var authService_js_1 = require("./services/authService.js");
var node_fetch_1 = require("node-fetch");
var express_ws_1 = require("express-ws");
var ElevenLabsStreamHandler_1 = require("./services/elevenLabsStreamHandler.js");
var twilioBasicService_1 = require("./services/twilioBasicService.js");
var googleSheetsService_1 = require("./services/googleSheetsService.js");
var app = (0, express_1.default)();
(0, express_ws_1.default)(app);
var PORT = process.env.PORT || 5000;
// Initialize services
var campaignService = new campaignService_js_1.CampaignService(database_js_1.default);
var authService = new authService_js_1.AuthService(database_js_1.default);
var elevenLabsStreamHandler = new ElevenLabsStreamHandler_1.ElevenLabsStreamHandler();
var twilioBasicService = new twilioBasicService_1.TwilioBasicService();
var googleSheetsService = new googleSheetsService_1.GoogleSheetsService();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check endpoint
app.get('/api/health', function (req, res) {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Authentication endpoints
// User login
app.post('/api/auth/login', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, user, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, email = _a.email, password = _a.password;
                if (!email || !password) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'Email and password are required' })];
                }
                return [4 /*yield*/, authService.authenticateUser(email, password)];
            case 1:
                user = _b.sent();
                if (!user) {
                    return [2 /*return*/, res.status(401).json({ success: false, message: 'Invalid email or password' })];
                }
                res.json({ success: true, user: user });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                console.error('Login error:', error_1);
                res.status(500).json({ success: false, message: error_1.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// User registration
app.post('/api/auth/register', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, emailRegex, user, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, email = _a.email, password = _a.password;
                if (!email || !password) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'Email and password are required' })];
                }
                emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'Invalid email format' })];
                }
                // Password strength validation (at least 6 characters)
                if (password.length < 6) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' })];
                }
                return [4 /*yield*/, authService.registerUser(email, password)];
            case 1:
                user = _b.sent();
                res.json({ success: true, user: user });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                console.error('Registration error:', error_2);
                if (error_2.message === 'User already exists') {
                    return [2 /*return*/, res.status(409).json({ success: false, message: 'User with this email already exists' })];
                }
                res.status(500).json({ success: false, message: error_2.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get all API keys for a user (metadata only)
app.get('/api/user-api-keys/:userId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, apiKeys, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.params.userId;
                return [4 /*yield*/, apiKeyService_js_1.ApiKeyService.getUserApiKeysMetadata(userId)];
            case 1:
                apiKeys = _a.sent();
                res.json({ success: true, apiKeys: apiKeys });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Error fetching user API keys:', error_3);
                res.status(500).json({ success: false, message: error_3.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get a specific API key for a user and service
app.get('/api/user-api-keys/:userId/:serviceName', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, serviceName, apiKey, maskedKey, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.params, userId = _a.userId, serviceName = _a.serviceName;
                return [4 /*yield*/, apiKeyService_js_1.ApiKeyService.getUserApiKey(userId, serviceName)];
            case 1:
                apiKey = _b.sent();
                if (!apiKey) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: 'API key not found' })];
                }
                maskedKey = apiKey.substring(0, 4) + '*'.repeat(Math.max(0, apiKey.length - 4));
                res.json({ success: true, apiKey: maskedKey });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _b.sent();
                console.error('Error fetching user API key:', error_4);
                res.status(500).json({ success: false, message: error_4.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Save or update an API key for a user
app.post('/api/user-api-keys', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, serviceName, apiKey, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, userId = _a.userId, serviceName = _a.serviceName, apiKey = _a.apiKey;
                if (!userId || !serviceName || !apiKey) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID, service name, and API key are required' })];
                }
                return [4 /*yield*/, apiKeyService_js_1.ApiKeyService.saveUserApiKey(userId, serviceName, apiKey)];
            case 1:
                _b.sent();
                res.json({ success: true, message: 'API key saved successfully' });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _b.sent();
                console.error('Error saving user API key:', error_5);
                res.status(500).json({ success: false, message: error_5.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Delete an API key for a user and service
app.delete('/api/user-api-keys/:userId/:serviceName', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, serviceName, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.params, userId = _a.userId, serviceName = _a.serviceName;
                return [4 /*yield*/, apiKeyService_js_1.ApiKeyService.deleteUserApiKey(userId, serviceName)];
            case 1:
                _b.sent();
                res.json({ success: true, message: 'API key deleted successfully' });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _b.sent();
                console.error('Error deleting user API key:', error_6);
                res.status(500).json({ success: false, message: error_6.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Validate an API key
app.post('/api/validate-api-key', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, serviceName, apiKey, isValid, error_7;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, userId = _a.userId, serviceName = _a.serviceName, apiKey = _a.apiKey;
                if (!userId || !serviceName || !apiKey) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID, service name, and API key are required' })];
                }
                return [4 /*yield*/, apiKeyService_js_1.ApiKeyService.validateApiKey(userId, serviceName, apiKey)];
            case 1:
                isValid = _b.sent();
                res.json({ success: true, valid: isValid });
                return [3 /*break*/, 3];
            case 2:
                error_7 = _b.sent();
                console.error('Error validating API key:', error_7);
                res.status(500).json({ success: false, message: error_7.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Fetch ElevenLabs credits
app.get('/api/credits/elevenlabs/:userId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, apiKey, response, errorText, data, credits, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                userId = req.params.userId;
                return [4 /*yield*/, externalApiService_js_1.ExternalApiService.getUserPlaintextApiKey(userId, '11labs')];
            case 1:
                apiKey = _a.sent();
                if (!apiKey) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: 'ElevenLabs API key not found' })];
                }
                return [4 /*yield*/, (0, node_fetch_1.default)('https://api.elevenlabs.io/v1/user/subscription', {
                        headers: {
                            'xi-api-key': apiKey
                        }
                    })];
            case 2:
                response = _a.sent();
                if (!!response.ok) return [3 /*break*/, 4];
                return [4 /*yield*/, response.text()];
            case 3:
                errorText = _a.sent();
                console.error("ElevenLabs API error: ".concat(response.status, " - ").concat(response.statusText), errorText);
                return [2 /*return*/, res.status(response.status).json({ success: false, message: "ElevenLabs API error: ".concat(response.statusText) })];
            case 4: return [4 /*yield*/, response.json()];
            case 5:
                data = _a.sent();
                credits = data.character_count || 0;
                res.json({ success: true, credits: credits });
                return [3 /*break*/, 7];
            case 6:
                error_8 = _a.sent();
                console.error('Error fetching ElevenLabs credits:', error_8);
                res.status(500).json({ success: false, message: error_8.message });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
// Fetch Google Gemini credits
app.get('/api/credits/gemini/:userId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, apiKey, response, errorText, data, credits, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                userId = req.params.userId;
                return [4 /*yield*/, externalApiService_js_1.ExternalApiService.getUserPlaintextApiKey(userId, 'gemini')];
            case 1:
                apiKey = _a.sent();
                if (!apiKey) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: 'Google Gemini API key not found' })];
                }
                return [4 /*yield*/, (0, node_fetch_1.default)("https://generativelanguage.googleapis.com/v1beta/models?key=".concat(apiKey), {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })];
            case 2:
                response = _a.sent();
                if (!!response.ok) return [3 /*break*/, 4];
                return [4 /*yield*/, response.text()];
            case 3:
                errorText = _a.sent();
                console.error("Gemini API error: ".concat(response.status, " - ").concat(response.statusText), errorText);
                return [2 /*return*/, res.status(response.status).json({ success: false, message: "Gemini API error: ".concat(response.statusText) })];
            case 4: return [4 /*yield*/, response.json()];
            case 5:
                data = _a.sent();
                credits = data.models && data.models.length > 0 ?
                    "Valid API Key (".concat(data.models.length, " models available)") :
                    'Valid API Key';
                res.json({ success: true, credits: credits });
                return [3 /*break*/, 7];
            case 6:
                error_9 = _a.sent();
                console.error('Error fetching Google Gemini credits:', error_9);
                res.status(500).json({ success: false, message: error_9.message });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
// Phone number endpoints
// Get all phone numbers for a user
app.get('/api/phone-numbers', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, phoneNumbers, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.query.userId;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID is required' })];
                }
                return [4 /*yield*/, phoneNumberService_js_1.PhoneNumberService.getPhoneNumbers(userId)];
            case 1:
                phoneNumbers = _a.sent();
                res.json({ success: true, data: phoneNumbers });
                return [3 /*break*/, 3];
            case 2:
                error_10 = _a.sent();
                console.error('Error fetching phone numbers:', error_10);
                res.status(500).json({ success: false, message: error_10.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get a specific phone number by ID
app.get('/api/phone-numbers/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, userId, phoneNumber, error_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                userId = req.query.userId;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID is required' })];
                }
                return [4 /*yield*/, phoneNumberService_js_1.PhoneNumberService.getPhoneNumberById(userId, id)];
            case 1:
                phoneNumber = _a.sent();
                if (!phoneNumber) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: 'Phone number not found' })];
                }
                res.json({ success: true, data: phoneNumber });
                return [3 /*break*/, 3];
            case 2:
                error_11 = _a.sent();
                console.error('Error fetching phone number:', error_11);
                res.status(500).json({ success: false, message: error_11.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Create a new phone number
app.post('/api/phone-numbers', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, phoneNumber, newPhoneNumber, error_12;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, userId = _a.userId, phoneNumber = _a.phoneNumber;
                if (!userId || !phoneNumber) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID and phone number data are required' })];
                }
                return [4 /*yield*/, phoneNumberService_js_1.PhoneNumberService.createPhoneNumber(userId, phoneNumber)];
            case 1:
                newPhoneNumber = _b.sent();
                res.json({ success: true, data: newPhoneNumber });
                return [3 /*break*/, 3];
            case 2:
                error_12 = _b.sent();
                console.error('Error creating phone number:', error_12);
                res.status(500).json({ success: false, message: error_12.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Update an existing phone number
app.put('/api/phone-numbers/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, userId, phoneNumber, updatedPhoneNumber, error_13;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                id = req.params.id;
                _a = req.body, userId = _a.userId, phoneNumber = _a.phoneNumber;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID is required' })];
                }
                return [4 /*yield*/, phoneNumberService_js_1.PhoneNumberService.updatePhoneNumber(userId, id, phoneNumber)];
            case 1:
                updatedPhoneNumber = _b.sent();
                res.json({ success: true, data: updatedPhoneNumber });
                return [3 /*break*/, 3];
            case 2:
                error_13 = _b.sent();
                console.error('Error updating phone number:', error_13);
                res.status(500).json({ success: false, message: error_13.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Delete a phone number
app.delete('/api/phone-numbers/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, userId, error_14;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                userId = req.query.userId;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID is required' })];
                }
                return [4 /*yield*/, phoneNumberService_js_1.PhoneNumberService.deletePhoneNumber(userId, id)];
            case 1:
                _a.sent();
                res.json({ success: true, message: 'Phone number deleted successfully' });
                return [3 /*break*/, 3];
            case 2:
                error_14 = _a.sent();
                console.error('Error deleting phone number:', error_14);
                res.status(500).json({ success: false, message: error_14.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Import a phone number
app.post('/api/phone-numbers/import', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, phoneNumber, importedPhoneNumber, error_15;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, userId = _a.userId, phoneNumber = _a.phoneNumber;
                if (!userId || !phoneNumber) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID and phone number data are required' })];
                }
                return [4 /*yield*/, phoneNumberService_js_1.PhoneNumberService.importPhoneNumber(userId, phoneNumber)];
            case 1:
                importedPhoneNumber = _b.sent();
                res.json({ success: true, data: importedPhoneNumber });
                return [3 /*break*/, 3];
            case 2:
                error_15 = _b.sent();
                console.error('Error importing phone number:', error_15);
                res.status(500).json({ success: false, message: error_15.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Agent endpoints
// Get all agents for a user
app.get('/api/agents', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, agents, error_16;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.query.userId;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID is required' })];
                }
                return [4 /*yield*/, agentService_js_1.AgentService.getAgents(userId)];
            case 1:
                agents = _a.sent();
                res.json({ success: true, data: agents });
                return [3 /*break*/, 3];
            case 2:
                error_16 = _a.sent();
                console.error('Error fetching agents:', error_16);
                res.status(500).json({ success: false, message: error_16.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get a specific agent by ID
app.get('/api/agents/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, userId, agent, error_17;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                userId = req.query.userId;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID is required' })];
                }
                return [4 /*yield*/, agentService_js_1.AgentService.getAgentById(userId, id)];
            case 1:
                agent = _a.sent();
                if (!agent) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: 'Agent not found' })];
                }
                res.json({ success: true, data: agent });
                return [3 /*break*/, 3];
            case 2:
                error_17 = _a.sent();
                console.error('Error fetching agent:', error_17);
                res.status(500).json({ success: false, message: error_17.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Create a new agent
app.post('/api/agents', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, agent, newAgent, error_18;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, userId = _a.userId, agent = _a.agent;
                if (!userId || !agent) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID and agent data are required' })];
                }
                return [4 /*yield*/, agentService_js_1.AgentService.createAgent(userId, agent)];
            case 1:
                newAgent = _b.sent();
                res.json({ success: true, data: newAgent });
                return [3 /*break*/, 3];
            case 2:
                error_18 = _b.sent();
                console.error('Error creating agent:', error_18);
                res.status(500).json({ success: false, message: error_18.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Update an existing agent
app.put('/api/agents/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, userId, agent, updatedAgent, error_19;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                id = req.params.id;
                _a = req.body, userId = _a.userId, agent = _a.agent;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID is required' })];
                }
                return [4 /*yield*/, agentService_js_1.AgentService.updateAgent(userId, id, agent)];
            case 1:
                updatedAgent = _b.sent();
                res.json({ success: true, data: updatedAgent });
                return [3 /*break*/, 3];
            case 2:
                error_19 = _b.sent();
                console.error('Error updating agent:', error_19);
                res.status(500).json({ success: false, message: error_19.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Delete an agent
app.delete('/api/agents/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, userId, error_20;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                userId = req.query.userId;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID is required' })];
                }
                return [4 /*yield*/, agentService_js_1.AgentService.deleteAgent(userId, id)];
            case 1:
                _a.sent();
                res.json({ success: true, message: 'Agent deleted successfully' });
                return [3 /*break*/, 3];
            case 2:
                error_20 = _a.sent();
                console.error('Error deleting agent:', error_20);
                res.status(500).json({ success: false, message: error_20.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Campaign endpoints
// Get all campaigns for a user
app.get('/api/campaigns', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, campaigns, error_21;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.query.userId;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID is required' })];
                }
                return [4 /*yield*/, campaignService.getUserCampaigns(userId)];
            case 1:
                campaigns = _a.sent();
                res.json({ success: true, data: campaigns });
                return [3 /*break*/, 3];
            case 2:
                error_21 = _a.sent();
                console.error('Error fetching campaigns:', error_21);
                res.status(500).json({ success: false, message: error_21.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get a specific campaign by ID with records
app.get('/api/campaigns/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, userId, campaignData, error_22;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                userId = req.query.userId;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID is required' })];
                }
                return [4 /*yield*/, campaignService.getCampaignWithRecords(id, userId)];
            case 1:
                campaignData = _a.sent();
                if (!campaignData) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: 'Campaign not found' })];
                }
                res.json({ success: true, data: campaignData });
                return [3 /*break*/, 3];
            case 2:
                error_22 = _a.sent();
                console.error('Error fetching campaign:', error_22);
                res.status(500).json({ success: false, message: error_22.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Create a new campaign
app.post('/api/campaigns', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, name_1, newCampaign, error_23;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, userId = _a.userId, name_1 = _a.name;
                if (!userId || !name_1) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID and campaign name are required' })];
                }
                return [4 /*yield*/, campaignService.createCampaign(userId, name_1)];
            case 1:
                newCampaign = _b.sent();
                res.json({ success: true, data: newCampaign });
                return [3 /*break*/, 3];
            case 2:
                error_23 = _b.sent();
                console.error('Error creating campaign:', error_23);
                res.status(500).json({ success: false, message: error_23.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Set caller phone for a campaign
app.post('/api/campaigns/:id/set-caller-phone', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, userId, callerPhone, updatedCampaign, error_24;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                id = req.params.id;
                _a = req.body, userId = _a.userId, callerPhone = _a.callerPhone;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID is required' })];
                }
                return [4 /*yield*/, campaignService.setCallerPhone(id, userId, callerPhone)];
            case 1:
                updatedCampaign = _b.sent();
                if (!updatedCampaign) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: 'Campaign not found' })];
                }
                res.json({ success: true, data: updatedCampaign });
                return [3 /*break*/, 3];
            case 2:
                error_24 = _b.sent();
                console.error('Error setting caller phone:', error_24);
                res.status(500).json({ success: false, message: error_24.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Import CSV records into a campaign
app.post('/api/campaigns/:id/import', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, userId, csvData, importedCount, error_25;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                id = req.params.id;
                _a = req.body, userId = _a.userId, csvData = _a.csvData;
                if (!userId || !csvData) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID and CSV data are required' })];
                }
                return [4 /*yield*/, campaignService.importRecords(id, userId, csvData)];
            case 1:
                importedCount = _b.sent();
                res.json({ success: true, message: "Successfully imported ".concat(importedCount, " records"), importedCount: importedCount });
                return [3 /*break*/, 3];
            case 2:
                error_25 = _b.sent();
                console.error('Error importing records:', error_25);
                res.status(500).json({ success: false, message: error_25.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Add a single record to a campaign
app.post('/api/campaigns/:id/records', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, userId, phone, newRecord, error_26;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                id = req.params.id;
                _a = req.body, userId = _a.userId, phone = _a.phone;
                if (!userId || !phone) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID and phone number are required' })];
                }
                return [4 /*yield*/, campaignService.addRecord(id, userId, phone)];
            case 1:
                newRecord = _b.sent();
                res.json({ success: true, data: newRecord });
                return [3 /*break*/, 3];
            case 2:
                error_26 = _b.sent();
                console.error('Error adding record:', error_26);
                res.status(500).json({ success: false, message: error_26.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Start a campaign
app.post('/api/campaigns/:id/start', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, userId, updatedCampaign, error_27;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                userId = req.body.userId;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID is required' })];
                }
                return [4 /*yield*/, campaignService.startCampaign(id, userId)];
            case 1:
                updatedCampaign = _a.sent();
                if (!updatedCampaign) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: 'Campaign not found' })];
                }
                res.json({ success: true, data: updatedCampaign });
                return [3 /*break*/, 3];
            case 2:
                error_27 = _a.sent();
                console.error('Error starting campaign:', error_27);
                res.status(500).json({ success: false, message: error_27.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get paginated records for a campaign
app.get('/api/campaigns/:id/records', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, page, limit, pageNum, limitNum, recordsData, error_28;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                id = req.params.id;
                _a = req.query, page = _a.page, limit = _a.limit;
                pageNum = page ? parseInt(page) : 1;
                limitNum = limit ? parseInt(limit) : 20;
                return [4 /*yield*/, campaignService.getRecords(id, pageNum, limitNum)];
            case 1:
                recordsData = _b.sent();
                res.json({ success: true, data: recordsData });
                return [3 /*break*/, 3];
            case 2:
                error_28 = _b.sent();
                console.error('Error fetching records:', error_28);
                res.status(500).json({ success: false, message: error_28.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Twilio configuration endpoints
// Save/Update Twilio configuration
app.post('/api/twilio/config', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, accountSid, authToken, appUrl, apiKeySid, apiKeySecret, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, userId = _a.userId, accountSid = _a.accountSid, authToken = _a.authToken, appUrl = _a.appUrl, apiKeySid = _a.apiKeySid, apiKeySecret = _a.apiKeySecret;
                if (!userId || !accountSid || !authToken || !appUrl) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID, Account SID, Auth Token, and App URL are required' })];
                }
                return [4 /*yield*/, twilioBasicService.saveUserConfig(userId, accountSid, authToken, appUrl, apiKeySid, apiKeySecret)];
            case 1:
                _b.sent();
                res.json({ success: true, message: 'Twilio configuration saved successfully' });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                console.error('Error saving Twilio config:', error_1);
                res.status(500).json({ success: false, message: error_1.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });

// Get Twilio configuration
app.get('/api/twilio/config/:userId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, config, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.params.userId;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID is required' })];
                }
                return [4 /*yield*/, twilioBasicService.getUserConfigData(userId)];
            case 1:
                config = _a.sent();
                if (!config) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: 'Twilio configuration not found' })];
                }
                res.json({ success: true, data: config });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Error fetching Twilio config:', error_2);
                res.status(500).json({ success: false, message: error_2.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });

// Connect/Import Twilio number
app.post('/api/twilio/connect-number', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, number, phoneNumber, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, userId = _a.userId, number = _a.number;
                if (!userId || !number) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID and phone number are required' })];
                }
                return [4 /*yield*/, twilioBasicService.connectNumber(userId, number)];
            case 1:
                phoneNumber = _b.sent();
                res.json({ success: true, data: phoneNumber });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _b.sent();
                console.error('Error connecting number:', error_3);
                res.status(500).json({ success: false, message: error_3.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });

// Get user's phone numbers
app.get('/api/twilio/phone-numbers/:userId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, phoneNumbers, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.params.userId;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID is required' })];
                }
                return [4 /*yield*/, twilioBasicService.getUserPhoneNumbers(userId)];
            case 1:
                phoneNumbers = _a.sent();
                res.json({ success: true, data: phoneNumbers });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error('Error fetching phone numbers:', error_4);
                res.status(500).json({ success: false, message: error_4.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });

// Make outbound call
app.post('/api/twilio/make-call', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, from, to, call, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, userId = _a.userId, from = _a.from, to = _a.to;
                if (!userId || !from || !to) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID, from number, and to number are required' })];
                }
                return [4 /*yield*/, twilioBasicService.makeCall(userId, from, to)];
            case 1:
                call = _b.sent();
                res.json({ success: true, data: call });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _b.sent();
                console.error('Error making call:', error_5);
                res.status(500).json({ success: false, message: error_5.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });

// Get user's call history
app.get('/api/twilio/calls/:userId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, limit, calls, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.params.userId;
                limit = parseInt(req.query.limit) || 50;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID is required' })];
                }
                return [4 /*yield*/, twilioBasicService.getUserCalls(userId, limit)];
            case 1:
                calls = _a.sent();
                res.json({ success: true, data: calls });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                console.error('Error fetching calls:', error_6);
                res.status(500).json({ success: false, message: error_6.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });

// Google Sheets endpoint for appending data
app.post('/api/tools/google-sheets/append', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, spreadsheetId, data, sheetName, success, error_7;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, spreadsheetId = _a.spreadsheetId, data = _a.data, sheetName = _a.sheetName;
                if (!spreadsheetId || !data) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'Spreadsheet ID and data are required' })];
                }
                return [4 /*yield*/, googleSheetsService.appendDataToSheet(spreadsheetId, data, sheetName)];
            case 1:
                success = _b.sent();
                if (success) {
                    res.json({ success: true, message: 'Data appended successfully' });
                } else {
                    res.status(500).json({ success: false, message: 'Failed to append data to Google Sheets' });
                }
                return [3 /*break*/, 3];
            case 2:
                error_7 = _b.sent();
                console.error('Error appending data to Google Sheets:', error_7);
                res.status(500).json({ success: false, message: error_7.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });

// WebSocket endpoint for ElevenLabs STT
app.ws('/api/stt', function (ws, req) {
    elevenLabsStreamHandler.handleConnection(ws, req);
});

app.listen(PORT, function () {
    console.log("Server is running on port ".concat(PORT));
});
