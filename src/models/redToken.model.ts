import { Schema, model } from 'mongoose';


const redTokenSchema = new Schema(
    {
        walletAddress: { type: String, required: true},
        numberOfTokens: { type: String, required: true},
        hash: { type: String, required: true, }
    }, { timestamps: true, versionKey: false }
)
export default model('redtoken', redTokenSchema)