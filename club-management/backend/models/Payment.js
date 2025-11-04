import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true }, // YYYY-MM
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    proofPath: { type: String }
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, month: 1 }, { unique: true });

export default mongoose.model('Payment', paymentSchema);
