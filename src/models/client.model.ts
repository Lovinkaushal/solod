import { Schema, model } from 'mongoose';
import { USER_STATUS, PAYMENT_STATUS } from '../constants/app.constants';
import { USER_ROLE, ADMIN_ROLE } from '../constants/user.constants';

const ClientSchema = new Schema(
  {
    name: { type: String, required: true, default: null },
    email: { type: String, required: true, trim: true, unique: true },
    userName: { type: String, required: true },
    countryCode: { type: String, required: true},
    contact: { type: String, required: true, unique: true },
    password: { type: String, default: null },
    referralCode: { type: String, required: false, defalut: null },
    referralUserName: { type: String, required: false, defalut: null },
    myReferralCode: { type: String, required: false, defalut: null },
    isBlocked: { type: Boolean, default: false }, 
    profileImage: {
      type: String,
      default: null
    },
    redToken: { type: Number, default: '0' },
    solosReward: { type: Number, default: '0' },
    status: { type: String, enum: [USER_STATUS.PENDING, USER_STATUS.APPROVED, USER_STATUS.DECLINED], default: USER_STATUS.PENDING },
    accountType: { type: String, defalut: null },
    isSecondaryAccountActive: { type: Boolean, default: false },
    businessEmail: { type: String, defalut: null },
    businessUserName: { type: String, defalut: null },
    businessContact: { type: String, defalut: null },
    businessCountryCode: { type: String, required: false },
    isKYCConfirmed: { type: String, enum: ['0', '1', '2', '3'], default: '0' },
    isMpinActive: { type: Boolean, default: false},
    isMpinCreated: { type: Boolean, default: false},
    isEmailOtpActive: { type: Boolean, default: false},
    isFaceScanActive: { type: Boolean, default: false},
    mpin: { type: String, required: false},
    isMpinUsedForTransactions: { type: Boolean, required: false},
    walletAddress: { type: String, default: '0' },
    futureRed:{ type: Number, default:'0'},
    businessRedToken: { type: Number, default: '0' },
    businessSoloReward: { type: Number, default: '0' },
    device_type: { type: [String],default:null },
    device_token: { type: [String],default:null },
    lockRedToken: { type: Number, default: '0' },
    loanAmount: { type: Number, default: '0' },
    bridgeId: { type: String, defalut: null },
    bridgeCustomerId: { type: String, defalut: null },
  }, { timestamps: true, versionKey: false }

)
export default model('client', ClientSchema)



