import { Schema, model } from 'mongoose';
import { USER_STATUS, PAYMENT_STATUS } from '../constants/app.constants';
import { USER_ROLE, ADMIN_ROLE } from '../constants/user.constants';

const dummySchema = new Schema(
    {
        name: { type: String, required: true, default: null },
        email: { type: String, required: true, trim: true },
        userName: { type: String, required: true },
        countryCode:{type:String,required:true},
        contact: { type: String, required: true },
        password: { type: String, default: null },
        referralCode: { type: String, required: false, defalut: null },
        myReferralCode: { type: String, required: false, defalut: null },
        isBlocked: { type: Boolean, default: false },
        profileImage: {
            type: String,
            default: null
        },
        otp: { type: String, required: true, default: '0' },
        status: { type: String, enum: [USER_STATUS.PENDING, USER_STATUS.APPROVED, USER_STATUS.DECLINED], default: USER_STATUS.PENDING },
        accountType: { type: String, defalut: null },
        isSecondaryAccountActive: { type: Boolean, default: false },
        businessEmail: { type: String, defalut: null },
        businessUserName: { type: String, defalut: null },
        businessContact: { type: String, defalut: null },
        isKYCConfirmed: { type: String, enum: ['0', '1', '2', '3'], default: '0' }, 
        device_type: { type: String,default:null },
        device_token: { type: String,default:null }
    }, { timestamps: true, versionKey: false }

)
export default model('dummyModels', dummySchema)

