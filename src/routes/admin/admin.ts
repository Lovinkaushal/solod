import express, { Request, Response } from 'express'
import AdminController from '../../controllers/admin.controller'
import { authenticateAdmin, authenticateBoth } from '../../middlewares/auth.middleware'
import { responseWithStatus } from '../../utils/response.util'
import upload from '../../middlewares/multer.middleware'
const router = express.Router()

router.post('/login', async (req: Request | any, res: Response) => {
    const { email, password } = req.body;
    const controller = new AdminController(req, res)
    const response = await controller.login({ email, password });
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.post('/forgotPassword', async (req: Request | any, res: Response) => {
    const { email, url } = req.body;
    const controller = new AdminController(req, res)
    const response = await controller.forgotPassword({ email, url });
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.post('/resetPassword', authenticateAdmin, async (req: Request | any, res: Response) => {
    // check purpose field
    const { purpose } = req.body.user;
    if (!purpose || purpose !== 'reset') {
        return responseWithStatus(res, 400, {
            data: {},
            error: 'Invalid Token',
            message: '',
            status: 400
        })
    }
    const { password } = req.body;
    const controller = new AdminController(req, res)
    const response = await controller.resetPassword({ password });
    const { status } = response;
    return responseWithStatus(res, status, response)
})


router.get('/getAllUsers', authenticateBoth, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize, filter } = req.query;
    const controller = new AdminController(req, res)
    const response = await controller.getAllUsers(pageNumber, pageSize, filter);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/allProperties', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize,filter } = req.query;
    const controller = new AdminController(req, res)
    const response = await controller.allProperties(pageNumber, pageSize,filter);
    const { status } = response;
    return responseWithStatus(res, status, response)
});

router.post('/createAminities', upload.single('iconImage'), authenticateAdmin, async (req: Request | any, res: Response) => {
    const { iconName } = req.body;
    const iconImage = req.file;
    const controller = new AdminController(req, res);
    const response = await controller.createAminities(iconName, iconImage);
    const { status } = response;
    return responseWithStatus(res, status, response);
});
router.get('/GetAminities', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize, filter } = req.query;
    const controller = new AdminController(req, res)
    const response = await controller.GetAminities(pageNumber, pageSize,filter);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.delete('/deleteAminitiesDetail', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { id } = req.query;
    const controller = new AdminController(req, res)
    const response = await controller.deleteAminitiesDetail(id);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.post('/createProperty', upload.fields([
    { name: 'imageURL', maxCount: 1 },
    { name: 'propertyDocument', maxCount: 1 },
]), authenticateAdmin, async (req: Request | any, res: Response) => {
    const {propertyId, propertyName, location, description, area, propertyType, interestPerAnnum, price, dueDate, MonthlyFees, aminities } = req.body;
    const imageURL = req.files['imageURL']?.[0];
    const propertyDocument = req.files['propertyDocument']?.[0];
    const controller = new AdminController(req, res);
    const response = await controller.createProperty(propertyId,propertyName, location, description, area, propertyType, interestPerAnnum, price, dueDate, MonthlyFees, aminities,  /*legalAttachments, */ imageURL, propertyDocument);
    const { status } = response;
    return responseWithStatus(res, status, response);
});

router.post('/createAgreement', upload.fields([
    { name: 'trustDeed', maxCount: 1 },
    { name: 'appraisalReports', maxCount: 1 },
    { name: 'titlePolicy', maxCount: 1 },
    { name: 'anyEncumbrances', maxCount: 1 },
    { name: 'pictures', maxCount: 5 },
    { name: 'videos', maxCount: 5 },
    { name: 'images_3d', maxCount: 5 },
    { name: 'floorPlans', maxCount: 5 }
]), async (req: Request | any, res: Response) => {
    const { propertyId, userId, leaseRequestId, propertyName, propertyType, streetAddress, city, state, country, apn, typeOfPropertyOwnership, tract, landValue, improvements, totalValue, monthlyLeaseFee, leaseTerm, leaseStartDate, leaseExpirationDate, unit } = req.body;

    const trustDeed = req.files['trustDeed']?.[0];
    const appraisalReports = req.files['appraisalReports']?.[0];
    const titlePolicy = req.files['titlePolicy']?.[0];
    const anyEncumbrances = req.files['anyEncumbrances']?.[0];
    const pictures = req.files['pictures'];
    const videos =req.files?.['videos'];
    const images_3d = req.files['images_3d'];
    const floorPlans = req.files['floorPlans'];
    const controller = new AdminController(req, res);
    const response = await controller.createAgreement(propertyId, userId, leaseRequestId, propertyName, propertyType, streetAddress, city, state, country, apn, typeOfPropertyOwnership, tract, landValue, improvements, totalValue, monthlyLeaseFee, leaseTerm, leaseStartDate, leaseExpirationDate, unit, trustDeed, appraisalReports, titlePolicy, anyEncumbrances, pictures, videos, images_3d, floorPlans);
    const { status } = response;
    return responseWithStatus(res, status, response);
});

router.get('/getLeasePropertyData', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize,filter } = req.query;
    const controller = new AdminController(req, res)
    const response = await controller.getLeasePropertyData(pageNumber, pageSize,filter);
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.put('/updateLeasePropertyStatus', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { id, status } = req.body;
    const controller = new AdminController(req, res)
    const response = await controller.updateLeasePropertyStatus({ id, status });
    //const { status } = response;
    return responseWithStatus(res, response.status, response)
})

router.get('/getRedTokenRequestData', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize } = req.query;
    const controller = new AdminController(req, res)
    const response = await controller.getRedTokenRequestData(pageNumber, pageSize);
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.put('/updateRedTokenRequest', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { status, hashId, accountType } = req.body;
    const controller = new AdminController(req, res)
    const response = await controller.updateRedTokenRequest({ status, hashId, accountType });
    //const { status } = response;
    return responseWithStatus(res, response.status, response)
})

router.put('/updateWalletAddress', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { walletAddress ,privatekey,receivewalletaddress} = req.body;
    const controller = new AdminController(req, res);
    const response = await controller.updateWalletAddress({ walletAddress,privatekey ,receivewalletaddress});
    const { status } = response;
    return responseWithStatus(res, status, response);
})

router.put('/updateConversionRate', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { conversionRate,sellPercentage } = req.body;
    const controller = new AdminController(req, res);
    const response = await controller.updateConversionRate({ conversionRate,sellPercentage });
    const { status } = response;
    return responseWithStatus(res, status, response);
})
router.put('/updateConversionRateForLoan', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { conversionRateForLoan } = req.body;
    const controller = new AdminController(req, res);
    const response = await controller.updateConversionRateForLoan({ conversionRateForLoan });
    const { status } = response;
    return responseWithStatus(res, status, response);
})

router.put('/updateBookingPercentage', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { bookingPercentage } = req.body;
    const controller = new AdminController(req, res);
    const response = await controller.updateBookingPercentage({ bookingPercentage });
    const { status } = response;
    return responseWithStatus(res, status, response);
})
router.put('/updateConversionRateForSoloReward', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { conversionRateForSoloReward } = req.body;
    const controller = new AdminController(req, res);
    const response = await controller.updateConversionRateForSoloReward({ conversionRateForSoloReward });
    const { status } = response;
    return responseWithStatus(res, status, response);
})

router.get("/logout", authenticateAdmin, async (req: Request | any, res: Response) => {
    const controller = new AdminController(req, res)
    const response = await controller.logout();
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.get('/getConversionRateForSoloReward', authenticateBoth, async (req: Request | any, res: Response) => {
    const controller = new AdminController(req, res)
    const response = await controller.getConversionRateForSoloReward();
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.post('/addNftData',  upload.fields([{ name: 'Image', maxCount: 1 } ]), authenticateAdmin, async (req: Request | any, res: Response) => {
    const { name, symbol, description,price,categoryId,type,tokenId,contractAddress,} = req.body;
    if (req.filevalidationerror) {
        return responseWithStatus(res, 400, { error: req.filevalidationerror });
    }
    const controller = new AdminController(req, res)
    const response = await controller.addNftData(name, symbol, description,price,categoryId,type,tokenId,contractAddress, req.files['Image'] ? req.files['Image'][0] : null);
    return responseWithStatus(res, response.status, response)
})
router.get('/getNftData', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize,filter } = req.query;
    const controller = new AdminController(req, res)
    const response = await controller.getNftData(pageNumber, pageSize,filter);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.put('/blockUser', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { isBlocked,id} = req.body;
    const controller = new AdminController(req, res);
    const response = await controller.blockUser({ isBlocked,id });
    const { status } = response;
    return responseWithStatus(res, status, response);
})
router.delete('/deletePropertyDetail', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { id } = req.query;
    const controller = new AdminController(req, res)
    const response = await controller.deletePropertyDetail(id);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.post('/createCategory', upload.fields([{ name: 'iconImage', maxCount: 1 } ]),authenticateAdmin, async (req: Request | any, res: Response) => {
    const { categoryName} = req.body;
    if (req.filevalidationerror) {
        return responseWithStatus(res, 400, { error: req.filevalidationerror });
    }
    const controller = new AdminController(req, res)
    const response = await controller.createCategory(categoryName,req.files['iconImage'] ? req.files['iconImage'][0] : null);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.delete('/deleteCategory', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { id } = req.query;
    const controller = new AdminController(req, res)
    const response = await controller.deleteCategory(id);
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.get('/getCategory', authenticateBoth, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize,filter } = req.query;
    const controller = new AdminController(req, res)
    const response = await controller.getCategory(pageNumber, pageSize,filter);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.post('/saveFred',authenticateAdmin, async (req: Request | any, res: Response) => {
    const { amount,expiryDate, numberOfUsers} = req.body;
    const controller = new AdminController(req, res)
    const response = await controller.saveFred({amount,expiryDate, numberOfUsers});
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.post('/sendRedTokenByAdmin',authenticateAdmin, async (req: Request | any, res: Response) => {
    const {userName,redToken } = req.body;
    const controller = new AdminController(req, res)
    const response = await controller.sendRedTokenByAdmin({userName,redToken});
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.post('/sendSolosReward',authenticateAdmin, async (req: Request | any, res: Response) => {
    const {userName,solosReward } = req.body;
    const controller = new AdminController(req, res)
    const response = await controller.sendSolosReward({userName,solosReward});
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/getRedAndSolosTransaction', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize,filter,type } = req.query;
    const controller = new AdminController(req, res)
    const response = await controller.getRedAndSolosTransaction(pageNumber, pageSize,filter,type);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.put('/FredExchangeRedToken', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { FredExchangeRedTokenPercentage } = req.body;
    const controller = new AdminController(req, res);
    const response = await controller.FredExchangeRedToken({ FredExchangeRedTokenPercentage });
    const { status } = response;
    return responseWithStatus(res, status, response);
})
router.get('/getFredExchangeRedTokenPercentage',authenticateBoth, async (req: Request | any, res: Response) => {
    const controller = new AdminController(req, res)
    const response = await controller.getFredExchangeRedTokenPercentage();
    return responseWithStatus(res, response.status, response)
});
router.get('/getAllModelTotalDataCount',authenticateAdmin, async (req: Request | any, res: Response) => {
    const controller = new AdminController(req, res)
    const response = await controller.getAllModelTotalDataCount();
    return responseWithStatus(res, response.status, response)
});
router.get('/adminData', authenticateAdmin, async (req: Request | any, res: Response) => {
    const controller = new AdminController(req, res)
    const response = await controller.adminData();
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.post('/createSFredTypes',authenticateAdmin, async (req: Request | any, res: Response) => {
    const {categoryId, categoryName,type} = req.body;
    const controller = new AdminController(req, res)
    const response = await controller.createSFredTypes({categoryId,categoryName,type});
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/getSFredTypes',authenticateAdmin, async (req: Request | any, res: Response) => {
    const{pageNumber,pageSize,filter}=req.query
    const controller = new AdminController(req, res)
    const response = await controller.getSFredTypes(pageNumber,pageSize,filter);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.delete('/deleteSfredCategory',authenticateAdmin, async (req: Request | any, res: Response) => {
    const { id } = req.query;
    const controller = new AdminController(req, res)
    const response = await controller.deleteSfredCategory(id);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.put('/updateUsdcRequest', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { status, hashId,hashId2 } = req.body;
    const controller = new AdminController(req, res)
    const response = await controller.updateUsdcRequest({ status, hashId,hashId2});
    //const { status } = response;
    return responseWithStatus(res, response.status, response)
})
router.post('/srTokenMintTransaction',authenticateAdmin, async (req: Request | any, res: Response) => {
    const {walletAddress,numberOfTokens,hash } = req.body;
    const controller = new AdminController(req, res)
    const response = await controller.srTokenMintTransaction({walletAddress,numberOfTokens,hash});
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/getSrTokenTransaction',authenticateAdmin, async (req: Request | any, res: Response) => {
    const{pageNumber,pageSize}=req.query
    const controller = new AdminController(req, res)
    const response = await controller.getSrTokenTransaction(pageNumber,pageSize);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.post('/redTokenMintTransaction',authenticateAdmin, async (req: Request | any, res: Response) => {
    const {walletAddress,numberOfTokens,hash } = req.body;
    const controller = new AdminController(req, res)
    const response = await controller.redTokenMintTransaction({walletAddress,numberOfTokens,hash});
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/getRedTokenTransaction',authenticateAdmin, async (req: Request | any, res: Response) => {
    const{pageNumber,pageSize}=req.query
    const controller = new AdminController(req, res)
    const response = await controller.getRedTokenTransaction(pageNumber,pageSize);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.post('/changePassword', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { oldPassword,newPassword } = req.body;
    const controller = new AdminController(req, res)
    const response = await controller.changePassword({oldPassword,newPassword});
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.post('/createMpin', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { password, mpin, isMpinUsedForTransactions } = req.body;
    const controller = new AdminController(req, res);
    const response = await controller.createMpin({ password, mpin, isMpinUsedForTransactions });
    const { status } = response;
    return responseWithStatus(res, status, response);
})
router.post('/verifyMpin', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { mpin } = req.body;
    const controller = new AdminController(req, res);
    const response = await controller.verifyMpin({ mpin });
    const { status } = response;
    return responseWithStatus(res, status, response);
})
router.get('/checkMpin',authenticateAdmin, async (req: Request | any, res: Response) => {
    const controller = new AdminController(req, res)
    const response = await controller.checkMpin();
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.post('/changeMpin', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { oldMpin, newMpin } = req.body;
    const controller = new AdminController(req, res)
    const response = await controller.changeMpin({oldMpin, newMpin});
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.post('/enableDisableSecurity', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { value} = req.body;
    const controller = new AdminController(req, res)
    const response = await controller.enableDisableSecurity({value});
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.put('/securityOtp', authenticateAdmin, async (req: Request | any, res: Response) => {
    const controller = new AdminController(req, res);
    const response = await controller.securityOtp({});
    const { status } = response;
    return responseWithStatus(res, status, response);
})
router.post('/verifySecurityOtp',authenticateAdmin, async (req: Request | any, res: Response) => {
    const { otp,email } = req.body;
    const controller = new AdminController(req, res)
    const response = await controller.verifySecurityOtp({ otp,email});
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.put('/blockNft', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { isBlocked,id,type} = req.body;
    const controller = new AdminController(req, res);
    const response = await controller.blockNft({ isBlocked,id,type });
    const { status } = response;
    return responseWithStatus(res, status, response);
})
router.post('/adminRegister', authenticateAdmin, async (req: Request | any, res: Response) => {
    const {  firstName,lastName, email, password, confirmPassword,role,permission} = req.body;
    const controller = new AdminController(req, res)
    const response = await controller.adminRegister({ firstName,lastName, email, password, confirmPassword,role,permission});
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.put('/editProfileOfAdmin', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { id,firstName, lastName, email, password, confirmPassword, role, permission,isBlocked} = req.body;
    const controller = new AdminController(req, res)
    const response = await controller.editProfileOfAdmin({ id,firstName, lastName, email, password, confirmPassword, role, permission,isBlocked});
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.delete('/deleteProfile', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { userId } = req.query;
    const controller = new AdminController(req, res)
    const response = await controller.deleteProfile(userId);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/getAdminsByRole',authenticateAdmin, async (req: Request | any, res: Response) => {
    const{pageNumber,pageSize}=req.query
    const controller = new AdminController(req, res)
    const response = await controller.getAdminsByRole(pageNumber,pageSize);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/getAdminById',authenticateAdmin, async (req: Request | any, res: Response) => {
    const{id}=req.query
    const controller = new AdminController(req, res)
    const response = await controller.getAdminById(id);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
module.exports = router
