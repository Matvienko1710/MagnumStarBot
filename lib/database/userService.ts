import { getDatabase } from "../mongodb"
import type { User, GameData, CaseOpening, LeaderboardEntry } from "../models/User"

export class UserService {
  private async getCollection() {
    const db = await getDatabase()
    return db.collection<User>("users")
  }

  private async getCaseOpeningsCollection() {
    const db = await getDatabase()
    return db.collection<CaseOpening>("case_openings")
  }

  private async getLeaderboardCollection() {
    const db = await getDatabase()
    return db.collection<LeaderboardEntry>("leaderboard")
  }

  async findUserByTelegramId(telegramId: string): Promise<User | null> {
    const collection = await this.getCollection()
    return await collection.findOne({ telegramId })
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const collection = await this.getCollection()

    const defaultGameData: GameData = {
      magnumCoins: 0,
      stars: 0,
      energy: 100,
      maxEnergy: 100,
      totalClicks: 0,
      lastEnergyRestore: Date.now(),
      clickPower: 1,
      level: 1,
      experience: 0,
      experienceToNext: 100,
      prestigeLevel: 0,
      dailyStreak: 0,
      lastLoginDate: new Date().toDateString(),
      achievements: [],
      inventory: [],
      dailyRewards: this.generateDailyRewards(),
      lastDailyReward: "",
      autoClicker: {
        active: false,
        level: 0,
        clicksPerSecond: 0,
        duration: 0,
        remaining: 0,
      },
      boosts: [],
      statistics: {
        totalEarned: 0,
        totalSpent: 0,
        casesOpened: 0,
        rareItemsFound: 0,
        daysPlayed: 1,
        maxClickStreak: 0,
        currentClickStreak: 0,
        prestigeCount: 0,
      },
      upgrades: [],
    }

    const newUser: User = {
      telegramId: userData.telegramId!,
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      languageCode: userData.languageCode || "en",
      isPremium: userData.isPremium || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      gameData: defaultGameData,
    }

    const result = await collection.insertOne(newUser)
    return { ...newUser, _id: result.insertedId.toString() }
  }

  async updateUserGameData(telegramId: string, gameData: Partial<GameData>): Promise<boolean> {
    const collection = await this.getCollection()

    const updateData: any = {
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    }

    // Обновляем только переданные поля gameData
    Object.keys(gameData).forEach((key) => {
      updateData[`gameData.${key}`] = gameData[key as keyof GameData]
    })

    const result = await collection.updateOne({ telegramId }, { $set: updateData })

    return result.modifiedCount > 0
  }

  async incrementCoins(telegramId: string, amount: number): Promise<boolean> {
    const collection = await this.getCollection()

    const result = await collection.updateOne(
      { telegramId },
      {
        $inc: {
          "gameData.magnumCoins": amount,
          "gameData.totalClicks": 1,
          "gameData.statistics.totalEarned": amount,
        },
        $set: {
          updatedAt: new Date(),
          lastLoginAt: new Date(),
        },
      },
    )

    return result.modifiedCount > 0
  }

  async recordCaseOpening(caseOpening: Omit<CaseOpening, "_id">): Promise<string> {
    const collection = await this.getCaseOpeningsCollection()
    const result = await collection.insertOne({
      ...caseOpening,
      openedAt: new Date(),
    })

    // Обновляем статистику пользователя
    await this.updateUserGameData(caseOpening.userId, {
      statistics: {
        casesOpened: 1,
        totalSpent: caseOpening.cost,
      } as any,
    })

    return result.insertedId.toString()
  }

  async getUserCaseHistory(telegramId: string, limit = 50): Promise<CaseOpening[]> {
    const collection = await this.getCaseOpeningsCollection()
    return await collection.find({ userId: telegramId }).sort({ openedAt: -1 }).limit(limit).toArray()
  }

  async getLeaderboard(type: "coins" | "level" | "clicks" = "coins", limit = 100): Promise<LeaderboardEntry[]> {
    const collection = await this.getLeaderboardCollection()

    let sortField = "magnumCoins"
    if (type === "level") sortField = "level"
    if (type === "clicks") sortField = "totalClicks"

    return await collection
      .find({})
      .sort({ [sortField]: -1 })
      .limit(limit)
      .toArray()
  }

  async updateLeaderboard(telegramId: string): Promise<void> {
    const user = await this.findUserByTelegramId(telegramId)
    if (!user) return

    const leaderboardCollection = await this.getLeaderboardCollection()

    const leaderboardEntry: Omit<LeaderboardEntry, "_id"> = {
      userId: telegramId,
      username: user.username || user.firstName || "Anonymous",
      magnumCoins: user.gameData.magnumCoins,
      level: user.gameData.level,
      totalClicks: user.gameData.totalClicks,
      updatedAt: new Date(),
    }

    await leaderboardCollection.updateOne({ userId: telegramId }, { $set: leaderboardEntry }, { upsert: true })
  }

  private generateDailyRewards() {
    const rewards = []
    for (let day = 1; day <= 7; day++) {
      let reward
      if (day === 7) {
        reward = { day, type: "case" as const, amount: 1, claimed: false, special: true }
      } else if (day % 3 === 0) {
        reward = { day, type: "stars" as const, amount: day * 10, claimed: false }
      } else if (day % 2 === 0) {
        reward = { day, type: "energy" as const, amount: 50, claimed: false }
      } else {
        reward = { day, type: "coins" as const, amount: day * 100, claimed: false }
      }
      rewards.push(reward)
    }
    return rewards
  }

  async getUserStats(telegramId: string) {
    const user = await this.findUserByTelegramId(telegramId)
    if (!user) return null

    const caseHistory = await this.getUserCaseHistory(telegramId, 10)

    return {
      user: user.gameData,
      recentCases: caseHistory,
      rank: await this.getUserRank(telegramId),
    }
  }

  private async getUserRank(telegramId: string): Promise<number> {
    const user = await this.findUserByTelegramId(telegramId)
    if (!user) return 0

    const collection = await this.getLeaderboardCollection()
    const higherRanked = await collection.countDocuments({
      magnumCoins: { $gt: user.gameData.magnumCoins },
    })

    return higherRanked + 1
  }
}

export const userService = new UserService()
