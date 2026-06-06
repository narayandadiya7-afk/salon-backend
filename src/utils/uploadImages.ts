import multer , {StorageEngine} from "multer";
import path from "path";
import express from "express";
const jwt = require("jsonwebtoken");
const fs = require("fs");

class uploadImages{
 // uploading genre images - multiple images
 static uploadGenreImages() {
    // Set up storage options for multer
    const storage: StorageEngine = multer.diskStorage({
        destination: (
            req: express.Request,
            file: Express.Multer.File,
            cb: (error: Error | null, destination: string) => void
        ) => {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY, {
                issuer: process.env.JWT_ISSUER,
                audience: process.env.JWT_AUDIENCE,
            });

            const userId = decoded.id;
            const userName = decoded.userName;

            // Base uploads directory
            const uploadDir = `uploads/`;
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir);
            }

            // Create personal folder for each user using their username and id
            const personalFolder = path.join(uploadDir, `${userName}_${userId}/`);
            
            if (!fs.existsSync(personalFolder)) {
                fs.mkdirSync(personalFolder);
            }

            cb(null, personalFolder);
        },

        filename: (
            req: express.Request,
            file: Express.Multer.File,
            cb: (error: Error | null, filename: string) => void
        ) => {
            // Rename the file with the current timestamp and original name
            cb(null, Date.now() + "-" + file.originalname);
        },
    });

    // Initialize multer with storage options, allowing for multiple file uploads
    const upload = multer({
        storage,
        limits: {
            // setting max imagesize 
            fileSize: 10 * 1024 * 1024,
        },   
        //  setting the number of images user can upload
    }).array('files', 10);

    return upload;
}
};