// [ARIA] NEW: Incident model — correlated groups of related alerts.
// Feature 08 (Alert Correlation) groups individual alerts into incidents
// based on shared IPs, attack types, time windows, and target patterns.

import mongoose from 'mongoose';

export interface IIncident extends mongoose.Document {
    title: string;
    description: string;
    category: string;                                       // e.g., 'credential_stuffing', 'sql_injection', 'xss_campaign'
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    status: 'open' | 'investigating' | 'resolved' | 'false_positive';
    alertIds: mongoose.Types.ObjectId[];                    // References to Alert documents
    alertCount: number;
    sourceIPs: string[];                                    // Deduplicated source IPs
    targetEndpoints: string[];                              // Deduplicated target URIs
    attackStage: 'reconnaissance' | 'weaponization' | 'delivery' | 'exploitation' | 'installation' | 'command_control' | 'exfiltration' | 'unknown';
    timeRange: {
        start: Date;
        end: Date;
    };
    avgFidelity: number;                                    // Average fidelity score of constituent alerts
    maxFidelity: number;                                    // Highest fidelity alert in the group
    correlationRule: string;                                // Which correlation rule matched
    playbookId?: mongoose.Types.ObjectId;                   // Reference to generated Playbook
    assignedTo?: string;                                    // Analyst assigned to investigate
    resolvedAt?: Date;
    resolutionNotes?: string;
    applicationId?: mongoose.Types.ObjectId;                // Reference to ProtectedService
    createdAt: Date;
    updatedAt: Date;
}

const IncidentSchema = new mongoose.Schema<IIncident>({
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    severity: { type: String, enum: ['critical', 'high', 'medium', 'low', 'info'], default: 'medium' },
    status: { type: String, enum: ['open', 'investigating', 'resolved', 'false_positive'], default: 'open' },
    alertIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Alert' }],
    alertCount: { type: Number, default: 0 },
    sourceIPs: [{ type: String }],
    targetEndpoints: [{ type: String }],
    attackStage: {
        type: String,
        enum: ['reconnaissance', 'weaponization', 'delivery', 'exploitation', 'installation', 'command_control', 'exfiltration', 'unknown'],
        default: 'unknown'
    },
    timeRange: {
        start: { type: Date },
        end: { type: Date },
    },
    avgFidelity: { type: Number, default: 0 },
    maxFidelity: { type: Number, default: 0 },
    correlationRule: { type: String },
    playbookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Playbook' },
    assignedTo: { type: String },
    resolvedAt: { type: Date },
    resolutionNotes: { type: String },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProtectedService' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// [ARIA] Indexes for incident queries: status queue, severity filtering, time-based lookups
IncidentSchema.index({ status: 1, severity: 1 });
IncidentSchema.index({ createdAt: -1 });
IncidentSchema.index({ category: 1 });
IncidentSchema.index({ applicationId: 1 });

export default mongoose.models.Incident || mongoose.model<IIncident>('Incident', IncidentSchema);
