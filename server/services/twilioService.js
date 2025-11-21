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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioService = void 0;
var twilio_1 = __importDefault(require("twilio"));
var database_js_1 = __importDefault(require("../config/database.js"));
var uuid_1 = require("uuid");
var encryption_js_1 = require("../utils/encryption.js");
var TwilioService = /** @class */ (function () {
    function TwilioService() {
    }
    /**
     * Get Twilio client for a specific user's account
     */
    TwilioService.prototype.getClientForUser = function (accountSid, authToken) {
        return (0, twilio_1.default)(accountSid, authToken);
    };
    /**
     * Add a Twilio number for a user
     */
    TwilioService.prototype.addTwilioNumber = function (userId, phoneNumber, region, accountSid, authToken) {
        return __awaiter(this, void 0, void 0, function () {
            var client, incomingNumbers, twilioNumber, verificationCode, expiresAt, existing, id, encryptedAuthToken, countryCode, phoneNumberId, capabilities, existingPhoneNumber, verifyService, verifyError_1, error_1;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 16, , 17]);
                        client = this.getClientForUser(accountSid, authToken);
                        return [4 /*yield*/, client.api.accounts(accountSid).fetch()];
                    case 1:
                        _d.sent();
                        return [4 /*yield*/, client.incomingPhoneNumbers.list({ phoneNumber: phoneNumber })];
                    case 2:
                        incomingNumbers = _d.sent();
                        if (incomingNumbers.length === 0) {
                            throw new Error('Phone number not found in your Twilio account');
                        }
                        twilioNumber = incomingNumbers[0];
                        verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
                        expiresAt = new Date(Date.now() + 10 * 60 * 1000);
                        return [4 /*yield*/, database_js_1.default.execute('SELECT id FROM user_twilio_numbers WHERE user_id = ? AND phone_number = ?', [userId, phoneNumber])];
                    case 3:
                        existing = (_d.sent())[0];
                        id = existing.length > 0 ? existing[0].id : (0, uuid_1.v4)();
                        encryptedAuthToken = (0, encryption_js_1.encrypt)(authToken);
                        if (!(existing.length > 0)) return [3 /*break*/, 5];
                        // Update existing number
                        return [4 /*yield*/, database_js_1.default.execute("UPDATE user_twilio_numbers \n           SET twilio_account_sid = ?, twilio_auth_token = ?, region = ?, \n               verification_code = ?, verification_expires_at = ?, verified = FALSE, updated_at = NOW()\n           WHERE id = ?", [accountSid, encryptedAuthToken, region, verificationCode, expiresAt, id])];
                    case 4:
                        // Update existing number
                        _d.sent();
                        return [3 /*break*/, 7];
                    case 5: 
                    // Insert new number
                    return [4 /*yield*/, database_js_1.default.execute("INSERT INTO user_twilio_numbers \n           (id, user_id, phone_number, region, provider, verified, verification_code, verification_expires_at, twilio_account_sid, twilio_auth_token)\n           VALUES (?, ?, ?, ?, 'twilio', FALSE, ?, ?, ?, ?)", [id, userId, phoneNumber, region, verificationCode, expiresAt, accountSid, encryptedAuthToken])];
                    case 6:
                        // Insert new number
                        _d.sent();
                        _d.label = 7;
                    case 7:
                        countryCode = this.extractCountryCodeFromPhoneNumber(phoneNumber);
                        phoneNumberId = (0, uuid_1.v4)();
                        capabilities = {
                            voice: ((_a = twilioNumber.capabilities) === null || _a === void 0 ? void 0 : _a.voice) || true,
                            sms: ((_b = twilioNumber.capabilities) === null || _b === void 0 ? void 0 : _b.sms) || false,
                            mms: ((_c = twilioNumber.capabilities) === null || _c === void 0 ? void 0 : _c.mms) || false
                        };
                        return [4 /*yield*/, database_js_1.default.execute('SELECT id FROM phone_numbers WHERE user_id = ? AND number = ?', [userId, phoneNumber])];
                    case 8:
                        existingPhoneNumber = (_d.sent())[0];
                        console.log("[TwilioService] Checking phone_numbers table: userId=".concat(userId, ", phoneNumber=").concat(phoneNumber));
                        console.log("[TwilioService] Existing records found: ".concat(existingPhoneNumber.length));
                        if (!(existingPhoneNumber.length === 0)) return [3 /*break*/, 10];
                        console.log("[TwilioService] Inserting new record into phone_numbers table...");
                        // Insert new record in phone_numbers table
                        return [4 /*yield*/, database_js_1.default.execute("INSERT INTO phone_numbers \n           (id, user_id, number, country_code, source, region, provider, twilio_sid, capabilities, next_cycle, purchased_at)\n           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), NOW())", [
                                phoneNumberId,
                                userId,
                                phoneNumber,
                                countryCode,
                                'Connected:twilio',
                                region,
                                'twilio',
                                twilioNumber.sid,
                                JSON.stringify(capabilities)
                            ])];
                    case 9:
                        // Insert new record in phone_numbers table
                        _d.sent();
                        console.log("[TwilioService] Successfully inserted phone number ".concat(phoneNumber, " with ID ").concat(phoneNumberId));
                        return [3 /*break*/, 11];
                    case 10:
                        console.log("[TwilioService] Phone number already exists in phone_numbers table, skipping insert.");
                        _d.label = 11;
                    case 11:
                        _d.trys.push([11, 14, , 15]);
                        return [4 /*yield*/, this.getOrCreateVerifyService(client, accountSid)];
                    case 12:
                        verifyService = _d.sent();
                        return [4 /*yield*/, client.verify.v2.services(verifyService.sid).verifications.create({
                                to: phoneNumber,
                                channel: 'sms'
                            })];
                    case 13:
                        _d.sent();
                        return [3 /*break*/, 15];
                    case 14:
                        verifyError_1 = _d.sent();
                        console.error('Error sending verification SMS:', verifyError_1);
                        return [3 /*break*/, 15];
                    case 15: return [2 /*return*/, { id: id, verificationCode: verificationCode }];
                    case 16:
                        error_1 = _d.sent();
                        console.error('Error adding Twilio number:', error_1);
                        throw new Error("Failed to add Twilio number: ".concat(error_1.message));
                    case 17: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Extract country code from phone number
     */
    TwilioService.prototype.extractCountryCodeFromPhoneNumber = function (phoneNumber) {
        if (phoneNumber.startsWith('+1')) {
            return 'us';
        }
        else if (phoneNumber.startsWith('+44')) {
            return 'gb';
        }
        else if (phoneNumber.startsWith('+91')) {
            return 'in';
        }
        else if (phoneNumber.startsWith('+86')) {
            return 'cn';
        }
        else if (phoneNumber.startsWith('+1')) {
            return 'ca';
        }
        return 'us'; // Default to US
    };
    /**
     * Get or create a Twilio Verify service
     */
    TwilioService.prototype.getOrCreateVerifyService = function (client, accountSid) {
        return __awaiter(this, void 0, void 0, function () {
            var services, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, client.verify.v2.services.list({ limit: 1 })];
                    case 1:
                        services = _a.sent();
                        if (services.length > 0) {
                            return [2 /*return*/, services[0]];
                        }
                        return [4 /*yield*/, client.verify.v2.services.create({
                                friendlyName: 'Ziya Voice Agent Verification'
                            })];
                    case 2: 
                    // Create a new Verify service
                    return [2 /*return*/, _a.sent()];
                    case 3:
                        error_2 = _a.sent();
                        console.error('Error getting Verify service:', error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Verify Twilio number with OTP
     */
    TwilioService.prototype.verifyTwilioNumber = function (userId, phoneNumber, otp) {
        return __awaiter(this, void 0, void 0, function () {
            var rows, number, decryptedAuthToken, expiresAt, client, verifyService, verificationCheck, verifyError_2, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 11, , 12]);
                        return [4 /*yield*/, database_js_1.default.execute("SELECT id, verification_code, verification_expires_at, twilio_account_sid, twilio_auth_token, verified\n         FROM user_twilio_numbers \n         WHERE user_id = ? AND phone_number = ?", [userId, phoneNumber])];
                    case 1:
                        rows = (_a.sent())[0];
                        if (rows.length === 0) {
                            throw new Error('Phone number not found');
                        }
                        number = rows[0];
                        if (number.verified) {
                            return [2 /*return*/, true]; // Already verified
                        }
                        decryptedAuthToken = (0, encryption_js_1.decrypt)(number.twilio_auth_token);
                        if (!(number.verification_code === otp)) return [3 /*break*/, 4];
                        expiresAt = new Date(number.verification_expires_at);
                        if (!(expiresAt > new Date())) return [3 /*break*/, 3];
                        // Mark as verified in user_twilio_numbers
                        return [4 /*yield*/, database_js_1.default.execute('UPDATE user_twilio_numbers SET verified = TRUE, verification_code = NULL, verification_expires_at = NULL WHERE id = ?', [number.id])];
                    case 2:
                        // Mark as verified in user_twilio_numbers
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3: throw new Error('Verification code has expired');
                    case 4:
                        _a.trys.push([4, 9, , 10]);
                        client = this.getClientForUser(number.twilio_account_sid, decryptedAuthToken);
                        return [4 /*yield*/, this.getOrCreateVerifyService(client, number.twilio_account_sid)];
                    case 5:
                        verifyService = _a.sent();
                        return [4 /*yield*/, client.verify.v2.services(verifyService.sid).verificationChecks.create({
                                to: phoneNumber,
                                code: otp
                            })];
                    case 6:
                        verificationCheck = _a.sent();
                        if (!(verificationCheck.status === 'approved')) return [3 /*break*/, 8];
                        return [4 /*yield*/, database_js_1.default.execute('UPDATE user_twilio_numbers SET verified = TRUE, verification_code = NULL, verification_expires_at = NULL WHERE id = ?', [number.id])];
                    case 7:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        verifyError_2 = _a.sent();
                        console.error('Twilio Verify API error:', verifyError_2);
                        return [3 /*break*/, 10];
                    case 10: throw new Error('Invalid verification code');
                    case 11:
                        error_3 = _a.sent();
                        console.error('Error verifying Twilio number:', error_3);
                        throw new Error("Failed to verify number: ".concat(error_3.message));
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get all verified Twilio numbers for a user
     */
    TwilioService.prototype.getVerifiedNumbers = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var rows, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, database_js_1.default.execute("SELECT id, user_id, phone_number, region, provider, verified, twilio_account_sid, twilio_auth_token, created_at\n         FROM user_twilio_numbers \n         WHERE user_id = ? AND verified = TRUE\n         ORDER BY created_at DESC", [userId])];
                    case 1:
                        rows = (_a.sent())[0];
                        return [2 /*return*/, rows.map(function (row) { return ({
                                id: row.id,
                                userId: row.user_id,
                                phoneNumber: row.phone_number,
                                region: row.region,
                                provider: row.provider,
                                verified: row.verified,
                                twilioAccountSid: row.twilio_account_sid,
                                twilioAuthToken: row.twilio_auth_token,
                                createdAt: row.created_at
                            }); })];
                    case 2:
                        error_4 = _a.sent();
                        console.error('Error fetching verified numbers:', error_4);
                        throw new Error('Failed to fetch verified numbers');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get a specific Twilio number by ID
     */
    TwilioService.prototype.getTwilioNumberById = function (userId, numberId) {
        return __awaiter(this, void 0, void 0, function () {
            var rows, row, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, database_js_1.default.execute("SELECT id, user_id, phone_number, region, provider, verified, twilio_account_sid, twilio_auth_token, created_at\n         FROM user_twilio_numbers \n         WHERE id = ? AND user_id = ?", [numberId, userId])];
                    case 1:
                        rows = (_a.sent())[0];
                        if (rows.length === 0) {
                            return [2 /*return*/, null];
                        }
                        row = rows[0];
                        return [2 /*return*/, {
                                id: row.id,
                                userId: row.user_id,
                                phoneNumber: row.phone_number,
                                region: row.region,
                                provider: row.provider,
                                verified: row.verified,
                                twilioAccountSid: row.twilio_account_sid,
                                twilioAuthToken: row.twilio_auth_token,
                                createdAt: row.created_at
                            }];
                    case 2:
                        error_5 = _a.sent();
                        console.error('Error fetching Twilio number:', error_5);
                        throw new Error('Failed to fetch Twilio number');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create a Twilio call using user's credentials
     */
    TwilioService.prototype.createCall = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var twilioNumber, client, call, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getTwilioNumberById(params.userId, params.twilioNumberId)];
                    case 1:
                        twilioNumber = _a.sent();
                        if (!twilioNumber) {
                            throw new Error('Twilio number not found');
                        }
                        if (!twilioNumber.verified) {
                            throw new Error('Twilio number is not verified');
                        }
                        client = this.getClientForUser(twilioNumber.twilioAccountSid, twilioNumber.twilioAuthToken);
                        return [4 /*yield*/, client.calls.create({
                                to: params.to,
                                from: twilioNumber.phoneNumber,
                                url: "".concat(params.appUrl, "/api/twilio/twiml?callId=").concat(params.callId, "&agentId=").concat(params.agentId),
                                statusCallback: "".concat(params.appUrl, "/api/twilio/status?callId=").concat(params.callId),
                                statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed', 'failed', 'busy', 'no-answer'],
                                statusCallbackMethod: 'POST'
                            })];
                    case 2:
                        call = _a.sent();
                        return [2 /*return*/, call];
                    case 3:
                        error_6 = _a.sent();
                        console.error('Error creating Twilio call:', error_6);
                        throw new Error("Failed to create call: ".concat(error_6.message));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return TwilioService;
}());
exports.TwilioService = TwilioService;
