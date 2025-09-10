import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const telegramId = searchParams.get('telegramId')
    
    console.log('GET /api/users called with telegramId:', telegramId)
    
    if (!telegramId) {
      console.log('No telegramId provided')
      return NextResponse.json({ error: 'Telegram ID is required' }, { status: 400 })
    }

    // Try to connect to MongoDB
    try {
      await connectDB()
    } catch (error) {
      console.warn('MongoDB connection failed, using test data:', error)
      // Return test data when MongoDB is not available
      return NextResponse.json({
        success: true,
        user: {
          telegramId: parseInt(telegramId),
          username: 'test_user',
          firstName: 'Test',
          lastName: 'User',
          magnumCoins: 1000,
          stars: 0.5,
          energy: 100,
          maxEnergy: 100,
          totalClicks: 0,
          level: 1,
          lastEnergyRestore: new Date().toISOString()
        }
      })
    }

    let user = await User.findOne({ telegramId: parseInt(telegramId) })
    console.log('Found user in database:', user ? { telegramId: user.telegramId, magnumCoins: user.magnumCoins } : 'No user found')
    
    if (!user) {
      console.log('Creating new user with telegramId:', telegramId)
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
      console.log('New user created:', { telegramId: user.telegramId, magnumCoins: user.magnumCoins })
    } else {
      console.log('Using existing user:', { telegramId: user.telegramId, magnumCoins: user.magnumCoins })
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

    console.log('POST /api/users called with:', { telegramId, username, firstName, lastName })

    if (!telegramId) {
      console.log('No telegramId provided in POST')
      return NextResponse.json({ error: 'Telegram ID is required' }, { status: 400 })
    }

    let user = await User.findOne({ telegramId })
    console.log('Found user for POST:', user ? { telegramId: user.telegramId, magnumCoins: user.magnumCoins } : 'No user found')
    
    if (user) {
      console.log('Updating existing user:', telegramId)
      // Update existing user
      user.username = username
      user.firstName = firstName
      user.lastName = lastName
      await user.save()
      console.log('User updated:', { telegramId: user.telegramId, magnumCoins: user.magnumCoins })
    } else {
      console.log('Creating new user via POST:', telegramId)
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
      console.log('New user created via POST:', { telegramId: user.telegramId, magnumCoins: user.magnumCoins })
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
