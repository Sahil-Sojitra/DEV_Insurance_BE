"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDigitMotorPolicy = void 0;
const baseParser_1 = require("./baseParser");
const extractDigitMotorPolicyNumber = (text) => {
    // Digit motor policies usually start with D or P and have 9+ digits, e.g. D277842316
    const match = text.match(/\b([a-zA-Z]\d{9,11})\b/);
    if (match)
        return match[1].toUpperCase();
    return null;
};
const extractDigitMotorDates = (text) => {
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Period of Policy')) {
            const dateLines = lines.slice(i, i + 10).join(' ');
            const dates = (0, baseParser_1.extractDatesFromText)(dateLines);
            if (dates.length >= 2) {
                return { start: dates[0], end: dates[dates.length - 1] };
            }
        }
    }
    // Fallback: look at the summary line at the bottom
    const summaryLineMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\s+(\d{4}-\d{2}-\d{2})\b/);
    if (summaryLineMatch) {
        return { start: summaryLineMatch[1], end: summaryLineMatch[2] };
    }
    return { start: null, end: null };
};
const extractDigitMotorPremium = (text) => {
    // Digit Motor Premium is usually near "Gross Premium" or "Final Premium"
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('final premium') || lines[i].toLowerCase().includes('gross premium') || lines[i].toLowerCase().includes('net premium')) {
            for (let j = 1; j <= 5; j++) {
                if (lines[i + j]) {
                    // Look for a number on its own line
                    const m = lines[i + j].match(/^([\d,]{3,}(?:\.\d{2}))$/);
                    if (m)
                        return m[1].replace(/,/g, '');
                }
            }
        }
    }
    // Fallback regex if it's not on its own line
    const value = (0, baseParser_1.findValueNearLabel)(text, ['gross premium', 'final premium'], {
        maxLookahead: 5,
        filter: (val) => /((?:₹|inr|rs\.?|usd|eur|`|')?\s*[\d,]{3,}(?:\.\d{2}))/i.test(val) // ensure .00 or .XX
    });
    if (value) {
        // match the LAST amount in case it's a smushed line like 123316.000.00298.44...3912.88
        const matches = Array.from(value.matchAll(/([\d,]{3,}(?:\.\d{2}))/g));
        if (matches.length > 0)
            return matches[matches.length - 1][1].replace(/,/g, '');
    }
    return null;
};
const extractDigitMotorVehicleNumber = (text) => {
    const value = (0, baseParser_1.findValueNearLabel)(text, ['vehicle registration no', 'registration no'], {
        maxLookahead: 2,
        filter: (val) => /[A-Z0-9]{4,}/i.test(val.replace(/[^A-Z0-9]/ig, ''))
    });
    if (value)
        return value.replace(/[^A-Z0-9]/ig, '').toUpperCase();
    const match = text.match(/\b([A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{4})\b/i);
    return match ? match[1].replace(/\s+/g, '').toUpperCase() : null;
};
const extractDigitMotorName = (text) => {
    return (0, baseParser_1.findValueNearLabel)(text, ['name'], { maxLookahead: 2, exactMatch: true, filter: (v) => v.length > 3 && !v.toLowerCase().includes('nominee') });
};
const extractDigitMotorMakeModel = (text) => {
    // MakeFORDModel/Vehicle Variant (Sub-Type)ECOSPORT/1.5 TDCi Ambiente
    const match = text.replace(/\s+/g, ' ').match(/Make(.*?)Model.*?\)(.*?)(?:Engine|Cubic|$)/i);
    if (match) {
        return (match[1].trim() + ' ' + match[2].trim()).trim();
    }
    return null;
};
const parseDigitMotorPolicy = (documentText) => {
    const dates = extractDigitMotorDates(documentText);
    let policyType = 'Motor';
    if (documentText.toLowerCase().includes('liability only') || documentText.toLowerCase().includes('third-party')) {
        policyType = 'Motor Third Party';
    }
    else if (documentText.toLowerCase().includes('package') || documentText.toLowerCase().includes('comprehensive')) {
        policyType = 'Motor Comprehensive Package';
    }
    return {
        customerName: (0, baseParser_1.cleanFieldValue)(extractDigitMotorName(documentText)),
        phone: (0, baseParser_1.cleanFieldValue)((0, baseParser_1.findValueNearLabel)(documentText, ['mobile'], { maxLookahead: 2, exactMatch: true, filter: (v) => /\d{4}/.test(v) || /x/i.test(v) })),
        email: (0, baseParser_1.cleanFieldValue)((0, baseParser_1.findValueNearLabel)(documentText, ['email'], { maxLookahead: 2, exactMatch: true, filter: (v) => v.includes('@') })),
        address: (0, baseParser_1.cleanFieldValue)((0, baseParser_1.findValueNearLabel)(documentText, ['address'], { maxLookahead: 3, exactMatch: true })),
        policyNumber: (0, baseParser_1.cleanFieldValue)(extractDigitMotorPolicyNumber(documentText)),
        policyType,
        insuranceCompany: 'Go Digit General Insurance',
        startDate: dates.start,
        expiryDate: dates.end,
        premiumAmount: (0, baseParser_1.cleanFieldValue)(extractDigitMotorPremium(documentText)),
        sumInsured: null, // Liability only usually has no IDV
        vehicleNumber: (0, baseParser_1.cleanFieldValue)(extractDigitMotorVehicleNumber(documentText)),
        vehicleMakeModel: (0, baseParser_1.cleanFieldValue)(extractDigitMotorMakeModel(documentText)),
        nomineeName: (0, baseParser_1.cleanFieldValue)((0, baseParser_1.findValueNearLabel)(documentText, ['name of nominee'], { maxLookahead: 2 })),
        policyIssuedOn: (0, baseParser_1.cleanFieldValue)((0, baseParser_1.findValueNearLabel)(documentText, ['policy issue date'], { maxLookahead: 10, filter: (v) => (0, baseParser_1.extractDatesFromText)(v).length > 0 })),
        agentName: (0, baseParser_1.cleanFieldValue)((0, baseParser_1.findValueNearLabel)(documentText, ['partner name'], { maxLookahead: 2 })),
        agentContact: (0, baseParser_1.cleanFieldValue)((0, baseParser_1.findValueNearLabel)(documentText, ['partner mobile no'], { maxLookahead: 2 })),
    };
};
exports.parseDigitMotorPolicy = parseDigitMotorPolicy;
