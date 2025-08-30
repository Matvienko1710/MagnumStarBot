import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import TasksPage from './pages/TasksPage'
import EarnPage from './pages/EarnPage'
import { TelegramProvider } from './context/TelegramContext'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  return (
    <Router>
      <TelegramProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
          <Header />
          
          <main className="pb-20 pt-4 px-4">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/earn" element={<EarnPage />} />
            </Routes>
          </main>
          
          <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
        </div>
      </TelegramProvider>
    </Router>
  )
}

export default App
