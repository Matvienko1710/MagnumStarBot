"use client"

import { AuthProvider } from "@/components/auth-provider"
import { TelegramClickerApp } from "@/components/telegram-clicker-app"

export default function Page() {
  return (
    <AuthProvider>
      <TelegramClickerApp />
    </AuthProvider>
  )
}
