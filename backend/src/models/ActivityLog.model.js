// backend/src/models/ActivityLog.model.js
import mongoose from "mongoose";
const activitySchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: [
        'created_task', 'updated_task', 'deleted_task', 'moved_task',
        'assigned_task', 'commented', 'uploaded_file',
        'created_board', 'created_project', 'invited_member',
        'changed_status', 'changed_priority',
      ],
    },
    target: {
      type: { type: String, enum: ['Task', 'Board', 'Project', 'Comment'] },
      id: mongoose.Schema.Types.ObjectId,
    },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    detail: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

activitySchema.index({ project: 1, createdAt: -1 });

export default mongoose.model('ActivityLog', activitySchema);