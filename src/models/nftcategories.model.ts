import { Schema, model } from 'mongoose';
    
    const nftCategorySchema = new Schema(
        {
            categoryName: { type: String, required: true },
            iconImage: { type: String, required: true }
        },
        { timestamps: true, versionKey: false }
    );
export default model('nftcategories', nftCategorySchema)