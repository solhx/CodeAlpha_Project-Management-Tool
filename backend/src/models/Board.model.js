// backend/src/models/Board.model.js
import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    background: { type: String, default: '#f8fafc' },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Board', boardSchema);