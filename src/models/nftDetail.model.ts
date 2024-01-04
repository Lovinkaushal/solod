import mongoose,{ Schema, model } from 'mongoose';
import {  USER_ROLE , ADMIN_ROLE } from '../constants/user.constants';
import { USER_STATUS, PAYMENT_STATUS } from '../constants/app.constants';
const nftSchema = new Schema(
    {
        userId: { type: mongoose.Types.ObjectId, required: true },
        name: { type: String, required: true },
        symbol: { type: String, required: true },
        description: { type: String, required: true},
        price: { type: Number, required: true },
        categoryId: {type: mongoose.Types.ObjectId, required: true },
        type: { type: String, required: true },
        publishedBy: { type: String, required: true },
        tokenId: { type: String, required: true },
        contractAddress: { type: String, required: true},
        signerAddress: { type: String, required: false},   
        Image: { type: String },
        walletAddress: { type: String, required: true},
        isPaid: { type: Boolean, default: false },
        isBlocked: { type: Boolean, default: false },
        status: { type: String, enum: [USER_STATUS.PENDING, USER_STATUS.APPROVED, USER_STATUS.DECLINED], default: USER_STATUS.PENDING },
    }, { timestamps: true, versionKey: false }
)
export default model('nftdetails', nftSchema)