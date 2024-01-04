import { Route, Controller, Tags, Post, Body, Get, Security, Query, Put, FormField, UploadedFile, UploadedFiles, Delete } from 'tsoa'
import { IResponse } from '../utils/interfaces.util';
import { Request, Response, request } from 'express'
import { findOne, getById, upsert, getAll, getAggregation, deleteById } from '../helpers/db.helpers';
import fredModel from '../models/fred.model';
import fredNftModel from '../models/fredNft.model';
import transactionModel from '../models/transaction.model';
import nftDetailModel from '../models/nftDetail.model';
import userNftModel from '../models/userNft.model';
import UploadedFileToAWS from '../utils/aws.s3.utils';
import mongoose from 'mongoose';

@Tags('Fred')
@Route('api/fred')
export default class FredController extends Controller {
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
     * Create / Update Fred NFT, and Type = " flexible / fixed "
     */
    @Security("Bearer")
    @Post("/createUpdateFredNFT")
    public async createUpdateFredNFT(
        @FormField() description?: string,
        @FormField() fred_name?: string,
        @FormField() benefit_month?: string,
        @FormField() years?: string,
        @FormField() amount?: string,
        @FormField() benefit_amount?: string,
        @FormField() purchase_limit?: string,
        @FormField() start_month?: string,
        @FormField() end_year?: string,
        @FormField() type?: string,
        @FormField() fred_nft_id?: string,
        @FormField() tokenId?: string,
        @FormField() contractAddress?: string,
        @FormField() maturityDate?: string,
        @UploadedFile('nft_image') file?: Express.Multer.File
    ): Promise<IResponse> {
        try {
            let payload: { [k: string]: any } = {}
            if (fred_name) {
                payload.fred_name = fred_name ?? "";
            }
            if (description) {
                payload.description = description ?? "";
            }
            if (benefit_month) {
                payload.benefitMonth = benefit_month ?? "";
            }
            if (years) {
                payload.years = years ?? "";
            }
            if (amount) {
                payload.amount = amount ?? "";
            }
            if (benefit_amount) {
                payload.benefitAmount = benefit_amount ?? "";
            }
            if (purchase_limit) {
                payload.purchaseLimit = purchase_limit ?? "";
            }
            if (start_month) {
                payload.startMonth = start_month ?? "";
            }
            if (end_year) {
                payload.endYear = end_year ?? "";
            }
            if (tokenId) {
                payload.tokenId = tokenId ?? "";
            }
            if (contractAddress) {
                payload.contractAddress = contractAddress ?? "";
            }
            if (maturityDate) {
                payload.maturityDate = maturityDate ?? "";
            }
            if (type) {
                payload.type = type ?? "";
            }
            if (file) {
                payload.nftImage = await UploadedFileToAWS(file?.originalname, file?.buffer, file?.mimetype.includes('image/png') ? "image/png" : "image/jpeg")
            }
            let result;
            if (fred_nft_id) {
                result = await upsert(fredNftModel, payload, fred_nft_id);
            } else {
                result = await upsert(fredNftModel, payload);
            }
            return {
                data: result,
                error: '',
                message: fred_nft_id ? "Fred NFT Updated!!" : "Fred NFT Created!!",
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
    * Normal NFT transfer to user
    */
    @Security("Bearer")
    @Post("/nftTransfer")
    public async nftTransfer(
        @Body() request: { receiverId?: string, hashId?: string, nftDetailId?: string, amount?: string, type?: string, signerAddress: string }
    ): Promise<IResponse> {
        try {

            const { receiverId, hashId, nftDetailId, amount, type, signerAddress } = request;
            if (type === "fred") {
                await upsert(fredNftModel, { isPaid: true, userId: this.userId, status: 'APPROVED', signerAddress }, nftDetailId);
            } else {
                await upsert(nftDetailModel, { isPaid: true, userId: this.userId, price: amount, status: 'APPROVED', signerAddress }, nftDetailId);
            }
            let result = await upsert(transactionModel, {
                // senderId: nftdetail?.userId || null,
                receiverId: this.userId || null,
                hashId,
                amount,
                nftDetailId,
                transactionType: "nftTransfer",
                status: "APPROVED"
            });
            let userNft = await upsert(userNftModel, {
                userId: this.userId,
                nftDetailId: type != "fred" ? nftDetailId : null,
                fredNftId: type == "fred" ? nftDetailId : null,
                amount: amount,
                hashId: hashId,
                type: 'fred',
                isLocked: false,
            })
            return {
                data: result,
                error: '',
                message: "",
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
      *List with Pagination Fred NFT
    */
    @Security("Bearer")
    @Get("/listFredNFT")
    public async listFredNFT(
        @Query('page_number') page_number: number,
        @Query('page_limit') page_limit: number,
        @Query('filter') filter: string,
        @Query("sort") sort?: '0' | '1'
    ): Promise<IResponse> {
        try {
            // Ensure that page_limit is parsed as a number
            page_limit = Number(page_limit);
            let query: any = { status: 'PENDING' };
            if (filter) {
                query.$or = [
                    { fred_name: { $regex: filter, $options: 'i' } },
                    { type: { $regex: filter, $options: 'i' } }
                ];
            }
            let result = await getAll(fredNftModel, query, page_number, page_limit, [], [], false, true);

            if (sort === '0' || sort === '1') {
                const sortOrder = sort === '0' ? 1 : -1;
                result.items.sort((a: any, b: any) => {
                    return sortOrder * (a.amount - b.amount);
                });
            }

            return {
                data: result,
                error: '',
                message: "Fred NFTs",
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
     * Delete Fred NFT
     */
    @Security("Bearer")
    @Delete("/deleteFredNFT")
    public async deleteFredNFT(@Query() id: string): Promise<IResponse> {
        try {

            const deleted = await deleteById(fredNftModel, id);
            return {
                data: deleted,
                error: '',
                message: "Fred NFT Deleted",
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
    * Purchase nft and fred from user 
    */
    @Security("Bearer")
    @Post("/purchaseNftAndFredFromUser")
    public async purchaseNftAndFredFromUser(
        @Body() request: { receiverId?: string, hashId?: string, nftDetailId?: string, amount?: string, type?: string }
    ): Promise<IResponse> {
        try {

            const { receiverId, hashId, nftDetailId, amount, type } = request;
            let nftdetail;
            if (type === "fred") {
                nftdetail = await fredNftModel.findOne({ _id: mongoose.Types.ObjectId(nftDetailId) });
                await upsert(fredNftModel, { isPaid: true, userId: this.userId, status: 'APPROVED' }, nftDetailId);
            } else {
                nftdetail = await nftDetailModel.findOne({ _id: mongoose.Types.ObjectId(nftDetailId) });
                await upsert(nftDetailModel, { isPaid: true, userId: this.userId, price: amount, status: 'APPROVED' }, nftDetailId);
            }

            let result = await upsert(transactionModel, {
                senderId: nftdetail?.userId || null,
                receiverId: this.userId || null,
                hashId,
                amount,
                nftDetailId,
                transactionType: "nftTransfer",
                status: "APPROVED"
            });

            let userNft = await upsert(userNftModel, {
                userId: this.userId,
                nftDetailId: type != "fred" ? nftDetailId : null,
                fredNftId: type == "fred" ? nftDetailId : null,
                amount: amount,
                hashId: hashId,
                type: 'fred',
                isLocked: false,
            })

            return {
                data: result,
                error: '',
                message: "",
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
    @Security("Bearer")
    @Put("/airdropFredNft")
    public async airdropFredNft(
        @Body() request: {
            FredId: string,
            userId: string,
            contractAddress: string,
        }
    ): Promise<IResponse> {
        try {

            const { FredId, userId, contractAddress } = request
            const res = await fredNftModel.findOne({ _id: mongoose.Types.ObjectId(FredId) });
            res.userId = userId;
            res.contractAddress = contractAddress
            await res.save();

            return {
                data: res,
                error: '',
                message: 'Fred Transfer Successfully',
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
    @Security("Bearer")
    @Put("/airdropNft")
    public async airdropNft(
        @Body() request: {
            NftId: string,
            userId: string,
            contractAddress: string
        }
    ): Promise<IResponse> {
        try {

            const { NftId, userId, contractAddress } = request
            const res = await nftDetailModel.findOne({ _id: mongoose.Types.ObjectId(NftId) });
            res.userId = userId;
            res.contractAddress = contractAddress;
            await res.save();

            return {
                data: res,
                error: '',
                message: 'Nft Transfer Successfully',
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

}

