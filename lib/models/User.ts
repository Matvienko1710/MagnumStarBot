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
  experience: number
  experienceToNext: number
  lastEnergyRestore: Date
  clickPower: number
  upgrades: Array<{
    id: string
    level: number
  }>
  statistics: {
    totalEarned: number
    totalSpent: number
    casesOpened: number
    rareItemsFound: number
    daysPlayed: number
    maxClickStreak: number
    currentClickStreak: number
    prestigeCount: number
  }
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  telegramId: { type: Number, required: true, unique: true },
  username: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  magnumCoins: { type: Number, default: 100, min: 0 },
  stars: { type: Number, default: 0, min: 0 },
  energy: { type: Number, default: 100, min: 0 },
  maxEnergy: { type: Number, default: 100, min: 1 },
  totalClicks: { type: Number, default: 0, min: 0 },
  level: { type: Number, default: 1, min: 1 },
  experience: { type: Number, default: 0, min: 0 },
  experienceToNext: { type: Number, default: 100, min: 1 },
  lastEnergyRestore: { type: Date, default: Date.now },
  clickPower: { type: Number, default: 1, min: 1 },
  upgrades: [{
    id: { type: String, required: true },
    level: { type: Number, default: 0, min: 0 }
  }],
  statistics: {
    totalEarned: { type: Number, default: 0, min: 0 },
    totalSpent: { type: Number, default: 0, min: 0 },
    casesOpened: { type: Number, default: 0, min: 0 },
    rareItemsFound: { type: Number, default: 0, min: 0 },
    daysPlayed: { type: Number, default: 1, min: 1 },
    maxClickStreak: { type: Number, default: 0, min: 0 },
    currentClickStreak: { type: Number, default: 0, min: 0 },
    prestigeCount: { type: Number, default: 0, min: 0 }
  }
}, {
  timestamps: true
})

// Индексы для оптимизации запросов
UserSchema.index({ telegramId: 1 })
UserSchema.index({ level: -1 })
UserSchema.index({ magnumCoins: -1 })

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
