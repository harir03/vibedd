// [ARIA] NEW: LearnedPattern model — agent-generated regex rules and detection patterns.
// Feature 10 (Self-Evolving Agent / regex-evolution) creates these records when the
// AI generates new attack detection patterns from confirmed threat data.

import mongoose from 'mongoose';

export interface ILearnedPattern extends mongoose.Document {
    pattern: string;                                        // The regex pattern string
    flags: string;                                          // Regex flags (e.g., 'i', 'gi')
    category: string;                                       // Attack category (e.g., 'sqli', 'xss', 'credential_stuffing')
    description: string;                                    // Human-readable description of what it detects
    confidence: number;                                     // 0-1, how confident the AI is in this pattern
    source: 'ai_generated' | 'human_created' | 'evolved';  // How this pattern was created
    generatedFrom: string[];                                // Alert IDs or payloads that inspired this pattern
    validationResults: {
        truePositives: number;                              // Correctly matched known-bad payloads
        falsePositives: number;                             // Incorrectly matched known-good payloads
        trueNegatives: number;                              // Correctly passed known-good payloads
        falseNegatives: number;                             // Missed known-bad payloads
    };
    status: 'proposed' | 'testing' | 'active' | 'disabled' | 'rolled_back';
    deployedAt?: Date;
    disabledAt?: Date;
    disabledReason?: string;
    evolutionChangeId?: mongoose.Types.ObjectId;            // Reference to the EvolutionChange that created this
    replacesPatternId?: mongoose.Types.ObjectId;            // If this pattern replaces an older one
    hitCount: number;                                       // How many requests this pattern has matched since deployment
    falsePositiveCount: number;                             // How many analyst-confirmed false positives
    createdAt: Date;
    updatedAt: Date;
}

const LearnedPatternSchema = new mongoose.Schema<ILearnedPattern>({
    pattern: { type: String, required: true },
    flags: { type: String, default: 'i' },
    category: { type: String, required: true },
    description: { type: String },
    confidence: { type: Number, min: 0, max: 1, default: 0.5 },
    source: { type: String, enum: ['ai_generated', 'human_created', 'evolved'], default: 'ai_generated' },
    generatedFrom: [{ type: String }],
    validationResults: {
        truePositives: { type: Number, default: 0 },
        falsePositives: { type: Number, default: 0 },
        trueNegatives: { type: Number, default: 0 },
        falseNegatives: { type: Number, default: 0 },
    },
    status: { type: String, enum: ['proposed', 'testing', 'active', 'disabled', 'rolled_back'], default: 'proposed' },
    deployedAt: { type: Date },
    disabledAt: { type: Date },
    disabledReason: { type: String },
    evolutionChangeId: { type: mongoose.Schema.Types.ObjectId, ref: 'EvolutionChange' },
    replacesPatternId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearnedPattern' },
    hitCount: { type: Number, default: 0 },
    falsePositiveCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// [ARIA] Indexes for pattern queries
LearnedPatternSchema.index({ status: 1, category: 1 });
LearnedPatternSchema.index({ confidence: -1 });
LearnedPatternSchema.index({ createdAt: -1 });

export default mongoose.models.LearnedPattern || mongoose.model<ILearnedPattern>('LearnedPattern', LearnedPatternSchema);
