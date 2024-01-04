import { Schema, model } from 'mongoose';

const fredSchema = new Schema(
    {
        amount: { type: String, required: true },
        expiryDate: { type: Date, required: true },
        numberOfUsers: { type: Number, required: true },
    },
    { timestamps: true, versionKey: false }
);

export default model('Freddetails', fredSchema);










