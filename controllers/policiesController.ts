import { Request, Response, NextFunction } from 'express';
import pdfParse from 'pdf-parse';

import Policy, { IPolicy } from '../models/Policy';
import { extractPolicyFields } from '../services/claudeService';
import { buildMonthRange, parseDateValue } from '../utils/dates';
import { toCsv } from '../utils/csv';

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

const escapeRegExp = (value: any) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sanitizeTextField = (value: any): string | null => {
    if (value === undefined || value === '') {
        return null;
    }

    return value;
};

const mapExtractedPolicy = (data: any, rawExtractedText: string): Record<string, any> => {
    const mappedPolicy: Record<string, any> = {};

    policyFields.forEach((fieldName) => {
        mappedPolicy[fieldName] = sanitizeTextField(data[fieldName]);
    });

    mappedPolicy.startDate = parseDateValue(data.startDate);
    mappedPolicy.expiryDate = parseDateValue(data.expiryDate);
    mappedPolicy.policyIssuedOn = parseDateValue(data.policyIssuedOn);
    mappedPolicy.rawExtractedText = rawExtractedText;

    return mappedPolicy;
};

const processUploadedFile = async (file: Express.Multer.File): Promise<any> => {
    const parsedPdf = await pdfParse(file.buffer);
    const rawText = (parsedPdf.text || '').trim();

    if (rawText.length < 50) {
        throw new Error('This PDF appears to be scanned/image-based and cannot be processed automatically');
    }

    const extractedData = await extractPolicyFields(rawText);

    return {
        fileName: file.originalname,
        status: 'success',
        message: 'Policy extracted successfully',
        extractedData: mapExtractedPolicy(extractedData, rawText),
    };
};

export const uploadPolicies = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const files = (req.files as Express.Multer.File[]) || [];

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
            } catch (error: any) {
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
    } catch (error) {
        return next(error);
    }
};

export const savePolicy = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload = req.body?.policies ?? req.body?.policyData ?? req.body;
        const policyInputs = Array.isArray(payload) ? payload : [payload];

        const savedPolicies = [];

        for (const policyInput of policyInputs) {
            const sourceData = policyInput?.extractedData || policyInput;

            const policy = await Policy.create({
                customerName: sanitizeTextField(sourceData?.customerName),
                phone: sanitizeTextField(sourceData?.phone),
                email: sanitizeTextField(sourceData?.email),
                address: sanitizeTextField(sourceData?.address),
                policyNumber: sanitizeTextField(sourceData?.policyNumber),
                policyType: sanitizeTextField(sourceData?.policyType),
                insuranceCompany: sanitizeTextField(sourceData?.insuranceCompany),
                startDate: parseDateValue(sourceData?.startDate),
                expiryDate: parseDateValue(sourceData?.expiryDate),
                premiumAmount: sanitizeTextField(sourceData?.premiumAmount),
                sumInsured: sanitizeTextField(sourceData?.sumInsured),
                vehicleNumber: sanitizeTextField(sourceData?.vehicleNumber),
                vehicleMakeModel: sanitizeTextField(sourceData?.vehicleMakeModel),
                nomineeName: sanitizeTextField(sourceData?.nomineeName),
                policyIssuedOn: parseDateValue(sourceData?.policyIssuedOn),
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
    } catch (error) {
        return next(error);
    }
};

const buildPolicyQuery = (queryParams: any) => {
    const query: any = {};

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
        const dateRange = buildMonthRange(queryParams.year as string, queryParams.month as string);

        if (dateRange) {
            query.expiryDate = {
                $gte: dateRange.start,
                $lte: dateRange.end,
            };
        }
    } else if (queryParams.month || queryParams.year) {
        const year = queryParams.year || new Date().getFullYear();
        const month = queryParams.month || new Date().getMonth() + 1;
        const dateRange = buildMonthRange(year as string, month as string);
        if (dateRange) {
             query.startDate = {
                 $gte: dateRange.start,
                 $lte: dateRange.end,
             };
        }
    }

    return query;
};

export const getPolicies = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = Math.max(Number(req.query.page as string) || 1, 1);
        const limit = Math.max(Number(req.query.limit as string) || 10, 1);
        const sortBy = ['expiryDate', 'uploadedAt'].includes(req.query.sortBy as string) ? req.query.sortBy as string : 'uploadedAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const query = buildPolicyQuery(req.query);

        const [total, policies] = await Promise.all([
            Policy.countDocuments(query),
            Policy.find(query)
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
    } catch (error) {
        return next(error);
    }
};

export const exportPoliciesCsv = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = buildPolicyQuery(req.query);
        const policies = await Policy.find(query).sort({ uploadedAt: -1 });

        const csvContent = toCsv(policies);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="policies.csv"');

        return res.status(200).send(csvContent);
    } catch (error) {
        return next(error);
    }
};

export const deletePolicy = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const deletedPolicy = await Policy.findByIdAndDelete(req.params.id);

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
    } catch (error) {
        return next(error);
    }
};

export const updatePolicy = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Parse date strings to proper Date objects if present
        if (updateData.startDate) updateData.startDate = parseDateValue(updateData.startDate);
        if (updateData.expiryDate) updateData.expiryDate = parseDateValue(updateData.expiryDate);
        if (updateData.policyIssuedOn) updateData.policyIssuedOn = parseDateValue(updateData.policyIssuedOn);

        const updatedPolicy = await Policy.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

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
    } catch (error) {
        return next(error);
    }
};
