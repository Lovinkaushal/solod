import { Schema, model } from 'mongoose';
import { USER_ROLE, ADMIN_ROLE } from '../constants/user.constants';

const AdminSchema = new Schema(
    {
        email: { type: String, required: true, trim: true, unique: true },
        role: { type: Number, enum: [ADMIN_ROLE, USER_ROLE], default: ADMIN_ROLE },
        firstName: { type: String, required: false },
        lastName: { type: String, required: false },
        password: { type: String, required: true, trim: true },
        totalRedToken: { type: Number, default: '0' },
        futureRed: { type: Number, default: '0' },
        solosReward: { type: Number, default: '0' },
        FredExchangeRedTokenPercentage: { type: Number, default: '0' },
        walletAddress: { type: String, default: '0' },
        receivewalletaddress: { type: String, default: '0' },
        privatekey: { type: String, default: '0' },
        permission: { type: [String], default: null },
        conversionRate: { type: Number, default: '0' },
        sellPercentage: { type: Number, default: '0' },
        conversionRateForSoloReward: { type: Number, default: '0' },
        conversionRateForLoan: { type: Number, default: '0' },
        bookingPercentage: { type: Number, default: '0' },
        businessSolosReward: { type: Number, default: '0' },
        device_token: { type: [String], default: null },
        mpin: { type: String, required: false },
        isMpinUsedForTransactions: { type: Boolean, required: false, default: false },
        otp: { type: String, required: false, default: '0' },
        isBlocked: { type: Boolean, default: false },
        isDeleted: { type: Boolean, default: false },
    }, { timestamps: true, versionKey: false }
)
export default model('admin', AdminSchema)