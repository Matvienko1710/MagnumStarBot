import { type NextRequest, NextResponse } from "next/server"
import { userService } from "@/lib/database/userService"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("No token provided")
  }

  const token = authHeader.substring(7)
  return jwt.verify(token, JWT_SECRET) as { telegramId: string }
}

export async function POST(request: NextRequest) {
  try {
    const { telegramId } = verifyToken(request)
    const body = await request.json()
    const { clickPower = 1, energyCost = 1 } = body

    const user = await userService.findUserByTelegramId(telegramId)
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Проверяем энергию
    if (user.gameData.energy < energyCost) {
      return NextResponse.json({ success: false, error: "Not enough energy" }, { status: 400 })
    }

    // Вычисляем награду
    const coinsEarned = clickPower
    const experienceGained = 1

    // Обновляем данные пользователя
    const newEnergy = user.gameData.energy - energyCost
    const newCoins = user.gameData.magnumCoins + coinsEarned
    const newExperience = user.gameData.experience + experienceGained
    const newTotalClicks = user.gameData.totalClicks + 1

    // Проверяем повышение уровня
    let newLevel = user.gameData.level
    let experienceToNext = user.gameData.experienceToNext

    if (newExperience >= experienceToNext) {
      newLevel += 1
      experienceToNext = newLevel * 100 // Простая формула для следующего уровня
    }

    // Обновляем в базе данных
    await userService.updateUserGameData(telegramId, {
      magnumCoins: newCoins,
      energy: newEnergy,
      experience: newExperience,
      level: newLevel,
      experienceToNext,
      totalClicks: newTotalClicks,
      statistics: {
        ...user.gameData.statistics,
        totalEarned: user.gameData.statistics.totalEarned + coinsEarned,
        currentClickStreak: user.gameData.statistics.currentClickStreak + 1,
      },
    })

    // Обновляем лидерборд
    await userService.updateLeaderboard(telegramId)

    return NextResponse.json({
      success: true,
      rewards: {
        coins: coinsEarned,
        experience: experienceGained,
      },
      newStats: {
        magnumCoins: newCoins,
        energy: newEnergy,
        experience: newExperience,
        level: newLevel,
        experienceToNext,
        totalClicks: newTotalClicks,
      },
    })
  } catch (error) {
    console.error("Click error:", error)
    return NextResponse.json({ success: false, error: "Click processing failed" }, { status: 500 })
  }
}
