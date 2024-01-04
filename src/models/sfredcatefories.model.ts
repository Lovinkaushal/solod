import { Schema, model } from 'mongoose';
    
    const SfredCategorySchema = new Schema(
        {
            categoryName: { type: String, required: true },
            type: { type: String, required: true }
        },
        { timestamps: true, versionKey: false }
    );
export default model('sfredcategories', SfredCategorySchema)