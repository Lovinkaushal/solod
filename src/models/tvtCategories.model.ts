import { Schema, model } from 'mongoose';
    
    const tvtCategorySchema = new Schema(
        {
            categoryName: { type: String, required: true },
        },
        { timestamps: true, versionKey: false }
    );
export default model('tvtcategories', tvtCategorySchema)