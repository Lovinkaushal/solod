import { Schema, model } from 'mongoose';
import { USER_STATUS, PAYMENT_STATUS  } from '../constants/app.constants';
import {  USER_ROLE , ADMIN_ROLE } from '../constants/user.constants';

const leasePropertySchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, required: true},
        propertyName: { type: String, required: true, default: null },
        propertyDescription: { type: String, required: true, default: null },
        addressLine1: { type: String, required: true },
        addressLine2: { type: String, required: true  },
        state: { type: String ,default: null },
        country: { type: String, defalut: null },
        pincode: { type: String, defalut: null },
        isBlocked: { type: Boolean, default: false },
        propertyDocument: {
            type: String,
            default: null
          },
        status: { type: String, enum: [USER_STATUS.PENDING, USER_STATUS.APPROVED, USER_STATUS.DECLINED], default: USER_STATUS.PENDING }
    }, { timestamps: true, versionKey: false }
)
export default model('leaseproperties', leasePropertySchema)