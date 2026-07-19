export declare const normalizeText: (value: any) => string;
export declare const titleCase: (value: string) => string;
export declare const parseDateFromText: (text: string | null | undefined) => string | null;
export declare const extractDatesFromText: (text: string | null | undefined) => string[];
interface FindValueOptions {
    maxLookahead?: number;
    filter?: ((val: string) => boolean) | null;
    exactMatch?: boolean;
}
export declare const findValueNearLabel: (text: string, labels: string[], { maxLookahead, filter, exactMatch }?: FindValueOptions) => string | null;
export declare const cleanFieldValue: (value: any) => any;
export {};
//# sourceMappingURL=baseParser.d.ts.map