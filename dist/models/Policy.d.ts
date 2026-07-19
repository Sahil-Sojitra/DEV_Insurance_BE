import mongoose, { Document } from 'mongoose';
export interface IPolicy extends Document {
    customerName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    policyNumber: string | null;
    policyType: string | null;
    insuranceCompany: string | null;
    startDate: Date | null;
    expiryDate: Date | null;
    premiumAmount: string | null;
    sumInsured: string | null;
    vehicleNumber: string | null;
    vehicleMakeModel: string | null;
    nomineeName: string | null;
    policyIssuedOn: Date | null;
    agentName: string | null;
    agentContact: string | null;
    rawExtractedText: string | null;
    uploadedAt: Date;
}
declare const _default: mongoose.Model<IPolicy, {}, {}, {}, Document<unknown, {}, IPolicy, {}, {}> & IPolicy & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Policy.d.ts.map