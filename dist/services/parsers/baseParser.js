"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanFieldValue = exports.findValueNearLabel = exports.extractDatesFromText = exports.parseDateFromText = exports.titleCase = exports.normalizeText = void 0;
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeText = (value) => String(value || '').replace(/[\s\u00A0\u200B\u200C\u200D\uFEFF]+/g, ' ').trim();
exports.normalizeText = normalizeText;
const titleCase = (value) => (0, exports.normalizeText)(value)
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
exports.titleCase = titleCase;
const parseDateFromText = (text) => {
    if (!text)
        return null;
    const datePatterns = [
        /\b(\d{4}-\d{2}-\d{2})\b/,
        /\b(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})\b/,
        /\b(\d{4}[\/.-]\d{2}[\/.-]\d{2})\b/,
        /\b(\d{1,2}-[A-Za-z]{3}-\d{4})\b/i
    ];
    for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
            if (pattern === datePatterns[3]) {
                const parts = match[1].split('-');
                const day = parseInt(parts[0], 10);
                const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
                const monthStr = parts[1].toLowerCase();
                const year = parseInt(parts[2], 10);
                const month = months[monthStr];
                if (month !== undefined) {
                    const parsed = new Date(Date.UTC(year, month, day));
                    if (!Number.isNaN(parsed.getTime()))
                        return parsed.toISOString().slice(0, 10);
                }
            }
            const dateValue = match[1];
            const parts = dateValue.split(/[\/.-]/).map(Number);
            if (parts.length === 3) {
                if (String(parts[0]).length === 4) {
                    const [year, month, day] = parts;
                    const parsed = new Date(Date.UTC(year, month - 1, day));
                    if (!Number.isNaN(parsed.getTime()))
                        return parsed.toISOString().slice(0, 10);
                }
                else {
                    let [day, month, year] = parts;
                    if (year < 100)
                        year += year < 50 ? 2000 : 1900;
                    const parsed = new Date(Date.UTC(year, month - 1, day));
                    if (!Number.isNaN(parsed.getTime()))
                        return parsed.toISOString().slice(0, 10);
                }
            }
        }
    }
    return null;
};
exports.parseDateFromText = parseDateFromText;
const extractDatesFromText = (text) => {
    if (!text)
        return [];
    const parsed = (0, exports.parseDateFromText)(text);
    return parsed ? [parsed] : [];
};
exports.extractDatesFromText = extractDatesFromText;
const looksLikeHeading = (value) => {
    if (!value)
        return true;
    const normalizedValue = (0, exports.normalizeText)(value);
    if (normalizedValue.length <= 2)
        return true;
    if (/^[\W_]+$/.test(normalizedValue))
        return true;
    return false;
};
const findValueNearLabel = (text, labels, { maxLookahead = 4, filter = null, exactMatch = false } = {}) => {
    const lines = text.split(/\r?\n/);
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        const normalizedLine = (0, exports.normalizeText)(lines[lineIndex]);
        const lowerLine = normalizedLine.toLowerCase();
        for (const label of labels) {
            const lowerLabel = label.toLowerCase();
            if (exactMatch) {
                if (lowerLine !== lowerLabel)
                    continue;
            }
            else {
                if (!lowerLine.includes(lowerLabel))
                    continue;
            }
            const labelIndex = lowerLine.indexOf(lowerLabel);
            let sameLineValue = normalizedLine.slice(labelIndex + lowerLabel.length).replace(/^[:\-–—\s]+/, '').trim();
            if (!sameLineValue) {
                const separatorMatch = normalizedLine.match(/[:\-–—]\s*(.+)$/);
                if (separatorMatch && separatorMatch[1])
                    sameLineValue = separatorMatch[1].trim();
            }
            if (sameLineValue && !looksLikeHeading(sameLineValue)) {
                if (!filter || filter(sameLineValue))
                    return sameLineValue;
            }
            for (let offset = 1; offset <= maxLookahead; offset += 1) {
                const nextLine = lines[lineIndex + offset];
                if (nextLine === undefined)
                    continue;
                const candidate = (0, exports.normalizeText)(nextLine);
                if (!candidate || looksLikeHeading(candidate))
                    continue;
                if (!filter || filter(candidate))
                    return candidate;
            }
        }
    }
    return null;
};
exports.findValueNearLabel = findValueNearLabel;
const cleanFieldValue = (value) => {
    if (value === null || value === undefined)
        return null;
    if (value instanceof Date)
        return Number.isNaN(value.getTime()) ? null : value;
    const normalizedValue = (0, exports.normalizeText)(value);
    if (!normalizedValue || looksLikeHeading(normalizedValue))
        return null;
    if (/^[-–—.\s]+$/.test(normalizedValue))
        return null;
    if (/^[a-z]$/i.test(normalizedValue))
        return null;
    return normalizedValue;
};
exports.cleanFieldValue = cleanFieldValue;
//# sourceMappingURL=baseParser.js.map