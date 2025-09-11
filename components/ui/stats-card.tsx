"use client"

import { Card } from "./card"
import { Progress } from "./progress"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  progress?: number
  icon?: React.ReactNode
  className?: string
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  progress, 
  icon,
  className = ""
}: StatsCardProps) {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {description}
            </p>
          )}
        </div>
        {icon && (
          <div className="ml-4 text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
      </div>
      {progress !== undefined && (
        <div className="mt-3">
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </Card>
  )
}
