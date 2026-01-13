import { Request, Response } from 'express';

// Extend Request type to include file property from multer
interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

export const uploadImage = async (req: Request, res: Response) => {
    try {
        const multerReq = req as MulterRequest;

        if (!multerReq.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Return the file path that can be accessed via the server
        const filePath = `/uploads/inventory/${multerReq.file.filename}`;

        res.json({
            message: 'File uploaded successfully',
            filePath: filePath,
            filename: multerReq.file.filename
        });
    } catch (err: any) {
        console.error('Upload error:', err.message);
        res.status(500).json({ message: 'Error uploading file' });
    }
};
