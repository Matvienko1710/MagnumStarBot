"use client"

import { Card } from "./card"
import { Button } from "./button"

interface CaseCardProps {
  name: string
  price: number
  description: string
  image?: string
  isAvailable: boolean
  onOpen: () => void
  className?: string
}

export function CaseCard({
  name,
  price,
  description,
  image,
  isAvailable,
  onOpen,
  className = ""
}: CaseCardProps) {
  return (
    <Card className={`p-4 transition-all duration-200 hover:shadow-lg ${
      isAvailable 
        ? "hover:scale-105 cursor-pointer" 
        "opacity-50 cursor-not-allowed"
    } ${className}`}>
      <div className="text-center">
        {image && (
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
            {image}
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {description}
        </p>
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {price} 🪙
          </span>
          <Button 
            onClick={onOpen}
            disabled={!isAvailable}
            className="px-4 py-2"
          >
            {isAvailable ? "Открыть" : "Недоступно"}
          </Button>
        </div>
      </div>
    </Card>
  )
}
