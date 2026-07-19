import { 
    normalizeText,
    titleCase,
    findValueNearLabel,
    extractDatesFromText,
    cleanFieldValue 
} from './baseParser';

const extractPhone = (text: string): string | null => {
    const value = findValueNearLabel(text, ['mobile', 'mobile no', 'mobile number', 'contact number', 'phone', 'telephone'], {
        filter: (val: string) => /\b(?:\+?91[-\s]?)?[6-9]\d{9}\b/.test(val) || /x+\d{4}/i.test(val)
    });
    if (value) {
        const match = value.match(/\b(?:\+?91[-\s]?)?[6-9]\d{9}\b/);
        if (match) return match[0].replace(/\s+/g, '');
        const maskedMatch = value.match(/x+\d{4}/i);
        if (maskedMatch) return maskedMatch[0];
    }
    const match = text.match(/\b(?:\+?91[-\s]?)?[6-9]\d{9}\b/);
    if (match && !match[0].startsWith('1800')) return match[0].replace(/\s+/g, '');
    return null;
};

const extractEmail = (text: string): string | null => {
    const regex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig;
    const value = findValueNearLabel(text, ['email', 'email id', 'mail id'], {
        filter: (val: string) => regex.test(val) && !/@(godigit\.com|libertyinsurance\.in|hdfcergo\.com|icicilombard\.com|company)/i.test(val)
    });
    if (value) {
        const match = value.match(regex);
        if (match) return match[0];
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

const extractPolicyType = (text: string): string | null => {
    const lowerText = normalizeText(text).toLowerCase();
    if (lowerText.includes('motor') || lowerText.includes('car') || lowerText.includes('vehicle')) {
        if (lowerText.includes('third party') || lowerText.includes('liability only') || lowerText.includes('tp only')) return 'Motor Third Party';
        if (lowerText.includes('package') || lowerText.includes('comprehensive') || lowerText.includes('own damage')) return 'Motor Comprehensive Package';
        return 'Motor';
    }
    if (lowerText.includes('health') || lowerText.includes('mediclaim')) return 'Health';
    if (lowerText.includes('life') || lowerText.includes('term assurance') || lowerText.includes('term plan')) return 'Life';
    if (lowerText.includes('travel')) return 'Travel';
    if (lowerText.includes('business') || lowerText.includes('commercial') || lowerText.includes('sme')) {
        if (lowerText.includes('fire') || lowerText.includes('burglary')) return 'Commercial Package';
        return 'Commercial Business';
    }
    if (lowerText.includes('liability')) return 'Liability';
    if (lowerText.includes('property')) return 'Property';
    return null;
};

const extractInsuranceCompany = (text: string): string | null => {
    const knownCompanies = [
        'hdfc ergo', 'icici lombard', 'tata aig', 'bajaj allianz', 'reliance general',
        'new india assurance', 'oriental insurance', 'national insurance', 'united india insurance',
        'sbi general', 'cholamandalam', 'iffco tokio', 'go digit general insurance', 'liberty general insurance', 'digit'
    ];
    const lowerText = normalizeText(text).toLowerCase();
    const match = knownCompanies.find((company) => lowerText.includes(company));
    if (match) {
        if (match === 'digit') return 'Go Digit General Insurance';
        return titleCase(match);
    }
    return null;
};

const extractCurrencyValue = (text: string, labels: string[]): string | null => {
    const value = findValueNearLabel(text, labels, { 
        maxLookahead: 10,
        filter: (val: string) => /((?:₹|inr|rs\.?|usd|eur|`|')?\s*[\d,]{3,}(?:\.\d{1,2})?)/i.test(val)
    });
    if (value) {
        const match = value.match(/((?:₹|inr|rs\.?|usd|eur|`|')?\s*[\d,]{3,}(?:\.\d{1,2})?)/i);
        if (match) return match[1].replace(/\s+/g, ' ').trim();
    }
    return null;
};

const extractDateByLabels = (text: string, labels: string[], { preferLast = false }: { preferLast?: boolean } = {}): string | null => {
    const value = findValueNearLabel(text, labels, {
        maxLookahead: 8,
        filter: (val: string) => extractDatesFromText(val).length > 0
    });
    if (value) {
        const parsedDates = extractDatesFromText(value);
        if (parsedDates.length) return preferLast ? parsedDates[parsedDates.length - 1] : parsedDates[0];
    }
    return null;
};

const extractCustomerName = (text: string): string | null => findValueNearLabel(text, ['name of insured', 'insured name', 'customer name', 'proposer name', 'name of the insured', 'insured details: name', 'insured', 'name'], { filter: (val: string) => !val.toLowerCase().includes('insurance') });
const extractAddress = (text: string): string | null => findValueNearLabel(text, ['registered address', 'premises address', 'correspondence address', 'mailing address', 'communication address', 'address'], { maxLookahead: 5 });
const extractVehicleMakeModel = (text: string): string | null => findValueNearLabel(text, ['make/model', 'make and model', 'make & model', 'make', 'model/vehicle variant']);
const extractAgentName = (text: string): string | null => findValueNearLabel(text, ['agent name', 'partner name', 'posp name', 'advisor name', 'sales person', 'sold by', 'introduced by', 'dealer name']);
const extractAgentContact = (text: string): string | null => {
    const value = findValueNearLabel(text, ['agent contact', 'agent mobile', 'partner contact', 'partner mobile', 'posp contact', 'advisor contact', 'sales person contact'], {
        filter: (val: string) => /\b(?:\+?91[-\s]?)?[6-9]\d{9}\b/.test(val)
    });
    if (value) {
        const match = value.match(/\b(?:\+?91[-\s]?)?[6-9]\d{9}\b/);
        if (match) return match[0].replace(/\s+/g, '');
    }
    return null;
};
const extractUinLikeValue = (text: string, labels: string[]): string | null => {
    const value = findValueNearLabel(text, labels, {
        filter: (val: string) => !/^IRDA[N]?/i.test(val) && !/^UIN/i.test(val) && !val.toLowerCase().includes('previous')
    });
    if (value && value.length > 4) return value;
    return null;
};

const extractLibertyDates = (text: string): { start: string | null, end: string | null } => {
    let start: string | null = null;
    let end: string | null = null;
    
    // First, try a very targeted regex for "From <date> To <date>"
    const singleLineMatch = text.replace(/\s+/g, ' ').match(/From\s*[:\-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s*(?:To|to|Till|till|Midnight of)\s*[:\-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
    if (singleLineMatch) {
        const d1 = extractDatesFromText(singleLineMatch[1]);
        const d2 = extractDatesFromText(singleLineMatch[2]);
        if (d1.length && d2.length) {
            return { start: d1[0], end: d2[0] };
        }
    }

    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        const lowerLine = lines[i].toLowerCase();
        if (lowerLine.includes('period of insurance') || lowerLine.includes('risk period')) {
            const dateLines = lines.slice(i, i + 5).join(' ');
            const dates = extractDatesFromText(dateLines);
            if (dates.length >= 2) {
                // To avoid duplicate dates (like picking issue date twice), only return if they are different
                // or if it's the only two dates.
                start = dates[0];
                end = dates[dates.length - 1];
                if (start !== end) return { start, end };
            }
        }
    }
    
    // Fallback: Look for "from" and "to" explicitly
    for (let i = 0; i < lines.length; i++) {
        const lowerLine = lines[i].toLowerCase();
        if (lowerLine.includes('from') && !start) {
            const dates = extractDatesFromText(lines.slice(i, i + 2).join(' '));
            if (dates.length > 0) start = dates[0];
        }
        if ((lowerLine.includes('to ') || lowerLine === 'to' || lowerLine.includes('midnight of')) && !end) {
            const dates = extractDatesFromText(lines.slice(i, i + 2).join(' '));
            if (dates.length > 0) {
                // If it picked the same date as start, skip it
                if (dates[0] !== start) {
                    end = dates[0];
                } else if (dates.length > 1) {
                    end = dates[1];
                }
            }
        }
    }
    return { start, end };
};
const extractLibertyVehicleNumber = (text: string): string | null => {
    const match = text.match(/\b([A-Z]{2}\s?[0-9]{2}\s?[A-Z]{1,3}\s?[0-9]{4})\b/i);
    if (match) return match[1].replace(/\s+/g, '').toUpperCase();
    return null;
};

const extractLibertyVehicleMakeModel = (text: string): string | null => {
    // MARUTI/SWIFT DZIRE ZDI/Sedan
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Make/Model/Type of Body')) {
            for (let j = 1; j <= 20; j++) {
                if (lines[i+j] && (lines[i+j].includes('/') || lines[i+j].match(/[A-Z]{4,}/))) {
                    if (!lines[i+j].match(/^[\d/]+$/) && !lines[i+j].includes('IDV')) {
                        return lines[i+j].trim() + (lines[i+j+1] && !lines[i+j+1].match(/^\d+$/) ? ' ' + lines[i+j+1].trim() : '');
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

const extractLibertyPremium = (text: string): string | null => {
    const match = text.match(/TOTAL\s+POLICY\s+PREMIUM\s+([\d,]+\.\d{2})/i);
    if (match) return match[1].replace(/,/g, '');
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].toUpperCase().includes('TOTAL POLICY PREMIUM')) {
            const m = lines[i].match(/([\d,]{3,}\.\d{2})/);
            if (m) return m[1].replace(/,/g, '');
        }
    }
    return null;
};

const extractLibertyIDV = (text: string): string | null => {
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].replace(/\s+/g, ' ').includes("IDV (INSURED'S DECLARED VALUE)") || lines[i].includes("IDV (INSURED")) {
            for (let j = 1; j <= 10; j++) {
                const match = lines[i+j]?.match(/^\s*\d+\s+([\d,]{3,}\.\d{2})/);
                if (match) {
                    return match[1].replace(/,/g, '');
                }
            }
        }
    }
    
    // Fallback: search for IDV table line globally
    const match = text.match(/\n\s*1\s+([\d,]{3,}\.\d{2})\s+0\.00/);
    if (match) return match[1].replace(/,/g, '');
    
    return null;
};

export const parseLibertyPolicy = (documentText: string): any => {
    const dates = extractLibertyDates(documentText);
    return {
        customerName: cleanFieldValue(extractCustomerName(documentText)),
        phone: cleanFieldValue(extractPhone(documentText)),
        email: cleanFieldValue(extractEmail(documentText)),
        address: cleanFieldValue(extractAddress(documentText)),
        policyNumber: cleanFieldValue(extractUinLikeValue(documentText, ['policy number', 'policy no', 'policy no.', 'policy id', 'policy#', 'policy no:', 'certificate no', 'certificate number', 'certificate no.', 'quote no'])),
        policyType: cleanFieldValue(extractPolicyType(documentText)),
        insuranceCompany: cleanFieldValue(extractInsuranceCompany(documentText)),
        startDate: dates.start,
        expiryDate: dates.end,
        premiumAmount: cleanFieldValue(extractLibertyPremium(documentText)),
        sumInsured: cleanFieldValue(extractLibertyIDV(documentText)),
        vehicleNumber: cleanFieldValue(extractLibertyVehicleNumber(documentText)),
        vehicleMakeModel: cleanFieldValue(extractLibertyVehicleMakeModel(documentText)),
        nomineeName: null, // Liberty format nominee is hard to parse reliably from tabular
        policyIssuedOn: extractDateByLabels(documentText, ['policy issued on', 'policy issue date', 'date of issue', 'issued on']),
        agentName: cleanFieldValue(extractAgentName(documentText)),
        agentContact: cleanFieldValue(extractAgentContact(documentText)),
    };
};
