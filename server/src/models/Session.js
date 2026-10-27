import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  channel: { type: String, required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  totalMessages: { type: Number, default: 0 },
  peakVelocity: { type: Number, default: 0 }, // msgs/sec
  summaries: [
    {
      timestamp: { type: Date, default: Date.now },
      bullets: [String],
      sentiment: {
        score: Number,
        label: String
      },
      alerts: [String]
    }
  ],
  status: { type: String, enum: ['active', 'ended'], default: 'active' }
}, { timestamps: true });

export const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);
