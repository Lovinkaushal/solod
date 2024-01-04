const multer = require("multer");
const path = require('path')

export default multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1048576 }, // 10 mb
    fileFilter: function (req: any, file: Express.Multer.File, callback: any) {
        const mime = file.mimetype;
        if (!mime.includes('image/png') && !mime.includes('image/jpeg') && !mime.includes('image/jpg') && !mime.includes('video/mp4') && !mime.includes('application/pdf')) {
            req.filevalidationerror = "Image mime type not allowed!!";
            return callback(null, false);
        }
        callback(null, true);
    }
});
