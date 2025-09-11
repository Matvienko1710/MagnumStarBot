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

    // Validate Telegram ID format
    const telegramIdNum = parseInt(telegramId)
    if (isNaN(telegramIdNum) || telegramIdNum < 100000000 || telegramIdNum > 999999999) {
      console.log('Invalid Telegram ID format:', telegramId)
      return NextResponse.json({ error: 'Invalid Telegram ID format' }, { status: 400 })
    }

      // Try to connect to MongoDB
      try {
        await connectDB()
      } catch (error) {
        console.error('MongoDB connection failed:', error)
        return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
      }

    console.log('Searching for user with telegramId:', telegramIdNum)
    let user = await User.findOne({ telegramId: telegramIdNum })
    console.log('Found user in database:', user ? { telegramId: user.telegramId, magnumCoins: user.magnumCoins, stars: user.stars, energy: user.energy } : 'No user found')
    
    // Also try to find any users with similar IDs for debugging
    const allUsers = await User.find({}).limit(5)
    console.log('All users in database (first 5):', allUsers.map(u => ({ telegramId: u.telegramId, magnumCoins: u.magnumCoins })))
    
    if (!user) {
      console.log('Creating new user with telegramId:', telegramId)
      // Create new user
      user = new User({
        telegramId: telegramIdNum,
        magnumCoins: 100,
        stars: 0,
        energy: 100,
        maxEnergy: 100,
        totalClicks: 0,
        level: 1,
        experience: 0,
        experienceToNext: 100,
        lastEnergyRestore: new Date(),
        clickPower: 1,
        upgrades: [],
        statistics: {
          totalEarned: 0,
          totalSpent: 0,
          casesOpened: 0,
          rareItemsFound: 0,
          daysPlayed: 1,
          maxClickStreak: 0,
          currentClickStreak: 0,
          prestigeCount: 0
        }
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
        experience: user.experience,
        experienceToNext: user.experienceToNext,
        lastEnergyRestore: user.lastEnergyRestore,
        clickPower: user.clickPower,
        upgrades: user.upgrades,
        statistics: user.statistics
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

    // Validate Telegram ID format
    const telegramIdNum = parseInt(telegramId)
    if (isNaN(telegramIdNum) || telegramIdNum < 100000000 || telegramIdNum > 999999999) {
      console.log('Invalid Telegram ID format in POST:', telegramId)
      return NextResponse.json({ error: 'Invalid Telegram ID format' }, { status: 400 })
    }

    let user = await User.findOne({ telegramId: telegramIdNum })
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
        telegramId: telegramIdNum,
        username,
        firstName,
        lastName,
        magnumCoins: 100,
        stars: 0,
        energy: 100,
        maxEnergy: 100,
        totalClicks: 0,
        level: 1,
        experience: 0,
        experienceToNext: 100,
        lastEnergyRestore: new Date(),
        clickPower: 1,
        upgrades: [],
        statistics: {
          totalEarned: 0,
          totalSpent: 0,
          casesOpened: 0,
          rareItemsFound: 0,
          daysPlayed: 1,
          maxClickStreak: 0,
          currentClickStreak: 0,
          prestigeCount: 0
        }
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
        experience: user.experience,
        experienceToNext: user.experienceToNext,
        lastEnergyRestore: user.lastEnergyRestore,
        clickPower: user.clickPower,
        upgrades: user.upgrades,
        statistics: user.statistics
      }
    })
  } catch (error) {
    console.error('Error creating/updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
