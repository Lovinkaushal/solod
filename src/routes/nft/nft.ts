import express, { Request, Response } from 'express'
import FredController from '../../controllers/fred.controller'
import { authenticateClient, authenticateAdmin, authenticateBoth } from '../../middlewares/auth.middleware'
import multerMiddleware from '../../middlewares/multer.middleware'
import { responseWithStatus } from '../../utils/response.util'
const router = express.Router()

router.post('/createUpdateFredNFT', multerMiddleware.single('nft_image'), authenticateAdmin, async (req: Request | any, res: Response) => {
    const {description, fred_name, benefit_month, years, amount, benefit_amount, purchase_limit, start_month, end_year, type, fred_nft_id,tokenId,contractAddress,maturityDate } = req.body;
    const controller = new FredController(req, res)
    const response = await controller.createUpdateFredNFT(description, fred_name,benefit_month, years, amount, benefit_amount, purchase_limit, start_month, end_year, type, fred_nft_id,tokenId,contractAddress,maturityDate, req?.file);
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.get('/listFredNFT', authenticateBoth, async (req: Request | any, res: Response) => {
    const { page_number, page_limit,filter,sort } = req.query;
    const controller = new FredController(req, res)
    const response = await controller.listFredNFT(page_number, page_limit,filter, sort);
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.delete('/deleteFredNFT', authenticateAdmin, async (req: Request | any, res: Response) => {
    const { id } = req.query;
    const controller = new FredController(req, res)
    const response = await controller.deleteFredNFT(id);
    const { status } = response;
    return responseWithStatus(res, status, response)
})

router.post('/nftTransfer', authenticateBoth, async (req: Request | any, res: Response) => {
    const { receiverId, hashId, nftDetailId, amount, type,signerAddress } = req.body;
    const controller = new FredController(req, res)
    const response = await controller.nftTransfer({receiverId, hashId, nftDetailId, amount, type,signerAddress});
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.post('/purchaseNftAndFredFromUser', authenticateBoth, async (req: Request | any, res: Response) => {
    const { receiverId, hashId, nftDetailId, amount, type } = req.body;
    const controller = new FredController(req, res)
    const response = await controller.purchaseNftAndFredFromUser({receiverId, hashId, nftDetailId, amount, type});
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.put('/airdropFredNft', authenticateBoth, async (req: Request | any, res: Response) => {
    const { FredId, userId ,contractAddress} = req.body;
    const controller = new FredController(req, res)
    const response = await controller.airdropFredNft({ FredId, userId,contractAddress});
    const { status } = response;
    return responseWithStatus(res, status, response)
})
router.put('/airdropNft', authenticateBoth, async (req: Request | any, res: Response) => {
    const { NftId, userId,contractAddress} = req.body;
    const controller = new FredController(req, res)
    const response = await controller.airdropNft({ NftId, userId,contractAddress});
    const { status } = response;
    return responseWithStatus(res, status, response)
})

module.exports = router
