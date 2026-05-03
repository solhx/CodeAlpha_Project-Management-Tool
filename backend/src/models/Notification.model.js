// backend/src/models/Notification.model.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: [
        'task_assigned',
        'task_updated',
        'task_completed',
        'comment_added',
        'comment_mention',
        'project_invite',
        'due_date_reminder',
        'member_joined',
      ],
      required: true,
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String }, // deep link to resource
    metadata: { type: mongoose.Schema.Types.Mixed }, // { taskId, projectId, ... }
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);