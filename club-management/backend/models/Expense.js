import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    note: { type: String },
    proofUrl: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model('Expense', expenseSchema);
