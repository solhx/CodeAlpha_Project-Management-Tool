// backend/src/models/Task.model.js
import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  filename  : String,
  url       : String,
  publicId  : String,
  fileType  : String,
  size      : Number,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now },
});

const checklistItemSchema = new mongoose.Schema({
  text       : { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  assignedTo : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type     : String,
      required : [true, 'Task title is required'],
      trim     : true,
      maxlength: 200,
    },
    description: { type: String, maxlength: 2000 },
    board: {
      type    : mongoose.Schema.Types.ObjectId,
      ref     : 'Board',
      required: true,
    },
    column: {
      type    : mongoose.Schema.Types.ObjectId,
      ref     : 'Column',
      required: true,
    },
    project: {
      type    : mongoose.Schema.Types.ObjectId,
      ref     : 'Project',
      required: true,
    },
    createdBy: {
      type    : mongoose.Schema.Types.ObjectId,
      ref     : 'User',
      required: true,
    },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    priority: {
      type   : String,
      enum   : ['critical', 'high', 'medium', 'low', 'none'],
      default: 'none',
    },
    status: {
      type   : String,
      enum   : ['todo', 'in_progress', 'review', 'done'],
      default: 'todo',
    },
    labels: [
      {
        text : String,
        color: String,
      },
    ],
    dueDate        : { type: Date },
    startDate      : { type: Date },
    estimatedHours : { type: Number, min: 0 },
    actualHours    : { type: Number, min: 0 },
    order          : { type: Number, default: 0 },
    checklist      : [checklistItemSchema],
    attachments    : [attachmentSchema],
    coverColor     : { type: String },
    coverImage     : { type: String },
    isArchived     : { type: Boolean, default: false },
    watchers       : [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    toJSON    : { virtuals: true },
    toObject  : { virtuals: true },
  }
);

// ── Virtual: comment count ─────────────────────────────────────────────────────
taskSchema.virtual('commentCount', {
  ref        : 'Comment',
  localField : '_id',
  foreignField: 'task',
  count      : true,
});

// ── Indexes ────────────────────────────────────────────────────────────────────
taskSchema.index({ board: 1, column: 1, order: 1 });
taskSchema.index({ project: 1 });
taskSchema.index({ assignees: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ isArchived: 1 });

// ✅ ADDED: Text index required for $text search in getTasks
taskSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Task', taskSchema);