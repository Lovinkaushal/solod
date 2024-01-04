import { Schema, model } from 'mongoose';
import { USER_STATUS, PAYMENT_STATUS  } from '../constants/app.constants';
import {  USER_ROLE , ADMIN_ROLE } from '../constants/user.constants';

const tvtSchema = new Schema(
    {   senderId: { type: Schema.Types.ObjectId,default:null },
        receiverId: { type: Schema.Types.ObjectId,default:null },
        senderUserName: { type: String,default:null },
        tvt: { type: String,default:null },
        quantity: { type: String,default:null },
        hashId: { type: String,default:null },
        adminHashId: { type: String,default:null },
        redToken: { type: String,default:null },
        walletAddress: { type: String,default:null },
        contractAddress: { type: String,default:null },
        isBlocked: { type: Boolean, default: false },
        status: { type: String, enum: [USER_STATUS.PENDING, USER_STATUS.APPROVED, USER_STATUS.DECLINED], default: USER_STATUS.PENDING },
    }, { timestamps: true, versionKey: false }
)
export default model('tvttransation', tvtSchema)