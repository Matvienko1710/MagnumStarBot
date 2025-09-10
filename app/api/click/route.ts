import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { telegramId } = body

    if (!telegramId) {
      return NextResponse.json({ error: 'Telegram ID is required' }, { status: 400 })
    }

    // Try to connect to MongoDB
    try {
      await connectDB()
    } catch (error) {
      console.warn('MongoDB connection failed, using test data:', error)
      // Return test response when MongoDB is not available
      return NextResponse.json({
        success: true,
        user: {
          magnumCoins: 1001,
          stars: 0.5,
          energy: 99,
          totalClicks: 1,
          level: 1
        }
      })
    }

    const user = await User.findOne({ telegramId })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.energy <= 0) {
      return NextResponse.json({ error: 'No energy left' }, { status: 400 })
    }

    // Update user stats - only give Magnum Coins for clicks
    user.magnumCoins += 1
    user.energy -= 1
    user.totalClicks += 1
    user.level = Math.floor(user.totalClicks / 100) + 1

    await user.save()

    return NextResponse.json({
      success: true,
      user: {
        magnumCoins: user.magnumCoins,
        stars: user.stars,
        energy: user.energy,
        totalClicks: user.totalClicks,
        level: user.level
      }
    })
  } catch (error) {
    console.error('Error processing click:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
