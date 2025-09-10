import { NextRequest, NextResponse } from 'next/server'
import { Telegraf } from 'telegraf'

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

// Start command
bot.start((ctx) => {
  const webAppUrl = process.env.NEXTAUTH_URL || 'https://magnmstartbot1.vercel.app'
  console.log('Start command received, webAppUrl:', webAppUrl)
  
  ctx.reply(
    '🎮 Добро пожаловать в Magnum Clicker!\n\n' +
    'Зарабатывайте криптовалюту кликами в стиле Binance и Revolut! Кликайте, открывайте кейсы и получайте награды. Начните зарабатывать прямо сейчас!',
    {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🎮 Play Game',
            web_app: { url: webAppUrl }
          }
        ]]
      }
    }
  )
})

// Help command
bot.help((ctx) => {
  const webAppUrl = process.env.NEXTAUTH_URL || 'https://magnmstartbot1.vercel.app'
  
  ctx.reply(
    '🎮 Magnum Clicker - Помощь\n\n' +
    'Кликайте для заработка монет, открывайте кейсы за награды, повышайте уровень! Используйте кнопку ниже для начала игры.',
    {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🎮 Play Game',
            web_app: { url: webAppUrl }
          }
        ]]
      }
    }
  )
})

// Handle all other messages
bot.on('text', (ctx) => {
  const webAppUrl = process.env.NEXTAUTH_URL || 'https://magnmstartbot1.vercel.app'
  
  ctx.reply(
    'Используйте /start для начала игры или /help для помощи!',
    {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🎮 Play Game',
            web_app: { url: webAppUrl }
          }
        ]]
      }
    }
  )
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Telegram webhook received:', JSON.stringify(body, null, 2))
    
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
