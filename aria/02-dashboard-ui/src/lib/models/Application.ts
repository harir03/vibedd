// [ARIA] REMOVED: Original MAF Application model with blockchainConfig, policyHistory, etc.
// Replaced by: ProtectedService model in ProtectedService.ts (simpler, banking-focused, no blockchain).
// This file now re-exports ProtectedService for backwards compatibility with any remaining imports.

// import mongoose from 'mongoose';
//
// export interface IApplication extends mongoose.Document {
//     name: string;
//     domain: string;
//     ports: { protocol: string; port: string }[];
//     upstreams: string[];
//     redirectStatus?: number;
//     redirectUrl?: string;
//     type: 'Reverse Proxy' | 'Static Files' | 'Redirect';
//     defenseMode?: 'Defense' | 'Audited' | 'Offline';
//     defenseStatus: boolean;
//     loggingEnabled: boolean;
//     aiModel?: string;
//     aiSystemPrompt?: string;
//     blockchainConfig?: {
//         enabled: boolean;
//         rpcUrl?: string;
//         privateKey?: string;
//         contractAddress?: string;
//     };
//     policyHistory?: {
//         prompt: string;
//         modelName: string;
//         createdAt: Date;
//     }[];
//     createdAt: Date;
// }
//
// const ApplicationSchema = new mongoose.Schema<IApplication>({
//     name: { type: String, required: true },
//     domain: { type: String, required: true },
//     ports: [{
//         protocol: { type: String, required: true },
//         port: { type: String, required: true }
//     }],
//     upstreams: [{ type: String }],
//     redirectStatus: { type: Number },
//     redirectUrl: { type: String },
//     type: { type: String, required: true, enum: ['Reverse Proxy', 'Static Files', 'Redirect'] },
//     defenseMode: { type: String, enum: ['Defense', 'Audited', 'Offline'], default: 'Defense' },
//     defenseStatus: { type: Boolean, default: true },
//     loggingEnabled: { type: Boolean, default: true },
//     aiModel: { type: String, default: 'mistral' },
//     aiSystemPrompt: { type: String },
//     blockchainConfig: {
//         enabled: { type: Boolean, default: false },
//         rpcUrl: String,
//         privateKey: String,
//         contractAddress: String
//     },
//     policyHistory: [{
//         prompt: String,
//         modelName: String,
//         createdAt: { type: Date, default: Date.now }
//     }],
//     createdAt: { type: Date, default: Date.now },
// });
//
// export default mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);

// [ARIA] NEW: Re-export ProtectedService as default for backwards compatibility
export { type IProtectedService as IApplication } from './ProtectedService';
export { default } from './ProtectedService';
