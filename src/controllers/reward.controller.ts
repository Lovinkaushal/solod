import { Route, Controller, Tags, Post, Body, Get, Security, Query, Put, FormField, UploadedFile, UploadedFiles, Delete } from 'tsoa'
import { IResponse } from '../utils/interfaces.util';
import { Request, Response, request } from 'express'
import { findOne, getById, upsert, getAll, getAggregation, deleteById } from '../helpers/db.helpers';
import UploadedFileToAWS from '../utils/aws.s3.utils';
import mongoose from 'mongoose';
import logger from '../configs/logger.config';
import tvtModel from '../models/tvt.model';
import clientModel from '../models/client.model';
import rewardModel from '../models/reward.model';
const crone = require('node-cron');

@Tags('Reward')
@Route('api/reward')
export default class rewardController extends Controller {
    req: Request;
    res: Response;
    userId: string;
    constructor(req: Request, res: Response) {
        super();
        this.req = req;
        this.res = res;
        this.userId = req.body.user ? req.body.user.id : ''
    }

    @Security("Bearer")
    @Post("/sendreward")
    public async sendreward(@Body() request: { sender_id: string, receiver_id: string, amount: number }): Promise<IResponse> {
        try {
            const { sender_id, receiver_id, amount } = request;
            console.log(sender_id)
            if (!sender_id || !receiver_id || !amount) {
                return {
                    data: null,
                    error: "Required Parameters are missing",
                    message: '',
                    status: 400
                };
            }
    
            const senderClient = await clientModel.findOne({ _id: sender_id });
            const receiverClient = await clientModel.findOne({ _id: receiver_id });
    
            if (senderClient.redToken < amount) {
                return {
                    data: null,
                    error: "Insufficient Red tokens for the transaction",
                    message: '',
                    status: 400
                };
            }
            console.log(senderClient.redToken)
            const cronejob = crone.schedule("* * * * *", async () => {
                const reward = new rewardModel({
                    sender_id: senderClient._id.toString(),
                    receiver_id: receiverClient._id.toString(),
                    amount,
                });
                console.log("yes save");
                await reward.save();
    
                let updatedRedTokenForSender = senderClient.redToken - amount;
                let updatedRedTokenForReceiver = receiverClient.redToken + amount;
                console.log(updatedRedTokenForSender);
    
                await clientModel.updateOne({ _id: senderClient._id }, { redToken: updatedRedTokenForSender });
                await clientModel.updateOne({ _id: receiverClient._id }, { redToken: updatedRedTokenForReceiver });
            });
            console.log(cronejob)
            const cronejobInfo = {
                status: "Red Token Sent in Every 10 minute from sender's account",
            };
    
            return {
                data: cronejobInfo,
                error: "Reward Sent Successfully",
                message: '',
                status: 200
            };
    } catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
      }
}



