import { 
    normalizeText,
    titleCase,
    findValueNearLabel,
    parseDateFromText,
    extractDatesFromText,
    cleanFieldValue 
} from './baseParser';

const extractDigitBusinessQuoteNo = (text: string): string | null => {
    const value = findValueNearLabel(text, ['quote no'], { maxLookahead: 2 });
    if (value) {
        const match = value.match(/([a-zA-Z]\d{9,11})/);
        if (match) return match[1].toUpperCase();
    }
    const match = text.match(/([a-zA-Z]\d{9,11})/);
    if (match) return match[1].toUpperCase();
    return null;
};

const extractDigitBusinessDates = (text: string): { start: string | null, end: string | null } => {
    const value = findValueNearLabel(text, ['policy period'], { maxLookahead: 2 });
    if (value) {
        // Try to match DD-MMM-YYYY even without word boundaries
        const dateMatches = Array.from(value.matchAll(/(\d{1,2}-[A-Za-z]{3}-\d{4})/gi));
        if (dateMatches.length >= 2) {
            return {
                start: parseDateFromText(dateMatches[0][1]),
                end: parseDateFromText(dateMatches[dateMatches.length - 1][1])
            };
        }
    }
    return { start: null, end: null };
};

const extractDigitBusinessPremium = (text: string): string | null => {
    const value = findValueNearLabel(text, ['final premium'], {
        maxLookahead: 2,
        filter: (val: string) => /((?:₹|inr|rs\.?|usd|eur|`|')?\s*[\d,]{3,}(?:\.\d{1,2})?)/i.test(val)
    });
    if (value) {
        const match = value.match(/((?:₹|inr|rs\.?|usd|eur|`|')?\s*[\d,]{3,}(?:\.\d{1,2})?)/i);
        if (match) return match[1].replace(/[`']/g, '').replace(/\s+/g, ' ').trim();
    }
    return null;
};

const extractDigitBusinessSumInsured = (text: string): string | null => {
    const value = findValueNearLabel(text, ['total sum insured'], {
        maxLookahead: 1,
        filter: (val: string) => /[\d,]{4,}/.test(val)
    });
    if (value) {
        const match = value.match(/([\d,]+)/);
        if (match) return match[1];
    }
    return null;
};

const extractDigitBusinessName = (text: string): string | null => {
    const nameLine1 = findValueNearLabel(text, ['1) proposer name'], { maxLookahead: 2 });
    if (nameLine1) {
        return nameLine1;
    }
    return null;
};

const extractDigitBusinessAddress = (text: string): string | null => {
    return findValueNearLabel(text, ['12) address of the premises'], { 
        maxLookahead: 4, 
        filter: (val: string) => val.length > 10 && !val.toLowerCase().includes('to be insured')
    });
};

export const parseDigitBusinessPolicy = (documentText: string): any => {
    const dates = extractDigitBusinessDates(documentText);
    
    return {
        customerName: cleanFieldValue(extractDigitBusinessName(documentText)),
        phone: cleanFieldValue(findValueNearLabel(documentText, ['5) mobile no'], { maxLookahead: 2 })),
        email: cleanFieldValue(findValueNearLabel(documentText, ['6) email id'], { maxLookahead: 2 })),
        address: cleanFieldValue(extractDigitBusinessAddress(documentText)),
        policyNumber: cleanFieldValue(extractDigitBusinessQuoteNo(documentText)),
        policyType: 'Commercial Package',
        insuranceCompany: 'Go Digit General Insurance',
        startDate: dates.start,
        expiryDate: dates.end,
        premiumAmount: cleanFieldValue(extractDigitBusinessPremium(documentText)),
        sumInsured: cleanFieldValue(extractDigitBusinessSumInsured(documentText)),
        vehicleNumber: null, // Commercial policy doesn't have vehicle number
        vehicleMakeModel: null,
        nomineeName: null,
        policyIssuedOn: null,
        agentName: null, // Agent name is mixed in with quote no in this format
        agentContact: null,
    };
};
