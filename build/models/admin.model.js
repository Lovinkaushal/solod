"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const user_constants_1 = require("../constants/user.constants");
const AdminSchema = new mongoose_1.Schema({
    email: { type: String, required: true, trim: true, unique: true },
    role: { type: Number, enum: [user_constants_1.ADMIN_ROLE, user_constants_1.USER_ROLE], default: user_constants_1.ADMIN_ROLE },
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    password: { type: String, required: true, trim: true },
    totalRedToken: { type: Number, default: '0' },
    futureRed: { type: Number, default: '0' },
    solosReward: { type: Number, default: '0' },
    FredExchangeRedTokenPercentage: { type: Number, default: '0' },
    walletAddress: { type: String, default: '0' },
    conversionRate: { type: Number, default: '0' },
    conversionRateForSoloReward: { type: Number, default: '0' },
    conversionRateForLoan: { type: Number, default: '0' },
    bookingPercentage: { type: Number, default: '0' },
    businessSolosReward: { type: Number, default: '0' },
    device_token: { type: [String], default: null },
    isBlocked: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });
exports.default = (0, mongoose_1.model)('admin', AdminSchema);
