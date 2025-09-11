import { type NextRequest, NextResponse } from "next/server"
import { userService } from "@/lib/database/userService"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = (searchParams.get("type") as "coins" | "level" | "clicks") || "coins"
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    const leaderboard = await userService.getLeaderboard(type, limit)

    return NextResponse.json({
      success: true,
      leaderboard,
    })
  } catch (error) {
    console.error("Leaderboard error:", error)
    return NextResponse.json({ success: false, error: "Failed to get leaderboard" }, { status: 500 })
  }
}
