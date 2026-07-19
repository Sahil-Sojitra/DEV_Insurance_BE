"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDigitBusinessPolicy = void 0;
const baseParser_1 = require("./baseParser");
const extractDigitBusinessQuoteNo = (text) => {
    const value = (0, baseParser_1.findValueNearLabel)(text, ['quote no'], { maxLookahead: 2 });
    if (value) {
        const match = value.match(/([a-zA-Z]\d{9,11})/);
        if (match)
            return match[1].toUpperCase();
    }
    const match = text.match(/([a-zA-Z]\d{9,11})/);
    if (match)
        return match[1].toUpperCase();
    return null;
};
const extractDigitBusinessDates = (text) => {
    const value = (0, baseParser_1.findValueNearLabel)(text, ['policy period'], { maxLookahead: 2 });
    if (value) {
        // Try to match DD-MMM-YYYY even without word boundaries
        const dateMatches = Array.from(value.matchAll(/(\d{1,2}-[A-Za-z]{3}-\d{4})/gi));
        if (dateMatches.length >= 2) {
            return {
                start: (0, baseParser_1.parseDateFromText)(dateMatches[0][1]),
                end: (0, baseParser_1.parseDateFromText)(dateMatches[dateMatches.length - 1][1])
            };
        }
    }
    return { start: null, end: null };
};
const extractDigitBusinessPremium = (text) => {
    const value = (0, baseParser_1.findValueNearLabel)(text, ['final premium'], {
        maxLookahead: 2,
        filter: (val) => /((?:₹|inr|rs\.?|usd|eur|`|')?\s*[\d,]{3,}(?:\.\d{1,2})?)/i.test(val)
    });
    if (value) {
        const match = value.match(/((?:₹|inr|rs\.?|usd|eur|`|')?\s*[\d,]{3,}(?:\.\d{1,2})?)/i);
        if (match)
            return match[1].replace(/[`']/g, '').replace(/\s+/g, ' ').trim();
    }
    return null;
};
const extractDigitBusinessSumInsured = (text) => {
    const value = (0, baseParser_1.findValueNearLabel)(text, ['total sum insured'], {
        maxLookahead: 1,
        filter: (val) => /[\d,]{4,}/.test(val)
    });
    if (value) {
        const match = value.match(/([\d,]+)/);
        if (match)
            return match[1];
    }
    return null;
};
const extractDigitBusinessName = (text) => {
    const nameLine1 = (0, baseParser_1.findValueNearLabel)(text, ['1) proposer name'], { maxLookahead: 2 });
    if (nameLine1) {
        return nameLine1;
    }
    return null;
};
const extractDigitBusinessAddress = (text) => {
    return (0, baseParser_1.findValueNearLabel)(text, ['12) address of the premises'], {
        maxLookahead: 4,
        filter: (val) => val.length > 10 && !val.toLowerCase().includes('to be insured')
    });
};
const parseDigitBusinessPolicy = (documentText) => {
    const dates = extractDigitBusinessDates(documentText);
    return {
        customerName: (0, baseParser_1.cleanFieldValue)(extractDigitBusinessName(documentText)),
        phone: (0, baseParser_1.cleanFieldValue)((0, baseParser_1.findValueNearLabel)(documentText, ['5) mobile no'], { maxLookahead: 2 })),
        email: (0, baseParser_1.cleanFieldValue)((0, baseParser_1.findValueNearLabel)(documentText, ['6) email id'], { maxLookahead: 2 })),
        address: (0, baseParser_1.cleanFieldValue)(extractDigitBusinessAddress(documentText)),
        policyNumber: (0, baseParser_1.cleanFieldValue)(extractDigitBusinessQuoteNo(documentText)),
        policyType: 'Commercial Package',
        insuranceCompany: 'Go Digit General Insurance',
        startDate: dates.start,
        expiryDate: dates.end,
        premiumAmount: (0, baseParser_1.cleanFieldValue)(extractDigitBusinessPremium(documentText)),
        sumInsured: (0, baseParser_1.cleanFieldValue)(extractDigitBusinessSumInsured(documentText)),
        vehicleNumber: null, // Commercial policy doesn't have vehicle number
        vehicleMakeModel: null,
        nomineeName: null,
        policyIssuedOn: null,
        agentName: null, // Agent name is mixed in with quote no in this format
        agentContact: null,
    };
};
exports.parseDigitBusinessPolicy = parseDigitBusinessPolicy;
