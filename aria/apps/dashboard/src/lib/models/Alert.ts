// [ARIA] NEW: Alert model replaces the old Log model.
// Alerts represent individual WAF detection events with fidelity scoring
// and human triage status. Schema matches gateway inline schema exactly.

import mongoose from 'mongoose';

export interface IAlert extends mongoose.Document {
    id: string;
    timestamp: Date;
    sourceIP: string;
    method: string;
    path: string;
    headers: Record<string, unknown>;
    body: string;
    userAgent: string;
    aiDecision: 'block' | 'allow';
    aiReasoning: string;
    detectionSources: string[];
    regexMatches: string[];
    category: string;
    fidelityScore: number;
    scores: {
        regex: number;
        llm: number;
        anomaly: number;
        ueba: number;
    };
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    triageStatus: 'pending' | 'approved' | 'rejected' | 'escalated';
    analystId?: string;
    analystNotes?: string;
    triagedAt?: Date;
    serviceId?: mongoose.Types.ObjectId;
    serviceName?: string;
    responseStatus?: number;
    responseSize?: string;
}

const AlertSchema = new mongoose.Schema<IAlert>({
    id: { type: String, required: true, unique: true },
    timestamp: { type: Date, default: Date.now },
    sourceIP: { type: String, required: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    headers: { type: Object },
    body: { type: String },
    userAgent: { type: String },
    aiDecision: { type: String, enum: ['block', 'allow'], required: true },
    aiReasoning: { type: String },
    detectionSources: [{ type: String }],
    regexMatches: [{ type: String }],
    category: { type: String },
    fidelityScore: { type: Number, default: 0, min: 0, max: 100 },
    scores: {
        regex: { type: Number, default: 0 },
        llm: { type: Number, default: 0 },
        anomaly: { type: Number, default: 0 },
        ueba: { type: Number, default: 0 },
    },
    severity: { type: String, enum: ['info', 'low', 'medium', 'high', 'critical'], default: 'info' },
    triageStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'escalated'], default: 'pending' },
    analystId: { type: String },
    analystNotes: { type: String },
    triagedAt: { type: Date },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProtectedService' },
    serviceName: { type: String },
    responseStatus: { type: Number },
    responseSize: { type: String },
});

// [ARIA] Index for common queries: triage queue, fidelity filtering, time-based lookups
AlertSchema.index({ triageStatus: 1, fidelityScore: -1 });
AlertSchema.index({ timestamp: -1 });
AlertSchema.index({ sourceIP: 1 });
AlertSchema.index({ severity: 1 });

export default mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
