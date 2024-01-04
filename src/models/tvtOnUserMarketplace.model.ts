import mongoose ,{ Schema, model } from 'mongoose';
import { USER_STATUS, PAYMENT_STATUS } from '../constants/app.constants';
const tvtSchema = new Schema(
    {   
        userId: { type: mongoose.Types.ObjectId, required: false },
        categories: { type: String, required: true },
        series: { type: String, required: true },
        description: { type: String, required: false },
        quantity: { type: String, required: false },
        symbol: { type: String, required: false },
        quantityForSellInSoloMarketPlace: { type: Number, required: false,default:null },
        price: { type: Number, required: true },
        tradePrice: { type: Number, required: true },
        hashId: { type: String, required: false },
        walletAddress: { type: String, required: false },
        contractAddress: { type: String, required: false },
        image: { type: String, required: true },
        ipfs: { type: String, required: false },
        isBlocked: { type: Boolean, default: false },
        status: { type: String, enum: [USER_STATUS.PENDING, USER_STATUS.APPROVED, USER_STATUS.DECLINED], default: USER_STATUS.PENDING },
        nftStatus: { type: String,enum: [USER_STATUS.PENDING, USER_STATUS.APPROVED, USER_STATUS.DECLINED,USER_STATUS.INPROGRESS], default: USER_STATUS.PENDING },
        isTvtDeleted: { type: Boolean, default: false },
    }, { timestamps: true, versionKey: false }
)
export default model('tvtonusermarketplace', tvtSchema)