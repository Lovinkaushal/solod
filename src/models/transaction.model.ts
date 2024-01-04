import { Schema, model } from 'mongoose';
import { USER_STATUS, PAYMENT_STATUS } from '../constants/app.constants';

const transactionSchema = new Schema(
    {
        senderId: { type: Schema.Types.ObjectId, default: null },
        receiverId: { type: Schema.Types.ObjectId, default: null },
        uesrBooqId:  { type: String, default: null },
        redToken: { type: Number, default: null },
        hashId: { type: String, default: null },
        sendToken: { type: String, default: null },
        receiveToken: { type: String, default: null },
        transactionType: { type: String, enum: ["booqLoan", "booqFredLoan", "booqNftLoanReturn", "booqLoanReturn", "booqTransfer", "normal", "nftTransfer"], default: "normal" },
        amount: { type: String, default: null },
        accountType: { type: String, default: null },
        status: { type: String, enum: [USER_STATUS.PENDING, USER_STATUS.APPROVED, USER_STATUS.DECLINED], default: USER_STATUS.PENDING },
        propertyId: { type: Schema.Types.ObjectId, default: null },
        agreementId: { type: Schema.Types.ObjectId, default: null },
        nftDetailId: { type: Schema.Types.ObjectId, default: null },
        tokenId: { type: String, default: null },
        nftAddress: { type: String, default: null },
        senderWalletAddress: { type: String, default: null },
        receiverWalletAddress: { type: String, default: null },

    }, { timestamps: true, versionKey: false }
)
export default model('transactions', transactionSchema)