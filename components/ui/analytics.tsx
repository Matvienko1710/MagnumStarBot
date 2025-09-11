"use client"

import { useEffect } from "react"

export function Analytics() {
  useEffect(() => {
    // Простая аналитика для WebApp
    if (typeof window !== "undefined") {
      // Отправка события загрузки страницы
      console.log("WebApp loaded")
      
      // Можно добавить отправку в Vercel Analytics
      // if (window.gtag) {
      //   window.gtag('event', 'page_view', {
      //     page_title: 'Magnum Star WebApp',
      //     page_location: window.location.href
      //   })
      // }
    }
  }, [])

  return null
}
