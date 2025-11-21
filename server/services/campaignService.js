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
exports.CampaignService = void 0;
var uuid_1 = require("uuid");
var CampaignService = /** @class */ (function () {
    function CampaignService(mysqlPool) {
        this.mysqlPool = mysqlPool;
    }
    /**
     * Get campaign by ID
     * @param id Campaign ID
     * @param userId User ID for security check
     * @returns Campaign object or null if not found
     */
    CampaignService.prototype.getCampaign = function (id, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var rows, row, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.mysqlPool.execute('SELECT id, user_id, name, caller_phone, include_metadata, status, created_at FROM campaigns WHERE id = ? AND user_id = ?', [id, userId])];
                    case 1:
                        rows = (_a.sent())[0];
                        if (rows.length === 0) {
                            return [2 /*return*/, null];
                        }
                        row = rows[0];
                        return [2 /*return*/, {
                                id: row.id,
                                userId: row.user_id,
                                name: row.name,
                                callerPhone: row.caller_phone,
                                includeMetadata: row.include_metadata === 1,
                                status: row.status,
                                createdAt: row.created_at
                            }];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error getting campaign:', error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get campaign with records
     * @param id Campaign ID
     * @param userId User ID for security check
     * @returns Campaign object with records or null if not found
     */
    CampaignService.prototype.getCampaignWithRecords = function (id, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var campaign, rows, records, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getCampaign(id, userId)];
                    case 1:
                        campaign = _a.sent();
                        if (!campaign) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, this.mysqlPool.execute('SELECT id, campaign_id, phone, call_status, call_sid, recording_url, retries, created_at FROM campaign_records WHERE campaign_id = ? ORDER BY created_at DESC', [id])];
                    case 2:
                        rows = (_a.sent())[0];
                        records = rows.map(function (row) { return ({
                            id: row.id,
                            campaignId: row.campaign_id,
                            phone: row.phone,
                            callStatus: row.call_status,
                            callSid: row.call_sid,
                            recordingUrl: row.recording_url,
                            retries: row.retries || 0,
                            createdAt: row.created_at
                        }); });
                        return [2 /*return*/, { campaign: campaign, records: records }];
                    case 3:
                        error_2 = _a.sent();
                        console.error('Error getting campaign with records:', error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Set caller phone for campaign
     * @param id Campaign ID
     * @param userId User ID for security check
     * @param callerPhone Caller phone number
     * @returns Updated campaign or null if not found
     */
    CampaignService.prototype.setCallerPhone = function (id, userId, callerPhone) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.mysqlPool.execute('UPDATE campaigns SET caller_phone = ? WHERE id = ? AND user_id = ?', [callerPhone, id, userId])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.getCampaign(id, userId)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_3 = _a.sent();
                        console.error('Error setting caller phone:', error_3);
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Import CSV records into campaign
     * @param id Campaign ID
     * @param userId User ID for security check
     * @param csvData Parsed CSV data
     * @returns Number of records imported
     */
    CampaignService.prototype.importRecords = function (id, userId, csvData) {
        return __awaiter(this, void 0, void 0, function () {
            var campaign, batchSize, totalInserted, i, batch, values, placeholders, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.getCampaign(id, userId)];
                    case 1:
                        campaign = _a.sent();
                        if (!campaign) {
                            throw new Error('Campaign not found');
                        }
                        batchSize = 100;
                        totalInserted = 0;
                        i = 0;
                        _a.label = 2;
                    case 2:
                        if (!(i < csvData.length)) return [3 /*break*/, 5];
                        batch = csvData.slice(i, i + batchSize);
                        values = batch.map(function (record) { return [(0, uuid_1.v4)(), id, record.phone, 'pending', 0]; });
                        placeholders = values.map(function () { return '(?, ?, ?, ?, ?)'; }).join(', ');
                        if (!(values.length > 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.mysqlPool.execute("INSERT INTO campaign_records (id, campaign_id, phone, call_status, retries) VALUES ".concat(placeholders), values.flat())];
                    case 3:
                        _a.sent();
                        totalInserted += values.length;
                        _a.label = 4;
                    case 4:
                        i += batchSize;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, totalInserted];
                    case 6:
                        error_4 = _a.sent();
                        console.error('Error importing records:', error_4);
                        throw error_4;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Add a single record to campaign
     * @param id Campaign ID
     * @param userId User ID for security check
     * @param phone Phone number
     * @returns Created record
     */
    CampaignService.prototype.addRecord = function (id, userId, phone) {
        return __awaiter(this, void 0, void 0, function () {
            var campaign, recordId, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getCampaign(id, userId)];
                    case 1:
                        campaign = _a.sent();
                        if (!campaign) {
                            throw new Error('Campaign not found');
                        }
                        recordId = (0, uuid_1.v4)();
                        return [4 /*yield*/, this.mysqlPool.execute('INSERT INTO campaign_records (id, campaign_id, phone, call_status, retries) VALUES (?, ?, ?, ?, ?)', [recordId, id, phone, 'pending', 0])];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, {
                                id: recordId,
                                campaignId: id,
                                phone: phone,
                                callStatus: 'pending',
                                retries: 0,
                                createdAt: new Date()
                            }];
                    case 3:
                        error_5 = _a.sent();
                        console.error('Error adding record:', error_5);
                        throw error_5;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Start campaign
     * @param id Campaign ID
     * @param userId User ID for security check
     * @returns Updated campaign or null if not found
     */
    CampaignService.prototype.startCampaign = function (id, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.mysqlPool.execute('UPDATE campaigns SET status = ? WHERE id = ? AND user_id = ?', ['running', id, userId])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.getCampaign(id, userId)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_6 = _a.sent();
                        console.error('Error starting campaign:', error_6);
                        throw error_6;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get paginated campaign records
     * @param id Campaign ID
     * @param page Page number (1-based)
     * @param limit Number of records per page
     * @returns Paginated records with total count
     */
    CampaignService.prototype.getRecords = function (id_1) {
        return __awaiter(this, arguments, void 0, function (id, page, limit) {
            var countResult, totalCount, offset, rows, records, error_7;
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 20; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.mysqlPool.execute('SELECT COUNT(*) as count FROM campaign_records WHERE campaign_id = ?', [id])];
                    case 1:
                        countResult = (_a.sent())[0][0];
                        totalCount = countResult.count;
                        offset = (page - 1) * limit;
                        return [4 /*yield*/, this.mysqlPool.execute('SELECT id, campaign_id, phone, call_status, call_sid, recording_url, retries, created_at FROM campaign_records WHERE campaign_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [id, limit, offset])];
                    case 2:
                        rows = (_a.sent())[0];
                        records = rows.map(function (row) { return ({
                            id: row.id,
                            campaignId: row.campaign_id,
                            phone: row.phone,
                            callStatus: row.call_status,
                            callSid: row.call_sid,
                            recordingUrl: row.recording_url,
                            retries: row.retries || 0,
                            createdAt: row.created_at
                        }); });
                        return [2 /*return*/, { records: records, totalCount: totalCount }];
                    case 3:
                        error_7 = _a.sent();
                        console.error('Error getting records:', error_7);
                        throw error_7;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create a new campaign
     * @param userId User ID
     * @param name Campaign name
     * @returns Created campaign
     */
    CampaignService.prototype.createCampaign = function (userId, name) {
        return __awaiter(this, void 0, void 0, function () {
            var id, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = (0, uuid_1.v4)();
                        return [4 /*yield*/, this.mysqlPool.execute('INSERT INTO campaigns (id, user_id, name, include_metadata, status) VALUES (?, ?, ?, ?, ?)', [id, userId, name, true, 'idle'])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, {
                                id: id,
                                userId: userId,
                                name: name,
                                includeMetadata: true,
                                status: 'idle',
                                createdAt: new Date()
                            }];
                    case 2:
                        error_8 = _a.sent();
                        console.error('Error creating campaign:', error_8);
                        throw error_8;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get all campaigns for a user
     * @param userId User ID
     * @returns Array of campaigns
     */
    CampaignService.prototype.getUserCampaigns = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var rows, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.mysqlPool.execute('SELECT id, user_id, name, caller_phone, include_metadata, status, created_at FROM campaigns WHERE user_id = ? ORDER BY created_at DESC', [userId])];
                    case 1:
                        rows = (_a.sent())[0];
                        return [2 /*return*/, rows.map(function (row) { return ({
                                id: row.id,
                                userId: row.user_id,
                                name: row.name,
                                callerPhone: row.caller_phone,
                                includeMetadata: row.include_metadata === 1,
                                status: row.status,
                                createdAt: row.created_at
                            }); })];
                    case 2:
                        error_9 = _a.sent();
                        console.error('Error getting user campaigns:', error_9);
                        throw error_9;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update campaign record with call SID
     * @param recordId Record ID
     * @param callSid Twilio Call SID
     * @returns Updated record
     */
    CampaignService.prototype.updateRecordCallSid = function (recordId, callSid) {
        return __awaiter(this, void 0, void 0, function () {
            var error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.mysqlPool.execute('UPDATE campaign_records SET call_sid = ? WHERE id = ?', [callSid, recordId])];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_10 = _a.sent();
                        console.error('Error updating record call SID:', error_10);
                        throw error_10;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update campaign record status
     * @param recordId Record ID
     * @param status New status
     * @returns Updated record
     */
    CampaignService.prototype.updateRecordStatus = function (recordId, status) {
        return __awaiter(this, void 0, void 0, function () {
            var error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.mysqlPool.execute('UPDATE campaign_records SET call_status = ? WHERE id = ?', [status, recordId])];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_11 = _a.sent();
                        console.error('Error updating record status:', error_11);
                        throw error_11;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update campaign record with recording URL
     * @param recordId Record ID
     * @param recordingUrl Recording URL
     * @returns Updated record
     */
    CampaignService.prototype.updateRecordRecording = function (recordId, recordingUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.mysqlPool.execute('UPDATE campaign_records SET recording_url = ? WHERE id = ?', [recordingUrl, recordId])];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_12 = _a.sent();
                        console.error('Error updating record recording URL:', error_12);
                        throw error_12;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Increment retry count for a campaign record
     * @param recordId Record ID
     * @returns Updated record
     */
    CampaignService.prototype.incrementRecordRetry = function (recordId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_13;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.mysqlPool.execute('UPDATE campaign_records SET retries = retries + 1 WHERE id = ?', [recordId])];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_13 = _a.sent();
                        console.error('Error incrementing record retries:', error_13);
                        throw error_13;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if a phone number is in the DNC list
     * @param phone Phone number to check
     * @param userId User ID
     * @returns True if phone is in DNC list, false otherwise
     */
    CampaignService.prototype.isPhoneInDnc = function (phone, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var rows, error_14;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.mysqlPool.execute('SELECT id FROM dncs WHERE phone = ? AND (user_id IS NULL OR user_id = ?)', [phone, userId])];
                    case 1:
                        rows = (_a.sent())[0];
                        return [2 /*return*/, rows.length > 0];
                    case 2:
                        error_14 = _a.sent();
                        console.error('Error checking DNC list:', error_14);
                        throw error_14;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Add a phone number to the DNC list
     * @param phone Phone number to add
     * @param userId User ID
     * @returns Created DNC record
     */
    CampaignService.prototype.addToDnc = function (phone, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var id, error_15;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = (0, uuid_1.v4)();
                        return [4 /*yield*/, this.mysqlPool.execute('INSERT INTO dncs (id, phone, user_id) VALUES (?, ?, ?)', [id, phone, userId])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { id: id, phone: phone, userId: userId, createdAt: new Date() }];
                    case 2:
                        error_15 = _a.sent();
                        console.error('Error adding to DNC list:', error_15);
                        throw error_15;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update campaign name
     * @param id Campaign ID
     * @param userId User ID for security check
     * @param name New campaign name
     * @returns Updated campaign or null if not found
     */
    CampaignService.prototype.updateCampaign = function (id, userId, name) {
        return __awaiter(this, void 0, void 0, function () {
            var error_16;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.mysqlPool.execute('UPDATE campaigns SET name = ? WHERE id = ? AND user_id = ?', [name, id, userId])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.getCampaign(id, userId)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_16 = _a.sent();
                        console.error('Error updating campaign:', error_16);
                        throw error_16;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Stop campaign
     * @param id Campaign ID
     * @param userId User ID for security check
     * @returns Updated campaign or null if not found
     */
    CampaignService.prototype.stopCampaign = function (id, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_17;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.mysqlPool.execute('UPDATE campaigns SET status = ? WHERE id = ? AND user_id = ?', ['completed', id, userId])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.getCampaign(id, userId)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_17 = _a.sent();
                        console.error('Error stopping campaign:', error_17);
                        throw error_17;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return CampaignService;
}());
exports.CampaignService = CampaignService;
exports.default = CampaignService;
