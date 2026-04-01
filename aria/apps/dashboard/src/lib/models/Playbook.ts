// [ARIA] NEW: Playbook model — LLM-generated incident response procedures.
// Feature 09 (Playbook Generation) uses Ollama/Mistral to generate step-by-step
// response plans tailored to specific incidents, following NIST 800-61, PCI-DSS, and RBI guidelines.

import mongoose from 'mongoose';

export interface IPlaybookStep {
    order: number;
    action: string;
    assignee: 'SOC-L1' | 'SOC-L2' | 'SOC-L3' | 'IT-Ops' | 'Management' | 'CERT';
    estimatedTime: string;              // e.g., '5m', '1h', '2d'
    verification: string;              // How to confirm step is done
    automated: boolean;                // Can this step be auto-executed?
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    completedAt?: Date;
    notes?: string;
}

export interface IPlaybook extends mongoose.Document {
    incidentId: mongoose.Types.ObjectId;
    title: string;
    generatedBy: 'template' | 'llm' | 'hybrid';
    category: string;                                       // e.g., 'credential_stuffing', 'sql_injection'
    steps: IPlaybookStep[];
    estimatedResolutionTime: string;
    regulatoryRequirements: string[];                        // e.g., 'PCI-DSS 12.10', 'RBI CSCRF 4.2'
    status: 'generated' | 'approved' | 'in_progress' | 'completed' | 'rejected';
    approvedBy?: string;
    completedAt?: Date;
    llmModel: string;                                       // Which Ollama model generated this
    llmPrompt?: string;                                     // The prompt used (for evolution tracking)
    effectiveness?: number;                                 // 0-100, rated after completion
    feedbackNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PlaybookStepSchema = new mongoose.Schema({
    order: { type: Number, required: true },
    action: { type: String, required: true },
    assignee: { type: String, enum: ['SOC-L1', 'SOC-L2', 'SOC-L3', 'IT-Ops', 'Management', 'CERT'], default: 'SOC-L1' },
    estimatedTime: { type: String },
    verification: { type: String },
    automated: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'skipped'], default: 'pending' },
    completedAt: { type: Date },
    notes: { type: String },
}, { _id: false });

const PlaybookSchema = new mongoose.Schema<IPlaybook>({
    incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', required: true },
    title: { type: String, required: true },
    generatedBy: { type: String, enum: ['template', 'llm', 'hybrid'], default: 'llm' },
    category: { type: String, required: true },
    steps: [PlaybookStepSchema],
    estimatedResolutionTime: { type: String },
    regulatoryRequirements: [{ type: String }],
    status: { type: String, enum: ['generated', 'approved', 'in_progress', 'completed', 'rejected'], default: 'generated' },
    approvedBy: { type: String },
    completedAt: { type: Date },
    llmModel: { type: String, default: 'mistral' },
    llmPrompt: { type: String },
    effectiveness: { type: Number, min: 0, max: 100 },
    feedbackNotes: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// [ARIA] Indexes for playbook queries
PlaybookSchema.index({ incidentId: 1 });
PlaybookSchema.index({ status: 1 });
PlaybookSchema.index({ createdAt: -1 });

export default mongoose.models.Playbook || mongoose.model<IPlaybook>('Playbook', PlaybookSchema);
