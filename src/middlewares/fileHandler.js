import multer from "multer";
import { v4 as uuidv4 } from 'uuid';

// Memory storage configuration
const storageConfig = multer.memoryStorage();

const imagefileSize = 10 * 1024 // * 1024 //   10KB
const vdofileSize = 1 * 1024 * 1024  // 1MB

const fileFilter = (req, file, cb) => {
    const imageFormats = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
    ];

    const vdoFormats = [
        'video/mp4',
        'video/mkv',
        'video/avi',
        'video/webm',
    ];

    if (imageFormats.includes(file.mimetype)) {
        req.fileSizeLimit = imagefileSize;
        cb(null, true);
    } else if (vdoFormats.includes(file.mimetype)) {
        req.fileSizeLimit = vdofileSize;
        cb(null, true);
    } else {
        cb(new Error('Invalid file format. Only JPEG, PNG, GIF for images and MP4, MKV, AVI, WEBM for videos are allowed.'));
    }
};

// Multer upload instance with dynamic file size limit
const uploader = multer({
    storage: storageConfig,
    fileFilter,
    limits: (req, file, cb) => {
        const sizeLimit = req.fileSizeLimit || vdofileSize;
        cb(null, { fileSize: sizeLimit });
    },
    // limits: {
    //     fileSize: 1 * 1024, // Set file size limit (5MB in this case)
    // },
});




/**
 * Middleware to upload a single image
 * @param {string} fileKeyName - The key name of the file field in the request
 * @returns {Function} - Express middleware for single file upload
 */
export const singleUploader = (fileKeyName) => {

    return (req, res, next) => {
        uploader.single(fileKeyName)(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // Multer-specific errors
                return res.status(400).json({ error: 1, messages: err.message });
            } else if (err) {
                // Custom errors (e.g., file format or size validation)
                return res.status(400).json({ messages: err.message });
            }

            if (req.file) {
                // console.log(req.file.originalname);
                const rendomStr = uuidv4().substring(0, 20);
                const extension = req.file.mimetype.split('/')[1];
                const fileName = `${Date.now()}${rendomStr}.${extension}`
                req.file.originalname = fileName;

                // console.log(req.file);
            }
            next();
        });
    }
};


/**
 * Middleware to upload multiple images
 * @param {string} fileKeyName - The key name of the file field in the request
 * @param {number} maxCount - Maximum number of files to upload
 * @returns {Function} - Express middleware for multiple file upload
 */
export const multipleUploader = (fileKeyName, maxCount = 5) => {
    return (req, res, next) => {
        uploader.array(fileKeyName, maxCount)(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // Multer-specific errors
                return res.status(400).json({ error: 1, messages: err.message });
            } else if (err) {
                // Custom errors (e.g., file format or size validation)
                return res.status(400).json({ messages: err.message });
            }

            if (req.files && req.files.length > 0) {
                req.files.forEach((file) => {
                    const rendomStr = uuidv4().substring(0, 20);
                    const extension = file.mimetype.split('/')[1];
                    const fileName = `${Date.now()}${rendomStr}.${extension}`;
                    file.originalname = fileName;
                });

                // console.log(req.files);

            }
            next();
        });
    };
};


