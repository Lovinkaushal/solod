import { Schema, model } from 'mongoose';
import { USER_STATUS, PAYMENT_STATUS  } from '../constants/app.constants';
import {  USER_ROLE , ADMIN_ROLE } from '../constants/user.constants';

const redTokenSchema = new Schema(
    {   senderId: { type: Schema.Types.ObjectId,default:null },
        receiverId: { type: Schema.Types.ObjectId,default:null },
        receiverUsername:{ type: String,default:null },
        senderUsername:{ type: String,default:null },
        totalRedToken: { type: Number,default:null},
        hashId: { type: String,default:null },
        token: { type: String,default:null },
        usdc: { type: String,default:null },
        solosReward:{ type: Number,default:null},
        transactionType: { type: String, default:null},
        transactionType2: { type: String, default:null},
        access_token: { type: String, default:null},
        walletAddress: { type: String, default: null },
        hashId2: { type: String,default:null },
        amount: { type: String, default:null},
        accountType: { type: String, default:null},
        accountType2: { type: String, default:null},
        isBlocked: { type: Boolean, default: false },
        status: { type: String, enum: [USER_STATUS.PENDING, USER_STATUS.APPROVED, USER_STATUS.DECLINED], default: USER_STATUS.PENDING },
        propertyId: { type: Schema.Types.ObjectId,default:null },
        agreementId: { type: Schema.Types.ObjectId,default:null },
    }, { timestamps: true, versionKey: false }
)
export default model('redtokentransactions', redTokenSchema)