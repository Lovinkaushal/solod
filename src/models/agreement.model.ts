import mongoose, { Schema, model } from 'mongoose';
import { USER_STATUS, PAYMENT_STATUS } from '../constants/app.constants';

const agreementDetailSchema = new Schema({
    propertyId: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    userId: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    leaseRequestId: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    propertyName: {
        type: String,
        required: true,
    },
    propertyType: {
        type: String,
        enum: ['Individual', 'Group', 'Portion'],
        required: true,
    },
    streetAddress: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    apn: {
        type: String,
        required: true,
    },
    typeOfPropertyOwnership: {
        type: String,
        enum: ['Freehold', 'Leasehold', 'Tract'],
        required: true,
    },
    tract:{
        type: String,
        required: true
    },
    landValue: {
        type: String,
        required: true,
    },
    improvements: {
        type: String,
        required: true,
    },
    totalValue: {
        type: String,
        required: true,
    },
    monthlyLeaseFee: {
        type: String,
        required: true,
    },
    leaseTerm: {
        type: String,
        required: true,
    },
    leaseStartDate: {
        type: String,
        required: true,
    },
    leaseExpirationDate: {
        type: String,
        required: true,
    },
    unit: {
        type: String
    },
    legalAttachments: {
        trustDeed: { type: String },
        appraisalReports: { type: String },
        titlePolicy: { type: String },
        anyEncumbrances: { type: String }
    },
    displayAttachments: { 
        pictures: { type: [String] },
        videos: { type: [String] },
        images_3d: { type: [String] }
    },
    floorPlans : { type: [String] },
    status: { type: String, enum: [USER_STATUS.PENDING, USER_STATUS.APPROVED, USER_STATUS.DECLINED], default: USER_STATUS.PENDING },
},
{
    timestamps: true,
});

export default model('agreementdetails', agreementDetailSchema);
