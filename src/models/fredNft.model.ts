import mongoose ,{ Schema, model } from 'mongoose';
import { TrustProductsEntityAssignmentsInstance } from 'twilio/lib/rest/trusthub/v1/trustProducts/trustProductsEntityAssignments';
import { USER_STATUS, PAYMENT_STATUS } from '../constants/app.constants';
const fredNftSchema = new Schema(
    {   
        userId: { type: mongoose.Types.ObjectId, required: false },
        benefitMonth: { type: String, required: false },
        benefitAmount: { type: String, required: false },
        type: { type: String, required: true,  enum: ['flexible', 'fixed']  },
        fred_name: { type: String, required: false },
        description: { type: String, required: false },
        purchaseLimit: { type: String, required: false },
        contractAddress: { type: String, required: false },
        maturityDate: { type: String, required: false },
        amount: { type: String, required: false },
        startMonth: { type: String, required: false },
        endYear: { type: String, required: false },
        years: { type: String, required: false },
        nftImage: { type: String, required: false },
        tokenId: { type: String, required: false },
        isPaid: { type: Boolean, default: false },
        signerAddress: { type: String, required: false },
        walletAddress: { type: String, required: false },
        isBlocked: { type: Boolean, default: false },
        status: { type: String, enum: [USER_STATUS.PENDING, USER_STATUS.APPROVED, USER_STATUS.DECLINED], default: USER_STATUS.PENDING }
    }, { timestamps: true, versionKey: false }
)
export default model('frednft', fredNftSchema)