// backend/src/models/Column.model.js
import mongoose from "mongoose";
const columnSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    order: { type: Number, required: true, default: 0 },
    color: { type: String, default: '#e2e8f0' },
    taskLimit: { type: Number, default: null }, // WIP limit
  },
  { timestamps: true }
);

export default mongoose.model('Column', columnSchema);