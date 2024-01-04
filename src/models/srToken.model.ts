import { Schema, model } from 'mongoose';
import {  USER_ROLE , ADMIN_ROLE } from '../constants/user.constants';

const srTokenSchema = new Schema(
    {
        walletAddress: { type: String, required: true},
        numberOfTokens: { type: String, required: true},
        hash: { type: String, required: true, }
    }, { timestamps: true, versionKey: false }
)
export default model('srtoken', srTokenSchema)