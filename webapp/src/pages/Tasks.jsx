import React, { useState } from 'react';
import TaskCard from '../components/TaskCard';

const Tasks = () => {
  const [balance, setBalance] = useState(null);

  const tasks = [
    {
      id: 'task1',
      title: 'Subscribe to Channel',
      description: 'Subscribe to our channel and earn stars',
      reward: 1,
      type: 'stars',
      status: 'available'
    },
    {
      id: 'task2',
      title: 'Join Group',
      description: 'Join our Telegram group to earn stars',
      reward: 0.5,
      type: 'stars',
      status: 'available'
    }
    // More tasks can be added here
  ];

  const handleTaskComplete = (newBalance) => {
    setBalance(newBalance);
    const webApp = window.Telegram.WebApp;
    if (webApp.MainButton) {
      webApp.MainButton.show();
      webApp.MainButton.setParams({
        text: `Balance: ${newBalance.stars.toFixed(2)} ⭐ | ${newBalance.coins} 🪙`
      });
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-center text-white mb-2">Tasks</h1>
      <p className="text-center text-blue-300 mb-6">Complete tasks to earn rewards!</p>
      
      <div className="grid gap-4">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            title={task.title}
            description={task.description}
            reward={task.reward}
            type={task.type}
            status={task.status}
            onComplete={handleTaskComplete}
          />
        ))}
      </div>
    </div>
  );
};

export default Tasks;
