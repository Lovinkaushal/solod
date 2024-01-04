import express, { Request, Response } from 'express'
import FredController from '../../controllers/fred.controller'
import { authenticateClient, authenticateAdmin, authenticateBoth } from '../../middlewares/auth.middleware'
import multerMiddleware from '../../middlewares/multer.middleware'
import { responseWithStatus } from '../../utils/response.util'
import superFredController from '../../controllers/superFred.controller'
const router = express.Router()

router.post('/createSuperFred', multerMiddleware.single('image'),authenticateAdmin, async (req: Request | any, res: Response) => {
    const {type,series,description,price,limit,quantity,rewardDistribution,rewardSR,dateOfMaturity,maturityAmount,ipfs } = req.body;
    const controller = new superFredController(req, res)
    const response = await controller.createSuperFred(type,series,description,price,limit,quantity,rewardDistribution,rewardSR,dateOfMaturity,maturityAmount,ipfs,req?.file);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/superFredData', authenticateBoth, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize} = req.query;
    const controller = new superFredController(req, res)
    const response = await controller.superFredData(pageNumber, pageSize);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.post('/buySuperFred', authenticateClient, async (req: Request | any, res: Response) => {
    const { id, price, quantity, walletAddress, } = req.body;
    const controller = new superFredController(req, res)
    const response = await controller.buySuperFred({ id, price, quantity, walletAddress, });
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/superFredDataOfSoloMarketPlace', authenticateClient, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize,sort,filter} = req.query;
    const controller = new superFredController(req, res)
    const response = await controller.superFredDataOfSoloMarketPlace(pageNumber, pageSize,sort,filter);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/getUserSuperRed', authenticateClient, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize,filter} = req.query;
    const controller = new superFredController(req, res)
    const response = await controller.getUserSuperRed(pageNumber, pageSize,filter);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.post('/airdropSfred',authenticateBoth, async (req: Request | any, res: Response) => {
    const {sId, userId, quantity } = req.body;
    const controller = new superFredController(req, res)
    const response = await controller.airdropSfred({sId, userId, quantity});
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.post('/SFredSellinMarketPlace', multerMiddleware.single('image'),authenticateClient, async (req: Request | any, res: Response) => {
    const {superFredId,price,quantity,walletAddress} = req.body;
    const controller = new superFredController(req, res)
    const response = await controller.SFredSellinMarketPlace({superFredId,price,quantity,walletAddress});
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/getSFredInMarketPlace', authenticateBoth, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize,filter} = req.query;
    const controller = new superFredController(req, res)
    const response = await controller.getSFredInMarketPlace(pageNumber, pageSize,filter);
    const { status } = response;
    return responseWithStatus(res, status, response)
})

module.exports = router