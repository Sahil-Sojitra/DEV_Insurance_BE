"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPolicyFields = void 0;
const libertyParser_1 = require("./parsers/libertyParser");
const digitBusinessParser_1 = require("./parsers/digitBusinessParser");
const digitMotorParser_1 = require("./parsers/digitMotorParser");
const defaultParser_1 = require("./parsers/defaultParser");
const extractPolicyFields = async (documentText) => {
    try {
        const lowerText = documentText.toLowerCase().replace(/[\s\u00A0\u200B\u200C\u200D\uFEFF]+/g, ' ').trim();
        // 1. Check for Go Digit My Business Policy
        if (lowerText.includes('digit my business policy') || lowerText.includes('bharat sookshma udyam suraksha')) {
            console.log("Routing to Digit Business Parser");
            return (0, digitBusinessParser_1.parseDigitBusinessPolicy)(documentText);
        }
        // 2. Check for Go Digit Motor Policy
        if (lowerText.includes('go digit') && (lowerText.includes('motor') || lowerText.includes('car') || lowerText.includes('vehicle') || lowerText.includes('liability only'))) {
            console.log("Routing to Digit Motor Parser");
            return (0, digitMotorParser_1.parseDigitMotorPolicy)(documentText);
        }
        // 3. Check for Liberty General Insurance
        if (lowerText.includes('liberty general insurance')) {
            console.log("Routing to Liberty Parser");
            return (0, libertyParser_1.parseLibertyPolicy)(documentText);
        }
        // 4. Default Fallback Parser
        console.log("Routing to Default Parser");
        return (0, defaultParser_1.parseDefaultPolicy)(documentText);
    }
    catch (error) {
        console.error("Error during local parsing:", error);
        // If specific parser fails, attempt fallback
        console.log("Falling back to Default Parser due to error");
        return (0, defaultParser_1.parseDefaultPolicy)(documentText);
    }
};
exports.extractPolicyFields = extractPolicyFields;
//# sourceMappingURL=claudeService.js.map