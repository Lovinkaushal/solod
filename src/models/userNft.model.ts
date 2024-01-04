import { Schema, model } from 'mongoose';

const userNftSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, default: null },
        nftDetailId: { type: Schema.Types.ObjectId, default: null },
        fredNftId: { type: Schema.Types.ObjectId, default: null },
        amount: { type: Number, default: 0 },
        hashId: { type: String, default: null },
        type: { type: String, enum: ["normal", "fred"], default: "normal" },
        isLocked: { type: Boolean, default: false },
    }, { timestamps: true, versionKey: false }
)
export default model('userNft', userNftSchema)



