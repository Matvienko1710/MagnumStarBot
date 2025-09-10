import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { telegramId, upgradeId, level } = body

    console.log('Upgrade API called with:', { telegramId, upgradeId, level })

    if (!telegramId || !upgradeId || level === undefined) {
      console.log('Missing required parameters')
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Validate Telegram ID format
    const telegramIdNum = parseInt(telegramId)
    if (isNaN(telegramIdNum) || telegramIdNum < 100000000 || telegramIdNum > 999999999) {
      console.log('Invalid Telegram ID format:', telegramId)
      return NextResponse.json({ error: 'Invalid Telegram ID format' }, { status: 400 })
    }

    // Connect to MongoDB
    await connectDB()

    let user = await User.findOne({ telegramId: telegramIdNum })
    
    if (!user) {
      console.log('User not found for upgrade')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Initialize upgrades if not exists
    if (!user.upgrades) {
      user.upgrades = []
    }

    // Find existing upgrade or create new one
    let upgrade = user.upgrades.find((u: any) => u.id === upgradeId)
    if (!upgrade) {
      upgrade = { id: upgradeId, level: 0 }
      user.upgrades.push(upgrade)
    }

    // Update upgrade level
    upgrade.level = level

    // Apply upgrade effects to user stats
    switch (upgradeId) {
      case 'click_power':
        user.clickPower = 1 + level // Base 1 + upgrade levels
        break
      case 'energy_capacity':
        user.maxEnergy = 100 + (level * 10) // Base 100 + 10 per level
        // If current energy is higher than new max, cap it
        if (user.energy > user.maxEnergy) {
          user.energy = user.maxEnergy
        }
        break
      case 'energy_regen':
        // This will be handled in the frontend timer
        break
      case 'star_multiplier':
        // This will be handled in the frontend click logic
        break
    }

    await user.save()
    console.log('User upgrade saved:', { telegramId: user.telegramId, upgradeId, level })

    return NextResponse.json({
      success: true,
      upgrade: {
        id: upgradeId,
        level: level
      }
    })
  } catch (error) {
    console.error('Error processing upgrade:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const telegramId = searchParams.get('telegramId')
    
    console.log('GET /api/upgrades called with telegramId:', telegramId)
    
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

    // Connect to MongoDB
    await connectDB()

    let user = await User.findOne({ telegramId: telegramIdNum })
    
    if (!user) {
      console.log('User not found for upgrades')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      upgrades: user.upgrades || []
    })
  } catch (error) {
    console.error('Error fetching upgrades:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
