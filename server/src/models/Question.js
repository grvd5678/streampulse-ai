import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  channel: { type: String, required: true },
  user: { type: String, required: true },
  question: { type: String, required: true },
  category: { type: String, default: 'General' }, // 'Gameplay', 'Hardware', 'Personal', 'General'
  isAnswered: { type: Boolean, default: false },
  isPinnedToOverlay: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);
