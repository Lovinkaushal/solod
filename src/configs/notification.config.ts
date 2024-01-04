import * as admin from 'firebase-admin';
import clientModel from '../models/client.model';
import { findOne } from '../helpers/db.helpers';
import propertyDetailsModel from '../models/propertyDetailsModel';
import agreementModel from '../models/agreement.model';
import adminModel from '../models/admin.model';
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', '..','firebase-creds.json');
const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const sendNotificationToUser = async (userId: string,propertyId:string, title: string, body: string): Promise<void> => {
  try {
    const user = await findOne(clientModel, { _id: userId });
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
        await admin.messaging().send(message)
          .then(response => { console.log(response) })
          .catch(error => { console.log(error) });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}
export const sendNotificationToAdmin = async (userId:string, title: string, body: string): Promise<void> => {
  try {
    const user = await findOne(clientModel, {_id: userId });
    const adminFCMToken = `${user.device_token}`;
        const message = {
            notification: {
              title,
              body
            },
            data: {
              redirect_to: 'Accounts',
              Id: JSON.stringify(userId)
            },
            token: `${adminFCMToken}`,
          };
          // Send the message
        await admin.messaging().send(message)
          .then(response => { console.log(response) })
          .catch(error => { console.log(error) });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}
