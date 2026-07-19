import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        message: err.message,
    });
};
