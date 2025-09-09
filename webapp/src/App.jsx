import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BottomNavBar from './components/BottomNavBar';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Exchange from './pages/Exchange';
import Cases from './pages/Cases';
import ComingSoon from './pages/ComingSoon';
import Loader from './components/Loader';
import { isAdmin } from './utils/admin';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  useEffect(() => {
    // Initialize Telegram WebApp
    const webApp = window.Telegram.WebApp;
    webApp.ready();
    webApp.expand();

    // Check admin status
    const checkAdminStatus = () => {
      console.log('🔧 Checking admin status...');
      const adminStatus = isAdmin();
      console.log('✅ Admin status result:', adminStatus);
      setUserIsAdmin(adminStatus);
      
      // Дополнительная отладочная информация
      console.log('📊 Admin Debug Summary:');
      console.log('- REACT_APP_ADMIN_IDS:', process.env.REACT_APP_ADMIN_IDS);
      console.log('- Telegram WebApp available:', !!window.Telegram?.WebApp);
      console.log('- User data:', window.Telegram?.WebApp?.initDataUnsafe?.user);
      console.log('- Final userIsAdmin will be:', adminStatus);
    };

    checkAdminStatus();

    // Show loading screen for 5 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Компонент для условного рендеринга страниц
  const ConditionalRoute = ({ adminComponent, userComponent, ...props }) => {
    // Отладочная информация для проверки админского статуса
    console.log('🔍 ConditionalRoute Debug:');
    console.log('👤 userIsAdmin:', userIsAdmin);
    console.log('🎯 adminComponent exists:', !!adminComponent);
    console.log('📱 WebApp user:', window.Telegram?.WebApp?.initDataUnsafe?.user);
    
    return userIsAdmin ? adminComponent : (userComponent || <ComingSoon />);
  };
  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <Router>
          <div className="min-h-dvh bg-gradient-to-b from-[#22223B] to-[#4A4E69] safe-all">
            <div className="max-w-md mx-auto pb-20 xs:pb-24 sm:pb-20 min-h-screen-safe">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/tasks" element={
                  <ConditionalRoute adminComponent={<Tasks />} />
                } />
                <Route path="/exchange" element={
                  <ConditionalRoute adminComponent={<Exchange />} />
                } />
                <Route path="/cases" element={
                  <ConditionalRoute adminComponent={<Cases />} />
                } />
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
