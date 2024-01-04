import mongoose, { Schema } from 'mongoose';
let notificationsSchema = new mongoose.Schema({
    senderId:{type:String,required:false},
    reciverId:{type:String,require:false},
    notifications:{type:String,required:false},
    propertyCreateId: { type:Schema.Types.ObjectId, required: false, default: null, index:true },
    leaseRequestId: { type:Schema.Types.ObjectId, required: false, default: null, index:true },
    view: { type: Boolean, required: false, default: false },
    type:{type:String,required:true},
    meg:{type:String,require:false}
    
},{
    timestamps:true,
});


export let notificationsModels = mongoose.model("notification", notificationsSchema,);