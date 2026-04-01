// [ARIA] NEW: Feedback model for analyst approve/reject decisions.
// When an analyst triages an alert, a Feedback document is created
// to track the decision for self-evolution training.

import mongoose from 'mongoose';

export interface IFeedback extends mongoose.Document {
    alertId: mongoose.Types.ObjectId;
    analystId: string;
    decision: 'approve_block' | 'reject_block' | 'approve_allow' | 'reject_allow';
    reason: string;
    createdAt: Date;
}

const FeedbackSchema = new mongoose.Schema<IFeedback>({
    alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert', required: true },
    analystId: { type: String, default: 'system' },
    decision: { type: String, enum: ['approve_block', 'reject_block', 'approve_allow', 'reject_allow'], required: true },
    reason: { type: String },
    createdAt: { type: Date, default: Date.now },
});

// [ARIA] Index for lookups by alert and by analyst
FeedbackSchema.index({ alertId: 1 });
FeedbackSchema.index({ createdAt: -1 });

export default mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema);
