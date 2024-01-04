import { Schema, model } from 'mongoose';
const propertyDetailSchema = new Schema({
    propertyName: {
        type: String,
        required: false,
    },
    location: {
        type: String,
        required: false,
    },
    description: {
        type: String,
        required: false,
    },
    propertyDetails: {
        area: {
            type: String,
            required: false,
        },
        propertyType: {
            type: String,
            required: false,
        },
        interestPerAnnum: {
            type: String,
            required: false,
        },
        price: {
            type: Number,
            required: false,
        },
        dueDate: {
            type: Date,
            required: false,
        },
        MonthlyFees: {
            type: Number,
            required: false,
        },
    },
    aminities: [Object],
    imageURL: {
        type: String,
        default: null,
    },
    propertyDocument: {
        type: String,
        default: null,
    },
    redToken: {
        type: Number,
    },
},
    {
        timestamps: true,
    });


export default model('propertydetails', propertyDetailSchema)