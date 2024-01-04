import express, { Request, Response } from 'express'
import ClientController from '../../controllers/transaction.controller'
import { authenticateClient} from '../../middlewares/auth.middleware'
import multerMiddleware from '../../middlewares/multer.middleware'
import { responseWithStatus } from '../../utils/response.util'
const router = express.Router()

router.post('/transactionOfBuyFutureRed', authenticateClient, async (req: Request | any, res: Response) => {
    const { redToken } = req.body;
    const controller = new ClientController(req, res);
    const response = await controller.transactionOfBuyFutureRed({ redToken });
    const { status } = response;
    return responseWithStatus(res, status, response);
})
router.post('/transactionToLeaseProperty', authenticateClient, async (req: Request | any, res: Response) => {
    const { amount,propertyId,accountType,agreementId } = req.body;
    const controller = new ClientController(req, res);
    const response = await controller.transactionToLeaseProperty({ amount,propertyId,accountType,agreementId });
    const { status } = response;
    return responseWithStatus(res, status, response);
})
router.get("/getLeaseTransactionsDetails", authenticateClient, async(req: Request | any, res: Response) => {
    const { pageNumber, pageSize } = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.getLeaseTransactionsDetails(pageNumber, pageSize);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/getRedAndSolosTransactionByUser', authenticateClient, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize } = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.getRedAndSolosTransactionByUser(pageNumber, pageSize);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.get('/getSolosTransactionByUser', authenticateClient, async (req: Request | any, res: Response) => {
    const { pageNumber, pageSize } = req.query;
    const controller = new ClientController(req, res)
    const response = await controller.getSolosTransactionByUser(pageNumber, pageSize);
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.post('/saveTransactionOfRedAndSoloReward', authenticateClient, async (req: Request | any, res: Response) => {
    const { userName,token,transactionType,walletAddress,hashId } = req.body;
    const controller = new ClientController(req, res);
    const response = await controller.saveTransactionOfRedAndSoloReward({ userName,token,transactionType,walletAddress,hashId });
    const { status } = response;
    return responseWithStatus(res, status, response);
})
module.exports = router