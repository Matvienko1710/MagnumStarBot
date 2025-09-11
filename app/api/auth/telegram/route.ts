import { type NextRequest, NextResponse } from "next/server"
import { userService } from "@/lib/database/userService"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { initData } = body

    // В реальном приложении здесь должна быть валидация Telegram WebApp initData
    // Для демонстрации используем простую структуру
    const telegramUser = {
      id: body.user?.id || Math.random().toString(),
      username: body.user?.username,
      first_name: body.user?.first_name,
      last_name: body.user?.last_name,
      language_code: body.user?.language_code,
      is_premium: body.user?.is_premium,
    }

    let user = await userService.findUserByTelegramId(telegramUser.id.toString())

    if (!user) {
      // Создаем нового пользователя
      user = await userService.createUser({
        telegramId: telegramUser.id.toString(),
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        languageCode: telegramUser.language_code,
        isPremium: telegramUser.is_premium,
      })
    } else {
      // Обновляем время последнего входа
      await userService.updateUserGameData(telegramUser.id.toString(), {
        lastLoginDate: new Date().toDateString(),
      } as any)
    }

    // Создаем JWT токен
    const token = jwt.sign({ telegramId: user.telegramId }, JWT_SECRET, { expiresIn: "7d" })

    return NextResponse.json({
      success: true,
      token,
      user: {
        telegramId: user.telegramId,
        username: user.username,
        gameData: user.gameData,
      },
    })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 })
  }
}
