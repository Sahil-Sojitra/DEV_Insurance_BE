"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCsv = void 0;
const dates_1 = require("./dates");
const csvHeaders = [
    'Customer Name',
    'Phone Number',
    'Email',
    'Policy Number',
    'Policy Type',
    'Insurance Company',
    'Start Date',
    'Expiry Date',
    'Premium Amount',
    'Sum Insured',
    'Vehicle Number',
    'Vehicle Make/Model',
    'Nominee Name',
    'Policy Issued On',
    'Agent Name',
    'Agent Contact',
    'Upload Date',
];
const formatCsvValue = (value) => {
    if (value === null || value === undefined || value === '') {
        return '"-"';
    }
    const stringValue = String(value).replace(/"/g, '""');
    return `"${stringValue}"`;
};
const toCsv = (policies) => {
    const rows = policies.map((policy) => [
        policy.customerName,
        policy.phone,
        policy.email,
        policy.policyNumber,
        policy.policyType,
        policy.insuranceCompany,
        (0, dates_1.toIsoDate)(policy.startDate),
        (0, dates_1.toIsoDate)(policy.expiryDate),
        policy.premiumAmount,
        policy.sumInsured,
        policy.vehicleNumber,
        policy.vehicleMakeModel,
        policy.nomineeName,
        (0, dates_1.toIsoDate)(policy.policyIssuedOn),
        policy.agentName,
        policy.agentContact,
        (0, dates_1.toIsoDate)(policy.uploadedAt),
    ]);
    const csvLines = [csvHeaders.map(formatCsvValue).join(',')];
    rows.forEach((row) => {
        csvLines.push(row.map(formatCsvValue).join(','));
    });
    return csvLines.join('\n');
};
exports.toCsv = toCsv;
//# sourceMappingURL=csv.js.map