import React from 'react';
import ProfileCard from '../components/ProfileCard';

const Profile = () => {
  // Mock user data - replace with real data
  const userData = {
    userId: 12345,
    totalStars: 5000,
    totalCoins: 10000
  };

  return (
    <div className="p-4">
      <ProfileCard {...userData} />
    </div>
  );
};

export default Profile;
