"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthContext } from "./auth-provider"
import { LoaderCircle } from "lucide-react"

export function LoginScreen() {
  const { login, loading, error } = useAuthContext()

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md card-gradient">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Magnum Clicker</CardTitle>
          <CardDescription>Добро пожаловать в игру! Войдите, чтобы начать зарабатывать монеты.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <Button onClick={login} disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                Вход...
              </>
            ) : (
              "Войти через Telegram"
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>Нажимая "Войти", вы соглашаетесь с условиями использования</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
