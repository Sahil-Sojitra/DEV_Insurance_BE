"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLibertyPolicy = void 0;
const baseParser_1 = require("./baseParser");
const extractPhone = (text) => {
    const value = (0, baseParser_1.findValueNearLabel)(text, ['mobile', 'mobile no', 'mobile number', 'contact number', 'phone', 'telephone'], {
        filter: (val) => /\b(?:\+?91[-\s]?)?[6-9]\d{9}\b/.test(val) || /x+\d{4}/i.test(val)
    });
    if (value) {
        const match = value.match(/\b(?:\+?91[-\s]?)?[6-9]\d{9}\b/);
        if (match)
            return match[0].replace(/\s+/g, '');
        const maskedMatch = value.match(/x+\d{4}/i);
        if (maskedMatch)
            return maskedMatch[0];
    }
    const match = text.match(/\b(?:\+?91[-\s]?)?[6-9]\d{9}\b/);
    if (match && !match[0].startsWith('1800'))
        return match[0].replace(/\s+/g, '');
    return null;
};
const extractEmail = (text) => {
    const regex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig;
    const value = (0, baseParser_1.findValueNearLabel)(text, ['email', 'email id', 'mail id'], {
        filter: (val) => regex.test(val) && !/@(godigit\.com|libertyinsurance\.in|hdfcergo\.com|icicilombard\.com|company)/i.test(val)
    });
    if (value) {
        const match = value.match(regex);
        if (match)
            return match[0];
    }
    const matches = text.match(regex);
    if (matches) {
        for (const match of matches) {
            if (!/@(godigit\.com|libertyinsurance\.in|hdfcergo\.com|icicilombard\.com|company)/i.test(match)) {
                return match;
            }
        }
    }
    return null;
};
const extractPolicyType = (text) => {
    const lowerText = (0, baseParser_1.normalizeText)(text).toLowerCase();
    if (lowerText.includes('motor') || lowerText.includes('car') || lowerText.includes('vehicle')) {
        if (lowerText.includes('third party') || lowerText.includes('liability only') || lowerText.includes('tp only'))
            return 'Motor Third Party';
        if (lowerText.includes('package') || lowerText.includes('comprehensive') || lowerText.includes('own damage'))
            return 'Motor Comprehensive Package';
        return 'Motor';
    }
    if (lowerText.includes('health') || lowerText.includes('mediclaim'))
        return 'Health';
    if (lowerText.includes('life') || lowerText.includes('term assurance') || lowerText.includes('term plan'))
        return 'Life';
    if (lowerText.includes('travel'))
        return 'Travel';
    if (lowerText.includes('business') || lowerText.includes('commercial') || lowerText.includes('sme')) {
        if (lowerText.includes('fire') || lowerText.includes('burglary'))
            return 'Commercial Package';
        return 'Commercial Business';
    }
    if (lowerText.includes('liability'))
        return 'Liability';
    if (lowerText.includes('property'))
        return 'Property';
    return null;
};
const extractInsuranceCompany = (text) => {
    const knownCompanies = [
        'hdfc ergo', 'icici lombard', 'tata aig', 'bajaj allianz', 'reliance general',
        'new india assurance', 'oriental insurance', 'national insurance', 'united india insurance',
        'sbi general', 'cholamandalam', 'iffco tokio', 'go digit general insurance', 'liberty general insurance', 'digit'
    ];
    const lowerText = (0, baseParser_1.normalizeText)(text).toLowerCase();
    const match = knownCompanies.find((company) => lowerText.includes(company));
    if (match) {
        if (match === 'digit')
            return 'Go Digit General Insurance';
        return (0, baseParser_1.titleCase)(match);
    }
    return null;
};
const extractCurrencyValue = (text, labels) => {
    const value = (0, baseParser_1.findValueNearLabel)(text, labels, {
        maxLookahead: 10,
        filter: (val) => /((?:₹|inr|rs\.?|usd|eur|`|')?\s*[\d,]{3,}(?:\.\d{1,2})?)/i.test(val)
    });
    if (value) {
        const match = value.match(/((?:₹|inr|rs\.?|usd|eur|`|')?\s*[\d,]{3,}(?:\.\d{1,2})?)/i);
        if (match)
            return match[1].replace(/\s+/g, ' ').trim();
    }
    return null;
};
const extractDateByLabels = (text, labels, { preferLast = false } = {}) => {
    const value = (0, baseParser_1.findValueNearLabel)(text, labels, {
        maxLookahead: 8,
        filter: (val) => (0, baseParser_1.extractDatesFromText)(val).length > 0
    });
    if (value) {
        const parsedDates = (0, baseParser_1.extractDatesFromText)(value);
        if (parsedDates.length)
            return preferLast ? parsedDates[parsedDates.length - 1] : parsedDates[0];
    }
    return null;
};
const extractCustomerName = (text) => (0, baseParser_1.findValueNearLabel)(text, ['name of insured', 'insured name', 'customer name', 'proposer name', 'name of the insured', 'insured details: name', 'insured', 'name'], { filter: (val) => !val.toLowerCase().includes('insurance') });
const extractAddress = (text) => (0, baseParser_1.findValueNearLabel)(text, ['registered address', 'premises address', 'correspondence address', 'mailing address', 'communication address', 'address'], { maxLookahead: 5 });
const extractVehicleMakeModel = (text) => (0, baseParser_1.findValueNearLabel)(text, ['make/model', 'make and model', 'make & model', 'make', 'model/vehicle variant']);
const extractAgentName = (text) => (0, baseParser_1.findValueNearLabel)(text, ['agent name', 'partner name', 'posp name', 'advisor name', 'sales person', 'sold by', 'introduced by', 'dealer name']);
const extractAgentContact = (text) => {
    const value = (0, baseParser_1.findValueNearLabel)(text, ['agent contact', 'agent mobile', 'partner contact', 'partner mobile', 'posp contact', 'advisor contact', 'sales person contact'], {
        filter: (val) => /\b(?:\+?91[-\s]?)?[6-9]\d{9}\b/.test(val)
    });
    if (value) {
        const match = value.match(/\b(?:\+?91[-\s]?)?[6-9]\d{9}\b/);
        if (match)
            return match[0].replace(/\s+/g, '');
    }
    return null;
};
const extractUinLikeValue = (text, labels) => {
    const value = (0, baseParser_1.findValueNearLabel)(text, labels, {
        filter: (val) => !/^IRDA[N]?/i.test(val) && !/^UIN/i.test(val) && !val.toLowerCase().includes('previous')
    });
    if (value && value.length > 4)
        return value;
    return null;
};
const extractLibertyDates = (text) => {
    let start = null;
    let end = null;
    // First, try a very targeted regex for "From <date> To <date>"
    const singleLineMatch = text.replace(/\s+/g, ' ').match(/From\s*[:\-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s*(?:To|to|Till|till|Midnight of)\s*[:\-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
    if (singleLineMatch) {
        const d1 = (0, baseParser_1.extractDatesFromText)(singleLineMatch[1]);
        const d2 = (0, baseParser_1.extractDatesFromText)(singleLineMatch[2]);
        if (d1.length && d2.length) {
            return { start: d1[0], end: d2[0] };
        }
    }
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        const lowerLine = lines[i].toLowerCase();
        if (lowerLine.includes('period of insurance') || lowerLine.includes('risk period')) {
            const dateLines = lines.slice(i, i + 5).join(' ');
            const dates = (0, baseParser_1.extractDatesFromText)(dateLines);
            if (dates.length >= 2) {
                // To avoid duplicate dates (like picking issue date twice), only return if they are different
                // or if it's the only two dates.
                start = dates[0];
                end = dates[dates.length - 1];
                if (start !== end)
                    return { start, end };
            }
        }
    }
    // Fallback: Look for "from" and "to" explicitly
    for (let i = 0; i < lines.length; i++) {
        const lowerLine = lines[i].toLowerCase();
        if (lowerLine.includes('from') && !start) {
            const dates = (0, baseParser_1.extractDatesFromText)(lines.slice(i, i + 2).join(' '));
            if (dates.length > 0)
                start = dates[0];
        }
        if ((lowerLine.includes('to ') || lowerLine === 'to' || lowerLine.includes('midnight of')) && !end) {
            const dates = (0, baseParser_1.extractDatesFromText)(lines.slice(i, i + 2).join(' '));
            if (dates.length > 0) {
                // If it picked the same date as start, skip it
                if (dates[0] !== start) {
                    end = dates[0];
                }
                else if (dates.length > 1) {
                    end = dates[1];
                }
            }
        }
    }
    return { start, end };
};
const extractLibertyVehicleNumber = (text) => {
    const match = text.match(/\b([A-Z]{2}\s?[0-9]{2}\s?[A-Z]{1,3}\s?[0-9]{4})\b/i);
    if (match)
        return match[1].replace(/\s+/g, '').toUpperCase();
    return null;
};
const extractLibertyVehicleMakeModel = (text) => {
    // MARUTI/SWIFT DZIRE ZDI/Sedan
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Make/Model/Type of Body')) {
            for (let j = 1; j <= 20; j++) {
                if (lines[i + j] && (lines[i + j].includes('/') || lines[i + j].match(/[A-Z]{4,}/))) {
                    if (!lines[i + j].match(/^[\d/]+$/) && !lines[i + j].includes('IDV')) {
                        return lines[i + j].trim() + (lines[i + j + 1] && !lines[i + j + 1].match(/^\d+$/) ? ' ' + lines[i + j + 1].trim() : '');
                    }
                }
            }
        }
    }
    const makeModelMatch = text.match(/([A-Z]+)\/([A-Z\s]+)\s+([A-Z]+\/[a-zA-Z]+)/);
    if (makeModelMatch) {
        return makeModelMatch[0].replace(/\s+/g, ' ');
    }
    return null;
};
const extractLibertyPremium = (text) => {
    const match = text.match(/TOTAL\s+POLICY\s+PREMIUM\s+([\d,]+\.\d{2})/i);
    if (match)
        return match[1].replace(/,/g, '');
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].toUpperCase().includes('TOTAL POLICY PREMIUM')) {
            const m = lines[i].match(/([\d,]{3,}\.\d{2})/);
            if (m)
                return m[1].replace(/,/g, '');
        }
    }
    return null;
};
const extractLibertyIDV = (text) => {
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].replace(/\s+/g, ' ').includes("IDV (INSURED'S DECLARED VALUE)") || lines[i].includes("IDV (INSURED")) {
            for (let j = 1; j <= 10; j++) {
                const match = lines[i + j]?.match(/^\s*\d+\s+([\d,]{3,}\.\d{2})/);
                if (match) {
                    return match[1].replace(/,/g, '');
                }
            }
        }
    }
    // Fallback: search for IDV table line globally
    const match = text.match(/\n\s*1\s+([\d,]{3,}\.\d{2})\s+0\.00/);
    if (match)
        return match[1].replace(/,/g, '');
    return null;
};
const parseLibertyPolicy = (documentText) => {
    const dates = extractLibertyDates(documentText);
    return {
        customerName: (0, baseParser_1.cleanFieldValue)(extractCustomerName(documentText)),
        phone: (0, baseParser_1.cleanFieldValue)(extractPhone(documentText)),
        email: (0, baseParser_1.cleanFieldValue)(extractEmail(documentText)),
        address: (0, baseParser_1.cleanFieldValue)(extractAddress(documentText)),
        policyNumber: (0, baseParser_1.cleanFieldValue)(extractUinLikeValue(documentText, ['policy number', 'policy no', 'policy no.', 'policy id', 'policy#', 'policy no:', 'certificate no', 'certificate number', 'certificate no.', 'quote no'])),
        policyType: (0, baseParser_1.cleanFieldValue)(extractPolicyType(documentText)),
        insuranceCompany: (0, baseParser_1.cleanFieldValue)(extractInsuranceCompany(documentText)),
        startDate: dates.start,
        expiryDate: dates.end,
        premiumAmount: (0, baseParser_1.cleanFieldValue)(extractLibertyPremium(documentText)),
        sumInsured: (0, baseParser_1.cleanFieldValue)(extractLibertyIDV(documentText)),
        vehicleNumber: (0, baseParser_1.cleanFieldValue)(extractLibertyVehicleNumber(documentText)),
        vehicleMakeModel: (0, baseParser_1.cleanFieldValue)(extractLibertyVehicleMakeModel(documentText)),
        nomineeName: null, // Liberty format nominee is hard to parse reliably from tabular
        policyIssuedOn: extractDateByLabels(documentText, ['policy issued on', 'policy issue date', 'date of issue', 'issued on']),
        agentName: (0, baseParser_1.cleanFieldValue)(extractAgentName(documentText)),
        agentContact: (0, baseParser_1.cleanFieldValue)(extractAgentContact(documentText)),
    };
};
exports.parseLibertyPolicy = parseLibertyPolicy;
//# sourceMappingURL=libertyParser.js.map