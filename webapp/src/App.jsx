import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BottomNavBar from './components/BottomNavBar';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Exchange from './pages/Exchange';
import Cases from './pages/Cases';
import Loader from './components/Loader';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize Telegram WebApp
    const webApp = window.Telegram.WebApp;
    webApp.ready();
    webApp.expand();

    // Show loading screen for 5 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <Router>
          <div className="min-h-screen bg-gradient-to-b from-[#22223B] to-[#4A4E69]">
            <div className="max-w-md mx-auto pb-20">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/exchange" element={<Exchange />} />
                <Route path="/cases" element={<Cases />} />
              </Routes>
            </div>
            <BottomNavBar />
          </div>
        </Router>
      )}
    </>
  );
}

export default App;
