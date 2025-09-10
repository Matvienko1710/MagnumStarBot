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

    // Validate Telegram ID format
    const telegramIdNum = parseInt(telegramId)
    if (isNaN(telegramIdNum) || telegramIdNum < 100000000 || telegramIdNum > 999999999) {
      console.log('Invalid Telegram ID format:', telegramId)
      return NextResponse.json({ error: 'Invalid Telegram ID format' }, { status: 400 })
    }

    // Connect to MongoDB first
    await connectDB()

    let user = await User.findOne({ telegramId: telegramIdNum })
    
    if (!user) {
      console.log('User not found, creating new user with telegramId:', telegramId)
      // Create new user
        user = new User({
          telegramId: telegramIdNum,
          magnumCoins: 100,
          stars: 0,
          energy: 100,
          maxEnergy: 100,
          totalClicks: 0,
          level: 1,
          lastEnergyRestore: new Date(),
          clickPower: 1,
          upgrades: []
        })
      await user.save()
      console.log('New user created:', user)
    } else {
      console.log('Found existing user:', { telegramId: user.telegramId, magnumCoins: user.magnumCoins, energy: user.energy })
    }

    if (user.energy <= 0) {
      console.log('User has no energy left')
      return NextResponse.json({ error: 'No energy left' }, { status: 400 })
    }

    // Update user stats - give +1 Magnum Coin and +0.0001 stars per click
    user.magnumCoins += 1
    user.stars += 0.0001
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
