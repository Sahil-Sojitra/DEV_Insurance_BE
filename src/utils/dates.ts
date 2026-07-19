const parseDateParts = (year: number, month: number, day: number): Date | null => {
    const parsed = new Date(Date.UTC(year, month - 1, day));

    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const monthLookup = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
};

export const parseDateValue = (value: any): Date | null => {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const stringValue = String(value).trim();

    const isoMatch = stringValue.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
    if (isoMatch) {
        return parseDateParts(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
    }

    const dmyMatch = stringValue.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if (dmyMatch) {
        const day = Number(dmyMatch[1]);
        const month = Number(dmyMatch[2]);
        let year = Number(dmyMatch[3]);

        if (year < 100) {
            year += year < 50 ? 2000 : 1900;
        }

        return parseDateParts(year, month, day);
    }

    const namedMonthMatch = stringValue.match(/^(\d{1,2})[-\s/]+([A-Za-z]{3,9})[-\s/]+(\d{2,4})$/) || stringValue.match(/^([A-Za-z]{3,9})[-\s/]+(\d{1,2})[-\s/]+(\d{2,4})$/);
    if (namedMonthMatch) {
        let day;
        let month;
        let year;

        if (Number.isNaN(Number(namedMonthMatch[1]))) {
            month = monthLookup[String(namedMonthMatch[1]).toLowerCase() as keyof typeof monthLookup];
            day = Number(namedMonthMatch[2]);
            year = Number(namedMonthMatch[3]);
        } else {
            day = Number(namedMonthMatch[1]);
            month = monthLookup[String(namedMonthMatch[2]).toLowerCase() as keyof typeof monthLookup];
            year = Number(namedMonthMatch[3]);
        }

        if (year < 100) {
            year += year < 50 ? 2000 : 1900;
        }

        if (month) {
            return parseDateParts(year, month, day);
        }
    }

    const parsed = new Date(stringValue);

    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed;
};

export const buildMonthRange = (year: number | string, month: number | string): { start: Date, end: Date } | null => {
    const numericYear = Number(year);
    const numericMonth = Number(month);

    if (!numericYear || !numericMonth) {
        return null;
    }

    const start = new Date(numericYear, numericMonth - 1, 1, 0, 0, 0, 0);
    const end = new Date(numericYear, numericMonth, 0, 23, 59, 59, 999);

    return { start, end };
};

export const toIsoDate = (value: any): string => {
    if (!value) {
        return '-';
    }

    const date = parseDateValue(value);

    if (!date) {
        return '-';
    }

    return date.toISOString().slice(0, 10);
};
