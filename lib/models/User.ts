import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  telegramId: number
  username?: string
  firstName?: string
  lastName?: string
  magnumCoins: number
  stars: number
  energy: number
  maxEnergy: number
  totalClicks: number
  level: number
  lastEnergyRestore: Date
  clickPower?: number
  upgrades?: Array<{
    id: string
    level: number
  }>
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  telegramId: { type: Number, required: true, unique: true },
  username: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  magnumCoins: { type: Number, default: 0 },
  stars: { type: Number, default: 0 },
  energy: { type: Number, default: 100 },
  maxEnergy: { type: Number, default: 100 },
  totalClicks: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  lastEnergyRestore: { type: Date, default: Date.now },
  clickPower: { type: Number, default: 1 },
  upgrades: [{
    id: { type: String, required: true },
    level: { type: Number, default: 0 }
  }],
}, {
  timestamps: true
})

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
