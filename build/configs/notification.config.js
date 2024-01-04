"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotificationToUser = void 0;
const admin = __importStar(require("firebase-admin"));
const client_model_1 = __importDefault(require("../models/client.model"));
const db_helpers_1 = require("../helpers/db.helpers");
const path = require('path');
const serviceAccountPath = path.join(__dirname, '..', '..', 'firebase-creds.json');
const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
const sendNotificationToUser = (userId, propertyId, title, body) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield (0, db_helpers_1.findOne)(client_model_1.default, { _id: userId });
        // const propertyData=await findOne(propertyDetailsModel,{_id:propertyId})
        // const agreementData=await findOne(agreementModel,{userId});
        const userFCMToken = `${user.device_token}`;
        const message = {
            notification: {
                title,
                body
            },
            data: {
                redirect_to: 'propertyDetails',
                propertyData: JSON.stringify(propertyId), // Convert propertyData to a JSON string
                // agreementData: JSON.stringify(agreementData)
            },
            token: `${userFCMToken}`,
        };
        // Send the message
        yield admin.messaging().send(message)
            .then(response => { console.log(response); })
            .catch(error => { console.log(error); });
    }
    catch (error) {
        console.error('Error sending notification:', error);
    }
});
exports.sendNotificationToUser = sendNotificationToUser;
// export const sendNotificationToAdmin = async (leaseRequestId:string, title: string, body: string): Promise<void> => {
//   try {
//     const admin2 = await findOne(adminModel, {  });
//     const adminFCMToken = `${admin2.device_token}`;
//         const message = {
//             notification: {
//               title,
//               body
//             },
//             // data: {
//             //   // redirect_to: 'leaseRequestId',
//             //   // leaseRequestId: JSON.stringify(leaseRequestId)
//             // },
//             token: `${adminFCMToken}`,
//           };
//           // Send the message
//         await admin.messaging().send(message)
//           .then(response => { console.log(response) })
//           .catch(error => { console.log(error) });
//   } catch (error) {
//     console.error('Error sending notification:', error);
//   }
// }
