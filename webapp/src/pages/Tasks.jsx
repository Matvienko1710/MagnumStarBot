import React from 'react';
import TaskCard from '../components/TaskCard';

const Tasks = () => {
  // Mock tasks data - replace with real data
  const tasks = [
    {
      id: 1,
      title: 'Daily Check-in',
      description: 'Get your daily reward by checking in',
      reward: 10,
      type: 'stars'
    },
    {
      id: 2,
      title: 'Complete Survey',
      description: 'Share your feedback and earn coins',
      reward: 100,
      type: 'coins'
    },
    // Add more tasks as needed
  ];

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold text-white mb-6">Available Tasks</h1>
      {tasks.map(task => (
        <TaskCard key={task.id} {...task} />
      ))}
    </div>
  );
};

export default Tasks;
