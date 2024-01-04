import { Schema, model } from 'mongoose';
import {  USER_ROLE , ADMIN_ROLE } from '../constants/user.constants';

const burnTvtSchema = new Schema(
    {
        tvtId:{ type: String, required: false },
        userId:{ type: String, required: false },
        amount: { type: Number, required: true },
    }, { timestamps: true, versionKey: false }
)
export default model('burntvttransaction', burnTvtSchema)