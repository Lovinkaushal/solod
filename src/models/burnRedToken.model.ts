import { Schema, model } from 'mongoose';
import {  USER_ROLE , ADMIN_ROLE } from '../constants/user.constants';

const burnRedSchema = new Schema(
    {
        userId:{ type: String, required: false },
        amount: { type: Number, required: true },
    }, { timestamps: true, versionKey: false }
)
export default model('burnredtransaction', burnRedSchema)