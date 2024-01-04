import { Schema, model } from 'mongoose';
import {  USER_ROLE , ADMIN_ROLE } from '../constants/user.constants';

const rewardSchema = new Schema({
  sender_id: { type: String, required: true },
  receiver_id: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});
export default model('reward', rewardSchema)

