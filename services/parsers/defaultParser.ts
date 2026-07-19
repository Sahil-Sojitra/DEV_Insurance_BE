import {
    normalizeText,
    titleCase,
    extractDatesFromText,
    findValueNearLabel,
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
const extractNomineeName = (text: string): string | null => findValueNearLabel(text, ['nominee name', 'name of nominee', 'nominee details', 'name of the nominee', 'nominee'], { filter: (val: string) => val.length > 3 });
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
const extractVehicleNumber = (text: string): string | null => {
    const value = findValueNearLabel(text, ['registration no', 'registration number', 'vehicle number', 'vehicle registration no'], {
        filter: (val: string) => /[A-Z0-9]{4,}/i.test(val.replace(/[^A-Z0-9]/ig, ''))
    });
    if (value) return value.replace(/[^A-Z0-9]/ig, '').toUpperCase();
    const match = text.match(/\b([A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{4})\b/i);
    return match ? match[1].replace(/\s+/g, '').toUpperCase() : null;
};

export const parseDefaultPolicy = (documentText: string): any => ({
    customerName: cleanFieldValue(extractCustomerName(documentText)),
    phone: cleanFieldValue(extractPhone(documentText)),
    email: cleanFieldValue(extractEmail(documentText)),
    address: cleanFieldValue(extractAddress(documentText)),
    policyNumber: cleanFieldValue(extractUinLikeValue(documentText, ['policy number', 'policy no', 'policy no.', 'policy id', 'policy#', 'policy no:', 'certificate no', 'certificate number', 'certificate no.', 'quote no'])),
    policyType: cleanFieldValue(extractPolicyType(documentText)),
    insuranceCompany: cleanFieldValue(extractInsuranceCompany(documentText)),
    startDate: extractDateByLabels(documentText, ['period of insurance from', 'policy period from', 'risk period from', 'commencement date', 'start date', 'from', 'policy issue date']),
    expiryDate: extractDateByLabels(documentText, ['period of insurance to', 'policy period to', 'risk period to', 'expiry date', 'end date', 'to', 'valid till'], { preferLast: true }),
    premiumAmount: cleanFieldValue(extractCurrencyValue(documentText, ['final premium', 'total policy premium', 'gross premium', 'final premium (with gst)', 'premium', 'net premium', 'total premium'])),
    sumInsured: cleanFieldValue(extractCurrencyValue(documentText, ['sum insured', 'sum assured', 'idv', 'insured amount', 'coverage amount', 'total sum insured'])),
    vehicleNumber: cleanFieldValue(extractVehicleNumber(documentText)),
    vehicleMakeModel: cleanFieldValue(extractPolicyType(documentText) && extractPolicyType(documentText)?.toLowerCase().includes('motor') ? extractVehicleMakeModel(documentText) : null),
    nomineeName: cleanFieldValue(extractNomineeName(documentText)),
    policyIssuedOn: extractDateByLabels(documentText, ['policy issued on', 'policy issue date', 'date of issue', 'issued on']),
    agentName: cleanFieldValue(extractAgentName(documentText)),
    agentContact: cleanFieldValue(extractAgentContact(documentText)),
});