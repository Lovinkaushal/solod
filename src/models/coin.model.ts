import { Schema, model } from 'mongoose';
import { COIN_NETWORK_TYPE } from '../constants/app.constants';

const CoinSchema = new Schema(
    {
        name: { type: String, required: true, default: null },
        abi: { type: Object, required: true, default: null },
        contractAddress: { type: String, required: true, default: null },
        networkType: { type: String, required: true, default: COIN_NETWORK_TYPE.TEST_NET },
    }, { timestamps: true, versionKey: false }
)

export default model('coin', CoinSchema);