import { NextRequest, NextResponse } from 'next/server'
import { Telegraf } from 'telegraf'

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

// Start command
bot.start((ctx) => {
  ctx.reply(
    '🎮 Добро пожаловать в Magnum Clicker!\n\n' +
    'Зарабатывайте криптовалюту кликами в стиле Binance и Revolut!\n\n' +
    'Используйте кнопку ниже для открытия веб-приложения:',
    {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🎮 Play Game',
            web_app: { url: process.env.NEXTAUTH_URL || 'https://magnum-clicker.vercel.app' }
          }
        ]]
      }
    }
  )
})

// Help command
bot.help((ctx) => {
  ctx.reply(
    '🎮 Magnum Clicker - Помощь\n\n' +
    '• Кликайте по кнопке для заработка монет\n' +
    '• Открывайте кейсы за награды\n' +
    '• Повышайте уровень и зарабатывайте больше\n\n' +
    'Используйте /start для начала игры!'
  )
})

// Handle all other messages
bot.on('text', (ctx) => {
  ctx.reply(
    'Используйте /start для начала игры или /help для помощи!',
    {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🎮 Play Game',
            web_app: { url: process.env.NEXTAUTH_URL || 'https://magnum-clicker.vercel.app' }
          }
        ]]
      }
    }
  )
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Process the update
    await bot.handleUpdate(body)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing Telegram update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Telegram bot is running' })
}
