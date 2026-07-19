import { parseLibertyPolicy } from './parsers/libertyParser';
import { parseDigitBusinessPolicy } from './parsers/digitBusinessParser';
import { parseDigitMotorPolicy } from './parsers/digitMotorParser';
import { parseDefaultPolicy } from './parsers/defaultParser';

export const extractPolicyFields = async (documentText: string): Promise<any> => {
    try {
        const lowerText = documentText.toLowerCase().replace(/[\s\u00A0\u200B\u200C\u200D\uFEFF]+/g, ' ').trim();
        
        // 1. Check for Go Digit My Business Policy
        if (lowerText.includes('digit my business policy') || lowerText.includes('bharat sookshma udyam suraksha')) {
            console.log("Routing to Digit Business Parser");
            return parseDigitBusinessPolicy(documentText);
        }
        
        // 2. Check for Go Digit Motor Policy
        if (lowerText.includes('go digit') && (lowerText.includes('motor') || lowerText.includes('car') || lowerText.includes('vehicle') || lowerText.includes('liability only'))) {
            console.log("Routing to Digit Motor Parser");
            return parseDigitMotorPolicy(documentText);
        }

        // 3. Check for Liberty General Insurance
        if (lowerText.includes('liberty general insurance')) {
            console.log("Routing to Liberty Parser");
            return parseLibertyPolicy(documentText);
        }
        
        // 4. Default Fallback Parser
        console.log("Routing to Default Parser");
        return parseDefaultPolicy(documentText);
        
    } catch (error) {
        console.error("Error during local parsing:", error);
        // If specific parser fails, attempt fallback
        console.log("Falling back to Default Parser due to error");
        return parseDefaultPolicy(documentText);
    }
};
