import crypto from "crypto"

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

export interface TelegramWebAppInitData {
  user?: TelegramUser
  chat_instance?: string
  chat_type?: string
  auth_date: number
  hash: string
}

export function validateTelegramWebAppData(initData: string, botToken: string): TelegramWebAppInitData | null {
  try {
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get("hash")
    urlParams.delete("hash")

    // Сортируем параметры
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n")

    // Создаем секретный ключ
    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest()

    // Вычисляем хеш
    const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex")

    if (calculatedHash !== hash) {
      return null
    }

    // Проверяем время (данные должны быть не старше 24 часов)
    const authDate = Number.parseInt(urlParams.get("auth_date") || "0")
    const now = Math.floor(Date.now() / 1000)
    if (now - authDate > 86400) {
      // 24 часа
      return null
    }

    // Парсим данные пользователя
    const userData = urlParams.get("user")
    const user = userData ? JSON.parse(userData) : undefined

    return {
      user,
      chat_instance: urlParams.get("chat_instance") || undefined,
      chat_type: urlParams.get("chat_type") || undefined,
      auth_date: authDate,
      hash: hash!,
    }
  } catch (error) {
    console.error("Telegram auth validation error:", error)
    return null
  }
}

export function getTelegramWebApp() {
  if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
    return (window as any).Telegram.WebApp
  }
  return null
}

export function isTelegramWebApp(): boolean {
  return getTelegramWebApp() !== null
}
