// [ARIA] NEW: EvolutionChange model — audit trail for all self-evolution actions.
// Feature 10 (Self-Evolving Agent) logs every change it makes: new regex, updated prompts,
// threshold adjustments, pipeline modifications. Each change can be validated and rolled back.

import mongoose from 'mongoose';

export interface IEvolutionChange extends mongoose.Document {
    type: 'regex' | 'prompt' | 'pipeline' | 'threshold' | 'model' | 'weight';
    description: string;                                     // Human-readable summary of what changed
    reason: string;                                          // Why the change was made (e.g., "3 false positives from analyst feedback")
    previousValue: mongoose.Schema.Types.Mixed;              // Snapshot of old value (for rollback)
    proposedValue: mongoose.Schema.Types.Mixed;              // The new value
    trigger: 'feedback' | 'scheduled' | 'threshold_breach' | 'manual' | 'auto_tune';
    feedbackIds?: mongoose.Types.ObjectId[];                  // Feedback records that triggered this change
    validationScore: number;                                 // 0-100, performance on test dataset
    validationDetails: {
        testCases: number;
        passed: number;
        failed: number;
        falsePositiveRate: number;                            // 0-1
        falseNegativeRate: number;                            // 0-1
    };
    status: 'proposed' | 'testing' | 'deployed' | 'monitoring' | 'validated' | 'rolled_back' | 'rejected';
    deployedAt?: Date;
    monitoringStartedAt?: Date;
    monitoringEndedAt?: Date;
    validatedAt?: Date;
    rolledBackAt?: Date;
    rollbackReason?: string;
    performanceMetrics?: {
        preChangeFPRate: number;                              // False positive rate before change
        postChangeFPRate: number;                             // False positive rate after change
        preChangeTPRate: number;                              // True positive rate before change
        postChangeTPRate: number;                             // True positive rate after change
    };
    affectedModule: string;                                   // Which module was changed (e.g., 'gateway-regex', 'fidelity-weights')
    createdBy: 'aria-agent' | 'analyst';                      // Who initiated the change
    approvedBy?: string;                                     // Analyst who approved (if human-approved)
    createdAt: Date;
    updatedAt: Date;
}

const EvolutionChangeSchema = new mongoose.Schema<IEvolutionChange>({
    type: { type: String, enum: ['regex', 'prompt', 'pipeline', 'threshold', 'model', 'weight'], required: true },
    description: { type: String, required: true },
    reason: { type: String, required: true },
    previousValue: { type: mongoose.Schema.Types.Mixed },
    proposedValue: { type: mongoose.Schema.Types.Mixed },
    trigger: { type: String, enum: ['feedback', 'scheduled', 'threshold_breach', 'manual', 'auto_tune'], default: 'feedback' },
    feedbackIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Feedback' }],
    validationScore: { type: Number, min: 0, max: 100, default: 0 },
    validationDetails: {
        testCases: { type: Number, default: 0 },
        passed: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
        falsePositiveRate: { type: Number, default: 0 },
        falseNegativeRate: { type: Number, default: 0 },
    },
    status: {
        type: String,
        enum: ['proposed', 'testing', 'deployed', 'monitoring', 'validated', 'rolled_back', 'rejected'],
        default: 'proposed'
    },
    deployedAt: { type: Date },
    monitoringStartedAt: { type: Date },
    monitoringEndedAt: { type: Date },
    validatedAt: { type: Date },
    rolledBackAt: { type: Date },
    rollbackReason: { type: String },
    performanceMetrics: {
        preChangeFPRate: { type: Number },
        postChangeFPRate: { type: Number },
        preChangeTPRate: { type: Number },
        postChangeTPRate: { type: Number },
    },
    affectedModule: { type: String, required: true },
    createdBy: { type: String, enum: ['aria-agent', 'analyst'], default: 'aria-agent' },
    approvedBy: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// [ARIA] Indexes for evolution queries
EvolutionChangeSchema.index({ status: 1, type: 1 });
EvolutionChangeSchema.index({ createdAt: -1 });
EvolutionChangeSchema.index({ trigger: 1 });
EvolutionChangeSchema.index({ affectedModule: 1 });

export default mongoose.models.EvolutionChange || mongoose.model<IEvolutionChange>('EvolutionChange', EvolutionChangeSchema);
