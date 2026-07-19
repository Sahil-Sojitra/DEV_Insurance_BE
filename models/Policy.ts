import mongoose, { Document, Schema } from 'mongoose';

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

const policySchema = new Schema<IPolicy>(
    {
        customerName: { type: String, default: null },
        phone: { type: String, default: null },
        email: { type: String, default: null },
        address: { type: String, default: null },
        policyNumber: { type: String, default: null },
        policyType: { type: String, default: null },
        insuranceCompany: { type: String, default: null },
        startDate: { type: Date, default: null },
        expiryDate: { type: Date, default: null },
        premiumAmount: { type: String, default: null },
        sumInsured: { type: String, default: null },
        vehicleNumber: { type: String, default: null },
        vehicleMakeModel: { type: String, default: null },
        nomineeName: { type: String, default: null },
        policyIssuedOn: { type: Date, default: null },
        agentName: { type: String, default: null },
        agentContact: { type: String, default: null },
        rawExtractedText: { type: String, default: null },
        uploadedAt: { type: Date, default: Date.now },
    },
    {
        versionKey: false,
    }
);

export default mongoose.model<IPolicy>('Policy', policySchema);