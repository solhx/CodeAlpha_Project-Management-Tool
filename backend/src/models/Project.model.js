// backend/src/models/Project.model.js
import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: {
    type    : String,
    enum    : ['owner', 'admin', 'member', 'viewer'],
    default : 'member',
  },
  joinedAt: { type: Date, default: Date.now },
});

const projectSchema = new mongoose.Schema(
  {
    name: {
      type      : String,
      required  : [true, 'Project name is required'],
      trim      : true,
      maxlength : [100, 'Project name cannot exceed 100 characters'],
    },
    description : { type: String, maxlength: 500 },
    owner: {
      type     : mongoose.Schema.Types.ObjectId,
      ref      : 'User',
      required : true,
    },
    members    : [memberSchema],
    color      : { type: String, default: '#6366f1' },
    icon       : { type: String, default: '📋' },
    status: {
      type    : String,
      enum    : ['active', 'archived', 'completed'],
      default : 'active',
    },
    coverImage : { type: String },
    isPrivate  : { type: Boolean, default: false },
    dueDate    : { type: Date },
    tags       : [{ type: String, trim: true }],
  },
  {
    timestamps : true,
    toJSON     : { virtuals: true },
    toObject   : { virtuals: true },
  }
);

// Virtual: count of boards
projectSchema.virtual('boardCount', {
  ref        : 'Board',
  localField : '_id',
  foreignField: 'project',
  count      : true,
});

// ✅ FIX: Add text index so $text search queries don't throw
// MongoServerError: text index required for $text query.
// Including `tags` allows searching by project tag keywords too.
projectSchema.index({ name: 'text', description: 'text', tags: 'text' });

// ✅ Performance index: most common query is "projects I own or am a member of"
projectSchema.index({ owner: 1 });
projectSchema.index({ 'members.user': 1 });

export default mongoose.model('Project', projectSchema);