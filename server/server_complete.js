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
var twilioService_js_1 = require("./services/twilioService.js");
var twilioBasicService_js_1 = require("./services/twilioBasicService.js");
var mediaStreamHandler_js_1 = require("./services/mediaStreamHandler.js");
var elevenLabsStreamHandler_js_1 = require("./services/elevenLabsStreamHandler.js");
var node_fetch_1 = require("node-fetch");
var express_ws_1 = require("express-ws");
var uuid_1 = require("uuid");
var twilio_1 = require("twilio");
var app = (0, express_1.default)();
var PORT = process.env.PORT || 5000;
// Initialize express-ws
var wsInstance = (0, express_ws_1.default)(app);
var wsApp = wsInstance.app;
// Initialize services
var campaignService = new campaignService_js_1.CampaignService(database_js_1.default);
var authService = new authService_js_1.AuthService(database_js_1.default);
var twilioService = new twilioService_js_1.TwilioService();
var elevenLabsStreamHandler = new elevenLabsStreamHandler_js_1.ElevenLabsStreamHandler();
// Initialize Twilio Basic Service (user-specific credentials from database)
var twilioBasicService = new twilioBasicService_js_1.TwilioBasicService();
console.log('Twilio Basic Service initialized (user-specific credentials)');
// Initialize MediaStreamHandler if API keys are available (legacy support)
var mediaStreamHandler = null;
if (process.env.DEEPGRAM_API_KEY && process.env.GOOGLE_GEMINI_API_KEY) {
    mediaStreamHandler = new mediaStreamHandler_js_1.MediaStreamHandler(process.env.DEEPGRAM_API_KEY, process.env.GOOGLE_GEMINI_API_KEY, campaignService);
    console.log('MediaStreamHandler initialized with Deepgram and Gemini');
}
else {
    console.warn('Deepgram API key or Google Gemini API key not found. Media streaming will be disabled.');
}
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true })); // For Twilio webhook form data
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
// Fetch credits for OpenAI
app.post('/api/openai/credits', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, apiKey, isValid, response, errorText, data, credits, error_8;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                _a = req.body, userId = _a.userId, apiKey = _a.apiKey;
                if (!userId || !apiKey) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID and API key are required' })];
                }
                return [4 /*yield*/, apiKeyService_js_1.ApiKeyService.validateApiKey(userId, 'openai', apiKey)];
            case 1:
                isValid = _b.sent();
                if (!isValid) {
                    return [2 /*return*/, res.status(401).json({ success: false, message: 'Invalid API key' })];
                }
                return [4 /*yield*/, (0, node_fetch_1.default)("https://api.openai.com/v1/models", {
                        method: 'GET',
                        headers: {
                            'Authorization': "Bearer ".concat(apiKey),
                            'Content-Type': 'application/json'
                        }
                    })];
            case 2:
                response = _b.sent();
                if (!!response.ok) return [3 /*break*/, 4];
                return [4 /*yield*/, response.text()];
            case 3:
                errorText = _b.sent();
                console.error("OpenAI API error: ".concat(response.status, " - ").concat(response.statusText), errorText);
                return [2 /*return*/, res.status(response.status).json({ success: false, message: "OpenAI API error: ".concat(response.statusText) })];
            case 4: return [4 /*yield*/, response.json()];
            case 5:
                data = _b.sent();
                credits = data.data && data.data.length > 0 ?
                    "Valid API Key (".concat(data.data.length, " models available)") :
                    'Valid API Key';
                res.json({ success: true, credits: credits });
                return [3 /*break*/, 7];
            case 6:
                error_8 = _b.sent();
                console.error('Error fetching OpenAI credits:', error_8);
                res.status(500).json({ success: false, message: error_8.message });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
// Fetch credits for Google Gemini
app.post('/api/google-gemini/credits', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, apiKey, isValid, response, errorText, data, credits, error_9;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                _a = req.body, userId = _a.userId, apiKey = _a.apiKey;
                if (!userId || !apiKey) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID and API key are required' })];
                }
                return [4 /*yield*/, apiKeyService_js_1.ApiKeyService.validateApiKey(userId, 'google-gemini', apiKey)];
            case 1:
                isValid = _b.sent();
                if (!isValid) {
                    return [2 /*return*/, res.status(401).json({ success: false, message: 'Invalid API key' })];
                }
                return [4 /*yield*/, (0, node_fetch_1.default)("https://generativelanguage.googleapis.com/v1beta/models?key=".concat(apiKey), {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })];
            case 2:
                response = _b.sent();
                if (!!response.ok) return [3 /*break*/, 4];
                return [4 /*yield*/, response.text()];
            case 3:
                errorText = _b.sent();
                console.error("Gemini API error: ".concat(response.status, " - ").concat(response.statusText), errorText);
                return [2 /*return*/, res.status(response.status).json({ success: false, message: "Gemini API error: ".concat(response.statusText) })];
            case 4: return [4 /*yield*/, response.json()];
            case 5:
                data = _b.sent();
                credits = data.models && data.models.length > 0 ?
                    "Valid API Key (".concat(data.models.length, " models available)") :
                    'Valid API Key';
                res.json({ success: true, credits: credits });
                return [3 /*break*/, 7];
            case 6:
                error_9 = _b.sent();
                console.error('Error fetching Google Gemini credits:', error_9);
                res.status(500).json({ success: false, message: error_9.message });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
// Fetch ElevenLabs credits for a user
app.get('/api/credits/elevenlabs/:userId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, apiKey, response, errorText, data, credits, error_10;
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
                error_10 = _a.sent();
                console.error('Error fetching ElevenLabs credits:', error_10);
                res.status(500).json({ success: false, message: error_10.message });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
// Fetch Google Gemini credits for a user
app.get('/api/credits/gemini/:userId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, apiKey, response, errorText, data, credits, error_11;
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
                error_11 = _a.sent();
                console.error('Error fetching Google Gemini credits:', error_11);
                res.status(500).json({ success: false, message: error_11.message });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
// Fetch Twilio account balance for a user
app.get('/api/credits/twilio/:userId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, configRows, twilioConfig, client, balanceResponse, balanceStr, balance, error_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                userId = req.params.userId;
                return [4 /*yield*/, database_js_1.default.execute('SELECT account_sid, auth_token, api_key_sid, api_key_secret FROM user_twilio_configs WHERE user_id = ?', [userId])];
            case 1:
                configRows = (_a.sent())[0];
                if (!configRows || configRows.length === 0) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: 'Twilio account not configured' })];
                }
                twilioConfig = configRows[0];
                client = twilioConfig.api_key_sid && twilioConfig.api_key_secret
                    ? (0, twilio_1.default)(twilioConfig.api_key_sid, twilioConfig.api_key_secret, {
                        accountSid: twilioConfig.account_sid
                    })
                    : (0, twilio_1.default)(twilioConfig.account_sid, twilioConfig.auth_token);
                return [4 /*yield*/, client.balance.fetch()];
            case 2:
                balanceResponse = _a.sent();
                balanceStr = balanceResponse.balance;
                balance = parseFloat(balanceStr !== null && balanceStr !== void 0 ? balanceStr : "0") || 0.00;
                return [2 /*return*/, res.json({ success: true, credits: balance })];
            case 3:
                error_12 = _a.sent();
                console.error('Error fetching Twilio credits:', error_12);
                return [2 /*return*/, res.status(500).json({ success: false, message: error_12.message })];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Get credit transactions for a user
app.get('/api/credits/transactions/:userId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, result, error_trans;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.params.userId;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID is required' })];
                }
                return [4 /*yield*/, database_js_1.default.execute('SELECT id, user_id, transaction_type, service_type, amount, description, created_at FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100', [userId])];
            case 1:
                result = _a.sent();
                var transactions = result[0] || [];
                res.json({ success: true, transactions: transactions.map(function (t) { return ({
                    id: t.id,
                    userId: t.user_id,
                    transactionType: t.transaction_type,
                    serviceType: t.service_type,
                    amount: t.amount,
                    description: t.description,
                    createdAt: t.created_at
                }); }) });
                return [3 /*break*/, 3];
            case 2:
                error_trans = _a.sent();
                console.error('Error fetching credit transactions:', error_trans);
                res.status(500).json({ success: false, message: error_trans.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get all phone numbers for a user
app.get('/api/phone-numbers', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, phoneNumbers, error_13;
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
                error_13 = _a.sent();
                console.error('Error fetching phone numbers:', error_13);
                res.status(500).json({ success: false, message: error_13.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get a specific phone number by ID
app.get('/api/phone-numbers/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, userId, phoneNumber, error_14;
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
                error_14 = _a.sent();
                console.error('Error fetching phone number:', error_14);
                res.status(500).json({ success: false, message: error_14.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Create a new phone number
app.post('/api/phone-numbers', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, phoneNumber, newPhoneNumber, error_15;
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
                error_15 = _b.sent();
                console.error('Error creating phone number:', error_15);
                res.status(500).json({ success: false, message: error_15.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Update an existing phone number
app.put('/api/phone-numbers/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, userId, phoneNumber, updatedPhoneNumber, error_16;
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
                error_16 = _b.sent();
                console.error('Error updating phone number:', error_16);
                res.status(500).json({ success: false, message: error_16.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Delete a phone number
app.delete('/api/phone-numbers/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, userId, error_17;
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
                error_17 = _a.sent();
                console.error('Error deleting phone number:', error_17);
                res.status(500).json({ success: false, message: error_17.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Import a phone number
app.post('/api/phone-numbers/import', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, phoneNumber, importedPhoneNumber, error_18;
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
                error_18 = _b.sent();
                console.error('Error importing phone number:', error_18);
                res.status(500).json({ success: false, message: error_18.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Agent endpoints
// Get all agents for a user
app.get('/api/agents', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, agents, error_19;
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
                error_19 = _a.sent();
                console.error('Error fetching agents:', error_19);
                res.status(500).json({ success: false, message: error_19.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get a specific agent by ID
app.get('/api/agents/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, userId, agent, error_20;
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
                error_20 = _a.sent();
                console.error('Error fetching agent:', error_20);
                res.status(500).json({ success: false, message: error_20.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Create a new agent
app.post('/api/agents', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, agent, newAgent, error_21;
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
                error_21 = _b.sent();
                console.error('Error creating agent:', error_21);
                console.error('Error message:', error_21.message);
                console.error('Error code:', error_21.code);
                console.error('Error sql:', error_21.sql);
                res.status(500).json({ success: false, message: error_21.message || 'Failed to create agent', error: error_21.message });;
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Update an existing agent
app.put('/api/agents/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, userId, agent, updatedAgent, error_22;
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
                error_22 = _b.sent();
                console.error('Error updating agent:', error_22);
                res.status(500).json({ success: false, message: error_22.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Delete an agent
app.delete('/api/agents/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, userId, error_23;
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
                error_23 = _a.sent();
                console.error('Error deleting agent:', error_23);
                res.status(500).json({ success: false, message: error_23.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Campaign endpoints
// Get all campaigns for a user
app.get('/api/campaigns', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, campaigns, error_24;
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
                error_24 = _a.sent();
                console.error('Error fetching campaigns:', error_24);
                res.status(500).json({ success: false, message: error_24.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get a specific campaign by ID with records
app.get('/api/campaigns/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, userId, campaignData, error_25;
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
                error_25 = _a.sent();
                console.error('Error fetching campaign:', error_25);
                res.status(500).json({ success: false, message: error_25.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Create a new campaign
app.post('/api/campaigns', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, name_1, newCampaign, error_26;
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
                error_26 = _b.sent();
                console.error('Error creating campaign:', error_26);
                res.status(500).json({ success: false, message: error_26.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Set caller phone for a campaign
app.post('/api/campaigns/:id/set-caller-phone', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, userId, callerPhone, updatedCampaign, error_27;
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
                error_27 = _b.sent();
                console.error('Error setting caller phone:', error_27);
                res.status(500).json({ success: false, message: error_27.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Import CSV records into a campaign
app.post('/api/campaigns/:id/import', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, userId, csvData, importedCount, error_28;
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
                error_28 = _b.sent();
                console.error('Error importing records:', error_28);
                res.status(500).json({ success: false, message: error_28.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Add a single record to a campaign
app.post('/api/campaigns/:id/records', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, userId, phone, newRecord, error_29;
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
                error_29 = _b.sent();
                console.error('Error adding record:', error_29);
                res.status(500).json({ success: false, message: error_29.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Start a campaign
app.post('/api/campaigns/:id/start', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, userId, updatedCampaign, records, callerPhone, enableRecording, throttleDelay_1, i, record, isDnc, twilioNumberRows, twilioNumberId, campaignRows, agentId, agentRows, callId, appUrl, cleanAppUrl, call, error_30, error_31;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 29, , 30]);
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
                return [4 /*yield*/, campaignService.getRecords(id, 1, 1000)];
            case 2:
                records = (_a.sent()).records;
                callerPhone = updatedCampaign.callerPhone;
                if (!!callerPhone) return [3 /*break*/, 3];
                console.warn('No caller phone number set for campaign', id);
                return [3 /*break*/, 28];
            case 3:
                enableRecording = false;
                throttleDelay_1 = 1000;
                i = 0;
                _a.label = 4;
            case 4:
                if (!(i < records.length)) return [3 /*break*/, 28];
                record = records[i];
                return [4 /*yield*/, campaignService.isPhoneInDnc(record.phone, userId)];
            case 5:
                isDnc = _a.sent();
                if (!isDnc) return [3 /*break*/, 7];
                console.log("Skipping call to ".concat(record.phone, " - DNC list"));
                // Update record status to 'dnc'
                return [4 /*yield*/, campaignService.updateRecordStatus(record.id, 'dnc')];
            case 6:
                // Update record status to 'dnc'
                _a.sent();
                return [3 /*break*/, 27];
            case 7:
                _a.trys.push([7, 22, , 25]);
                if (!(record.retries >= 3)) return [3 /*break*/, 9];
                console.log("Skipping call to ".concat(record.phone, " - max retries exceeded"));
                // Update record status to 'max-retries-exceeded'
                return [4 /*yield*/, campaignService.updateRecordStatus(record.id, 'max-retries-exceeded')];
            case 8:
                // Update record status to 'max-retries-exceeded'
                _a.sent();
                return [3 /*break*/, 27];
            case 9: return [4 /*yield*/, database_js_1.default.execute('SELECT id FROM user_twilio_numbers WHERE user_id = ? AND phone_number = ? AND verified = TRUE', [userId, callerPhone])];
            case 10:
                twilioNumberRows = (_a.sent())[0];
                if (!(twilioNumberRows.length === 0)) return [3 /*break*/, 12];
                console.error("No verified Twilio number found for ".concat(callerPhone));
                return [4 /*yield*/, campaignService.updateRecordStatus(record.id, 'failed')];
            case 11:
                _a.sent();
                return [3 /*break*/, 27];
            case 12:
                twilioNumberId = twilioNumberRows[0].id;
                return [4 /*yield*/, database_js_1.default.execute('SELECT agent_id FROM campaigns WHERE id = ?', [id])];
            case 13:
                campaignRows = (_a.sent())[0];
                agentId = campaignRows.length > 0 && campaignRows[0].agent_id
                    ? campaignRows[0].agent_id
                    : null;
                if (!!agentId) return [3 /*break*/, 17];
                return [4 /*yield*/, database_js_1.default.execute('SELECT id FROM agents WHERE user_id = ? LIMIT 1', [userId])];
            case 14:
                agentRows = (_a.sent())[0];
                if (!(agentRows.length > 0)) return [3 /*break*/, 15];
                agentId = agentRows[0].id;
                return [3 /*break*/, 17];
            case 15:
                console.error("No agent found for user ".concat(userId));
                return [4 /*yield*/, campaignService.updateRecordStatus(record.id, 'failed')];
            case 16:
                _a.sent();
                return [3 /*break*/, 27];
            case 17:
                callId = (0, uuid_1.v4)();
                appUrl = process.env.APP_URL || "http://".concat(process.env.SERVER_DOMAIN || 'localhost:5000');
                cleanAppUrl = appUrl.replace(/\/$/, '');
                // Create call record in database first
                return [4 /*yield*/, database_js_1.default.execute("INSERT INTO calls (id, user_id, agent_id, from_number, to_number, status, twilio_number_id, campaign_id, started_at)\n             VALUES (?, ?, ?, ?, ?, 'initiated', ?, ?, NOW())", [callId, userId, agentId, callerPhone, record.phone, twilioNumberId, id])];
            case 18:
                // Create call record in database first
                _a.sent();
                return [4 /*yield*/, twilioService.createCall({
                        userId: userId,
                        twilioNumberId: twilioNumberId,
                        to: record.phone,
                        agentId: agentId,
                        callId: callId,
                        appUrl: cleanAppUrl
                    })];
            case 19:
                call = _a.sent();
                // Update call record with Twilio call SID
                return [4 /*yield*/, database_js_1.default.execute('UPDATE calls SET call_sid = ? WHERE id = ?', [call.sid, callId])];
            case 20:
                // Update call record with Twilio call SID
                _a.sent();
                // Save the call SID to the campaign record
                return [4 /*yield*/, campaignService.updateRecordCallSid(record.id, call.sid)];
            case 21:
                // Save the call SID to the campaign record
                _a.sent();
                console.log("Initiated call to ".concat(record.phone, " with SID ").concat(call.sid));
                return [3 /*break*/, 25];
            case 22:
                error_30 = _a.sent();
                console.error("Error initiating call to ".concat(record.phone, ":"), error_30);
                // Increment retry count on failure
                return [4 /*yield*/, campaignService.incrementRecordRetry(record.id)];
            case 23:
                // Increment retry count on failure
                _a.sent();
                // Update record status to 'failed'
                return [4 /*yield*/, campaignService.updateRecordStatus(record.id, 'failed')];
            case 24:
                // Update record status to 'failed'
                _a.sent();
                return [3 /*break*/, 25];
            case 25:
                if (!(i < records.length - 1)) return [3 /*break*/, 27];
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, throttleDelay_1); })];
            case 26:
                _a.sent();
                _a.label = 27;
            case 27:
                i++;
                return [3 /*break*/, 4];
            case 28:
                res.json({ success: true, data: updatedCampaign });
                return [3 /*break*/, 30];
            case 29:
                error_31 = _a.sent();
                console.error('Error starting campaign:', error_31);
                res.status(500).json({ success: false, message: error_31.message });
                return [3 /*break*/, 30];
            case 30: return [2 /*return*/];
        }
    });
}); });
// Stop a campaign
app.post('/api/campaigns/:id/stop', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, userId, updatedCampaign, error_32;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                userId = req.body.userId;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID is required' })];
                }
                return [4 /*yield*/, campaignService.stopCampaign(id, userId)];
            case 1:
                updatedCampaign = _a.sent();
                if (!updatedCampaign) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: 'Campaign not found' })];
                }
                res.json({ success: true, data: updatedCampaign });
                return [3 /*break*/, 3];
            case 2:
                error_32 = _a.sent();
                console.error('Error stopping campaign:', error_32);
                res.status(500).json({ success: false, message: error_32.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get paginated records for a campaign
app.get('/api/campaigns/:id/records', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, page, limit, pageNum, limitNum, recordsData, error_33;
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
                error_33 = _b.sent();
                console.error('Error fetching records:', error_33);
                res.status(500).json({ success: false, message: error_33.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Twilio number management endpoints
// Add a Twilio number for a user
app.post('/api/add-twilio-number', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, phoneNumber, region, accountSid, authToken, result, error_34;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, userId = _a.userId, phoneNumber = _a.phoneNumber, region = _a.region, accountSid = _a.accountSid, authToken = _a.authToken;
                if (!userId || !phoneNumber || !region || !accountSid || !authToken) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'All fields are required' })];
                }
                return [4 /*yield*/, twilioService.addTwilioNumber(userId, phoneNumber, region, accountSid, authToken)];
            case 1:
                result = _b.sent();
                res.json({ success: true, data: result });
                return [3 /*break*/, 3];
            case 2:
                error_34 = _b.sent();
                console.error('Error adding Twilio number:', error_34);
                res.status(500).json({ success: false, message: error_34.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Verify Twilio number with OTP
app.post('/api/verify-twilio-otp', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, phoneNumber, otp, verified, error_35;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, userId = _a.userId, phoneNumber = _a.phoneNumber, otp = _a.otp;
                if (!userId || !phoneNumber || !otp) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID, phone number, and OTP are required' })];
                }
                return [4 /*yield*/, twilioService.verifyTwilioNumber(userId, phoneNumber, otp)];
            case 1:
                verified = _b.sent();
                res.json({ success: true, verified: verified });
                return [3 /*break*/, 3];
            case 2:
                error_35 = _b.sent();
                console.error('Error verifying Twilio number:', error_35);
                res.status(500).json({ success: false, message: error_35.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get all verified Twilio numbers for a user
app.get('/api/twilio-numbers/:userId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, numbers, error_36;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.params.userId;
                return [4 /*yield*/, twilioService.getVerifiedNumbers(userId)];
            case 1:
                numbers = _a.sent();
                res.json({ success: true, data: numbers });
                return [3 /*break*/, 3];
            case 2:
                error_36 = _a.sent();
                console.error('Error fetching Twilio numbers:', error_36);
                res.status(500).json({ success: false, message: error_36.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Start a call endpoint
app.post('/api/start-call', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, twilioNumberId, to, agentId, campaignId, callId, appUrl, cleanAppUrl, twilioNumber, call, error_37;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                _a = req.body, userId = _a.userId, twilioNumberId = _a.twilioNumberId, to = _a.to, agentId = _a.agentId, campaignId = _a.campaignId;
                if (!userId || !twilioNumberId || !to || !agentId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'User ID, Twilio number ID, destination number, and agent ID are required' })];
                }
                callId = (0, uuid_1.v4)();
                appUrl = process.env.APP_URL || "http://".concat(process.env.SERVER_DOMAIN || 'localhost:5000');
                cleanAppUrl = appUrl.replace(/\/$/, '');
                return [4 /*yield*/, twilioService.getTwilioNumberById(userId, twilioNumberId)];
            case 1:
                twilioNumber = _b.sent();
                if (!twilioNumber || !twilioNumber.verified) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'Twilio number not found or not verified' })];
                }
                // Create call record
                return [4 /*yield*/, database_js_1.default.execute("INSERT INTO calls (id, user_id, agent_id, from_number, to_number, status, twilio_number_id, campaign_id, started_at)\n       VALUES (?, ?, ?, ?, ?, 'initiated', ?, ?, NOW())", [callId, userId, agentId, twilioNumber.phoneNumber, to, twilioNumberId, campaignId || null])];
            case 2:
                // Create call record
                _b.sent();
                return [4 /*yield*/, twilioService.createCall({
                        userId: userId,
                        twilioNumberId: twilioNumberId,
                        to: to,
                        agentId: agentId,
                        callId: callId,
                        appUrl: cleanAppUrl
                    })];
            case 3:
                call = _b.sent();
                // Update call record with Twilio call SID
                return [4 /*yield*/, database_js_1.default.execute('UPDATE calls SET call_sid = ? WHERE id = ?', [call.sid, callId])];
            case 4:
                // Update call record with Twilio call SID
                _b.sent();
                res.json({ success: true, data: { callId: callId, callSid: call.sid } });
                return [3 /*break*/, 6];
            case 5:
                error_37 = _b.sent();
                console.error('Error starting call:', error_37);
                res.status(500).json({ success: false, message: error_37.message });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// Twilio TwiML endpoint
app.post('/api/twilio/twiml', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, callId, agentId, appUrl, cleanAppUrl, wsUrl;
    return __generator(this, function (_b) {
        try {
            _a = req.query, callId = _a.callId, agentId = _a.agentId;
            if (!callId || !agentId) {
                return [2 /*return*/, res.status(400).json({ success: false, message: 'Call ID and Agent ID are required' })];
            }
            appUrl = process.env.APP_URL || "http://".concat(process.env.SERVER_DOMAIN || 'localhost:5000');
            cleanAppUrl = appUrl.replace(/\/$/, '');
            wsUrl = cleanAppUrl.replace(/^https?/, function (match) { return match === 'https' ? 'wss' : 'ws'; });
            // Return TwiML response with Media Stream and greeting
            res.set('Content-Type', 'text/xml');
            res.send("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Response>\n  <Start>\n    <Stream url=\"".concat(wsUrl, "/voice-stream?callId=").concat(callId, "&agentId=").concat(agentId, "\"/>\n  </Start>\n  <Say voice=\"Polly.Joanna\">Connecting your AI assistant...</Say>\n</Response>"));
        }
        catch (error) {
            console.error('Error handling Twilio TwiML:', error);
            res.status(500).json({ success: false, message: error.message });
        }
        return [2 /*return*/];
    });
}); });
// Twilio status callback endpoint (new - for callId based calls)
app.post('/api/twilio/status', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var callId, _a, CallStatus, CallSid, RecordingUrl, CallDuration, From, To, updateData, fields, values, callRows, records, error_38;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 7, , 8]);
                callId = req.query.callId;
                _a = req.body, CallStatus = _a.CallStatus, CallSid = _a.CallSid, RecordingUrl = _a.RecordingUrl, CallDuration = _a.CallDuration, From = _a.From, To = _a.To;
                if (!callId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'Call ID is required' })];
                }
                updateData = { status: CallStatus };
                if (CallStatus === 'completed' || CallStatus === 'failed' || CallStatus === 'busy' || CallStatus === 'no-answer') {
                    updateData.ended_at = new Date().toISOString();
                    if (CallDuration) {
                        updateData.duration = parseInt(CallDuration);
                    }
                }
                if (RecordingUrl) {
                    updateData.recording_url = RecordingUrl;
                }
                fields = Object.keys(updateData).map(function (key) { return "".concat(key, " = ?"); }).join(', ');
                values = Object.values(updateData);
                values.push(callId);
                return [4 /*yield*/, database_js_1.default.execute("UPDATE calls SET ".concat(fields, " WHERE id = ?"), values)];
            case 1:
                _b.sent();
                return [4 /*yield*/, database_js_1.default.execute('SELECT campaign_id FROM calls WHERE id = ?', [callId])];
            case 2:
                callRows = (_b.sent())[0];
                if (!(callRows.length > 0 && callRows[0].campaign_id)) return [3 /*break*/, 6];
                return [4 /*yield*/, database_js_1.default.execute('SELECT id FROM campaign_records WHERE campaign_id = ? AND phone = ?', [callRows[0].campaign_id, To])];
            case 3:
                records = (_b.sent())[0];
                if (!(records.length > 0)) return [3 /*break*/, 6];
                return [4 /*yield*/, campaignService.updateRecordStatus(records[0].id, CallStatus)];
            case 4:
                _b.sent();
                if (!RecordingUrl) return [3 /*break*/, 6];
                return [4 /*yield*/, campaignService.updateRecordRecording(records[0].id, RecordingUrl)];
            case 5:
                _b.sent();
                _b.label = 6;
            case 6:
                console.log("Call ".concat(CallSid, " (").concat(callId, ") status updated to ").concat(CallStatus));
                res.status(200).send('OK');
                return [3 /*break*/, 8];
            case 7:
                error_38 = _b.sent();
                console.error('Error handling Twilio status callback:', error_38);
                res.status(500).json({ success: false, message: error_38.message });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); });
// Twilio status callback endpoint (legacy - for campaign calls)
app.post('/api/twilio/callback', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, campaignId, contactId_1, _b, CallStatus, CallSid, RecordingUrl, CallDuration, From, To, failedStatuses, campaignData, record, error_39;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 8, , 9]);
                _a = req.query, campaignId = _a.campaignId, contactId_1 = _a.contactId;
                _b = req.body, CallStatus = _b.CallStatus, CallSid = _b.CallSid, RecordingUrl = _b.RecordingUrl, CallDuration = _b.CallDuration, From = _b.From, To = _b.To;
                if (!campaignId || !contactId_1) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'Campaign ID and Contact ID are required' })];
                }
                // Update the campaign record with the call status
                return [4 /*yield*/, campaignService.updateRecordStatus(contactId_1, CallStatus)];
            case 1:
                // Update the campaign record with the call status
                _c.sent();
                if (!RecordingUrl) return [3 /*break*/, 3];
                return [4 /*yield*/, campaignService.updateRecordRecording(contactId_1, RecordingUrl)];
            case 2:
                _c.sent();
                _c.label = 3;
            case 3:
                // Log the event
                console.log("Call ".concat(CallSid, " for campaign ").concat(campaignId, " and contact ").concat(contactId_1, " status updated to ").concat(CallStatus));
                failedStatuses = ['busy', 'failed', 'no-answer'];
                if (!failedStatuses.includes(CallStatus)) return [3 /*break*/, 7];
                return [4 /*yield*/, campaignService.getCampaignWithRecords(campaignId, 'user_id')];
            case 4:
                campaignData = _c.sent();
                if (!campaignData) return [3 /*break*/, 7];
                record = campaignData.records.find(function (r) { return r.id === contactId_1; });
                if (!(record && record.retries < 3)) return [3 /*break*/, 6];
                // Increment retry count
                return [4 /*yield*/, campaignService.incrementRecordRetry(contactId_1)];
            case 5:
                // Increment retry count
                _c.sent();
                // Log retry attempt
                console.log("Call to ".concat(contactId_1, " failed with status ").concat(CallStatus, ". Retry count: ").concat(record.retries + 1));
                return [3 /*break*/, 7];
            case 6:
                console.log("Max retries reached for contact ".concat(contactId_1, ". No further retries will be attempted."));
                _c.label = 7;
            case 7:
                res.status(200).send('OK');
                return [3 /*break*/, 9];
            case 8:
                error_39 = _c.sent();
                console.error('Error handling Twilio callback:', error_39);
                res.status(500).json({ success: false, message: error_39.message });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
// WebSocket endpoint for Twilio media stream (legacy - uses Deepgram)
// DISABLED: Using new ElevenLabs handler instead (/voice-stream)
// wsApp.ws('/stream', function (ws, req) {
//     if (mediaStreamHandler) {
//         mediaStreamHandler.handleConnection(ws, req);
//     }
//     else {
//         console.error('MediaStreamHandler not initialized. Cannot handle WebSocket connection.');
//         ws.close();
//     }
// });
// WebSocket endpoint for voice stream (new - uses ElevenLabs)
wsApp.ws('/voice-stream', function (ws, req) {
    elevenLabsStreamHandler.handleConnection(ws, req);
});
    // ============================================
wsApp.ws('/api/stt', function (ws, req) {
    console.log("Frontend connected to /api/stt WebSocket");

    ws.on('message', function (msg) {
        console.log("Frontend WS message:", msg);

        // TODO: You will add ElevenLabs STT audio handling here later
        // For now, this prevents the WS from closing automatically.
    });

    ws.on('close', function () {
        console.log("Frontend /api/stt WebSocket disconnected");
    });
});

// DNC management endpoints
// Add a phone number to DNC list


app.post('/api/dnc', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, phone, userId, dncRecord, error_40;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, phone = _a.phone, userId = _a.userId;
                if (!phone || !userId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'Phone number and User ID are required' })];
                }
                return [4 /*yield*/, campaignService.addToDnc(phone, userId)];
            case 1:
                dncRecord = _b.sent();
                res.json({ success: true, data: dncRecord });
                return [3 /*break*/, 3];
            case 2:
                error_40 = _b.sent();
                console.error('Error adding to DNC list:', error_40);
                res.status(500).json({ success: false, message: error_40.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Check if a phone number is in DNC list
app.get('/api/dnc/check', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, phone, userId, isDnc, error_41;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, phone = _a.phone, userId = _a.userId;
                if (!phone || !userId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'Phone number and User ID are required' })];
                }
                return [4 /*yield*/, campaignService.isPhoneInDnc(phone, userId)];
            case 1:
                isDnc = _b.sent();
                res.json({ success: true, data: { isDnc: isDnc } });
                return [3 /*break*/, 3];
            case 2:
                error_41 = _b.sent();
                console.error('Error checking DNC list:', error_41);
                res.status(500).json({ success: false, message: error_41.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ============================================
// Twilio Basic Integration Endpoints
// ============================================
// Save/Update User Twilio Configuration
app.post('/api/twilio/config', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, accountSid, authToken, appUrl, apiKeySid, apiKeySecret, error_42;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, userId = _a.userId, accountSid = _a.accountSid, authToken = _a.authToken, appUrl = _a.appUrl, apiKeySid = _a.apiKeySid, apiKeySecret = _a.apiKeySecret;
                if (!userId || !accountSid || !authToken || !appUrl) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'User ID, Account SID, Auth Token, and App URL are required'
                        })];
                }
                return [4 /*yield*/, twilioBasicService.saveUserConfig(userId, accountSid, authToken, appUrl, apiKeySid, apiKeySecret)];
            case 1:
                _b.sent();
                res.json({
                    success: true,
                    message: 'Twilio configuration saved successfully'
                });
                return [3 /*break*/, 3];
            case 2:
                error_42 = _b.sent();
                console.error('Error saving Twilio config:', error_42);
                res.status(500).json({
                    success: false,
                    message: error_42.message || 'Failed to save configuration'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get User Twilio Configuration
app.get('/api/twilio/config/:userId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, config, error_43;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.params.userId;
                return [4 /*yield*/, twilioBasicService.getUserConfigData(userId)];
            case 1:
                config = _a.sent();
                if (!config) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Twilio configuration not found'
                        })];
                }
                res.json({
                    success: true,
                    data: config
                });
                return [3 /*break*/, 3];
            case 2:
                error_43 = _a.sent();
                console.error('Error fetching Twilio config:', error_43);
                res.status(500).json({
                    success: false,
                    message: error_43.message || 'Failed to fetch configuration'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Connect/Import Twilio Number
app.post('/api/twilio/connect-number', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, number, phoneNumber, error_44;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, userId = _a.userId, number = _a.number;
                if (!userId || !number) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'User ID and phone number are required'
                        })];
                }
                return [4 /*yield*/, twilioBasicService.connectNumber(userId, number)];
            case 1:
                phoneNumber = _b.sent();
                res.json({
                    success: true,
                    data: phoneNumber
                });
                return [3 /*break*/, 3];
            case 2:
                error_44 = _b.sent();
                console.error('Error connecting Twilio number:', error_44);
                res.status(500).json({
                    success: false,
                    message: error_44.message || 'Failed to connect number'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get User's Phone Numbers
app.get('/api/twilio/phone-numbers/:userId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, numbers, error_45;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.params.userId;
                return [4 /*yield*/, twilioBasicService.getUserPhoneNumbers(userId)];
            case 1:
                numbers = _a.sent();
                res.json({
                    success: true,
                    data: numbers
                });
                return [3 /*break*/, 3];
            case 2:
                error_45 = _a.sent();
                console.error('Error fetching phone numbers:', error_45);
                res.status(500).json({
                    success: false,
                    message: error_45.message || 'Failed to fetch phone numbers'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Make Outbound Call
app.post('/api/twilio/make-call', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, from, to, agentId, call, error_46;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, userId = _a.userId, from = _a.from, to = _a.to, agentId = _a.agentId;
                if (!userId || !from || !to) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'User ID, "from", and "to" phone numbers are required'
                        })];
                }
                return [4 /*yield*/, twilioBasicService.makeCall(userId, from, to, agentId)];
            case 1:
                call = _b.sent();
                res.json({
                    success: true,
                    data: {
                        callId: call.id,
                        callSid: call.callSid,
                        status: call.status,
                        from: call.fromNumber,
                        to: call.toNumber,
                        direction: call.direction
                    }
                });
                return [3 /*break*/, 3];
            case 2:
                error_46 = _b.sent();
                console.error('Error making call:', error_46);
                res.status(500).json({
                    success: false,
                    message: error_46.message || 'Failed to make call'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get User's Call History
app.get('/api/twilio/calls/:userId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, limit, calls, error_47;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.params.userId;
                limit = parseInt(req.query.limit) || 50;
                return [4 /*yield*/, twilioBasicService.getUserCalls(userId, limit)];
            case 1:
                calls = _a.sent();
                res.json({
                    success: true,
                    data: calls
                });
                return [3 /*break*/, 3];
            case 2:
                error_47 = _a.sent();
                console.error('Error fetching calls:', error_47);
                res.status(500).json({
                    success: false,
                    message: error_47.message || 'Failed to fetch calls'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Twilio Voice Webhook (Inbound Call Handler)
app.post('/api/twilio/voice', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, signature, url, isValid, _a, From, To, CallSid, error_48;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                userId = req.query.userId;
                if (!userId) {
                    console.error('Missing userId in voice webhook');
                    res.set('Content-Type', 'text/xml');
                    return [2 /*return*/, res.send("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Response>\n  <Say>Error: User configuration not found.</Say>\n</Response>")];
                }
                signature = req.headers['x-twilio-signature'];
                url = "".concat(req.protocol, "://").concat(req.get('host')).concat(req.originalUrl);
                if (!signature) return [3 /*break*/, 2];
                return [4 /*yield*/, twilioBasicService.validateWebhookSignature(userId, url, req.body, signature)];
            case 1:
                isValid = _b.sent();
                if (!isValid) {
                    console.warn("Invalid Twilio webhook signature for user ".concat(userId));
                    // Log but don't reject for now (can be enabled in production)
                    // return res.status(403).send('Invalid signature');
                }
                _b.label = 2;
            case 2:
                _a = req.body, From = _a.From, To = _a.To, CallSid = _a.CallSid;
                if (!(CallSid && From && To)) return [3 /*break*/, 4];
                return [4 /*yield*/, twilioBasicService.saveInboundCall(userId, CallSid, From, To)];
            case 3:
                _b.sent();
                console.log("Inbound call received for user ".concat(userId, ": ").concat(CallSid, " from ").concat(From, " to ").concat(To));
                _b.label = 4;
            case 4:
                // Return TwiML response
                res.set('Content-Type', 'text/xml');
                res.send("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Response>\n  <Say>Hello! Your call was received successfully.</Say>\n</Response>");
                return [3 /*break*/, 6];
            case 5:
                error_48 = _b.sent();
                console.error('Error handling Twilio voice webhook:', error_48);
                res.set('Content-Type', 'text/xml');
                res.status(500).send("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Response>\n  <Say>Error processing your call. Please try again later.</Say>\n</Response>");
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// Twilio Status Callback Webhook
app.post('/api/twilio/callback', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, signature, url, isValid, _a, CallSid, CallStatus, CallDuration, RecordingUrl, error_49;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                userId = req.query.userId;
                if (!userId) {
                    console.error('Missing userId in callback webhook');
                    return [2 /*return*/, res.status(200).send('OK')]; // Still return OK to avoid Twilio retries
                }
                signature = req.headers['x-twilio-signature'];
                url = "".concat(req.protocol, "://").concat(req.get('host')).concat(req.originalUrl);
                if (!signature) return [3 /*break*/, 2];
                return [4 /*yield*/, twilioBasicService.validateWebhookSignature(userId, url, req.body, signature)];
            case 1:
                isValid = _b.sent();
                if (!isValid) {
                    console.warn("Invalid Twilio callback signature for user ".concat(userId));
                    // Log but don't reject for now
                }
                _b.label = 2;
            case 2:
                _a = req.body, CallSid = _a.CallSid, CallStatus = _a.CallStatus, CallDuration = _a.CallDuration, RecordingUrl = _a.RecordingUrl;
                if (!(CallSid && CallStatus)) return [3 /*break*/, 4];
                // Update call status in database
                return [4 /*yield*/, twilioBasicService.updateCallStatus(userId, CallSid, CallStatus, CallDuration ? parseInt(CallDuration) : undefined, RecordingUrl)];
            case 3:
                // Update call status in database
                _b.sent();
                console.log("Call ".concat(CallSid, " for user ").concat(userId, " status updated to ").concat(CallStatus));
                _b.label = 4;
            case 4:
                // Always return 200 OK to Twilio
                res.status(200).send('OK');
                return [3 /*break*/, 6];
            case 5:
                error_49 = _b.sent();
                console.error('Error handling Twilio callback:', error_49);
                // Still return 200 to avoid Twilio retries
                res.status(200).send('OK');
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
app.listen(PORT, function () {
    console.log("Server is running on port ".concat(PORT));
});
