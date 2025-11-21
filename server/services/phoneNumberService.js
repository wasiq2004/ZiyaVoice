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
exports.PhoneNumberService = void 0;
var database_js_1 = require("../config/database.js");
var uuid_1 = require("uuid");
var PhoneNumberService = /** @class */ (function () {
    function PhoneNumberService() {
    }
    // Get all phone numbers for a user
    PhoneNumberService.getPhoneNumbers = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var rows, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, database_js_1.default.execute('SELECT * FROM phone_numbers WHERE user_id = ? ORDER BY created_at DESC', [userId])];
                    case 1:
                        rows = (_a.sent())[0];
                        return [2 /*return*/, rows];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error fetching phone numbers:', error_1);
                        throw new Error('Failed to fetch phone numbers');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get a specific phone number by ID
    PhoneNumberService.getPhoneNumberById = function (userId, id) {
        return __awaiter(this, void 0, void 0, function () {
            var rows, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, database_js_1.default.execute('SELECT * FROM phone_numbers WHERE user_id = ? AND id = ?', [userId, id])];
                    case 1:
                        rows = (_a.sent())[0];
                        if (rows.length > 0) {
                            return [2 /*return*/, rows[0]];
                        }
                        return [2 /*return*/, null];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error fetching phone number:', error_2);
                        throw new Error('Failed to fetch phone number');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Create a new phone number
    PhoneNumberService.createPhoneNumber = function (userId, phoneNumberData) {
        return __awaiter(this, void 0, void 0, function () {
            var id, number, countryCode, source, _a, agentName, _b, agentId, region, nextCycle, provider, _c, twilioSid, _d, capabilities, nextCycleDate, error_3;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 3, , 4]);
                        id = (0, uuid_1.v4)();
                        number = phoneNumberData.number, countryCode = phoneNumberData.countryCode, source = phoneNumberData.source, _a = phoneNumberData.agentName, agentName = _a === void 0 ? null : _a, _b = phoneNumberData.agentId, agentId = _b === void 0 ? null : _b, region = phoneNumberData.region, nextCycle = phoneNumberData.nextCycle, provider = phoneNumberData.provider, _c = phoneNumberData.twilioSid, twilioSid = _c === void 0 ? null : _c, _d = phoneNumberData.capabilities, capabilities = _d === void 0 ? null : _d;
                        nextCycleDate = nextCycle || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                        return [4 /*yield*/, database_js_1.default.execute("INSERT INTO phone_numbers \n        (id, user_id, number, country_code, source, agent_name, agent_id, region, next_cycle, provider, twilio_sid, capabilities, purchased_at) \n        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())", [
                                id,
                                userId,
                                number,
                                countryCode,
                                source,
                                agentName,
                                agentId,
                                region,
                                nextCycleDate,
                                provider,
                                twilioSid,
                                JSON.stringify(capabilities || { voice: true })
                            ])];
                    case 1:
                        _e.sent();
                        return [4 /*yield*/, this.getPhoneNumberById(userId, id)];
                    case 2: 
                    // Return the created phone number
                    return [2 /*return*/, _e.sent()];
                    case 3:
                        error_3 = _e.sent();
                        console.error('Error creating phone number:', error_3);
                        throw new Error('Failed to create phone number');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Update an existing phone number
    PhoneNumberService.updatePhoneNumber = function (userId, id, updateData) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, fields_1, values_1, fieldMapping_1, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.getPhoneNumberById(userId, id)];
                    case 1:
                        existing = _a.sent();
                        if (!existing) {
                            throw new Error('Phone number not found');
                        }
                        fields_1 = [];
                        values_1 = [];
                        fieldMapping_1 = {
                            'agentId': 'agent_id',
                            'agentName': 'agent_name',
                            'countryCode': 'country_code',
                            'nextCycle': 'next_cycle',
                            'twilioSid': 'twilio_sid'
                        };
                        Object.keys(updateData).forEach(function (key) {
                            if (key !== 'id' && key !== 'userId') { // Don't allow updating these fields
                                // Map the field name if needed
                                var dbField = fieldMapping_1[key] || key;
                                fields_1.push("".concat(dbField, " = ?"));
                                values_1.push(updateData[key]);
                            }
                        });
                        if (fields_1.length === 0) {
                            return [2 /*return*/, existing]; // Nothing to update
                        }
                        values_1.push(id);
                        values_1.push(userId);
                        return [4 /*yield*/, database_js_1.default.execute("UPDATE phone_numbers SET ".concat(fields_1.join(', '), " WHERE id = ? AND user_id = ?"), values_1)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.getPhoneNumberById(userId, id)];
                    case 3: 
                    // Return the updated phone number
                    return [2 /*return*/, _a.sent()];
                    case 4:
                        error_4 = _a.sent();
                        console.error('Error updating phone number:', error_4);
                        throw new Error('Failed to update phone number: ' + error_4.message);
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // Delete a phone number
    PhoneNumberService.deletePhoneNumber = function (userId, id) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getPhoneNumberById(userId, id)];
                    case 1:
                        existing = _a.sent();
                        if (!existing) {
                            throw new Error('Phone number not found');
                        }
                        return [4 /*yield*/, database_js_1.default.execute('DELETE FROM phone_numbers WHERE id = ? AND user_id = ?', [id, userId])];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_5 = _a.sent();
                        console.error('Error deleting phone number:', error_5);
                        throw new Error('Failed to delete phone number');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Import a phone number (special case for existing numbers)
    PhoneNumberService.importPhoneNumber = function (userId, phoneNumberData) {
        return __awaiter(this, void 0, void 0, function () {
            var region, country, phoneNumber, twilioSid, phoneData, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        region = phoneNumberData.region, country = phoneNumberData.country, phoneNumber = phoneNumberData.phoneNumber, twilioSid = phoneNumberData.twilioSid;
                        phoneData = {
                            number: phoneNumber,
                            countryCode: country,
                            source: 'Imported:twilio',
                            region: region,
                            provider: 'twilio',
                            twilioSid: twilioSid || null,
                            capabilities: { voice: true }
                        };
                        return [4 /*yield*/, this.createPhoneNumber(userId, phoneData)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_6 = _a.sent();
                        console.error('Error importing phone number:', error_6);
                        throw new Error('Failed to import phone number: ' + error_6.message);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return PhoneNumberService;
}());
exports.PhoneNumberService = PhoneNumberService;
