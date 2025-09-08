import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useUser } from '../contexts/UserContext';
import useData from '../hooks/useData';

const Header = () => {
  const { user, userProfile } = useUser();
  const { appSettings } = useData();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-indigo-600 cursor-pointer" onClick={() => navigate('/')}>
          GMAT Focus Prep
        </div>
        <div>
          {userProfile && (
            <span className="text-sm text-gray-600 mr-4">
              {userProfile.displayName || user.email} ({userProfile.role})
            </span>
          )}
          <Link to="/" className="text-indigo-600 hover:text-indigo-800 mr-4">Home</Link>
          <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-800 mr-4">Dashboard</Link>
          {appSettings.isPracticeHubActive && (
            <Link to="/practice" className="text-indigo-600 hover:text-indigo-800 mr-4">Practice Hub</Link>
          )}
          <Link to="/past-results" className="text-indigo-600 hover:text-indigo-800 mr-4">Past Results</Link>
          {(userProfile?.role === 'Admin' || userProfile?.role === 'Educator') && (
            <Link to="/create" className="text-indigo-600 hover:text-indigo-800 mr-4">Create Content</Link>
          )}
          {userProfile?.role === 'Admin' && (
            <Link to="/admin" className="text-indigo-600 hover:text-indigo-800 mr-4">Admin Panel</Link>
          )}
          <button onClick={handleLogout} className="text-red-600 hover:text-red-800">Logout</button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
