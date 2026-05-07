const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { authUser } = require('../auth/checkAuth');

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ được upload file ảnh'), false);
        }
    },
});

// Upload 1 ảnh
router.post('/single', authUser, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng chọn ảnh' });
        }

        const folder = req.body.folder || 'ql-kho/products';

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: 'image',
                    transformation: [
                        { width: 800, height: 800, crop: 'limit', quality: 'auto' },
                    ],
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                },
            );
            stream.end(req.file.buffer);
        });

        res.status(200).json({
            status: 200,
            message: 'Upload ảnh thành công',
            metadata: {
                url: result.secure_url,
                publicId: result.public_id,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Upload ảnh thất bại', error: error.message });
    }
});

// Upload nhiều ảnh
router.post('/multiple', authUser, upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Vui lòng chọn ảnh' });
        }

        const folder = req.body.folder || 'ql-kho/products';

        const uploadPromises = req.files.map((file) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder,
                        resource_type: 'image',
                        transformation: [
                            { width: 800, height: 800, crop: 'limit', quality: 'auto' },
                        ],
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve({ url: result.secure_url, publicId: result.public_id });
                    },
                );
                stream.end(file.buffer);
            });
        });

        const results = await Promise.all(uploadPromises);

        res.status(200).json({
            status: 200,
            message: 'Upload ảnh thành công',
            metadata: results,
        });
    } catch (error) {
        res.status(500).json({ message: 'Upload ảnh thất bại', error: error.message });
    }
});

module.exports = router;
