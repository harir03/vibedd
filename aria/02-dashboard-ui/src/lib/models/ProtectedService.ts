// [ARIA] NEW: ProtectedService model replaces the old Application model.
// Represents a single banking app/service config protected by the ARIA gateway.
// Schema matches gateway inline schema exactly (minus blockchainConfig which was removed).

import mongoose from 'mongoose';

export interface IProtectedService extends mongoose.Document {
    name: string;
    domain: string;
    ports: { protocol: string; port: string }[];
    upstreams: string[];
    type: string;
    defenseMode: 'Defense' | 'Audited' | 'Offline';
    defenseStatus: boolean;
    loggingEnabled: boolean;
    aiModel: string;
    aiSystemPrompt: string;
    createdAt: Date;
}

const ProtectedServiceSchema = new mongoose.Schema<IProtectedService>({
    name: { type: String, required: true },
    domain: { type: String, required: true },
    ports: [{ protocol: String, port: String }],
    upstreams: [{ type: String }],
    type: { type: String, enum: ['Reverse Proxy', 'Static Files', 'Redirect'], default: 'Reverse Proxy' },
    defenseMode: { type: String, enum: ['Defense', 'Audited', 'Offline'], default: 'Defense' },
    defenseStatus: { type: Boolean, default: true },
    loggingEnabled: { type: Boolean, default: true },
    aiModel: { type: String, default: 'mistral' },
    aiSystemPrompt: { type: String },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ProtectedService || mongoose.model<IProtectedService>('ProtectedService', ProtectedServiceSchema);
