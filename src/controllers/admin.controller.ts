import { Route, Controller, Tags, Post, Body, Get, Security, Query, Put, FormField, UploadedFile, UploadedFiles, Delete } from 'tsoa'
import { IResponse } from '../utils/interfaces.util';
import { Request, Response } from 'express'
import { findOne, getById, upsert, getAll, getAggregation, deleteById, findAll } from '../helpers/db.helpers';
import { verifyHash, signToken, genHash } from '../utils/common.util';
import { validateChangePassword, validateAgreementDetails, validateResetPassword, validateAdmin, validatePropertyDetails, validateConversionRate, validateBookingPercentage, validateNftDetails, validateNftCategory, validateFredCategory, validateadminConversionRateForLoan, validateFredExchangeRedTokenPercentage, validateConversionRateForSoloReward, validateSfredCategory, validatesellpercentage, validateAdminPassword, validateAdminRegister } from '../validations/admin.validator';
import adminModel from '../models/admin.model';
import { validateForgotPassword, validateRedTokenSchema, validateSrTokenSchema } from '../validations/user.validator';
import logger from '../configs/logger.config';
import { sendEmail } from '../configs/nodemailer';
import { generateRandomOtp, readHTMLFile } from '../services/utils';
import path from 'path';
import handlebar, { parse } from 'handlebars'
import otpModel from '../models/otp.model';
import propertyDetailsModel from '../models/propertyDetailsModel';
import { notificationsModels } from "../models/notifications.model";
import leasePropertyModel from '../models/leasePropertyDetail.Model';
import redTokenTransactionModel from '../models/redTokenTransaction.model';
import clientModel from '../models/client.model';
import tokenModel from '../models/token.model';
import aminitiesModel from '../models/aminities.model';
import agreementModel from '../models/agreement.model';
import { sendNotificationToUser } from '../configs/notification.config';
import nftDetailModel from '../models/nftDetail.model';
import nftcategoriesModel from '../models/nftcategories.model';
import sfredcategoriesModel from "../models/sfredcatefories.model"
import fredModel from '../models/fred.model';
import mongoose from 'mongoose';
import UploadedFileToAWS from '../utils/aws.s3.utils';
import fredNftModel from '../models/fredNft.model';
import srTokenModel from '../models/srToken.model';
import redTokenModel from '../models/redToken.model';
import superFredModel from '../models/superFred.model';
import tvtModel from '../models/tvt.model';
@Tags('Admin')
@Route('api/admin')
export default class AdminController extends Controller {
    req: Request;
    res: Response;
    userId: string
    constructor(req: Request, res: Response) {
        super();
        this.req = req;
        this.res = res;
        this.userId = req.body.user ? req.body.user.id : ''
    }

    /**
     * Get user login
     */
    @Post("/login")
    public async login(@Body() request: { email: string, password: string }): Promise<IResponse> {
        try {
            const { email, password } = request;
            const validatedUser = validateAdmin({ email, password });
            if (validatedUser.error) {
                throw new Error(validatedUser.error.message)
            }
            const exists = await findOne(adminModel, { email });
            if (!exists) {
                throw new Error('Admin doesn\'t exists!');
            }
            // check if blocked
            if (exists.isBlocked) {
                throw new Error('Admin is not approved yet!');
            }
            const isValid = await verifyHash(password, exists.password);
            if (!isValid) {
                throw new Error('Password seems to be incorrect');
            }
            const token = await signToken(exists._id, { access: 'admin' })
            delete exists.password
            return {
                data: { ...exists, token },
                error: '',
                message: 'Login Success',
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
    * Forgot password api endpoint
    */
    @Post("/forgotPassword")
    public async forgotPassword(@Body() request: { email: string, url: string }): Promise<IResponse> {
        try {
            const { email, url } = request;
            const validatedForgotPassword = validateForgotPassword({ email });
            if (validatedForgotPassword.error) {
                throw new Error(validatedForgotPassword.error.message)
            }
            // check if user exists
            const exists = await findOne(adminModel, { email });
            if (!exists) {
                throw new Error('Invalid User')
            }
            const token = await signToken(exists._id, { access: 'admin', purpose: 'reset' }, '1h')
            //send a mail with otp 
            const html = await readHTMLFile(path.join(__dirname, '../', '../', 'src', 'template', 'reset-password.html'))
            const template = handlebar.compile(html)
            await sendEmail(process.env.EMAIL_NOTIFICATION_ADDRESS, 'Reset Your Password', email, template({ link: `${url}/reset-password?resetId=${token}` }))
            return {
                data: {},
                error: '',
                message: 'Password reset OTP successfully sent to ' + exists.email,
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
    * Forgot password api endpoint
    */
    @Security('Bearer')
    @Post("/resetPassword")
    public async resetPassword(@Body() request: { password: string }): Promise<IResponse> {
        try {
            const { password } = request;
            const validatedResetPassword = validateChangePassword({ password });
            if (validatedResetPassword.error) {
                throw new Error(validatedResetPassword.error.message)
            }
            const hashed = await genHash(password)
            const updated = await upsert(adminModel, { password: hashed }, this.userId)

            //token invalidated
            let authHeader = this.req.headers.authorization;
            await upsert(tokenModel, { token: authHeader });

            return {
                data: {},
                error: '',
                message: 'Password reset successfully!',
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
     * Create Aminities
     */
    @Security('Bearer')
    @Post("/createAminities")
    public async createAminities(
        @FormField() iconName: string,
        @UploadedFile('iconImage') iconImage: Express.Multer.File): Promise<IResponse> {
        try {
            let fileImage;
            if (iconImage) {
                fileImage = await UploadedFileToAWS(iconImage?.originalname, iconImage?.buffer, iconImage?.mimetype.includes('image/png') ? "image/png" : "image/jpeg");
            }
            let response = await upsert(aminitiesModel, {
                iconName: iconName,
                iconImage: fileImage
            });
            return {
                data: { response },
                error: '',
                message: 'Aminity Created',
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
     * Delete aminities detail API
     */
    @Security('Bearer')
    @Delete('/deleteAminitiesDetail')
    public async deleteAminitiesDetail(@Query('id') id: string): Promise<IResponse> {
        try {
            // Find the property detail by ID and remove it
            const response = await deleteById(aminitiesModel, id)
            if (!response) {
                return {
                    data: null,
                    error: 'Aminities detail not found',
                    message: 'Aminities detail not found',
                    status: 404,
                };
            }
            return {
                data: null,
                error: '',
                message: 'Aminitie details deleted successfully',
                status: 200,
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: 'Error deleting Aminitie details',
                status: 400,
            };
        }
    }
    /**
   * Get Aminities
   */
    @Security('Bearer')
    @Get("/GetAminities")
    public async GetAminities(@Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
        @Query('filter') filter: string): Promise<IResponse> {
        try {
            let payload: any = {};
            if (filter) {
                payload = {
                    $or: [
                        {
                            iconName: {
                                $regex: filter,
                                $options: 'i'
                            }
                        }
                    ]
                };
            }
            const data = await getAll(aminitiesModel, payload, +pageNumber, +pageSize);
            return {
                data: data || {},
                error: '',
                message: 'Aminity Fetched Succesfully',
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
* create property
*/
    @Security('Bearer')
    @Post("/createProperty")
    public async createProperty(
        @FormField('propertyId') propertyId?: string,
        @FormField('propertyName') propertyName?: string,
        @FormField('location') location?: string,
        @FormField('description') description?: string,
        @FormField('area') area?: number,
        @FormField('propertyType') propertyType?: string,
        @FormField('interestPerAnnum') interestPerAnnum?: number,
        @FormField('price') price?: number,
        @FormField('dueDate') dueDate?: string,
        @FormField('MonthlyFees') MonthlyFees?: number,
        @FormField() aminities?: Array<{
            id: string,
            value: string,
            label: string,
            image: string,
        }>,
        @UploadedFile('imageURL') imageFile?: Express.Multer.File,
        @UploadedFile('propertyDocument') propertyDocumentFile?: Express.Multer.File
    ): Promise<IResponse> {
        try {
            let aminity: any[] = [];
            if (aminities && typeof aminities === 'string') {
                aminity = JSON.parse(aminities);
            }

            const validatedProperty = validatePropertyDetails({
                propertyName,
                location,
                description,
                area,
                propertyType,
                interestPerAnnum,
                price,
                dueDate,
                MonthlyFees,
                aminities: aminity,
                imageURL: imageFile?.filename,
                propertyDocument: propertyDocumentFile?.filename
            });

            if (validatedProperty.error) {
                throw new Error(validatedProperty.error.message);
            }

            const adminData = await findOne(adminModel, { _id: this.userId });
            const conversionrate = adminData.conversionRate;
            const redToken = price !== undefined ? price * conversionrate : 0;

            const payload: any = {
                propertyName: propertyName ?? "",
                location: location ?? "",
                description: description ?? "",
                propertyDetails: {
                    area: area ?? 0,
                    propertyType: propertyType ?? "",
                    interestPerAnnum: interestPerAnnum ?? 0,
                    price: price ?? 0,
                    dueDate: dueDate ?? "",
                    MonthlyFees: MonthlyFees ?? 0,
                },
                aminities: aminity ?? "",
            };

            const fileImage = imageFile
                ? await UploadedFileToAWS(imageFile.originalname, imageFile.buffer, imageFile.mimetype.includes('image/png') ? "image/png" : "image/jpeg")
                : undefined;

            const documentFile = propertyDocumentFile
                ? await UploadedFileToAWS(propertyDocumentFile.originalname, propertyDocumentFile.buffer, propertyDocumentFile.mimetype.includes('application/pdf') ? "application/pdf" : "application/pdf")
                : undefined;

            if (fileImage) {
                payload.imageURL = fileImage;
            }
            if (documentFile) {
                payload.propertyDocument = documentFile;
            }

            const saveResponse = propertyId
                ? await upsert(propertyDetailsModel, payload, propertyId)
                : await upsert(propertyDetailsModel, payload);

            const response = await findOne(adminModel, { _id: this.userId });
            const currentRedTokens = +response.totalRedToken;
            const totalRedTokens = redToken + currentRedTokens;

            await upsert(adminModel, { totalRedToken: totalRedTokens }, this.userId);

            const notifictions = await upsert(notificationsModels, {
                notifications: "Property created....",
                view: true,
                type: "admin",
                propertyCreateId: saveResponse._id,
                message: "Property created..."
            });

            if (!saveResponse || !notifictions) {
                throw new Error("Error");
            }

            return {
                data: { ...saveResponse.toObject(), ...notifictions.toObject() },
                error: "",
                message: "Property created successfully",
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message || err,
                message: "",
                status: 400
            };
        }
    }
    /**
   * create Agreement
   */
    @Security('Bearer')
    @Post("/createAgreement")
    public async createAgreement(
        @FormField() propertyId: string,
        @FormField() userId: string,
        @FormField() leaseRequestId: string,
        @FormField() propertyName: string,
        @FormField() propertyType: string,
        @FormField() streetAddress: string,
        @FormField() city: string,
        @FormField() state: string,
        @FormField() country: string,
        @FormField() apn: string,
        @FormField() typeOfPropertyOwnership: string,
        @FormField() tract: string,
        @FormField() landValue: string,
        @FormField() improvements: string,
        @FormField() totalValue: string,
        @FormField() monthlyLeaseFee: string,
        @FormField() leaseTerm: string,
        @FormField() leaseStartDate: string,
        @FormField() leaseExpirationDate: string,
        @FormField() unit?: string,
        @UploadedFile('trustDeed') trustDeed?: Express.Multer.File,
        @UploadedFile('appraisalReports') appraisalReports?: Express.Multer.File,
        @UploadedFile('titlePolicy') titlePolicy?: Express.Multer.File,
        @UploadedFile('anyEncumbrances') anyEncumbrances?: Express.Multer.File,
        @UploadedFiles('pictures') pictures?: Express.Multer.File[],
        @UploadedFiles('videos') videos?: Express.Multer.File[],
        @UploadedFiles('images_3d') images_3d?: Express.Multer.File[],
        @UploadedFiles('floorPlans') floorPlans?: Express.Multer.File[]): Promise<IResponse> {
        try {
            const validatedProperty = validateAgreementDetails({
                propertyId,
                userId,
                leaseRequestId,
                propertyName,
                propertyType,
                streetAddress,
                city,
                state,
                country,
                apn,
                typeOfPropertyOwnership,
                tract,
                landValue,
                improvements,
                totalValue,
                monthlyLeaseFee,
                leaseTerm,
                leaseStartDate,
                leaseExpirationDate,
                unit,
            });
            if (validatedProperty.error) {
                throw new Error(validatedProperty.error.message)
            }
            const trustDeedDocs = trustDeed
                ? await UploadedFileToAWS(trustDeed.originalname, trustDeed.buffer, trustDeed.mimetype.includes('application/pdf') ? "application/pdf" : "application/pdf")
                : undefined;

            const appraisalDocs = appraisalReports
                ? await UploadedFileToAWS(appraisalReports.originalname, appraisalReports.buffer, appraisalReports.mimetype.includes('application/pdf') ? "application/pdf" : "application/pdf")
                : undefined;
            const titlePolicyDocs = titlePolicy
                ? await UploadedFileToAWS(titlePolicy.originalname, titlePolicy.buffer, titlePolicy.mimetype.includes('application/pdf') ? "application/pdf" : "application/pdf")
                : undefined;

            const anyEncumbrancesDocs = anyEncumbrances
                ? await UploadedFileToAWS(anyEncumbrances.originalname, anyEncumbrances.buffer, anyEncumbrances.mimetype.includes('application/pdf') ? "application/pdf" : "application/pdf")
                : undefined;

            const pictureUrls = pictures
                ? await Promise.all(
                    pictures.map(async (file) => {
                        const filename = file.originalname;
                        const buffer = file.buffer;
                        const mimeType = file.mimetype;

                        return await UploadedFileToAWS(
                            filename,
                            buffer,
                            mimeType.includes('image/png') ? 'image/png' : 'image/jpeg'
                        );
                    })
                )
                : [];
            const videoUrls = videos
                ? await Promise.all(
                    videos.map(async (file) => {
                        const filename = file.originalname;
                        const buffer = file.buffer;
                        const mimeType = file.mimetype;

                        return await UploadedFileToAWS(
                            filename,
                            buffer,
                            mimeType.includes('video/mp4') ? 'video/mp4' : 'video/mp4'
                        );
                    })
                )
                : [];

            const images3dUrls = images_3d
                ? await Promise.all(
                    images_3d.map(async (file) => {
                        const filename = file.originalname;
                        const buffer = file.buffer;
                        const mimeType = file.mimetype;

                        return await UploadedFileToAWS(
                            filename,
                            buffer,
                            mimeType.includes('image/png') ? 'image/png' : 'image/jpeg'
                        );
                    })
                )
                : [];
            const floorPlanUrls = floorPlans
                ? await Promise.all(
                    floorPlans.map(async (file) => {
                        const filename = file.originalname;
                        const buffer = file.buffer;
                        const mimeType = file.mimetype;

                        return await UploadedFileToAWS(
                            filename,
                            buffer,
                            mimeType.includes('image/png') ? 'image/png' : 'image/jpeg'
                        );
                    })
                )
                : [];
            let saveResponse = await upsert(agreementModel, {
                propertyId,
                userId,
                leaseRequestId,
                propertyName,
                propertyType,
                streetAddress,
                city,
                state,
                country,
                apn,
                typeOfPropertyOwnership,
                tract,
                landValue,
                improvements,
                totalValue,
                monthlyLeaseFee,
                leaseTerm,
                leaseStartDate,
                leaseExpirationDate,
                unit,
                legalAttachments: {
                    trustDeed: trustDeedDocs,
                    appraisalReports: appraisalDocs,
                    titlePolicy: titlePolicyDocs,
                    anyEncumbrances: anyEncumbrancesDocs
                },
                displayAttachments: {
                    pictures: pictureUrls,
                    videos: videoUrls,
                    images_3d: images3dUrls
                },
                floorPlans: floorPlanUrls
            });
            //send notification
            await sendNotificationToUser(userId, propertyId, "Property Registered", "Hello your property is registered");
            return {
                data: { ...saveResponse.toObject() },
                error: '',
                message: 'property created successfully ',
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
    * Get Lease Property Data
    */
    @Security('Bearer')
    @Get("/getLeasePropertyData")
    public async getLeasePropertyData(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number, @Query('filter') filter: string): Promise<IResponse> {
        try {
            //   check for a valid id
            let payload: any = {};
            if (filter) {
                payload = {
                    $or: [
                        {
                            propertyName: {
                                $regex: filter,
                                $options: 'i'
                            }
                        }
                    ]
                };
            }
            const getLeasePropertyData = await getAll(leasePropertyModel, payload, +pageNumber, +pageSize);
            return {
                data: getLeasePropertyData,
                error: '',
                message: 'Property Lease Request info fetched Successfully',
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

    /*
*Get All Property Details 
*/
    @Security('Bearer')
    @Get("/allProperties")
    public async allProperties(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
        @Query('filter') filter: string): Promise<IResponse> {
        try {
            let payload: any = {};
            if (filter) {
                payload = {
                    $or: [
                        { propertyName: { $regex: filter, $options: 'i' } },
                    ]
                }
            }

            const data = await getAll(propertyDetailsModel, payload, +pageNumber, +pageSize);
            return {
                data: data || {},
                error: '',
                message: 'All Property Details fetched Successfully',
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
 * Get users with optional search functionality
 */
    @Security('Bearer')
    @Get("/getAllUsers")
    public async getAllUsers(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
        @Query('filter') filter: string
    ): Promise<IResponse> {
        try {
            const fieldsToExclude = ['password', 'mpin'];

            let payload: any = {};
            if (filter) {
                payload = {
                    $or: [
                        { username: { $regex: filter, $options: 'i' } },
                        { email: { $regex: filter, $options: 'i' } },
                        { name: { $regex: filter, $options: 'i' } }
                    ]
                }
            }

            const getAllUsersData = await getAll(clientModel, payload, +pageNumber, +pageSize, fieldsToExclude);
            return {
                data: getAllUsersData || {},
                error: '',
                message: 'All users info fetched Successfully',
                status: 200
            }
        } catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            }
        }
    }

    /**
    * Update status of lease request
    */
    @Security('Bearer')
    @Put("/updateLeasePropertyStatus")
    public async updateLeasePropertyStatus(@Body() request: { id: string, status: string }): Promise<IResponse> {
        try {
            const { id, status } = request;
            // Check for a valid id
            // Update the status of leasePropertyModel with the newStatus
            const updatedLeaseProperty = await upsert(leasePropertyModel, { status }, id);

            return {
                data: updatedLeaseProperty,
                error: '',
                message: 'Lease property status updated successfully',
                status: 200
            };
        } catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: 'Error updating lease property status',
                status: 400
            };
        }
    }
    /**
    * Get red token Data with search filter
    */
    @Security('Bearer')
    @Get("/getRedTokenRequestData")
    public async getRedTokenRequestData(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
    ): Promise<IResponse> {
        try {
            const aggregate = [
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
                    $match: {
                        transactionType: { $ne: 'Sell RED' }
                    }
                },
                {
                    $project: {
                        status: 1,
                        senderId: 1,
                        totalRedToken: 1,
                        hashId: 1,
                        usdc: 1,
                        transactionType: 1,
                        accountType: 1,
                        walletAddress: 1,
                        userName: "$client.userName",
                        name: "$client.name",
                        createdAt: 1,
                        updatedAt: 1
                    }
                }
            ];

            const getRedTokenData = await getAggregation(redTokenTransactionModel, aggregate, +pageNumber, +pageSize);

            return {
                data: getRedTokenData,
                error: '',
                message: 'Red Token Request info fetched Successfully',
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
  * Update status of Red Token Request
  */
    @Security('Bearer')
    @Put("/updateRedTokenRequest")
    public async updateRedTokenRequest(@Body() request: { status: string, hashId: string, accountType: string }): Promise<IResponse> {
        try {
            const { status, hashId, accountType } = request;
            // Check for a valid id
            // Update the status of the red token request with the newStatus
            const transaction = await findOne(redTokenTransactionModel, { hashId: hashId });

            if (transaction && transaction.status === "PENDING") {
                const changeStatusRequest = await upsert(redTokenTransactionModel, { status }, transaction._id);
                const clientId = changeStatusRequest.senderId;
                let response = await findOne(clientModel, { _id: clientId });
                const totalRedToken = +changeStatusRequest.totalRedToken;

                if (accountType === 'Primary') {
                    let currentRedTokens = +response.redToken;
                    let totalRedTokens = +totalRedToken + +currentRedTokens;
                    const addRedToken = await upsert(clientModel, { redToken: totalRedTokens }, clientId);

                    return {
                        data: { addRedToken, changeStatusRequest },
                        error: '',
                        message: 'Red token added successfully',
                        status: 200
                    };
                } else {
                    let currentRedTokens = +response.businessRedToken;
                    let totalRedTokens = +totalRedToken + +currentRedTokens;
                    const addRedToken = await upsert(clientModel, { businessRedToken: totalRedTokens }, clientId);

                    return {
                        data: { addRedToken, changeStatusRequest },
                        error: '',
                        message: 'Red token added successfully',
                        status: 200
                    };
                }
            } else {
                return {
                    data: { transaction },
                    error: '',
                    message: 'Red token request already approved or declined',
                    status: 200
                };
            }
        } catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: 'Error updating Red Tokens',
                status: 400
            };
        }

    }
    /**
       * Add/Update wallet address
       */
    @Security('Bearer')
    @Put('/updateWalletAddress')
    public async updateWalletAddress(@Body() request: { walletAddress: string, privatekey: string, receivewalletaddress: string }): Promise<IResponse> {
        try {
            const _id = this.userId;
            const exists = await findOne(adminModel, { _id });
            if (!exists) {
                throw new Error("User doesnot exist");
            }

            const { walletAddress, privatekey, receivewalletaddress } = request;

            let saveResponse = await upsert(adminModel, { walletAddress: walletAddress, privatekey: privatekey, receivewalletaddress: receivewalletaddress }, _id);
            const data = saveResponse.walletAddress;
            const data1 = saveResponse.privatekey;
            const data2 = saveResponse.privatekey;

            return {
                data: { data, data1, data2 },
                error: '',
                message: 'Wallet Address,privatekey,receivewalletaddress Updated Successfully',
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
   * Get Admin Data
   */
    @Security('Bearer')
    @Get("/adminData")
    public async adminData(): Promise<IResponse> {
        try {
            const adminData = await findOne(adminModel, {});
            return {
                data: { adminData },
                error: '',
                message: 'Admin Data Fetch Successfully!',
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
    * Add/Update Conversion rate
    */
    @Security('Bearer')
    @Put('/updateConversionRate')
    public async updateConversionRate(@Body() request: { conversionRate: string, sellPercentage: string }): Promise<IResponse> {
        try {
            const _id = this.userId;
            const exists = await findOne(adminModel, { _id });
            if (!exists) {
                throw new Error("User doesnot exist");
            }
            const { conversionRate, sellPercentage } = request;

            const validatedConversionRate = validateConversionRate({ conversionRate });
            if (validatedConversionRate.error) {
                throw new Error(validatedConversionRate.error.message)
            }
            const validatedsellpercentage = validatesellpercentage({ sellPercentage });
            if (validatedsellpercentage.error) {
                throw new Error(validatedsellpercentage.error.message)
            }
            let saveResponse = await upsert(adminModel, { conversionRate: conversionRate, sellPercentage: sellPercentage }, _id);
            const dataconversionrate = saveResponse.conversionRate;
            const datasellpercentage = saveResponse.sellPercentage;
            console.log(dataconversionrate, datasellpercentage);


            return {
                data: { dataconversionrate, datasellpercentage },
                error: '',
                message: 'Conversion rate and sell percentage Updated Successfully',
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
    * Add/Update Conversion Rate For Loan
    */
    @Security('Bearer')
    @Put('/updateConversionRateForLoan')
    public async updateConversionRateForLoan(@Body() request: { conversionRateForLoan: string }): Promise<IResponse> {
        try {
            const _id = this.userId;
            const exists = await findOne(adminModel, { _id });
            if (!exists) {
                throw new Error("Admin doesnot exist");
            }

            const { conversionRateForLoan } = request;
            const validatedConversionRate = validateadminConversionRateForLoan({ conversionRateForLoan });
            if (validatedConversionRate.error) {
                throw new Error(validatedConversionRate.error.message)
            }
            let saveResponse = await upsert(adminModel, { conversionRateForLoan: conversionRateForLoan }, _id);
            const data = saveResponse.conversionRateForLoan;
            return {
                data: { data },
                error: '',
                message: 'Conversion rate Updated Successfully',
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
   * Add/Update Booking Percentage
   */
    @Security('Bearer')
    @Put('/updateBookingPercentage')
    public async updateBookingPercentage(@Body() request: { bookingPercentage: string }): Promise<IResponse> {
        try {
            const _id = this.userId;
            const exists = await findOne(adminModel, { _id });
            if (!exists) {
                throw new Error("User doesnot exist");
            }

            const { bookingPercentage } = request;
            const validatedConversionRate = validateBookingPercentage({ bookingPercentage });
            if (validatedConversionRate.error) {
                throw new Error(validatedConversionRate.error.message)
            }
            let saveResponse = await upsert(adminModel, { bookingPercentage: bookingPercentage }, _id);
            const data = saveResponse.bookingPercentage;
            return {
                data: { data },
                error: '',
                message: 'Booking Percentage Rate Updated Successfully',
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
   * Add/Update Conversion rate
   */
    @Security('Bearer')
    @Put('/updateConversionRateForSoloReward')
    public async updateConversionRateForSoloReward(@Body() request: { conversionRateForSoloReward: string }): Promise<IResponse> {
        try {
            const _id = this.userId;
            const exists = await findOne(adminModel, { _id });
            if (!exists) {
                throw new Error("User doesnot exist");
            }

            const { conversionRateForSoloReward } = request;
            const validatedConversionRate = validateConversionRateForSoloReward({ conversionRateForSoloReward });
            if (validatedConversionRate.error) {
                throw new Error(validatedConversionRate.error.message)
            }
            let saveResponse = await upsert(adminModel, { conversionRateForSoloReward: conversionRateForSoloReward }, _id);
            const data = saveResponse.conversionRateForSoloReward;
            return {
                data: { data },
                error: '',
                message: 'Conversion rate for solo reward  Updated Successfully',
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
    * Get conversion rate for solo reward
    */
    @Security('Bearer')
    @Get("/getConversionRateForSoloReward")
    public async getConversionRateForSoloReward(): Promise<IResponse> {
        try {
            const adminData = await findOne(adminModel, {});
            const conversionrate = adminData.conversionRateForSoloReward
            return {
                data: { conversionrate },
                error: '',
                message: 'Conversion rate for solo reward fetch successfully!',
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
    Logout 
    */
    @Security("Bearer")
    @Get("/logout")
    public async logout(): Promise<IResponse> {
        try {
            const authHeader = this.req.headers.authorization;
            await upsert(tokenModel, { token: authHeader });

            return {
                data: {},
                error: '',
                message: 'Logged Out Successfully',
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
        * Save Nft Details
        */
    @Security('Bearer')
    @Post("/addNftData")
    public async addNftData(@FormField() name?: string, @FormField() symbol?: string, @FormField() description?: string, @FormField() price?: string, @FormField() categoryId?: string, @FormField() type?: string, @FormField() tokenId?: string, @FormField() contractAddress?: string, @UploadedFile('Image') Image?: Express.Multer.File): Promise<IResponse> {
        try {
            const validatedProperty = validateNftDetails({
                name,
                symbol,
                description,
                price,
                categoryId,
                type,
                contractAddress,
            });
            if (validatedProperty.error) {
                throw new Error(validatedProperty.error.message);
            }
            let fileImage;
            if (Image) {
                fileImage = await UploadedFileToAWS(Image?.originalname, Image?.buffer, Image?.mimetype.includes('image/png') ? "image/png" : "image/jpeg");
            }
            let saveResponse = await upsert(nftDetailModel, {
                userId: this.userId,
                name,
                symbol,
                description,
                price,
                categoryId,
                type,
                publishedBy: 'Solos',
                tokenId,
                contractAddress,
                Image: fileImage
            });
            return {
                data: { saveResponse },
                error: '',
                message: 'NFT Data Saved Successfully',
                status: 200
            };
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400
            };
        }
    }
    /*
    * Get All NFT Data
    */
    @Security('Bearer')
    @Get("/getNftData")
    public async getNftData(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number, @Query('filter') filter: string
    ): Promise<IResponse> {
        try {
            const totalCount = await nftDetailModel.countDocuments({});
            let payload: any = {};
            if (filter) {
                payload = {
                    $or: [
                        { name: { $regex: filter, $options: 'i' } }
                    ]
                }
            }
            const data = await nftDetailModel.aggregate([
                {
                    $lookup: {
                        from: "nftcategories",
                        localField: "categoryId",
                        foreignField: "_id",
                        as: "nftCategorieDetails"
                    }
                },
                {
                    $match: {
                        $or: [
                            { name: { $regex: filter, $options: 'i' } }
                        ]
                    }
                },
                {
                    $sort: { createdAt: -1 }
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
                message: 'All Nft Data fetched Successfully',
                status: 200
            }
        } catch (err: any) {
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
   * User blocked or unblocked api
   */
    @Security('Bearer')
    @Put('/blockUser')
    public async blockUser(@Body() request: { id: string, isBlocked: boolean }): Promise<IResponse> {
        try {

            const { isBlocked, id } = request;

            // Find the client by ID and update the isBlocked status
            let saveResponse = await upsert(clientModel, { isBlocked: isBlocked }, id);

            if (!saveResponse) {
                return {
                    data: null,
                    error: 'Client not found',
                    message: 'Client not found',
                    status: 404,
                };
            }
            let message = '';
            if (isBlocked) {
                message = 'User Blocked Successfully';
            } else {
                message = 'User Unblocked Successfully';
            }
            return {
                data: { saveResponse },
                error: '',
                message,
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
     * Delete property detail API
     */
    @Security('Bearer')
    @Delete('deletePropertyDetail')
    public async deletePropertyDetail(@Query('id') id: string): Promise<IResponse> {
        try {
            // Find the property detail by ID and remove it
            const deletedPropertyDetail = await deleteById(propertyDetailsModel, id)
            if (!deletedPropertyDetail) {
                return {
                    data: null,
                    error: 'Property detail not found',
                    message: 'Property detail not found',
                    status: 404,
                };
            }
            return {
                data: null,
                error: '',
                message: 'Property detail deleted successfully',
                status: 200,
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: 'Error deleting property detail',
                status: 400,
            };
        }
    }
    /**
  * Create NFT Category API
  */
    @Security('Bearer')
    @Post("/createCategory")
    public async createCategory(
        @FormField() categoryName: string,
        @UploadedFile('iconImage') iconImage: Express.Multer.File
    ): Promise<IResponse> {
        try {
            const MAX_FILE_SIZE = 5 * 1024 * 1024;
            if (iconImage.size > MAX_FILE_SIZE) {
                throw new Error('Uploaded file is too large. Please upload a smaller file.');
            }

            const validatedCategory = validateNftCategory({ categoryName });
            if (validatedCategory.error) {
                throw new Error(validatedCategory.error.message);
            }
            let fileImage;
            if (iconImage) {
                fileImage = await UploadedFileToAWS(iconImage?.originalname, iconImage?.buffer, iconImage?.mimetype.includes('image/png') ? "image/png" : "image/jpeg");
            }

            const saveResponse = await upsert(nftcategoriesModel, {
                categoryName: categoryName,
                iconImage: fileImage
            });

            return {
                data: saveResponse,
                error: '',
                message: 'NFT Category Created successfully!',
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
    * Delete Category api
    */
    @Security('Bearer')
    @Delete('/deleteCategory')
    public async deleteCategory(@Query('id') id: string): Promise<IResponse> {
        try {
            const response = await findOne(nftDetailModel, { categoryId: id })
            if (response.categoryId === id) {
                throw new Error("This category is already in use you can't delete this category")
            }
            // Find the property detail by ID and remove it
            const deletedCategory = await deleteById(nftcategoriesModel, id)
            if (!deletedCategory) {
                return {
                    data: null,
                    error: 'Category detail not found',
                    message: 'Category detail not found',
                    status: 404,
                };
            }
            return {
                data: null,
                error: '',
                message: 'Category deleted successfully',
                status: 200,
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: 'Error deleting category details',
                status: 400,
            };
        }
    }
    /*
    *Get All NFT Category 
    */
    @Security('Bearer')
    @Get("/getCategory")
    public async getCategory(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number, @Query('filter') filter: string): Promise<IResponse> {
        try {
            const totalCount = await nftcategoriesModel.countDocuments({});
            let payload: any = {};
            if (filter) {
                payload = {
                    $or: [
                        { categoryName: { $regex: filter, $options: 'i' } }
                    ]
                }
            }
            const data = await nftcategoriesModel.aggregate([
                {
                    $lookup: {
                        from: "nftdetails",
                        localField: "_id",
                        foreignField: "categoryId",
                        as: "nftDetails"
                    }
                },
                {
                    $match: {
                        $or: [
                            { categoryName: { $regex: filter, $options: 'i' } }
                        ]
                    }
                },
                {
                    $sort: { createdAt: -1 }
                },
                {
                    $skip: Number(pageNumber - 1) * Number(pageSize)
                },
                {
                    $limit: Number(pageSize)
                },
                {
                    $project: {
                        _id: 1,
                        iconImage: 1,
                        categoryName: 1,
                        nftDetailsCount: { $size: "$nftDetails" }
                    }
                }
            ]);
            return {
                data: { data, totalCount },
                error: '',
                message: 'All Nft Category fetched Successfully',
                status: 200
            }
        }
        catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`)
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400,
            }
        }
    }
    @Security('Bearer')
    @Post('/saveFred')
    public async saveFred(@Body() request: { amount: string, expiryDate: string, numberOfUsers: string }): Promise<IResponse> {
        try {
            const { amount, expiryDate, numberOfUsers } = request;
            const validateFred = validateFredCategory({ amount, expiryDate, numberOfUsers });
            if (validateFred.error) {
                throw new Error(validateFred.error.message)
            }
            const updated = await upsert(fredModel, { amount, expiryDate, numberOfUsers })
            return {
                data: { updated },
                error: '',
                message: 'Fred Save Successfully ',
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
      * Send Red Admin to User
      */
    @Security('Bearer')
    @Post('/sendRedTokenByAdmin')
    public async sendRedTokenByAdmin(@Body() request: { userName: string, redToken: string }): Promise<IResponse> {
        try {
            const { userName, redToken } = request;
            const upperCaseUserName = userName.toLocaleUpperCase();
            const _id = this.userId;
            const exists = await findOne(adminModel, { _id });
            if (!exists) {
                throw new Error("User doesnot exist");
            }
            const adminRedToken = parseFloat(exists.totalRedToken);
            const sendRedTokenValue = parseFloat(redToken);
            if (isNaN(adminRedToken) || isNaN(sendRedTokenValue)) {
                throw new Error('Invalid redToken values');
            }
            const receiverData = await clientModel.findOne({ userName: upperCaseUserName });
            if (!receiverData) {
                throw new Error('User doesn\'t exist!');
            }

            //sender
            const updatedRedToken = adminRedToken - sendRedTokenValue;
            let saveResponse = await upsert(adminModel, { totalRedToken: updatedRedToken }, this.userId);

            //reciever
            const receiverUpdatedRedToken = +(receiverData.redToken) + +sendRedTokenValue;
            let saveResponse2 = await upsert(clientModel, { redToken: receiverUpdatedRedToken }, { _id: receiverData._id })

            let tranasctionRepsonse = await upsert(redTokenTransactionModel, {
                senderId: this.userId,
                receiverId: receiverData._id,
                totalRedToken: redToken,
                transactionType: 'Red Token',
                status: "APPROVED",
            });
            delete tranasctionRepsonse.accountType
            return {
                data: { tranasctionRepsonse },
                error: '',
                message: 'RedToken sent successfully',
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
          * Send Solos Reward Admin to User
          */
    @Security('Bearer')
    @Post('/sendSolosReward')
    public async sendSolosReward(@Body() request: { userName: string, solosReward: string }): Promise<IResponse> {
        try {
            const { userName, solosReward } = request;
            const upperCaseUserName = userName.toLocaleUpperCase();
            const _id = this.userId;
            const exists = await findOne(adminModel, { _id: mongoose.Types.ObjectId(this.userId) });
            if (!exists) {
                throw new Error("User doesnot exist");
            }
            const adminSolosReward = parseFloat(exists.solosReward);
            const sendSolosRewardValue = parseFloat(solosReward);
            if (isNaN(adminSolosReward) || isNaN(sendSolosRewardValue)) {
                throw new Error('Invalid Solos Reward Value');
            }
            const receiverData = await clientModel.findOne({ userName: upperCaseUserName });
            if (!receiverData) {
                throw new Error('User doesn\'t exist!');
            }

            //sender
            const updatedSolosReward = adminSolosReward - sendSolosRewardValue;
            let saveResponse = await upsert(adminModel, { solosReward: updatedSolosReward }, this.userId);
            //reciever
            const receiverUpdatedSolosReward = +(receiverData.solosReward) + +sendSolosRewardValue;
            let saveResponse2 = await upsert(clientModel, { solosReward: receiverUpdatedSolosReward }, { _id: receiverData._id })
            let tranasctionRepsonse = await upsert(redTokenTransactionModel, {
                senderId: this.userId,
                receiverId: receiverData._id,
                solosReward: solosReward,
                transactionType: 'Solos Reward',
                status: "APPROVED",
            });
            delete tranasctionRepsonse.accountType
            return {
                data: { tranasctionRepsonse },
                error: '',
                message: 'Solos Reward sent successfully',
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
    * Get All admin redtoken and solos reward transactions
    */
    @Security('Bearer')
    @Get('/getRedAndSolosTransaction')
    public async getRedAndSolosTransaction(
        @Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number,
        @Query('filter') filter: string,
        @Query('type') type: string,
    ): Promise<IResponse> {
        try {
            const skip = (pageNumber - 1) * pageSize;

            const totalCount = await redTokenTransactionModel.countDocuments({});

            let payload: any = {};
            if (filter) {
                payload = {
                    $or: [
                        { transactionType: { $regex: filter, $options: 'i' } },
                        { 'clientDetails.userName': { $regex: filter, $options: 'i' } }
                    ]
                };
            }

            const query: any = {
                senderId: mongoose.Types.ObjectId(this.userId),
                ...payload,
            };

            // Add type filter if provided
            if (type) {
                query.transactionType = type;
            }

            const transactionData = await redTokenTransactionModel.aggregate([
                {
                    $match: query,
                },
                {
                    $lookup: {
                        from: 'clients',
                        localField: 'receiverId',
                        foreignField: '_id',
                        as: 'clientDetails',
                    },
                },
                {
                    $sort: { createdAt: -1 },
                },
                {
                    $skip: Number(skip),
                },
                {
                    $limit: Number(pageSize),
                },
                {
                    $project: {
                        transactionType: 1,
                        totalRedToken: 1,
                        solosReward: 1,
                        createdAt: 1,
                        clientDetails: { $arrayElemAt: ['$clientDetails.userName', 0] },
                    },
                },
            ]);

            return {
                data: { transactionData, totalCount },
                error: '',
                message: 'All Red token and Solos Reward Transactions Data fetched Successfully',
                status: 200,
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message || err}`);
            return {
                data: null,
                error: err.message || err,
                message: '',
                status: 400,
            };
        }
    }

    /**
      * Add/Update fred exchange percentage
      */
    @Security('Bearer')
    @Put('/FredExchangeRedToken')
    public async FredExchangeRedToken(@Body() request: { FredExchangeRedTokenPercentage: string }): Promise<IResponse> {
        try {
            const _id = this.userId;
            const exists = await findOne(adminModel, { _id });
            if (!exists) {
                throw new Error("Admin doesnot exist");
            }

            const { FredExchangeRedTokenPercentage } = request;
            const validatedConversionRate = validateFredExchangeRedTokenPercentage({ FredExchangeRedTokenPercentage });
            if (validatedConversionRate.error) {
                throw new Error(validatedConversionRate.error.message)
            }
            let saveResponse = await upsert(adminModel, { FredExchangeRedTokenPercentage: FredExchangeRedTokenPercentage }, _id);
            const data = saveResponse.FredExchangeRedTokenPercentage;
            return {
                data: { data },
                error: '',
                message: 'Fred Exchange Percentage Updated Successfully',
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
  * Get Red Token Exchange Percentage
  */
    @Security('Bearer')
    @Get("/getFredExchangeRedTokenPercentage")
    public async getFredExchangeRedTokenPercentage(): Promise<IResponse> {
        try {
            const adminData = await findOne(adminModel, {});
            const FredExchangePercentage = adminData.FredExchangeRedTokenPercentage
            return {
                data: { FredExchangePercentage },
                error: '',
                message: 'Fred Exchange Percentage fetch successfully!',
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
       * Get all model total data count for dashboard
       */
    @Security('Bearer')
    @Get("/getAllModelTotalDataCount")
    public async getAllModelTotalDataCount(): Promise<IResponse> {
        try {
            const [totalusers, noofproperty, totalfred, totalnft, totalleasecount] = await Promise.all([
                clientModel.countDocuments(),
                propertyDetailsModel.countDocuments(),
                fredNftModel.countDocuments(),
                nftDetailModel.countDocuments(),
                leasePropertyModel.countDocuments()
            ]);
            return {
                data: { totalusers, noofproperty, totalfred, totalnft, totalleasecount },
                error: '',
                message: 'Total Data Count fetch successfully!',
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
    @Post("/createSFredTypes")
    public async createSFredTypes(
        @Body() request: { categoryId: string, categoryName: string, type: string }
    ): Promise<IResponse> {
        try {
            const { categoryId, categoryName, type } = request
            const validatedCategory = validateSfredCategory({ categoryName });
            if (validatedCategory.error) {
                throw new Error(validatedCategory.error.message);
            }

            let saveResponse;

            if (categoryId) {
                // Update existing document
                saveResponse = await sfredcategoriesModel.findByIdAndUpdate(
                    categoryId,
                    { categoryName: categoryName, type: type },
                    { new: true }
                );
            } else {
                // Create new document
                saveResponse = await sfredcategoriesModel.create({
                    categoryName: categoryName,
                    type: type
                });
            }

            return {
                data: saveResponse,
                error: '',
                message: categoryId ? 'SFred Category Updated successfully!' : 'SFred Category Created successfully!',
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
    @Get("/getSFredTypes")
    public async getSFredTypes(
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
                        { type: { $regex: filter, $options: 'i' } }
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
            const data = await getAll(sfredcategoriesModel, +pageNumber, +pageSize, filter);
            const totalCount = await sfredcategoriesModel.countDocuments({});
            return {
                data: { data, totalCount },
                error: '',
                message: 'SFred Category Fetched successfully!',
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
    @Delete('/deleteSfredCategory')
    public async deleteSfredCategory(@Query('id') id: string): Promise<IResponse> {
        try {
            const response = await findOne(sfredcategoriesModel, { _id: id })
            if (response.categoryId === id) {
                throw new Error("This category is already in use you can't delete this category")
            }
            // Find the property detail by ID and remove it
            const deletedCategory = await deleteById(sfredcategoriesModel, id)
            if (!deletedCategory) {
                return {
                    data: null,
                    error: 'SFredCategory detail not found',
                    message: 'SfredCategory detail not found',
                    status: 404,
                };
            }
            return {
                data: null,
                error: '',
                message: 'SfredCategory deleted successfully',
                status: 200,
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: 'Error deleting category details',
                status: 400,
            };
        }
    }

    /**
     * Update status of Usdc Request
     */
    @Security('Bearer')
    @Put("/updateUsdcRequest")
    public async updateUsdcRequest(@Body() request: { status: string, hashId: string, hashId2: string }): Promise<IResponse> {
        try {
            const { status, hashId, hashId2 } = request;

            // Check for a valid id
            // Update the status of the red token request with the newStatus
            const transaction = await findOne(redTokenTransactionModel, { hashId: hashId });

            if (transaction && transaction.status === "PENDING") {
                const changeStatusRequest = await upsert(redTokenTransactionModel, { status, hashId2 }, transaction._id);
                const clientId = changeStatusRequest.senderId;
                const Usdc = +changeStatusRequest.usdc;

                return {
                    data: { Usdc, changeStatusRequest },
                    error: '',
                    message: 'Usdc added successfully',
                    status: 200
                };
            } else {
                return {
                    data: { transaction },
                    error: '',
                    message: 'Usdc request already approved or declined',
                    status: 200
                };
            }
        } catch (err: any) {
            return {
                data: null,
                error: err.message ? err.message : err,
                message: 'Error updating Red Tokens',
                status: 400
            };
        }
    }
    /**
      * SR Token Mint Tansaction Api
      */
    @Security('Bearer')
    @Post("/srTokenMintTransaction")
    public async srTokenMintTransaction(@Body() request: { walletAddress: string, numberOfTokens: string, hash: string }): Promise<IResponse> {
        try {
            const { walletAddress, numberOfTokens, hash } = request;
            const validateSrTokenSchema2 = validateSrTokenSchema({ walletAddress, numberOfTokens, hash });
            if (validateSrTokenSchema2.error) {
                throw new Error(validateSrTokenSchema2.error.message)
            }
            let saveResponse = await upsert(srTokenModel, { walletAddress, numberOfTokens, hash });
            return {
                data: { saveResponse },
                error: '',
                message: 'SR Token Mint Transaction Save Succesfully',
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
     * Get SR Token Mint Tansaction Api
     */
    @Security('Bearer')
    @Get("/getSrTokenTransaction")
    public async getSrTokenTransaction(@Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number): Promise<IResponse> {
        try {

            const data = await getAll(srTokenModel, {}, +pageNumber, +pageSize);
            return {
                data: data || {},
                error: '',
                message: 'RED Token Mint Transaction Fetched Succesfully',
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
    * Red Token Mint Tansaction Api
    */
    @Security('Bearer')
    @Post("/redTokenMintTransaction")
    public async redTokenMintTransaction(@Body() request: { walletAddress: string, numberOfTokens: string, hash: string }): Promise<IResponse> {
        try {
            const { walletAddress, numberOfTokens, hash } = request;
            const validateSrTokenSchema2 = validateRedTokenSchema({ walletAddress, numberOfTokens, hash });
            if (validateSrTokenSchema2.error) {
                throw new Error(validateSrTokenSchema2.error.message)
            }
            let saveResponse = await upsert(redTokenModel, { walletAddress, numberOfTokens, hash });
            return {
                data: { saveResponse },
                error: '',
                message: 'RED Token Mint Transaction Save Succesfully',
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
     * Get Red Token Mint Tansaction Api
     */
    @Security('Bearer')
    @Get("/getRedTokenTransaction")
    public async getRedTokenTransaction(@Query('pageNumber') pageNumber: number,
        @Query('pageSize') pageSize: number): Promise<IResponse> {
        try {

            const data = await getAll(redTokenModel, {}, +pageNumber, +pageSize);
            return {
                data: data || {},
                error: '',
                message: 'RED Token Mint Transaction Fetched Succesfully',
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
   * Change password api endpoint
   */
    @Security('Bearer')
    @Post("/changePassword")
    public async changePassword(@Body() request: { oldPassword: string, newPassword: string }): Promise<IResponse> {
        try {
            const { oldPassword, newPassword } = request;
            const validatedResetPassword = validateAdminPassword({ oldPassword, newPassword });
            if (validatedResetPassword.error) {
                throw new Error(validatedResetPassword.error.message)
            }
            const data = await getById(adminModel, this.userId)
            const isValid = await verifyHash(oldPassword, data.password);
            if (!isValid) {
                throw new Error('Password seems to be incorrect');
            }
            const hashed = await genHash(newPassword)
            const updated = await upsert(adminModel, { password: hashed }, this.userId)
            return {
                data: {},
                error: '',
                message: 'Password reset successfully!',
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
   * Create Mpin Api
   */
    @Security('Bearer')
    @Post('/createMpin')
    public async createMpin(@Body() request: { password?: string, mpin: string, isMpinUsedForTransactions?: boolean }): Promise<IResponse> {
        try {
            const _id = this.userId;
            const exists = await findOne(adminModel, { _id });
            if (!exists) {
                throw new Error('User not found !')
            }
            const { password, mpin, isMpinUsedForTransactions } = request;
            const isValid = await verifyHash(password ?? '', exists.password ?? '');
            if (!isValid) {
                throw new Error('Password seems to be incorrect');
            }
            else {
                let hashed = await genHash(mpin);
                await upsert(adminModel, { mpin: hashed, isMpinUsedForTransactions }, _id);
            }
            return {
                data: { "Mpin Created": "Success" },
                error: '',
                message: 'Mpin Created successfully',
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
   * Verification of mpin over usage
   */
    @Security('Bearer')
    @Post('/verifyMpin')
    public async verifyMpin(@Body() request: { mpin: string }): Promise<IResponse> {
        try {
            const { mpin } = request;
            const _id = this.userId;
            const exists = await findOne(adminModel, { _id });
            if (!exists) {
                throw new Error('User not found');
            }
            const isValid = await verifyHash(mpin, exists.mpin);
            if (!isValid) {
                throw new Error('Incorrect Mpin');
            }
            if (!exists.mpin) {
                throw new Error("Mpin not Generated")
            }
            return {
                data: { "Mpin": "Verified" },
                error: '',
                message: 'Mpin verified successfully',
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
    * check mpin api
    */
    @Security('Bearer')
    @Get("/checkMpin")
    public async checkMpin(): Promise<IResponse> {
        try {

            const data = await getById(adminModel, this.userId)
            const response = data.isMpinUsedForTransactions
            return {
                data: response || {},
                error: '',
                message: 'Mpin Response Fetch Successfully',
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
       * Change mpin api
       */
    @Security('Bearer')
    @Post("/changeMpin")
    public async changeMpin(@Body() request: { oldMpin: string, newMpin: string }): Promise<IResponse> {
        try {
            const { oldMpin, newMpin } = request;
            const data = await getById(adminModel, this.userId)
            const isValid = await verifyHash(oldMpin, data.mpin);
            if (!isValid) {
                throw new Error('Mpin seems to be incorrect');
            }
            const hashed = await genHash(newMpin)
            const updated = await upsert(adminModel, { mpin: hashed }, this.userId)
            return {
                data: {},
                error: '',
                message: 'Mpin reset successfully!',
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
  * Mpin security enable disable security api
  */
    @Security('Bearer')
    @Post('/enableDisableSecurity')
    public async enableDisableSecurity(@Body() request: { value: boolean }): Promise<IResponse> {
        try {
            const { value } = request;
            const response = await upsert(adminModel, { isMpinUsedForTransactions: value }, this.userId);
            return {
                data: {},
                error: '',
                message: 'Mpin status updated successfully',
                status: 200
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: 'Failed to update Mpin status',
                status: 400
            };
        }
    }
    /**
 * Send OTP for transaction security
 */
    @Security('Bearer')
    @Put("/securityOtp")
    public async securityOtp(
        @Body()
        request: {}
    ): Promise<IResponse> {
        try {
            // Assuming this.userId is defined elsewhere in your code
            const getResponse = await getById(adminModel, this.userId);

            // Assuming getResponse is an object with an 'email' property
            const { email, name } = getResponse;
            const otp = generateRandomOtp();
            const html = await readHTMLFile(
                path.join(__dirname, "../", "../", "src", "template", "otp_email.html")
            );
            const template = handlebar.compile(html);
            const [otp1, otp2, otp3, otp4] = otp.split("");
            const tempData = template({
                otp1,
                otp2,
                otp3,
                otp4,
                email,
                firstName: name,
            });
            await sendEmail(process.env.EMAIL_NOTIFICATION_ADDRESS, 'OTP for Reset Password', email, tempData)
            const saveResponse = await upsert(adminModel, { otp }, this.userId);
            return {
                data: saveResponse,
                error: "",
                message: "OTP sent successfully",
                status: 200,
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message || err,
                message: "",
                status: 400,
            };
        }
    }
    /**
     * Verify Otp For Security
     */
    @Security('Bearer')
    @Post("/verifySecurityOtp")
    public async verifySecurityOtp(@Body() request: { otp: string, email: string }): Promise<IResponse> {
        try {
            const { otp, email } = request;
            const exists = await adminModel.findOne({ email: email }).sort({ createdAt: -1 }).limit(1);
            if (exists.otp != otp) {
                throw new Error("OTP does not match");
            }
            return {
                data: {},
                error: "",
                message: "OTP verify Successfully",
                status: 200,
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: "",
                status: 400,
            };
        }
    }
    /**
  * Nft blocked or unblocked API
  */
    @Security('Bearer')
    @Put('/blockNft')
    public async blockNft(@Body() request: { id: string, isBlocked: boolean, type: string }): Promise<IResponse> {
        try {
            const { isBlocked, id, type } = request;
            let saveResponse;

            if (type === 'Nft') {
                saveResponse = await upsert(nftDetailModel, { isBlocked: isBlocked }, id);
            } else if (type === 'Fred') {
                saveResponse = await upsert(fredNftModel, { isBlocked: isBlocked }, id);
            } else if (type === 'SuperFred') {
                saveResponse = await upsert(superFredModel, { isBlocked: isBlocked }, id);
            } else if (type === 'Tvt') {
                saveResponse = await upsert(tvtModel, { isBlocked: isBlocked }, id);
            } else {
                return {
                    data: null,
                    error: `${type} not found`,
                    message: `${type} not found`,
                    status: 404,
                };
            }
            let message = isBlocked ? `${type} Blocked Successfully` : `${type} Unblocked Successfully`;
            return {
                data: saveResponse,
                error: '',
                message,
                status: 200,
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400,
            };
        }
    }
    /**
      * Register a admin
      */
    @Security('Bearer')
    @Post("/adminRegister")
    public async adminRegister(@Body() request: { firstName: string, lastName: string, email: string, password: string, confirmPassword: string, role: string,  permission: string[] }): Promise<IResponse> {
        try {
            const { firstName, lastName, email, password, confirmPassword, role, permission } = request;
            const validatedProfile = validateAdminRegister({ firstName, lastName, email, password, confirmPassword });
            if (validatedProfile.error) {
                throw new Error(validatedProfile.error.message);
            }

            const userEmail = await findOne(adminModel, { email });
            if (userEmail) {
                throw new Error(`Email ${email} is already registered.`);
            }

            if (password !== confirmPassword) {
                throw new Error(`Passwords do not match.`);
            }

            let hashed = await genHash(password);
            const saveResponse = await upsert(adminModel, { firstName, lastName, email, password: hashed, role, permission });

            return {
                data: saveResponse,
                error: '',
                message: 'Admin registration successful.',
                status: 200,
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400,
            };
        }
    }
    /**
  * Edit Profile
  */
    @Security('Bearer')
    @Put("/editProfileOfAdmin")
    public async editProfileOfAdmin(@Body() request: {
        id: string,
        firstName?: string,
        lastName?: string,
        email?: string,
        password?: string,
        confirmPassword?: string,
        role?: number,
        permission?: string,
        isBlocked?:boolean
    }): Promise<IResponse> {
        try {

            const { id, firstName, lastName, email, password, confirmPassword, role, permission,isBlocked} = request;

            const data = await getById(adminModel, id);
            if (!data) {
                throw new Error('User not found.');
            }
            let user: { [k: string]: any } = {};
            if (firstName) {
                user.firstName = firstName;
            }
            if (lastName) {
                user.lastName = lastName;
            }
            if (email && email !== user.email) {
                const existingUserWithEmail = await findOne(adminModel, { email });
                if (existingUserWithEmail && existingUserWithEmail._id !== user._id) {
                    throw new Error(`Email ${email} is already in use.`);
                }
                user.email = email;
            }
            if (password && confirmPassword) {
                if (password !== confirmPassword) {
                    throw new Error('Passwords do not match.');
                }
                const hashedPassword = await genHash(password);
                user.password = hashedPassword;
            }
            if (role) {
                user.role = role;
            }

            if (permission) {
                user.permission = permission;
            }
            if (isBlocked) {
                user.isBlocked = isBlocked;
            }
            const updatedUser = await upsert(adminModel, user,id);

            return {
                data: updatedUser,
                error: '',
                message: 'Profile updated successfully.',
                status: 200,
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400,
            };
        }
    }
    /**
  * Delete Profile
  */
    @Security('Bearer')
    @Delete("/deleteProfile")
    public async deleteProfile(@Query('userId') userId: string): Promise<IResponse> {
        try {

            console.log(userId)
            const user = await getById(adminModel, userId);
            if (!user) {
                throw new Error('User not found.');
            }

            const deleteResponse = await deleteById(adminModel, userId);

            return {
                data: deleteResponse,
                error: '',
                message: 'Profile deleted successfully.',
                status: 200,
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400,
            };
        }
    }

    /**
 * Get Admins by Role
 */
    @Security('Bearer')
    @Get("/getAdminsByRole")
    public async getAdminsByRole( @Query('pageNumber') pageNumber: number,
    @Query('pageSize') pageSize: number,): Promise<IResponse> {
        try {
            const admins = await getAll(adminModel, { role: '2' }, +pageNumber, +pageSize);
            return {
                data: admins,
                error: '',
                message: 'Admins retrieved successfully.',
                status: 200,
            };
        } catch (err: any) {
            logger.error(`${this.req.ip} ${err.message}`);
            return {
                data: null,
                error: err.message ? err.message : err,
                message: '',
                status: 400,
            };
        }
    }
     /**
 * Get Admins by Role
 */
     @Security('Bearer')
     @Get("/getAdminById")
     public async getAdminById( @Query('id') id: string): Promise<IResponse> {
         try {
             const admins = await getById(adminModel,id);
             return {
                 data: admins,
                 error: '',
                 message: 'Admins retrieved successfully.',
                 status: 200,
             };
         } catch (err: any) {
             logger.error(`${this.req.ip} ${err.message}`);
             return {
                 data: null,
                 error: err.message ? err.message : err,
                 message: '',
                 status: 400,
             };
         }
     }
}

