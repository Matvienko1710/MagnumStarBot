import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const telegramId = searchParams.get('telegramId')
    
    if (!telegramId) {
      return NextResponse.json({ error: 'Telegram ID is required' }, { status: 400 })
    }

    let user = await User.findOne({ telegramId: parseInt(telegramId) })
    
    if (!user) {
      // Create new user
      user = new User({
        telegramId: parseInt(telegramId),
        magnumCoins: 100, // Starting coins
        stars: 0,
        energy: 100,
        maxEnergy: 100,
        totalClicks: 0,
        level: 1,
        lastEnergyRestore: new Date()
      })
      await user.save()
    }

    return NextResponse.json({
      success: true,
      user: {
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        magnumCoins: user.magnumCoins,
        stars: user.stars,
        energy: user.energy,
        maxEnergy: user.maxEnergy,
        totalClicks: user.totalClicks,
        level: user.level,
        lastEnergyRestore: user.lastEnergyRestore
      }
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { telegramId, username, firstName, lastName } = body

    if (!telegramId) {
      return NextResponse.json({ error: 'Telegram ID is required' }, { status: 400 })
    }

    let user = await User.findOne({ telegramId })
    
    if (user) {
      // Update existing user
      user.username = username
      user.firstName = firstName
      user.lastName = lastName
      await user.save()
    } else {
      // Create new user
      user = new User({
        telegramId,
        username,
        firstName,
        lastName,
        magnumCoins: 100,
        stars: 0,
        energy: 100,
        maxEnergy: 100,
        totalClicks: 0,
        level: 1,
        lastEnergyRestore: new Date()
      })
      await user.save()
    }

    return NextResponse.json({
      success: true,
      user: {
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        magnumCoins: user.magnumCoins,
        stars: user.stars,
        energy: user.energy,
        maxEnergy: user.maxEnergy,
        totalClicks: user.totalClicks,
        level: user.level,
        lastEnergyRestore: user.lastEnergyRestore
      }
    })
  } catch (error) {
    console.error('Error creating/updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
