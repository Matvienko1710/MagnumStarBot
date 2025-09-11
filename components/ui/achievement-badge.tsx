"use client"

import { Card } from "./card"

interface AchievementBadgeProps {
  title: string
  description: string
  icon: React.ReactNode
  isUnlocked: boolean
  progress?: number
  maxProgress?: number
  className?: string
}

export function AchievementBadge({
  title,
  description,
  icon,
  isUnlocked,
  progress = 0,
  maxProgress = 100,
  className = ""
}: AchievementBadgeProps) {
  const progressPercentage = maxProgress > 0 ? (progress / maxProgress) * 100 : 0

  return (
    <Card className={`p-4 transition-all duration-200 ${
      isUnlocked 
        ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-700" 
        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    } ${className}`}>
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-full ${
          isUnlocked 
            ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-800 dark:text-yellow-300" 
            : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
        }`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium ${
            isUnlocked 
              ? "text-yellow-800 dark:text-yellow-200" 
              : "text-gray-600 dark:text-gray-400"
          }`}>
            {title}
          </h3>
          <p className={`text-xs mt-1 ${
            isUnlocked 
              ? "text-yellow-600 dark:text-yellow-300" 
              : "text-gray-500 dark:text-gray-500"
          }`}>
            {description}
          </p>
          {!isUnlocked && maxProgress > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Прогресс</span>
                <span>{progress}/{maxProgress}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-yellow-400 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
