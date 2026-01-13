import { Router } from 'express';
import { upload } from '../config/upload';
import { uploadImage } from '../controllers/uploadController';

const router = Router();

// Single image upload endpoint
router.post('/image', upload.single('image'), uploadImage);

export default router;
