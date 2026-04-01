// [ARIA] UPDATED: Event model kept from MAF but extended with additional severity levels
// and action types to support ARIA's incident correlation.
import mongoose from 'mongoose';

export interface IEvent extends mongoose.Document {
    id: string; // Friendly ID like EV-9021
    time: string;
    ip: string;
    type: string;
    // [ARIA] REMOVED: Original action enum was ['Blocked', 'Passed', 'Audited', 'Challenged']
    // [ARIA] NEW: Added 'Escalated' and 'Pending' for triage queue support
    action: 'Blocked' | 'Passed' | 'Audited' | 'Challenged' | 'Escalated' | 'Pending';
    // [ARIA] REMOVED: Original severity enum was ['High', 'Medium', 'Low']
    // [ARIA] NEW: Added 'Critical' and 'Info' to match Alert severity scale
    severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
    // [ARIA] NEW: Optional link to the Alert that generated this event
    alertId?: mongoose.Types.ObjectId;
    createdAt: Date;
}

const EventSchema = new mongoose.Schema<IEvent>({
    id: { type: String, required: true, unique: true },
    time: { type: String, required: true },
    ip: { type: String, required: true },
    type: { type: String, required: true },
    // [ARIA] REMOVED: action: { type: String, required: true, enum: ['Blocked', 'Passed', 'Audited', 'Challenged'] },
    // [ARIA] NEW: Extended action enum with Escalated and Pending
    action: { type: String, required: true, enum: ['Blocked', 'Passed', 'Audited', 'Challenged', 'Escalated', 'Pending'] },
    // [ARIA] REMOVED: severity: { type: String, required: true, enum: ['High', 'Medium', 'Low'] },
    // [ARIA] NEW: Extended severity enum with Critical and Info
    severity: { type: String, required: true, enum: ['Critical', 'High', 'Medium', 'Low', 'Info'] },
    // [ARIA] NEW: Link to source Alert
    alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert' },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
