import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { telegramId } = body

    console.log('Click API called with telegramId:', telegramId)

    if (!telegramId) {
      console.log('No telegramId provided')
      return NextResponse.json({ error: 'Telegram ID is required' }, { status: 400 })
    }

    // Connect to MongoDB first
    await connectDB()

    let user = await User.findOne({ telegramId })
    
    if (!user) {
      console.log('User not found, creating new user with telegramId:', telegramId)
      // Create new user
      user = new User({
        telegramId: parseInt(telegramId),
        magnumCoins: 100,
        stars: 0,
        energy: 100,
        maxEnergy: 100,
        totalClicks: 0,
        level: 1,
        lastEnergyRestore: new Date()
      })
      await user.save()
      console.log('New user created:', user)
    }

    if (user.energy <= 0) {
      console.log('User has no energy left')
      return NextResponse.json({ error: 'No energy left' }, { status: 400 })
    }

    // Update user stats - only give Magnum Coins for clicks
    user.magnumCoins += 1
    user.energy -= 1
    user.totalClicks += 1
    user.level = Math.floor(user.totalClicks / 100) + 1

    await user.save()
    console.log('User updated:', { magnumCoins: user.magnumCoins, energy: user.energy, totalClicks: user.totalClicks })

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
