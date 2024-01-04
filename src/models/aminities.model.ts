import { Schema ,model } from 'mongoose';
const aminitiesSchema = new Schema({
    iconName: { type: String, required: true },
    iconImage: { type: String, required: true }
});

export default model('aminity', aminitiesSchema);