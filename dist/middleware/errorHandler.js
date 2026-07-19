"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message,
    });
};
exports.errorHandler = errorHandler;
