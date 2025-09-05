import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BottomNavBar from './components/BottomNavBar';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Exchange from './pages/Exchange';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-bg-dark to-bg-dark2">
        <div className="max-w-md mx-auto pb-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/exchange" element={<Exchange />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
        <BottomNavBar />
      </div>
    </Router>
  );
}

export default App;
