import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import { useUser } from '../../contexts/UserContext';

const UserProfile = () => {
  const { user, userProfile } = useUser();
  const [displayName, setDisplayName] = useState(userProfile.displayName || '');
  const [message, setMessage] = useState('');

  const handleUpdateProfile = async () => {
    if (!user) return;

    const userRef = doc(db, `artifacts/${appId}/users`, user.uid);
    try {
      await updateDoc(userRef, { displayName });
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Error updating profile.');
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">User Profile</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <p className="mt-1 text-gray-600">{user.email}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <p className="mt-1 text-gray-600">{userProfile.role}</p>
        </div>
      </div>
      <button
        onClick={handleUpdateProfile}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
      >
        Update Profile
      </button>
      {message && <p className="text-sm mt-2 text-gray-600">{message}</p>}
    </div>
  );
};

export default UserProfile;
