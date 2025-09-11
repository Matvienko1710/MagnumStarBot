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

export async function GET(request: NextRequest) {
  try {
    const { telegramId } = verifyToken(request)

    const stats = await userService.getUserStats(telegramId)
    if (!stats) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({ success: false, error: "Failed to get stats" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { telegramId } = verifyToken(request)
    const body = await request.json()

    const success = await userService.updateUserGameData(telegramId, body.gameData)

    if (success) {
      await userService.updateLeaderboard(telegramId)
    }

    return NextResponse.json({
      success,
    })
  } catch (error) {
    console.error("Stats update error:", error)
    return NextResponse.json({ success: false, error: "Failed to update stats" }, { status: 500 })
  }
}
