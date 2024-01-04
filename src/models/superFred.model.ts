import mongoose ,{ Schema, model } from 'mongoose';
import { USER_STATUS, PAYMENT_STATUS } from '../constants/app.constants';
const superFredSchema = new Schema(
    {   
        userId: { type: mongoose.Types.ObjectId, required: false,default:null},
        nftId: { type: mongoose.Types.ObjectId, required: false },
        type: { type: String, required: true },
        series: { type: String, required: true },
        description: { type: String, required: true },
        price: { type: Number, required: true },
        limit: { type: String, required: true },
        quantity: { type: Number, required: true },
        rewardDistribution: { type: String, required: true },
        rewardSR: { type: Number, required: true },
        dateOfMaturity: { type: String, required: false },
        maturityAmount: { type: Number, required: false },
        walletAddress:{ type: String, required: false },
        hashId: { type: String, required: false },
        image: { type: String, required: true },
        ipfs: { type: String, required: false },
        isBlocked: { type: Boolean, default: false },
        contractAddress: { type: String, required: false },
        status: { type: String, enum: [USER_STATUS.PENDING, USER_STATUS.APPROVED, USER_STATUS.DECLINED], default: USER_STATUS.PENDING }
    }, { timestamps: true, versionKey: false }
)
export default model('superfred', superFredSchema)

