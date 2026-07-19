import express, { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';

import {
    deletePolicy,
    exportPoliciesCsv,
    getPolicies,
    savePolicy,
    uploadPolicies,
    updatePolicy,
} from '../controllers/policiesController';

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        if (file.mimetype !== 'application/pdf') {
            const error: any = new Error('Only PDF files are allowed');
            error.statusCode = 400;
            return cb(error);
        }

        return cb(null, true);
    },
});

const router = express.Router();

router.post('/upload', upload.array('files'), uploadPolicies);
router.post('/save', savePolicy);
router.get('/', getPolicies);
router.get('/export/csv', exportPoliciesCsv);
router.put('/:id', updatePolicy);
router.delete('/:id', deletePolicy);

export default router;