import { Route, Controller, Tags, Post, Body, Get, Security, Query, Put, FormField, UploadedFile, UploadedFiles, Delete } from 'tsoa'
import { IResponse } from '../utils/interfaces.util';
import { Request, Response, request } from 'express'
import { findOne, getById, upsert, getAll, getAggregation, deleteById } from '../helpers/db.helpers';
import UploadedFileToAWS from '../utils/aws.s3.utils';
import mongoose from 'mongoose';
import logger from '../configs/logger.config';
import tvtModel from '../models/tvt.model';
import { ethers, ContractFactory } from 'ethers';
import clientModel from '../models/client.model';
import adminModel from '../models/admin.model';
import { sendNotificationToAdmin } from '../configs/notification.config';
import { validateConversionRateForSoloReward, validateNftCategory } from '../validations/admin.validator';
import tvtCategoriesModel from '../models/tvtCategories.model';
import { validateTvtRequest } from '../validations/tvt.validator';
import tvtTransactionModel from '../models/tvtTransaction.model';
import axios from 'axios';
import burnTvtModel from '../models/burnTvt.model';
import { validateClientBurnSrTokens, validateClientBurnTvts } from '../validations/client.validator';
import tvtOnUserMarketplaceModel from '../models/tvtOnUserMarketplace.model';
const contratAbi = require("../Abi/tvtNft.json")
const { object } = require("../bytecode/tvtNftByteCode.json")
const web3 = require('web3');
@Tags('Tvt')
@Route('api/tvt')
export default class tvtController extends Controller {
    req: Request;
    res: Response;
    userId: string;
    constructor(req: Request, res: Response) {
        super();
        this.req = req;
        this.res = res;
        this.userId = req.body.user ? req.body.user.id : ''
    }


    /**
     * Create TVT Token
     */
    @Security("Bearer")
    @Post("/createTvt")
    public async createTvt(
        @FormField() categories?: string,
        @FormField() series?: string,
        @FormField() description?: string,
        @FormField() symbol?: string,
        @FormField() price?: string,
        @FormField() hashId?: string,
        @FormField() ipfs?: string,
        @FormField() contractAddress?: string,
        @UploadedFile('image') file?: Express.Multer.File
    ): Promise<IResponse> {
        try {
            let payload: { [k: string]: any } = {};
            if (categories) {
                payload.categories = categories;
            }
            if (series) {
                payload.series = series;
            }
            if (symbol) {
                payload.symbol = symbol;
            }
            if (price) {
                payload.price = price;
            }
            if (price) {
                payload.tradePrice = price;
            }
            if (description) {
                payload.description = description;
            }
            if (hashId) {
                payload.hashId = hashId;
            }
            if (ipfs) {
                payload.ipfs = ipfs;
            }
            if (contractAddress) {
                payload.contractAddress = contractAddress;
            }
            if (file) {
                payload.image = await UploadedFileToAWS(
                    file.originalname,
                    file.buffer,
                    file.mimetype.includes('image/png') ? 'image/png' : 'image/jpeg'
                );
            }
            const result = await upsert(tvtModel, payload);
            return {
                data: result,
                error: '',
                message: 'TVT created successfully',
                status: 200,
            };
        } catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400,
            };

        }
    }
    /*
      * Get TVT Details
      */
    @Security('Bearer')
    @Get("/tvtData")
    public async tvtData(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number
    ): Promise<IResponse> {
        try {

            const query = {
                userId: null,
                isTvtDeleted: false
            };

            const data = await getAll(tvtModel, query, +pageNumber, +pageSize);
            return {
                data: data || {},
                error: '',
                message: 'TVT Details Fetched Successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message || err,
                message: '',
                status: 400
            };
        }
    }
    /**
   * Get TVT Details
   */
    @Security('Bearer')
    @Get("/tvtDataOfUsers")
    public async tvtDataOfUsers(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
    ): Promise<IResponse> {
        try {
            const totalCount = await tvtModel.countDocuments({});
            const data = await tvtModel.aggregate([
                {
                    $lookup: {
                        from: "clients",
                        localField: "userId",
                        foreignField: "_id",
                        as: "client"
                    }
                },
                {
                    $unwind: "$client"
                },
                {
                    $match: {
                        userId: { $ne: null }
                    }
                },
                {
                    $project: {
                        status: 1,
                        image: 1,
                        hashId: 1,
                        tradePrice: 1,
                        symbol: 1,
                        description: 1,
                        price: 1,
                        userId: 1,
                        contractAddress: 1,
                        quantityForSellInSoloMarketPlace: 1,
                        quantity: 1,
                        userName: "$client.userName",
                        name: "$client.name",
                        createdAt: 1,
                        updatedAt: 1,
                        categories: 1,
                        series: 1,
                    }
                },
                {
                    $sort: { updatedAt: -1 }
                },
                {
                    $skip: Number(pageNumber - 1) * Number(pageSize)
                },
                {
                    $limit: Number(pageSize)
                },
            ]);

            return {
                data: { data, totalCount },
                error: '',
                message: 'TVT Details Fetched Successfully',
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

    /**
       * Tvts Sell in MarketPlace
       */
    @Security('Bearer')
    @Put("/totalTvtSellInMarketPlace")
    public async totalTvtSellInMarketPlace(@Body() request: { id: string, quantity: string }): Promise<IResponse> {
        try {
            const { id, quantity } = request;
            const getResponse = await getById(tvtModel, id);
            const updatedQuantityForSellInSoloMarketPlace = getResponse.quantityForSellInSoloMarketPlace + parseInt(quantity);
            const getResponse2 = await upsert(tvtModel, {
                quantity: getResponse.quantity - parseInt(quantity),
                quantityForSellInSoloMarketPlace: updatedQuantityForSellInSoloMarketPlace
            }, id);

            return {
                data: getResponse2,
                error: '',
                message: 'TVT Transfer Successfully',
                status: 200
            };
        } catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: 'Error Transfering Tvt',
                status: 400
            };
        }
    }
    /*
 * Get TVT Details
 */
    @Security('Bearer')
    @Get("/tvtDataOfSoloMarketPlace")
    public async tvtDataOfSoloMarketPlace(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
        @Query('filter') filter?: string,
        @Query("sort") sort?: '0' | '1'
    ): Promise<IResponse> {
        try {

            let payload: any = { quantityForSellInSoloMarketPlace: { $gt: 0 }, isTvtDeleted: false };
            if (filter) {
                payload.series = { $regex: filter, $options: 'i' }
            }
            const result = await getAll(tvtModel, payload, +pageNumber, +pageSize);

            let data = result.items;

            if (sort === '0' || sort === '1') {
                const sortOrder = sort === '0' ? 1 : -1;
                data.sort((a: any, b: any) => {
                    return sortOrder * (a.price - b.price);
                });
            }
            const totalCount = data.length;
            return {
                data: { filteredData: data, totalCount },
                error: '',
                message: 'TVT Details Fetched Successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }
    /**
    * Buy Tvt
    */
    @Security("Bearer")
    @Post("/buyTvt")
    public async buyTvt(
        @Body() request: {
            id: string,
            price: string,
            quantity: string,
            walletAddress: string,
            hashId: string,
            contractAddress: string
        }
    ): Promise<IResponse> {
        try {
            let { id, quantity, price, walletAddress, hashId, contractAddress } = request;
            if (id === undefined || quantity === undefined || price === undefined) {
                throw new Error('Missing required parameters.');
            }
            const tvtDetails = await getById(tvtModel, id);
            const categories = tvtDetails.categories
            const series = tvtDetails.series
            let payload: { [k: string]: any } = {
                userId: this.userId,
                status: 'APPROVED',
                categories: categories,
                symbol: tvtDetails.symbol,
                description: tvtDetails.description,
                series: series,
                price: tvtDetails.price,
                tradePrice: price,
                quantity: quantity,
                hashId: tvtDetails.hashId,
                image: tvtDetails.image,
                ipfs: tvtDetails.ipfs
            };
            let result: string;
            const data = await findOne(tvtModel, { userId: this.userId, categories, status: 'APPROVED', series });
            if (data) {
                const contractAddress = data.contractAddress
                const getResponse = await getById(tvtModel, id);
                console.log(getResponse)
                const updatedQuantity = getResponse.quantityForSellInSoloMarketPlace - +parseInt(quantity);
                console.log(updatedQuantity)
                if (updatedQuantity < 0) {
                    throw new Error('Invalid quantity calculation.');
                }
                const updatedQuantity2 = data.quantity + +quantity
                console.log(updatedQuantity2)

                const getResponse2 = await upsert(tvtModel, { tradePrice: price, quantityForSellInSoloMarketPlace: updatedQuantity }, id);
                result = await upsert(tvtModel, { quantity: updatedQuantity2, hashId: hashId, contractAddress: contractAddress }, data._id);
            } else {
                const getResponse = await getById(tvtModel, id);
                const updatedQuantity = getResponse.quantityForSellInSoloMarketPlace - +parseInt(quantity);
                if (updatedQuantity < 0) {
                    throw new Error('Invalid quantity calculation.');
                }
                const getResponse2 = await upsert(tvtModel, { tradePrice: price, quantityForSellInSoloMarketPlace: updatedQuantity }, id);
                const response = await upsert(tvtModel, payload);
                result = await upsert(tvtModel, { hashId: hashId, contractAddress: contractAddress }, response._id);
            }
            return {
                data: result,
                error: '',
                message: 'TVT Purchase Successfully',
                status: 200,
            };
        } catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400,
            };
        }
    }
    @Security('Bearer')
    @Get("/getUserTvt")
    public async getUserTvt(): Promise<IResponse> {
        try {

            let query: any = { userId: this.userId };
            query.status = 'APPROVED';
            const getResponse = await getAll(tvtModel, query);
            const dataToDelete = getResponse.items.filter(entry =>
                entry.userId == this.userId && entry.quantity == 0
            );
            console.log(dataToDelete)
            for (const entryToDelete of dataToDelete) {
                const stringId: string = entryToDelete._id.toString();
                await deleteById(tvtModel, stringId);
            }
            const filteredResponse = getResponse.items.filter(entry =>
                entry.userId !== null && entry.quantity !== 0
            );

            let result = []
            for (let index = 0; index < filteredResponse.length; index++) {
                const element = filteredResponse[index];
                let tvt = await tvtModel.findOne({ contractAddress: element.contractAddress, status: "PENDING" })
                if (tvt) {
                    element.tradePrice = tvt.tradePrice;
                }
                result.push(element)
            }

            return {
                data: result,
                error: '',
                message: 'TVT Details Fetched Successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message || err,
                message: '',
                status: 400
            };
        }
    }
    /**
        * AirDrop Tvt
        */
    @Security("Bearer")
    @Post("/airdropTvt")
    public async airdropTvt(
        @Body() request: {
            tvtId: string,
            userId: string,
            quantity?: string,
            contractAddress: string
        }
    ): Promise<IResponse> {
        try {
            let { tvtId, userId, quantity, contractAddress } = request;
            const getResponse = await getById(tvtModel, tvtId);
            if (tvtId === undefined || quantity === undefined) {
                throw new Error('Missing required parameters.');
            }
            let payload: { [k: string]: any } = {
                receiverId: userId,
                status: 'APPROVED',
                tvt: tvtId,
                quantity: quantity,
                contractAddress: contractAddress
            };

            const result = await upsert(tvtTransactionModel, payload);
            return {
                data: result,
                error: '',
                message: 'TVT Transfer Successfully',
                status: 200,
            };
        } catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400,
            };
        }
    }

    @Security('Bearer')
    @Put("/quantityfromSellInMarketPlace")
    public async quantityfromSellInMarketPlace(@Body() request: { id: string, quantity: string }): Promise<IResponse> {
        try {
            const { id, quantity } = request;
            const getResponse = await getById(tvtModel, id);
            if (quantity > getResponse.quantityForSellInSoloMarketPlace) {
                return {
                    data: null,
                    error: '',
                    message: 'The required Quantity is not present on marketPlace',
                    status: 400
                }
            }
            const updatedQuantityForSellInSoloMarketPlace = parseInt(quantity);
            const updatedquantityforadmin = getResponse.quantityForSellInSoloMarketPlace - parseInt(quantity)
            const updatedquantity = getResponse.quantity + updatedquantityforadmin
            const getResponse2 = await upsert(tvtModel, {
                quantity: updatedquantity,
                quantityForSellInSoloMarketPlace: updatedQuantityForSellInSoloMarketPlace
            }, id);
            return {
                data: getResponse2,
                error: '',
                message: 'TVT Updated Successfully',
                status: 200
            };
        } catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: 'Error Transfering Tvt',
                status: 400
            };
        }
    }
    /**
         * Tvt Sell in User Marketplace api
         */
    @Security("Bearer")
    @Post("/tvtSellInUserMarketPlace")
    public async tvtSellInUserMarketPlace(
        @Body() request: { tvtId: string; quantity: String, walletAddress: string, tradePrice: string }
    ): Promise<IResponse> {
        try {
            const { tvtId, quantity, walletAddress, tradePrice } = request
            const data = await findOne(tvtModel, { _id: tvtId })
            if (data) {
                if (quantity > data.quantity) {
                    throw new Error("Insufficient token's: You don't have enough token to complete this operation.");
                }
            }
            let payload: { [k: string]: any } = {};
            if (data.userId) {
                payload.userId = data.userId;
            }
            if (data.categories) {
                payload.categories = data.categories;
            }

            if (data.series) {
                payload.series = data.series;
            }
            if (data.symbol) {
                payload.symbol = data.symbol;
            }
            if (data.description) {
                payload.description = data.description;
            }
            if (data.quantityForSellInSoloMarketPlace) {
                payload.quantityForSellInSoloMarketPlace = data.quantityForSellInSoloMarketPlace;
            }

            if (data.tradePrice) {
                payload.tradePrice = data.tradePrice;
            }
            if (data.price) {
                payload.price = data.price;
            }
            if (tradePrice) {
                payload.tradePrice = tradePrice;
            }
            if (quantity) {
                payload.quantity = quantity;
            }
            if (data.hashId) {
                payload.hashId = data.hashId;
            }
            if (data.contractAddress) {
                payload.contractAddress = data.contractAddress;
            }
            if (data.image) {
                payload.image = data.image;
            }
            if (walletAddress) {
                payload.walletAddress = walletAddress;
            }
            if (data.ipfs) {
                payload.ipfs = data.ipfs;
            }
            let result2;
            const updatedQuantity = data.quantity - parseInt(quantity.toString());
            const result1 = await upsert(tvtModel, { quantity: updatedQuantity }, data._id);
            const userNFT = await findOne(tvtModel, { userId: this.userId, categories: data.categories, status: 'DECLINED' });
            if (userNFT) {
                const updatedQuantity2 = userNFT.quantity + parseInt(quantity.toString());
                result2 = await upsert(tvtModel, { quantity: updatedQuantity2 }, userNFT._id);
            } else {
                const result = await upsert(tvtModel, payload);
                result2 = await upsert(tvtModel, { status: 'DECLINED' }, result._id);
            }
            return {
                data: result2,
                error: '',
                message: 'Transfer Tvt to User MarketPlace Successfully',
                status: 200,
            };
        } catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400,
            };
        }

    }
    /**
         * Get Tvt Sell in User Marketplace api
         */
    @Security('Bearer')
    @Get("/getTvtInUserMarketPlace")
    public async getTvtInUserMarketPlace(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
        @Query('filter') filter?: string
    ): Promise<IResponse> {
        try {
            let query: any = { status: 'DECLINED' };
            let admin = await adminModel.findOne({ _id: new mongoose.Types.ObjectId(this.userId) })
            if (!admin) {
                query.isBlocked = { $ne: true };
            }
            if (filter) {
                query = {
                    series: { $regex: filter, $options: 'i' }
                };
            }
            const getResponse = await getAll(tvtModel, query, +pageNumber, +pageSize);
            const filteredResponse = getResponse.items.filter(entry =>
                entry.userId !== null && entry.quantity !== 0
            );
            const dataToDelete = getResponse.items.filter(entry =>
                entry.userId == this.userId && entry.quantity == 0
            );
            console.log(dataToDelete)
            for (const entryToDelete of dataToDelete) {
                const stringId: string = entryToDelete._id.toString();
                await deleteById(tvtModel, stringId);
            }
            return {
                data: filteredResponse,
                error: '',
                message: 'Tvt Details Fetched Successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message || err,
                message: '',
                status: 400
            };
        }
    }
    /**
       * Update Tvt Data Api
       */
    @Security('Bearer')
    @Put("/updateTvt")
    public async updateTvt(@Body() request: { id: string, categories: string, series: string, description: string, symbol: string, price: string, hashId: string, contractAddress: string, tradePrice: string, nftStatus: string, quantityForSellInSoloMarketPlace: string }): Promise<IResponse> {
        try {
            const { id, categories, series, description, symbol, price, hashId, contractAddress, tradePrice, nftStatus, quantityForSellInSoloMarketPlace } = request;

            let payload: { [k: string]: any } = {};

            if (categories) {
                payload.categories = categories;
            }
            if (series) {
                payload.series = series;
            }
            if (description) {
                payload.description = description;
            }
            if (symbol) {
                payload.symbol = symbol;
            }
            if (price) {
                payload.price = price;
            }
            if (hashId) {
                payload.hashId = hashId;
            }
            if (contractAddress) {
                payload.contractAddress = contractAddress;
            }
            if (tradePrice) {
                payload.tradePrice = tradePrice;
            }
            if (nftStatus) {
                payload.nftStatus = nftStatus;
            }
            if (quantityForSellInSoloMarketPlace) {
                payload.quantityForSellInSoloMarketPlace = quantityForSellInSoloMarketPlace;
            }
            let result;
            result = await upsert(tvtModel, payload, id);
            return {
                data: result,
                error: '',
                message: 'TVT Updated Successfully',
                status: 200
            };
        } catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: 'Error',
                status: 400
            };
        }
    }
    /**
             * Get Tvt transaction receipt
             */
    @Security('Bearer')
    @Get("/getTransactionReceipt")
    public async getTransactionReceipt(
        @Query('tvtId') tvtId: string,
        @Query('hashId') hashId: string,
    ): Promise<IResponse> {
        try {
            if (!tvtId || !hashId || tvtId.trim() === '' || hashId.trim() === '') {
                throw new Error('Both tvtId and hashId are required parameters');
            }

            const provider = new ethers.providers.JsonRpcProvider('https://polygon-mainnet.g.alchemy.com/v2/rvmpmREwuUjwDRUj3SBmkP6EDR0rSlVo');

            // Call ethers provider to get transaction receipt
            const transactionReceipt = await provider.getTransactionReceipt(hashId);

            // Check if the transaction receipt is not found
            if (!transactionReceipt) {
                throw new Error('Transaction receipt not found');
            }

            // Check if the transaction is verified
            if (transactionReceipt.status === 1) {
                await upsert(tvtModel, { nftStatus: 'APPROVED' }, tvtId);
            } else {
                await upsert(tvtModel, { nftStatus: 'DECLINED', contractAddress: 'null', hashId: 'null' }, tvtId);
            }
            return {
                data: transactionReceipt,
                error: '',
                message: 'Tvt Details Fetched Successfully',
                status: 200,
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message || err,
                message: '',
                status: 400,
            };
        }
    }
    /**
* Create Token Category API
*/
    @Security('Bearer')
    @Post("/createTvtCategory")
    public async createTvtCategory(
        @Body() request: { id: string, categoryName: string, }
    ): Promise<IResponse> {
        try {
            const { id, categoryName } = request;
            console.log(categoryName)
            const validatedCategory = validateNftCategory({ categoryName });
            if (validatedCategory.error) {
                throw new Error(validatedCategory.error.message);
            }
            let saveResponse;
            if (id) {
                saveResponse = await upsert(tvtCategoriesModel, {
                    categoryName: categoryName
                }, id);
            } else {
                saveResponse = await upsert(tvtCategoriesModel, {
                    categoryName: categoryName
                });
            }

            return {
                data: saveResponse,
                error: '',
                message: 'TVT Category Created successfully!',
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
    @Security('Bearer')
    @Get("/getTvtCategory")
    public async getTvtCategory(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
        @Query('filter') filter: string
    ): Promise<IResponse> {
        async function getAll(model: any, pageNumber: number, pageSize: number, filter?: string) {
            let query: any = {};
            if (filter) {
                query = {
                    $or: [
                        { categoryName: { $regex: filter, $options: 'i' } },
                    ]
                };
            }

            if (pageNumber && pageSize) {
                const skip = (pageNumber - 1) * pageSize;
                return model.find(query).skip(skip).limit(pageSize);
            } else {
                return model.find(query);
            }
        }
        try {
            const data = await getAll(tvtCategoriesModel, +pageNumber, +pageSize, filter);
            const totalCount = await tvtCategoriesModel.countDocuments({});
            return {
                data: { data, totalCount },
                error: '',
                message: 'Tvt Category Fetched successfully!',
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

    /**
  * Request for Buying Tvt
  */
    @Security('Bearer')
    @Post("/requestTvt")
    public async requestTvt(@Body() request: { tvtId: string, quantity: string, hashId: string, redToken: string, walletAddress: string, contractAddress: string }): Promise<IResponse> {
        try {
            const { tvtId, quantity, hashId, redToken, walletAddress, contractAddress } = request;
            const validateRedToken = validateTvtRequest({ tvtId, quantity, hashId, redToken, walletAddress });
            if (validateRedToken.error) {
                throw new Error(validateRedToken.error.message)

            }
            const getResponse = await getById(tvtModel, tvtId);
            const updatedQuantity = getResponse.quantityForSellInSoloMarketPlace - parseInt(quantity)
            let saveResponse1 = await upsert(tvtModel, { quantityForSellInSoloMarketPlace: updatedQuantity }, getResponse._id)
            // check if client exists
            const propertyData = await findOne(tvtTransactionModel, { hashId });
            if (propertyData) {
                throw new Error(`Name ${hashId} is already exists`)
            }
            const clientData = await findOne(clientModel, { _id: this.userId });
            let saveResponse = await upsert(tvtTransactionModel, { senderId: clientData._id, senderUserName: clientData.userName, quantity, hashId, redToken, walletAddress, contractAddress })
            return {
                data: { ...saveResponse.toObject() },
                error: '',
                message: 'TVT request send successfully',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
     * Delete Tvt Category  API
     */
    @Security('Bearer')
    @Delete('deleteTvtCategory')
    public async deleteTvtCategory(@Query('id') id: string): Promise<IResponse> {
        try {
            // Find the property detail by ID and remove it
            const deletedPropertyDetail = await deleteById(tvtCategoriesModel, id)
            if (!deletedPropertyDetail) {
                return {
                    data: null,
                    error: 'Tvt detail not found',
                    message: 'Tvt detail not found',
                    status: 404,
                };
            }
            return {
                data: null,
                error: '',
                message: 'Tvt detail deleted successfully',
                status: 200,
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: 'Error deleting Tvt detail',
                status: 400,
            };
        }
    }
    /**
  * Get TVT Details
  */
    @Security('Bearer')
    @Get("/getTvtRequestData")
    public async getTvtRequestData(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
        @Query('filter') filter?: string
    ): Promise<IResponse> {
        try {
            // Validation for page number and page size
            const skip = Math.max(0, (Number(pageNumber) - 1) * Number(pageSize));
            const limit = Number(pageSize);

            const aggregationPipeline = [
                {
                    $lookup: {
                        from: "clients",
                        localField: "senderId",
                        foreignField: "_id",
                        as: "client"
                    }
                },
                {
                    $lookup: {
                        from: "tvts",
                        localField: "contractAddress",
                        foreignField: "contractAddress",
                        as: "tvtData"
                    }
                },
                {
                    $unwind: "$client"
                },
                {
                    $project: {
                        status: 1,
                        senderId: 1,
                        redToken: 1,
                        hashId: 1,
                        adminHashId: 1,
                        quantity: 1,
                        walletAddress: 1,
                        contractAddress: 1,
                        userName: "$client.userName",
                        name: "$client.name",
                        tvtdata: "$tvtData",
                        createdAt: 1,
                        updatedAt: 1
                    }
                },
                {
                    $match: {
                        $or: [
                            { contractAddress: { $regex: filter, $options: 'i' } }
                        ]
                    }
                },
                {
                    $sort: { updatedAt: -1 }
                },
                {
                    $skip: skip,
                },
                {
                    $limit: limit,
                },
            ];

            const totalCount = await tvtTransactionModel.countDocuments({});
            const data = await tvtTransactionModel.aggregate(aggregationPipeline);

            return {
                data: { data, totalCount },
                error: '',
                message: 'TVT Requests Fetched Successfully',
                status: 200
            };
        } catch (err: any) {
            console.error('Error in getTvtRequestData:', err);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }

    /**
  * Get TVT Details for users
  */
    @Security('Bearer')
    @Get("/getTvtRequestDataForUsers")
    public async getTvtRequestDataForUsers(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
    ): Promise<IResponse> {
        try {
            const totalCount = await tvtModel.countDocuments({});
            const data = await tvtTransactionModel.aggregate([
                {
                    $match: {
                        senderId: mongoose.Types.ObjectId(this.userId)
                    }
                },
                {
                    $lookup: {
                        from: "clients",
                        localField: "senderId",
                        foreignField: "_id",
                        as: "client"
                    }
                },
                {
                    $unwind: "$client"
                },
                {
                    $project: {
                        status: 1,
                        senderId: 1,
                        redToken: 1,
                        hashId: 1,
                        quantity: 1,
                        walletAddress: 1,
                        contractAddress: 1,
                        userName: "$client.userName",
                        name: "$client.name",
                        createdAt: 1,
                        updatedAt: 1
                    }
                },
                {
                    $sort: { updatedAt: -1 }
                },
                {
                    $skip: Number(pageNumber - 1) * Number(pageSize)
                },
                {
                    $limit: Number(pageSize)
                },
            ]);

            return {
                data: { data, totalCount },
                error: '',
                message: 'TVT Requests Fetched Successfully',
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
    /**
 * Update status of Tvt Request
 */
    @Security('Bearer')
    @Put("/updateTvtRequest")
    public async updateTvtRequest(@Body() updateRequest: { tvtId: string, status: string, hashId: string, }): Promise<IResponse> {
        try {
            const { tvtId, status, hashId } = updateRequest;
            const getResponse = await getById(tvtTransactionModel, tvtId);
            const changeStatusRequest = await upsert(tvtTransactionModel, { adminHashId: hashId, status }, getResponse._id);
            return {
                data: { changeStatusRequest },
                error: '',
                message: 'Tvt request status updated successfully',
                status: 200
            };
        } catch (error) {
            return {
                data: null,
                error: 'Internal Server Error',
                message: 'Error updating Tvt',
                status: 500


            };
        }
    }
    /*
     * Get All TVT Details
     */
    @Security('Bearer')
    @Get("/getAllTvt")
    public async getAllTvt(): Promise<IResponse> {
        try {
            const query = {
                isTvtDeleted: false
            };
            const result = await getAll(tvtModel, query);
            return {
                data: { result },
                error: '',
                message: 'TVT Details Fetched Successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }
    /**
 * Get TVT Details for users
 */
    @Security('Bearer')
    @Get("/getUserHolders")
    public async getUserHolders(
        @Query('chainId') chainId: string,
        @Query('contractAddress') contractAddress: string,
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
    ): Promise<IResponse> {
        try {
            const apiKey = '2ZqZ5ujGyoynIrxqwGn2Ghj8qOc';
            const options = {
                method: 'GET',
                headers: { accept: 'application/json', 'x-api-key': apiKey },
            };

            const apiResponse = await axios.get(`https://api.chainbase.online/v1/token/holders?chain_id=${chainId}&contract_address=${contractAddress}&page=${pageNumber}&limit=${pageSize}`, options);
            if (!apiResponse) {
                throw new Error("Invalid Contract Address")
            }
            const responseData = apiResponse.data.data;
            const addresses = responseData.map((data: string) => data);
            const provider = new ethers.providers.JsonRpcProvider('https://polygon-mainnet.g.alchemy.com/v2/rvmpmREwuUjwDRUj3SBmkP6EDR0rSlVo');

            async function getTokenBalance(address: string, tokenContractAddress: string, provider: ethers.providers.JsonRpcProvider): Promise<string> {
                try {
                    const tokenContract = new ethers.Contract(contractAddress, contratAbi, provider);

                    const balanceWei = await tokenContract.balanceOf(address);
                    const balance = ethers.utils.formatUnits(balanceWei, 'wei');

                    return balance;
                } catch (error) {
                    console.error(`Error fetching token balance for address ${address}:`, error);
                    throw error;
                }
            }
            const balancePromises = addresses.map(async (address: any) => {
                try {
                    const balanceWei = await provider.getBalance(address);
                    const balanceEth = ethers.utils.formatEther(balanceWei);
                    const tvtBalance = await getTokenBalance(address, contractAddress, provider);
                    const data = await getAll(clientModel, { walletAddress: address });
                    return {
                        address: address,
                        balance: tvtBalance,
                        data: data
                    };
                } catch (balanceErr) {
                    return null;
                }
            });

            const balances = await Promise.all(balancePromises);
            const formattedBalances: { address: string, balance: string, data: string }[] = [];

            balances.forEach((balanceData: any) => {
                if (balanceData) {
                    const formattedBalance = {
                        address: balanceData.address,
                        balance: balanceData.balance,
                        data: balanceData.data
                    };
                    formattedBalances.push(formattedBalance);
                }
            });
            const data = await findOne(tvtModel, { contractAddress })
            const combinedData = {
                formattedBalances, data
            };
            return {
                data: combinedData,
                error: '',
                message: 'User Holder Balance Fetched Successfully',
                status: 200
            };
        } catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : 'Internal Server Error',
                message: '',
                status: 500
            };
        }
    }

    /**
     * Save transation of burn Tvt
     */
    @Security('Bearer')
    @Post("/saveTransactionOfBurnTvt")
    public async saveTransactionOfBurnTvt(@Body() request: { tvtId: string, amount: string }): Promise<IResponse> {
        try {
            const { tvtId, amount } = request;
            const validatedData = validateClientBurnTvts({ amount });
            if (validatedData.error) {
                throw new Error(validatedData.error.message)
            }
            const updated = await upsert(burnTvtModel, { tvtId, amount, userId: this.userId },)
            return {
                data: { updated },
                error: '',
                message: 'Transaction Save Successfully',
                status: 200
            }
        }
        catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }
    /**
    * Get Transaction Burn Tvt
    */
    @Security('Bearer')
    @Get("/getTransactionOfBurnTvt")
    public async getTransactionOfBurnTvt(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
    ): Promise<IResponse> {
        try {
            // Assuming findAll function supports pagination
            const data = await getAll(burnTvtModel, {}, +pageNumber, +pageSize);

            return {
                data: { data },
                error: '',
                message: 'Transaction fetch Successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }
    /**
 * Get TVT transaction details
 */
    @Security('Bearer')
    @Get("/getTvtTransactions")
    public async getTvtTransactions(
        @Query('chainId') chainId: string,
        @Query('contractAddress') contractAddress: string,
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
    ): Promise<IResponse> {
        const options = {
            method: 'GET',
            headers: {
                'x-api-key': "2ZqZ5ujGyoynIrxqwGn2Ghj8qOc",
                'accept': 'application/json'
            }
        };
        try {
            const apiResponse = await axios.get(`https://api.chainbase.online/v1/token/transfers?chain_id=${chainId}&contract_address=${contractAddress}&page=${pageNumber}&limit=${pageSize}`, options);
            const response = apiResponse.data.data;
            const addresses = response.map((data: string) => data);
            console.log(addresses)
            const clientData = await Promise.all(addresses.map(async (address: any) => {
                try {
                    const data = await getAll(clientModel, { walletAddress: address.to_address });
                    return {
                        data: data
                    };
                } catch (balanceErr) {
                    return null;
                }
            }));

            const data = await findOne(tvtModel, { contractAddress })
            const combinedData = {
                response, data, clientData
            };
            return {
                data: combinedData,
                error: '',
                message: 'Tvt Transaction Fetched Successfully',
                status: 200
            };
        } catch (error) {
            console.error(error);
            return {
                data: null,
                error: 'Internal Server Error',
                message: '',
                status: 500
            };
        }
    }
    /**
    * Delete Tvt detail API
    */
    @Security('Bearer')
    @Delete('deleteTvt')
    public async deleteTvt(@Query('id') id: string): Promise<IResponse> {
        try {
            // Find the property detail by ID and remove it
            const updated = await upsert(tvtModel, { isTvtDeleted: true }, id)
            if (!updated) {
                return {
                    data: null,
                    error: 'Tvt detail not found',
                    message: 'Tvt detail not found',
                    status: 404,
                };
            }
            return {
                data: null,
                error: '',
                message: 'Tvt deleted successfully',
                status: 200,
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: 'Error deleting tvt detail',
                status: 400,
            };
        }
    }

    /**
         * Tvt Sell in User Marketplace api
         */
    @Security("Bearer")
    @Post("/tvttokenSellInUserMarketPlace")
    public async tvttokenSellInUserMarketPlace(
        @Body() request: { tvtId: string; quantity: String, walletAddress: string, tradePrice: string }
    ): Promise<IResponse> {
        try {
            const { tvtId, quantity, walletAddress, tradePrice } = request
            const data = await findOne(tvtModel, { _id: tvtId })
            let payload: { [k: string]: any } = {};
            if (this.userId) {
                payload.userId = this.userId;
            }
            if (data.categories) {
                payload.categories = data.categories;
            }

            if (data.series) {
                payload.series = data.series;
            }
            if (data.symbol) {
                payload.symbol = data.symbol;
            }
            if (data.description) {
                payload.description = data.description;
            }
            if (data.quantityForSellInSoloMarketPlace) {
                payload.quantityForSellInSoloMarketPlace = data.quantityForSellInSoloMarketPlace;
            }

            if (data.tradePrice) {
                payload.tradePrice = data.tradePrice;
            }
            if (data.price) {
                payload.price = data.price;
            }
            if (tradePrice) {
                payload.tradePrice = tradePrice;
            }
            if (quantity) {
                payload.quantity = quantity;
            }
            if (data.hashId) {
                payload.hashId = data.hashId;
            }
            if (data.contractAddress) {
                payload.contractAddress = data.contractAddress;
            }
            if (data.image) {
                payload.image = data.image;
            }
            if (walletAddress) {
                payload.walletAddress = walletAddress;
            }
            if (data.ipfs) {
                payload.ipfs = data.ipfs;
            }
            const result = await upsert(tvtOnUserMarketplaceModel, payload);
            return {
                data: result,
                error: '',
                message: 'Transfer Tvt to User MarketPlace Successfully',
                status: 200,
            };
        } catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400,
            };
        }

    }
    /**
         * Get Tvt Sell in User Marketplace api
         */
    @Security('Bearer')
    @Get("/getTvtTokenInUserMarketPlace")
    public async getTvtTokenInUserMarketPlace(): Promise<IResponse> {
        try {
            const getResponse = await getAll(tvtOnUserMarketplaceModel, {});
            const filteredResponse = getResponse.items.filter(entry =>
                entry.userId !== null && entry.quantity !== 0
            );
            const dataToDelete = getResponse.items.filter(entry =>
                entry.userId == this.userId && entry.quantity == 0
            );
            console.log(dataToDelete)
            for (const entryToDelete of dataToDelete) {
                const stringId: string = entryToDelete._id.toString();
                await deleteById(tvtOnUserMarketplaceModel, stringId);
            }
            return {
                data: filteredResponse,
                error: '',
                message: 'Tvt Details Fetched Successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message || err,
                message: '',
                status: 400
            };
        }
    }
}



