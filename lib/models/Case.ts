import mongoose, { Document, Schema } from 'mongoose'

export interface ICase extends Document {
  userId: number
  caseType: string
  caseName: string
  price: number
  rewards: Array<{
    type: 'coins' | 'stars' | 'energy'
    amount: number
  }>
  openedAt: Date
}

const CaseSchema = new Schema<ICase>({
  userId: { type: Number, required: true },
  caseType: { type: String, required: true },
  caseName: { type: String, required: true },
  price: { type: Number, required: true },
  rewards: [{
    type: { type: String, enum: ['coins', 'stars', 'energy'], required: true },
    amount: { type: Number, required: true }
  }],
  openedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
})

export default mongoose.models.Case || mongoose.model<ICase>('Case', CaseSchema)
