import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const BottomNav = ({ currentPage, setCurrentPage }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    {
      id: 'home',
      label: 'Главная',
      icon: '🏠',
      path: '/'
    },
    {
      id: 'tasks',
      label: 'Задания',
      icon: '📋',
      path: '/tasks'
    },
    {
      id: 'earn',
      label: 'Заработать ⭐️',
      icon: '💰',
      path: '/earn'
    }
  ]

  const handleNavClick = (item) => {
    setCurrentPage(item.id)
    navigate(item.path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`
                flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-lg
                transition-all duration-200 ease-out
                ${isActive 
                  ? 'text-telegram-blue bg-blue-50' 
                  : 'text-gray-600 hover:text-telegram-blue hover:bg-gray-50'
                }
              `}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
              
              {/* Индикатор активной страницы */}
              {isActive && (
                <div className="w-1.5 h-1.5 bg-telegram-blue rounded-full"></div>
              )}
            </button>
          )
        })}
      </div>
      
      {/* Безопасная зона для устройств с "чёлкой" */}
      <div className="h-4 bg-white"></div>
    </nav>
  )
}

export default BottomNav
