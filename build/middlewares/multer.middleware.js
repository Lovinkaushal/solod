"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const multer = require("multer");
const path = require('path');
exports.default = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1048576 },
    fileFilter: function (req, file, callback) {
        const mime = file.mimetype;
        if (!mime.includes('image/png') && !mime.includes('image/jpeg') && !mime.includes('image/jpg') && !mime.includes('video/mp4') && !mime.includes('application/pdf')) {
            req.filevalidationerror = "Image mime type not allowed!!";
            return callback(null, false);
        }
        callback(null, true);
    }
});
