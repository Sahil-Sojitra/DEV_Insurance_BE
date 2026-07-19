import { 
    normalizeText,
    findValueNearLabel,
    extractDatesFromText,
    cleanFieldValue 
} from './baseParser';

const extractDigitMotorPolicyNumber = (text: string): string | null => {
    // Digit motor policies usually start with D or P and have 9+ digits, e.g. D277842316
    const match = text.match(/\b([a-zA-Z]\d{9,11})\b/);
    if (match) return match[1].toUpperCase();
    return null;
};

const extractDigitMotorDates = (text: string): { start: string | null, end: string | null } => {
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Period of Policy')) {
            const dateLines = lines.slice(i, i + 10).join(' ');
            const dates = extractDatesFromText(dateLines);
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

const extractDigitMotorPremium = (text: string): string | null => {
    // Digit Motor Premium is usually near "Gross Premium" or "Final Premium"
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('final premium') || lines[i].toLowerCase().includes('gross premium') || lines[i].toLowerCase().includes('net premium')) {
            for (let j = 1; j <= 5; j++) {
                if (lines[i+j]) {
                    // Look for a number on its own line
                    const m = lines[i+j].match(/^([\d,]{3,}(?:\.\d{2}))$/);
                    if (m) return m[1].replace(/,/g, '');
                }
            }
        }
    }
    
    // Fallback regex if it's not on its own line
    const value = findValueNearLabel(text, ['gross premium', 'final premium'], {
        maxLookahead: 5,
        filter: (val: string) => /((?:₹|inr|rs\.?|usd|eur|`|')?\s*[\d,]{3,}(?:\.\d{2}))/i.test(val) // ensure .00 or .XX
    });
    if (value) {
        // match the LAST amount in case it's a smushed line like 123316.000.00298.44...3912.88
        const matches = Array.from(value.matchAll(/([\d,]{3,}(?:\.\d{2}))/g));
        if (matches.length > 0) return matches[matches.length - 1][1].replace(/,/g, '');
    }
    
    return null;
};

const extractDigitMotorVehicleNumber = (text: string): string | null => {
    const value = findValueNearLabel(text, ['vehicle registration no', 'registration no'], {
        maxLookahead: 2,
        filter: (val: string) => /[A-Z0-9]{4,}/i.test(val.replace(/[^A-Z0-9]/ig, ''))
    });
    if (value) return value.replace(/[^A-Z0-9]/ig, '').toUpperCase();
    
    const match = text.match(/\b([A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{4})\b/i);
    return match ? match[1].replace(/\s+/g, '').toUpperCase() : null;
};

const extractDigitMotorName = (text: string): string | null => {
    return findValueNearLabel(text, ['name'], { maxLookahead: 2, exactMatch: true, filter: (v: string) => v.length > 3 && !v.toLowerCase().includes('nominee') });
};

const extractDigitMotorMakeModel = (text: string): string | null => {
    // MakeFORDModel/Vehicle Variant (Sub-Type)ECOSPORT/1.5 TDCi Ambiente
    const match = text.replace(/\s+/g, ' ').match(/Make(.*?)Model.*?\)(.*?)(?:Engine|Cubic|$)/i);
    if (match) {
        return (match[1].trim() + ' ' + match[2].trim()).trim();
    }
    return null;
};

export const parseDigitMotorPolicy = (documentText: string): any => {
    const dates = extractDigitMotorDates(documentText);
    
    let policyType = 'Motor';
    if (documentText.toLowerCase().includes('liability only') || documentText.toLowerCase().includes('third-party')) {
        policyType = 'Motor Third Party';
    } else if (documentText.toLowerCase().includes('package') || documentText.toLowerCase().includes('comprehensive')) {
        policyType = 'Motor Comprehensive Package';
    }
    
    return {
        customerName: cleanFieldValue(extractDigitMotorName(documentText)),
        phone: cleanFieldValue(findValueNearLabel(documentText, ['mobile'], { maxLookahead: 2, exactMatch: true, filter: (v: string) => /\d{4}/.test(v) || /x/i.test(v) })),
        email: cleanFieldValue(findValueNearLabel(documentText, ['email'], { maxLookahead: 2, exactMatch: true, filter: (v: string) => v.includes('@') })),
        address: cleanFieldValue(findValueNearLabel(documentText, ['address'], { maxLookahead: 3, exactMatch: true })),
        policyNumber: cleanFieldValue(extractDigitMotorPolicyNumber(documentText)),
        policyType,
        insuranceCompany: 'Go Digit General Insurance',
        startDate: dates.start,
        expiryDate: dates.end,
        premiumAmount: cleanFieldValue(extractDigitMotorPremium(documentText)),
        sumInsured: null, // Liability only usually has no IDV
        vehicleNumber: cleanFieldValue(extractDigitMotorVehicleNumber(documentText)),
        vehicleMakeModel: cleanFieldValue(extractDigitMotorMakeModel(documentText)),
        nomineeName: cleanFieldValue(findValueNearLabel(documentText, ['name of nominee'], { maxLookahead: 2 })),
        policyIssuedOn: cleanFieldValue(findValueNearLabel(documentText, ['policy issue date'], { maxLookahead: 10, filter: (v: string) => extractDatesFromText(v).length > 0 })),
        agentName: cleanFieldValue(findValueNearLabel(documentText, ['partner name'], { maxLookahead: 2 })),
        agentContact: cleanFieldValue(findValueNearLabel(documentText, ['partner mobile no'], { maxLookahead: 2 })),
    };
};
