// [ARIA] NEW: Alert model replaces the old Log model.
// Alerts represent individual WAF detection events with fidelity scoring
// and human triage status. Schema matches gateway inline schema exactly.

import mongoose from 'mongoose';

export interface IAlert extends mongoose.Document {
    requestId: string;
    time: Date;
    ip: string;
    method: string;
    uri: string;
    headers: Record<string, unknown>;
    body: string;
    status: number;
    userAgent: string;
    country: string;
    attackType: string;
    detectionSource: 'regex' | 'ai' | 'both' | 'none';
    regexMatches: { pattern: string; category: string }[];
    aiAnalysis: string;
    aiConfidence: number;
    fidelityScore: number;
    fidelityBreakdown: {
        regexScore: number;
        aiScore: number;
        contextScore: number;
        historicalScore: number;
    };
    decision: 'block' | 'allow' | 'escalate' | 'pending';
    triageStatus: 'pending' | 'approved' | 'rejected' | 'auto-resolved';
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    applicationId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const AlertSchema = new mongoose.Schema<IAlert>({
    requestId: { type: String, required: true, unique: true },
    time: { type: Date, default: Date.now },
    ip: { type: String, required: true },
    method: { type: String, required: true },
    uri: { type: String, required: true },
    headers: { type: Object },
    body: { type: String },
    status: { type: Number },
    userAgent: { type: String },
    country: { type: String },
    attackType: { type: String },
    detectionSource: { type: String, enum: ['regex', 'ai', 'both', 'none'], default: 'none' },
    regexMatches: [{ pattern: String, category: String }],
    aiAnalysis: { type: String },
    aiConfidence: { type: Number, min: 0, max: 1 },
    fidelityScore: { type: Number, min: 0, max: 100, default: 0 },
    fidelityBreakdown: {
        regexScore: Number,
        aiScore: Number,
        contextScore: Number,
        historicalScore: Number,
    },
    decision: { type: String, enum: ['block', 'allow', 'escalate', 'pending'], default: 'pending' },
    triageStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'auto-resolved'], default: 'pending' },
    severity: { type: String, enum: ['critical', 'high', 'medium', 'low', 'info'], default: 'info' },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProtectedService' },
    createdAt: { type: Date, default: Date.now },
});

// [ARIA] Index for common queries: triage queue, fidelity filtering, time-based lookups
AlertSchema.index({ triageStatus: 1, fidelityScore: -1 });
AlertSchema.index({ createdAt: -1 });
AlertSchema.index({ ip: 1 });
AlertSchema.index({ severity: 1 });

export default mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
