"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePolicy = exports.deletePolicy = exports.exportPoliciesCsv = exports.getPolicies = exports.savePolicy = exports.uploadPolicies = void 0;
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const Policy_1 = __importDefault(require("../models/Policy"));
const claudeService_1 = require("../services/claudeService");
const dates_1 = require("../utils/dates");
const csv_1 = require("../utils/csv");
const policyFields = [
    'customerName',
    'phone',
    'email',
    'address',
    'policyNumber',
    'policyType',
    'insuranceCompany',
    'startDate',
    'expiryDate',
    'premiumAmount',
    'sumInsured',
    'vehicleNumber',
    'vehicleMakeModel',
    'nomineeName',
    'policyIssuedOn',
    'agentName',
    'agentContact',
];
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sanitizeTextField = (value) => {
    if (value === undefined || value === '') {
        return null;
    }
    return value;
};
const mapExtractedPolicy = (data, rawExtractedText) => {
    const mappedPolicy = {};
    policyFields.forEach((fieldName) => {
        mappedPolicy[fieldName] = sanitizeTextField(data[fieldName]);
    });
    mappedPolicy.startDate = (0, dates_1.parseDateValue)(data.startDate);
    mappedPolicy.expiryDate = (0, dates_1.parseDateValue)(data.expiryDate);
    mappedPolicy.policyIssuedOn = (0, dates_1.parseDateValue)(data.policyIssuedOn);
    mappedPolicy.rawExtractedText = rawExtractedText;
    return mappedPolicy;
};
const processUploadedFile = async (file) => {
    const parsedPdf = await (0, pdf_parse_1.default)(file.buffer);
    const rawText = (parsedPdf.text || '').trim();
    if (rawText.length < 50) {
        throw new Error('This PDF appears to be scanned/image-based and cannot be processed automatically');
    }
    const extractedData = await (0, claudeService_1.extractPolicyFields)(rawText);
    return {
        fileName: file.originalname,
        status: 'success',
        message: 'Policy extracted successfully',
        extractedData: mapExtractedPolicy(extractedData, rawText),
    };
};
const uploadPolicies = async (req, res, next) => {
    try {
        const files = req.files || [];
        if (!files.length) {
            return res.status(400).json({
                success: false,
                message: 'Please upload at least one PDF file',
            });
        }
        const results = [];
        for (const file of files) {
            try {
                const result = await processUploadedFile(file);
                results.push(result);
            }
            catch (error) {
                results.push({
                    fileName: file.originalname,
                    status: 'error',
                    message: error.message || 'Failed to process PDF',
                });
            }
        }
        return res.status(200).json({
            success: true,
            message: 'Upload processing completed',
            results,
        });
    }
    catch (error) {
        return next(error);
    }
};
exports.uploadPolicies = uploadPolicies;
const savePolicy = async (req, res, next) => {
    try {
        const payload = req.body?.policies ?? req.body?.policyData ?? req.body;
        const policyInputs = Array.isArray(payload) ? payload : [payload];
        const savedPolicies = [];
        for (const policyInput of policyInputs) {
            const sourceData = policyInput?.extractedData || policyInput;
            const policy = await Policy_1.default.create({
                customerName: sanitizeTextField(sourceData?.customerName),
                phone: sanitizeTextField(sourceData?.phone),
                email: sanitizeTextField(sourceData?.email),
                address: sanitizeTextField(sourceData?.address),
                policyNumber: sanitizeTextField(sourceData?.policyNumber),
                policyType: sanitizeTextField(sourceData?.policyType),
                insuranceCompany: sanitizeTextField(sourceData?.insuranceCompany),
                startDate: (0, dates_1.parseDateValue)(sourceData?.startDate),
                expiryDate: (0, dates_1.parseDateValue)(sourceData?.expiryDate),
                premiumAmount: sanitizeTextField(sourceData?.premiumAmount),
                sumInsured: sanitizeTextField(sourceData?.sumInsured),
                vehicleNumber: sanitizeTextField(sourceData?.vehicleNumber),
                vehicleMakeModel: sanitizeTextField(sourceData?.vehicleMakeModel),
                nomineeName: sanitizeTextField(sourceData?.nomineeName),
                policyIssuedOn: (0, dates_1.parseDateValue)(sourceData?.policyIssuedOn),
                agentName: sanitizeTextField(sourceData?.agentName),
                agentContact: sanitizeTextField(sourceData?.agentContact),
                rawExtractedText: sanitizeTextField(sourceData?.rawExtractedText),
            });
            savedPolicies.push(policy);
        }
        return res.status(201).json({
            success: true,
            data: Array.isArray(payload) ? savedPolicies : savedPolicies[0],
        });
    }
    catch (error) {
        return next(error);
    }
};
exports.savePolicy = savePolicy;
const buildPolicyQuery = (queryParams) => {
    const query = {};
    if (queryParams.name) {
        query.customerName = { $regex: escapeRegExp(queryParams.name), $options: 'i' };
    }
    if (queryParams.policyType) {
        query.policyType = queryParams.policyType;
    }
    if (queryParams.insuranceCompany) {
        query.insuranceCompany = queryParams.insuranceCompany;
    }
    if (queryParams.month && queryParams.year) {
        const dateRange = (0, dates_1.buildMonthRange)(queryParams.year, queryParams.month);
        if (dateRange) {
            query.expiryDate = {
                $gte: dateRange.start,
                $lte: dateRange.end,
            };
        }
    }
    else if (queryParams.month || queryParams.year) {
        const year = queryParams.year || new Date().getFullYear();
        const month = queryParams.month || new Date().getMonth() + 1;
        const dateRange = (0, dates_1.buildMonthRange)(year, month);
        if (dateRange) {
            query.startDate = {
                $gte: dateRange.start,
                $lte: dateRange.end,
            };
        }
    }
    return query;
};
const getPolicies = async (req, res, next) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const sortBy = ['expiryDate', 'uploadedAt'].includes(req.query.sortBy) ? req.query.sortBy : 'uploadedAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const query = buildPolicyQuery(req.query);
        const [total, policies] = await Promise.all([
            Policy_1.default.countDocuments(query),
            Policy_1.default.find(query)
                .sort({ [sortBy]: sortOrder })
                .skip((page - 1) * limit)
                .limit(limit),
        ]);
        return res.status(200).json({
            success: true,
            data: policies,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(Math.ceil(total / limit), 1),
            },
        });
    }
    catch (error) {
        return next(error);
    }
};
exports.getPolicies = getPolicies;
const exportPoliciesCsv = async (req, res, next) => {
    try {
        const query = buildPolicyQuery(req.query);
        const policies = await Policy_1.default.find(query).sort({ uploadedAt: -1 });
        const csvContent = (0, csv_1.toCsv)(policies);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="policies.csv"');
        return res.status(200).send(csvContent);
    }
    catch (error) {
        return next(error);
    }
};
exports.exportPoliciesCsv = exportPoliciesCsv;
const deletePolicy = async (req, res, next) => {
    try {
        const deletedPolicy = await Policy_1.default.findByIdAndDelete(req.params.id);
        if (!deletedPolicy) {
            return res.status(404).json({
                success: false,
                message: 'Policy not found',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Policy deleted successfully',
        });
    }
    catch (error) {
        return next(error);
    }
};
exports.deletePolicy = deletePolicy;
const updatePolicy = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Parse date strings to proper Date objects if present
        if (updateData.startDate)
            updateData.startDate = (0, dates_1.parseDateValue)(updateData.startDate);
        if (updateData.expiryDate)
            updateData.expiryDate = (0, dates_1.parseDateValue)(updateData.expiryDate);
        if (updateData.policyIssuedOn)
            updateData.policyIssuedOn = (0, dates_1.parseDateValue)(updateData.policyIssuedOn);
        const updatedPolicy = await Policy_1.default.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
        if (!updatedPolicy) {
            return res.status(404).json({
                success: false,
                message: 'Policy not found',
            });
        }
        return res.status(200).json({
            success: true,
            data: updatedPolicy,
        });
    }
    catch (error) {
        return next(error);
    }
};
exports.updatePolicy = updatePolicy;
//# sourceMappingURL=policiesController.js.map