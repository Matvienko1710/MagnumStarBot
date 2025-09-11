"use client"

import { Progress } from "./progress"

interface LevelProgressProps {
  level: number
  experience: number
  experienceToNext: number
  className?: string
}

export function LevelProgress({
  level,
  experience,
  experienceToNext,
  className = ""
}: LevelProgressProps) {
  const progressPercentage = experienceToNext > 0 ? (experience / experienceToNext) * 100 : 0

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Уровень {level}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {experience}/{experienceToNext} XP
        </span>
      </div>
      <Progress 
        value={progressPercentage} 
        className="h-3"
      />
      <div className="text-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          До следующего уровня: {experienceToNext - experience} XP
        </span>
      </div>
    </div>
  )
}
