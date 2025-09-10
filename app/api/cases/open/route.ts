import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Case from '@/lib/models/Case'

const caseTypes = {
  bronze: {
    name: 'Бронзовый кейс',
    price: 100,
    rewards: [
      { type: 'coins', min: 50, max: 200 },
      { type: 'stars', min: 0.001, max: 0.01 }
    ]
  },
  silver: {
    name: 'Серебряный кейс',
    price: 500,
    rewards: [
      { type: 'coins', min: 300, max: 800 },
      { type: 'stars', min: 0.01, max: 0.05 },
      { type: 'energy', min: 10, max: 30 }
    ]
  },
  gold: {
    name: 'Золотой кейс',
    price: 1000,
    rewards: [
      { type: 'coins', min: 800, max: 2000 },
      { type: 'stars', min: 0.05, max: 0.15 },
      { type: 'energy', min: 20, max: 50 }
    ]
  },
  platinum: {
    name: 'Платиновый кейс',
    price: 5000,
    rewards: [
      { type: 'coins', min: 3000, max: 8000 },
      { type: 'stars', min: 0.1, max: 0.5 },
      { type: 'energy', min: 50, max: 100 }
    ]
  },
  mythic: {
    name: 'Мифический кейс',
    price: 15000,
    rewards: [
      { type: 'coins', min: 10000, max: 25000 },
      { type: 'stars', min: 0.5, max: 2.0 },
      { type: 'energy', min: 100, max: 200 }
    ]
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { telegramId, caseType } = body

    if (!telegramId || !caseType) {
      return NextResponse.json({ error: 'Telegram ID and case type are required' }, { status: 400 })
    }

    const caseConfig = caseTypes[caseType as keyof typeof caseTypes]
    if (!caseConfig) {
      return NextResponse.json({ error: 'Invalid case type' }, { status: 400 })
    }

    const user = await User.findOne({ telegramId })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.magnumCoins < caseConfig.price) {
      return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })
    }

    // Generate rewards
    const rewards = caseConfig.rewards.map(reward => ({
      type: reward.type,
      amount: Math.random() * (reward.max - reward.min) + reward.min
    }))

    // Update user balance
    user.magnumCoins -= caseConfig.price
    
    rewards.forEach(reward => {
      if (reward.type === 'coins') {
        user.magnumCoins += Math.floor(reward.amount)
      } else if (reward.type === 'stars') {
        user.stars += reward.amount
      } else if (reward.type === 'energy') {
        user.energy = Math.min(user.maxEnergy, user.energy + Math.floor(reward.amount))
      }
    })

    await user.save()

    // Save case opening record
    const caseRecord = new Case({
      userId: telegramId,
      caseType,
      caseName: caseConfig.name,
      price: caseConfig.price,
      rewards
    })
    await caseRecord.save()

    return NextResponse.json({
      success: true,
      rewards,
      user: {
        magnumCoins: user.magnumCoins,
        stars: user.stars,
        energy: user.energy
      }
    })
  } catch (error) {
    console.error('Error opening case:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
