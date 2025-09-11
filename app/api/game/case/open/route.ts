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

// Определяем кейсы (в реальном приложении это может быть в отдельном файле)
const CASES = {
  starter: {
    id: "starter",
    name: "Стартовый кейс",
    price: 100,
    rewards: [
      { type: "coins", min: 50, max: 200, chance: 70 },
      { type: "coins", min: 200, max: 500, chance: 25 },
      { type: "stars", min: 1, max: 5, chance: 5 },
    ],
  },
  golden: {
    id: "golden",
    name: "Золотой кейс",
    price: 500,
    rewards: [
      { type: "coins", min: 300, max: 800, chance: 50 },
      { type: "coins", min: 800, max: 1500, chance: 30 },
      { type: "stars", min: 5, max: 15, chance: 15 },
      { type: "energy", min: 20, max: 50, chance: 5 },
    ],
  },
  platinum: {
    id: "platinum",
    name: "Платиновый кейс",
    price: 1500,
    rewards: [
      { type: "coins", min: 1000, max: 3000, chance: 40 },
      { type: "coins", min: 3000, max: 6000, chance: 30 },
      { type: "stars", min: 10, max: 30, chance: 20 },
      { type: "energy", min: 50, max: 100, chance: 10 },
    ],
  },
}

export async function POST(request: NextRequest) {
  try {
    const { telegramId } = verifyToken(request)
    const body = await request.json()
    const { caseId } = body

    const caseData = CASES[caseId as keyof typeof CASES]
    if (!caseData) {
      return NextResponse.json({ success: false, error: "Invalid case" }, { status: 400 })
    }

    const user = await userService.findUserByTelegramId(telegramId)
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Проверяем достаточно ли монет
    if (user.gameData.magnumCoins < caseData.price) {
      return NextResponse.json({ success: false, error: "Not enough coins" }, { status: 400 })
    }

    // Генерируем награду
    const totalChance = caseData.rewards.reduce((sum, reward) => sum + reward.chance, 0)
    let random = Math.random() * totalChance
    let selectedReward = caseData.rewards[0]

    for (const reward of caseData.rewards) {
      random -= reward.chance
      if (random <= 0) {
        selectedReward = reward
        break
      }
    }

    const amount = Math.floor(Math.random() * (selectedReward.max - selectedReward.min + 1)) + selectedReward.min

    // Определяем редкость
    let rarity = "common"
    if (selectedReward.chance <= 5) rarity = "mythic"
    else if (selectedReward.chance <= 10) rarity = "legendary"
    else if (selectedReward.chance <= 20) rarity = "epic"
    else if (selectedReward.chance <= 40) rarity = "rare"

    // Обновляем данные пользователя
    const updates: any = {
      magnumCoins: user.gameData.magnumCoins - caseData.price,
      statistics: {
        ...user.gameData.statistics,
        totalSpent: user.gameData.statistics.totalSpent + caseData.price,
        casesOpened: user.gameData.statistics.casesOpened + 1,
      },
    }

    if (selectedReward.type === "coins") {
      updates.magnumCoins += amount
      updates.statistics.totalEarned = user.gameData.statistics.totalEarned + amount
    } else if (selectedReward.type === "stars") {
      updates.stars = user.gameData.stars + amount
    } else if (selectedReward.type === "energy") {
      updates.energy = Math.min(user.gameData.maxEnergy, user.gameData.energy + amount)
    }

    // Проверяем на редкий предмет
    if (rarity === "legendary" || rarity === "mythic") {
      updates.statistics.rareItemsFound = user.gameData.statistics.rareItemsFound + 1
    }

    await userService.updateUserGameData(telegramId, updates)

    // Записываем открытие кейса
    await userService.recordCaseOpening({
      userId: telegramId,
      caseId: caseData.id,
      caseName: caseData.name,
      cost: caseData.price,
      rewards: [
        {
          type: selectedReward.type as any,
          amount,
          rarity,
        },
      ],
    })

    // Обновляем лидерборд
    await userService.updateLeaderboard(telegramId)

    return NextResponse.json({
      success: true,
      reward: {
        type: selectedReward.type,
        amount,
        rarity,
      },
      newStats: {
        magnumCoins: updates.magnumCoins,
        stars: updates.stars || user.gameData.stars,
        energy: updates.energy || user.gameData.energy,
      },
    })
  } catch (error) {
    console.error("Case opening error:", error)
    return NextResponse.json({ success: false, error: "Case opening failed" }, { status: 500 })
  }
}
