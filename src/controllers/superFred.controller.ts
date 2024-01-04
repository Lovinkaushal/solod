import { Route, Controller, Tags, Post, Body, Get, Security, Query, Put, FormField, UploadedFile, UploadedFiles, Delete } from 'tsoa'
import { IResponse } from '../utils/interfaces.util';
import { Request, Response, request } from 'express'
import { findOne, getById, upsert, getAll, getAggregation, deleteById } from '../helpers/db.helpers';
import UploadedFileToAWS from '../utils/aws.s3.utils';
import mongoose from 'mongoose';
import superFredModel from '../models/superFred.model';
import logger from '../configs/logger.config';
const contratAbi = require("../Abi/superFred.json")
const { object } = require("../bytecode/superFREDByteCode.json")
// import { ethers, providers } from 'ethers';

import { ethers, ContractFactory } from 'ethers';
import { any } from '@hapi/joi';
import adminModel from '../models/admin.model';

@Tags('superFreds')
@Route('api/superFred')
export default class superFredController extends Controller {
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
     * Create Super Fred Nft
     */
    @Security("Bearer")
    @Post("/createSuperFred")
    public async createSuperFred(
        @FormField() type?: string,
        @FormField() series?: string,
        @FormField() description?: string,
        @FormField() price?: string,
        @FormField() limit?: string,
        @FormField() quantity?: string,
        @FormField() rewardDistribution?: string,
        @FormField() rewardSR?: string,
        @FormField() dateOfMaturity?: string,
        @FormField() maturityAmount?: string,
        @FormField() ipfs?: string,
        @UploadedFile('image') file?: Express.Multer.File
    ): Promise<IResponse> {
        try {
            let payload: { [k: string]: any } = {};
            if (description) {
                payload.description = description;
            }
            if (type) {
                payload.type = type;
            }

            if (series) {
                payload.series = series;
            }

            if (description) {
                payload.description = description;
            }
            if (price) {
                payload.price = price;
            }

            if (limit) {
                payload.limit = limit;
            }
            if (quantity) {
                payload.quantity = quantity;
            }
            if (rewardDistribution) {
                payload.rewardDistribution = rewardDistribution;
            }
            if (rewardSR) {
                payload.rewardSR = rewardSR;
            }
            if (dateOfMaturity) {
                payload.dateOfMaturity = dateOfMaturity;
            }
            if (maturityAmount) {
                payload.maturityAmount = maturityAmount;
            }
            if (ipfs) {
                payload.ipfs = ipfs;
            }
            if (file) {
                payload.image = await UploadedFileToAWS(
                    file.originalname,
                    file.buffer,
                    file.mimetype.includes('image/png') ? 'image/png' : 'image/jpeg'
                );
            }
            const result = await upsert(superFredModel, payload);
            const result2 = await upsert(superFredModel, { nftId: result._id }, result._id);
            return {
                data: result2,
                error: '',
                message: 'Super Fred is created',
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
       *Get TVT Details
       */
    @Security('Bearer')
    @Get("/superFredData")
    public async superFredData(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number): Promise<IResponse> {
        try {

            const data = await getAll(superFredModel, {}, +pageNumber, +pageSize);
            return {
                data: data || {},
                error: '',
                message: 'Super Fred Details Fetched Successfully',
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
    /*
* Get Super Fred Details
*/
    @Security('Bearer')
    @Get("/superFredDataOfSoloMarketPlace")
    public async superFredDataOfSoloMarketPlace(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
        @Query('sort') sort?: '0' | '1',
        @Query('filter') filter?: string
    ): Promise<IResponse> {
        try {
            let query: any = {};
            if (filter) {
                query = {
                    $or: [
                        { series: { $regex: filter, $options: 'i' } }
                    ]
                };
            }

            const result = await getAll(superFredModel, query, +pageNumber, +pageSize);
            const data = result.items;
            const filteredData = data.filter((item: any) => item.userId === null);

            if (sort === '0' || sort === '1') {
                const sortOrder = sort === '0' ? 1 : -1;
                filteredData.sort((a: any, b: any) => {
                    return sortOrder * (a.price - b.price);
                });
            }

            return {
                data: filteredData,
                error: '',
                message: 'Super Fred Details Fetched Successfully',
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
 * Buy Super Red
 */
    @Security("Bearer")
    @Post("/buySuperFred")
    public async buySuperFred(
        @Body() request: {
            id: string,
            price: string,
            quantity: string,
            walletAddress: string,
        }
    ): Promise<IResponse> {
        try {
            const {
                id,
                price,
                quantity,
                walletAddress,
            } = request;
            if (!id || !quantity || !price) {
                throw new Error('Missing required parameters: id, quantity, price');
            }
            const nftDetails = await getById(superFredModel, id);
            const dateOfMaturity = nftDetails.dateOfMaturity
            const ipfs = nftDetails.ipfs
            const type = nftDetails.type
            const series = nftDetails.series
            const userNFT = await findOne(superFredModel, { userId: this.userId, type: type, status: 'APPROVED',series:series });
            if (userNFT) {
                if (userNFT.quantity > nftDetails.limit) {
                    throw new Error("You have already reached the maximum limit for purchasing this NFT");
                }
            }
            if (userNFT) {
                const quantity2 = userNFT.quantity + +quantity;
                if (quantity2 > nftDetails.limit) {
                    throw new Error("Please decrease your NFT purchase quantity");
                }
            }
            if (quantity > nftDetails.limit) {
                throw new Error("Please decrease your NFT purchase quantity");
            }
            const payload: { [k: string]: any } = {
                userId: this.userId,
                status: 'APPROVED',
                type: nftDetails.type,
                series: nftDetails.series,
                description: nftDetails.description,
                price,
                limit: nftDetails.limit,
                quantity,
                rewardDistribution: nftDetails.rewardDistribution,
                rewardSR: nftDetails.rewardSR,
                dateOfMaturity: nftDetails.dateOfMaturity,
                maturityAmount: nftDetails.maturityAmount,
                walletAddress,
                image: nftDetails.image,
                nftId: id,
                ipfs: nftDetails.ipfs
            };
            let response: string;
            const dateObject = new Date(dateOfMaturity);
            const year = dateObject.getFullYear();
            const month = dateObject.getMonth() + 1;
            if (userNFT) {
                const updatedUserQuantity = userNFT.quantity + parseInt(quantity, 10);
                const privateKey = process.env.PRIVATE_KEY || ' ';
               // const provider = new ethers.JsonRpcProvider('https://polygon-mumbai.g.alchemy.com/v2/si6rJZXVSBxX17y81FXMsg7UdAt6NUQl');
                const provider = new ethers.providers.JsonRpcProvider(
                    'https://polygon-mainnet.g.alchemy.com/v2/rvmpmREwuUjwDRUj3SBmkP6EDR0rSlVo',
                )
                const wallet = new ethers.Wallet(privateKey, provider);
                const signer = wallet.connect(provider);
                const factory = new ContractFactory(contratAbi, object, signer);
                const contract = await factory.deploy("superFred", "SFRED", ipfs, quantity, month, year, price, walletAddress);
                console.log(contract,"---------------------------------------1")
                const finalDeploy = await contract.deployTransaction;
                const myContractDeployedAddress = await contract.address;
                const updatedQuantity = nftDetails.quantity - parseInt(quantity, 10)
                console.log(updatedQuantity);

                const res = await upsert(superFredModel, { quantity: updatedQuantity }, id);
                console.log(res)
                const result = await upsert(superFredModel, { quantity: updatedUserQuantity, price }, userNFT._id);
                response = await upsert(superFredModel, { hashId: finalDeploy.hash, contractAddress: myContractDeployedAddress }, userNFT._id);
            } else {
                const privateKey = process.env.PRIVATE_KEY || ' ';
                //const provider = new ethers.JsonRpcProvider('https://polygon-mumbai.g.alchemy.com/v2/si6rJZXVSBxX17y81FXMsg7UdAt6NUQl');
                const provider = new ethers.providers.JsonRpcProvider(
                    'https://polygon-mainnet.g.alchemy.com/v2/rvmpmREwuUjwDRUj3SBmkP6EDR0rSlVo',
                )
                const wallet = new ethers.Wallet(privateKey, provider);
                const signer = wallet.connect(provider);
                const factory = new ContractFactory(contratAbi, object, signer);
                const contract = await factory.deploy("superFred", "SFRED", ipfs, quantity, month, year, price, walletAddress,{gasLimit:7000000});
                console.log(contract,"---------------------------------------2")
                const finalDeploy = await contract.deployTransaction;
                const myContractDeployedAddress = await contract.address;
                const updatedQuantity = nftDetails.quantity - parseInt(quantity, 10)
                console.log(updatedQuantity);
                const res = await upsert(superFredModel, { quantity: updatedQuantity }, id);
                const data = await upsert(superFredModel, payload);
                response = await upsert(superFredModel, { hashId: finalDeploy.hash, contractAddress: myContractDeployedAddress }, data._id);
            }
            return {
                data: response,
                error: '',
                message: 'Super Fred Purchase Successfully',
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
    @Get("/getUserSuperRed")
    public async getUserSuperRed(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
        @Query('filter') filter?: string
    ): Promise<IResponse> {
        try {
            let query: any = { userId: this.userId };
            query.status = 'APPROVED';
            if (filter) {
                query = {
                    $and: [
                        { userId: this.userId },
                        { series: { $regex: filter, $options: 'i' } }
                    ]
                };
            }
            const getResponse = await getAll(superFredModel, query, +pageNumber, +pageSize);
            const dataToDelete = getResponse.items.filter(entry =>
                entry.userId == this.userId && entry.quantity == 0
            );
            console.log(dataToDelete)
            for (const entryToDelete of dataToDelete) {
                const stringId: string = entryToDelete._id.toString();
                await deleteById(superFredModel, stringId);
            }
            const filteredResponse = getResponse.items.filter(entry =>
                entry.userId !== null && entry.quantity !== 0
            );
            return {
                data: filteredResponse,
                error: '',
                message: 'Super Fred Details Fetched Successfully',
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
       * AirDrop superfred
       */
    @Security("Bearer")
    @Post("/airdropSfred")
    public async airdropSfred(
        @Body() request: {
            sId: string,
            userId: string,
            quantity?: string,
        }
    ): Promise<IResponse> {
        try {
            let { sId, userId, quantity } = request;
            const getResponse = await getById(superFredModel, sId);
            if (sId === undefined || quantity === undefined) {
                throw new Error('Missing required parameters.');
            }

            let payload: { [k: string]: any } = {
                userId: userId,
                status: 'APPROVED',
            };

            if (getResponse.type) {
                payload.type = getResponse.type;
            }
            if (getResponse.series) {
                payload.series = getResponse.series;
            }
            if (getResponse.description) {
                payload.description = getResponse.description;
            }
            if (getResponse.price) {
                payload.price = getResponse.price;
            }
            if (getResponse.limit) {
                payload.limit = getResponse.limit;
            }
            if (getResponse.quantity) {
                payload.quantity = getResponse.quantity;
            }
            if (getResponse.rewardDistribution) {
                payload.rewardDistribution = getResponse.rewardDistribution;
            }
            if (getResponse.rewardSR) {
                payload.rewardSR = getResponse.rewardSR;
            }
            if (getResponse.dateOfMaturity) {
                payload.dateOfMaturity = getResponse.dateOfMaturity;
            }
            if (getResponse.maturityAmount) {
                payload.maturityAmount = getResponse.maturityAmount;
            }
            if (getResponse.walletAddress) {
                payload.walletAddress = getResponse.walletAddress;
            }
            if (getResponse.hashId) {
                payload.hashId = getResponse.hashId;
            }
            if (getResponse.image) {
                payload.image = getResponse.image;
            }
            if (getResponse.ipfs) {
                payload.ipfs = getResponse.ipfs;
            }
            if (getResponse.contractAddress) {
                payload.contractAddress = getResponse.contractAddress;
            }
            let result: string;
            const data = await findOne(superFredModel, { userId: userId, type: getResponse.type });
            if (data) {
                const getResponse = await getById(superFredModel, sId);
                const updatedQuantity = getResponse.quantity - +parseInt(quantity);
                if (updatedQuantity < 0) {
                    throw new Error('Invalid quantity calculation.');
                }
                const getResponse2 = await upsert(superFredModel, { quantity: updatedQuantity }, sId);
                const updatedQuantity2 = data.quantity + +quantity
                result = await upsert(superFredModel, { quantity: updatedQuantity2 }, data._id);
            } else {
                const getResponse = await getById(superFredModel, sId);
                const updatedQuantity = getResponse.quantity - +parseInt(quantity);
                if (updatedQuantity < 0) {
                    throw new Error('Invalid quantity calculation.');
                }
                const getResponse2 = await upsert(superFredModel, { quantity: updatedQuantity }, sId);
                result = await upsert(superFredModel, payload);
            }

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
    /**
        * Create Super Fred Nft
        */
    @Security("Bearer")
    @Post("/SFredSellinMarketPlace")
    public async SFredSellinMarketPlace(
        @Body() request: { superFredId: string; price: string; quantity: String, walletAddress: String }
    ): Promise<IResponse> {
        try {
            const { superFredId, price, quantity, walletAddress } = request
            const data = await findOne(superFredModel, { _id: superFredId })
            if (data) {
                if (quantity > data.quantity) {
                    throw new Error("Insufficient NFTs: You don't have enough NFTs to complete this operation.");
                }
            }
            let payload: { [k: string]: any } = {};
            if (data.userId) {
                payload.userId = data.userId;
            }
            if (data.type) {
                payload.type = data.type;
            }

            if (data.series) {
                payload.series = data.series;
            }
            if (data.nftId) {
                payload.nftId = data.nftId;
            }

            if (data.description) {
                payload.description = data.description;
            }
            if (price) {
                payload.price = price;
            }
            if (quantity) {
                payload.quantity = quantity;
            }
            if (data.quantity) {
                payload.limit = data.quantity;
            }
            if (data.rewardDistribution) {
                payload.rewardDistribution = data.rewardDistribution;
            }
            if (data.rewardSR) {
                payload.rewardSR = data.rewardSR;
            }
            if (data.dateOfMaturity) {
                payload.dateOfMaturity = data.dateOfMaturity;
            }
            if (data.maturityAmount) {
                payload.maturityAmount = data.maturityAmount;
            }
            if (data.ipfs) {
                payload.ipfs = data.ipfs;
            }
            if (data.contractAddress) {
                payload.contractAddress = data.contractAddress;
            }
            if (walletAddress) {
                payload.walletAddress = walletAddress;
            }
            if (data.image) {
                payload.image = data.image
            }
            let result2;
            const updatedQuantity = data.quantity - parseInt(quantity.toString());
            const result1 = await upsert(superFredModel, { quantity: updatedQuantity }, data._id);
            const userNFT = await findOne(superFredModel, { userId: this.userId, type: data.type, status: 'DECLINED' });
            if (userNFT) {
                const updatedQuantity2 = userNFT.quantity + parseInt(quantity.toString());
                result2 = await upsert(superFredModel, { quantity: updatedQuantity2 }, userNFT._id);
            } else {
                const result = await upsert(superFredModel, payload);
                result2 = await upsert(superFredModel, { status: 'DECLINED' }, result._id);
            }
            return {
                data: result2,
                error: '',
                message: 'transfer Super Fred successfully',
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
    @Get("/getSFredInMarketPlace")
    public async getSFredInMarketPlace(
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

            const getResponse = await getAll(superFredModel, query, +pageNumber, +pageSize);
            const filteredResponse = getResponse.items.filter(entry =>
                entry.userId !== null && entry.quantity !== 0
            );

            const dataToDelete = getResponse.items.filter(entry =>
                entry.userId == this.userId && entry.quantity == 0
            );
            console.log(dataToDelete)
            for (const entryToDelete of dataToDelete) {
                const stringId: string = entryToDelete._id.toString();
                await deleteById(superFredModel, stringId);
            }

            return {
                data: filteredResponse,
                error: '',
                message: 'Super Fred Details Fetched Successfully',
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

