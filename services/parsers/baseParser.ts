const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const normalizeText = (value: any): string => String(value || '').replace(/[\s\u00A0\u200B\u200C\u200D\uFEFF]+/g, ' ').trim();

export const titleCase = (value: string): string =>
    normalizeText(value)
        .toLowerCase()
        .replace(/\b\w/g, (character) => character.toUpperCase());

export const parseDateFromText = (text: string | null | undefined): string | null => {
    if (!text) return null;

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
                const months = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };
                const monthStr = parts[1].toLowerCase() as keyof typeof months;
                const year = parseInt(parts[2], 10);
                const month = months[monthStr];
                if (month !== undefined) {
                    const parsed = new Date(Date.UTC(year, month, day));
                    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
                }
            }
            const dateValue = match[1];
            const parts = dateValue.split(/[\/.-]/).map(Number);
            if (parts.length === 3) {
                if (String(parts[0]).length === 4) {
                    const [year, month, day] = parts;
                    const parsed = new Date(Date.UTC(year, month - 1, day));
                    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
                } else {
                    let [day, month, year] = parts;
                    if (year < 100) year += year < 50 ? 2000 : 1900;
                    const parsed = new Date(Date.UTC(year, month - 1, day));
                    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
                }
            }
        }
    }
    return null;
};

export const extractDatesFromText = (text: string | null | undefined): string[] => {
    if (!text) return [];
    const parsed = parseDateFromText(text);
    return parsed ? [parsed] : [];
};

const looksLikeHeading = (value: string | null | undefined): boolean => {
    if (!value) return true;
    const normalizedValue = normalizeText(value);
    if (normalizedValue.length <= 2) return true;
    if (/^[\W_]+$/.test(normalizedValue)) return true;
    return false;
};

interface FindValueOptions {
    maxLookahead?: number;
    filter?: ((val: string) => boolean) | null;
    exactMatch?: boolean;
}

export const findValueNearLabel = (text: string, labels: string[], { maxLookahead = 4, filter = null, exactMatch = false }: FindValueOptions = {}): string | null => {
    const lines = text.split(/\r?\n/);
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        const normalizedLine = normalizeText(lines[lineIndex]);
        const lowerLine = normalizedLine.toLowerCase();
        
        for (const label of labels) {
            const lowerLabel = label.toLowerCase();
            
            if (exactMatch) {
                if (lowerLine !== lowerLabel) continue;
            } else {
                if (!lowerLine.includes(lowerLabel)) continue;
            }
            
            const labelIndex = lowerLine.indexOf(lowerLabel);
            let sameLineValue = normalizedLine.slice(labelIndex + lowerLabel.length).replace(/^[:\-–—\s]+/, '').trim();
            
            if (!sameLineValue) {
                const separatorMatch = normalizedLine.match(/[:\-–—]\s*(.+)$/);
                if (separatorMatch && separatorMatch[1]) sameLineValue = separatorMatch[1].trim();
            }

            if (sameLineValue && !looksLikeHeading(sameLineValue)) {
                if (!filter || filter(sameLineValue)) return sameLineValue;
            }
            
            for (let offset = 1; offset <= maxLookahead; offset += 1) {
                const nextLine = lines[lineIndex + offset];
                if (nextLine === undefined) continue;
                const candidate = normalizeText(nextLine);
                if (!candidate || looksLikeHeading(candidate)) continue;
                if (!filter || filter(candidate)) return candidate;
            }
        }
    }
    return null;
};

export const cleanFieldValue = (value: any): any => {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const normalizedValue = normalizeText(value);
    if (!normalizedValue || looksLikeHeading(normalizedValue)) return null;
    if (/^[-–—.\s]+$/.test(normalizedValue)) return null;
    if (/^[a-z]$/i.test(normalizedValue)) return null;
    return normalizedValue;
};


