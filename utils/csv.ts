import { toIsoDate } from './dates';

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

const formatCsvValue = (value: any): string => {
    if (value === null || value === undefined || value === '') {
        return '"-"';
    }

    const stringValue = String(value).replace(/"/g, '""');

    return `"${stringValue}"`;
};

export const toCsv = (policies: any[]): string => {
    const rows = policies.map((policy) => [
        policy.customerName,
        policy.phone,
        policy.email,
        policy.policyNumber,
        policy.policyType,
        policy.insuranceCompany,
        toIsoDate(policy.startDate),
        toIsoDate(policy.expiryDate),
        policy.premiumAmount,
        policy.sumInsured,
        policy.vehicleNumber,
        policy.vehicleMakeModel,
        policy.nomineeName,
        toIsoDate(policy.policyIssuedOn),
        policy.agentName,
        policy.agentContact,
        toIsoDate(policy.uploadedAt),
    ]);

    const csvLines = [csvHeaders.map(formatCsvValue).join(',')];

    rows.forEach((row) => {
        csvLines.push(row.map(formatCsvValue).join(','));
    });

    return csvLines.join('\n');
};
