import { Schema, model } from 'mongoose';

const tokenSchema = new Schema(
    {
        token: { type: String, required: true },
    }, { timestamps: true, versionKey: false }
)
export default model('blacklistToken', tokenSchema)
