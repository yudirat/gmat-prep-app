import React, { useState, useMemo, useEffect } from 'react';
import { onSnapshot, collection, doc, updateDoc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, appId, firebaseConfig } from '../../firebase';
import RolesManager from './RolesManager';
import { useDataFromContext as useData } from '../../contexts/DataContext';

export default function AdminDashboard() {
    const { roles, appSettings, isLoading } = useData();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newUserUid, setNewUserUid] = useState('');
    const [newUserRole, setNewUserRole] = useState('');
    const [message, setMessage] = useState('');
    const [testLimits, setTestLimits] = useState({
        quantLimit: 5,
        verbalLimit: 5,
        diLimit: 5,
        mockLimit: 3
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'displayName', direction: 'ascending' });

    useEffect(() => {
        const usersRef = collection(db, `artifacts/${appId}/users`);
        const unsubscribe = onSnapshot(usersRef, (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleRoleChange = async (uid, newRole) => {
        const userRef = doc(db, `artifacts/${appId}/users`, uid);
        try { await updateDoc(userRef, { role: newRole }); } catch (error) { console.error("Error updating role: ", error); }
    };

    const handleDeleteUser = async (uid) => {
        const userRef = doc(db, `artifacts/${appId}/users`, uid);
        try {
            await deleteDoc(userRef);
        } catch (error) {
            console.error("Error deleting user: ", error);
        }
    };
    
    const handleAssignRole = async (e) => {
        e.preventDefault();
        if (!newUserUid) {
            setMessage('Please provide a User ID (UID).');
            return;
        }
        setMessage('Assigning role...');
        const userRef = doc(db, `artifacts/${appId}/users`, newUserUid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            setMessage('This user already has a profile. You can modify their role in the table below.');
            return;
        }

        try {
            await setDoc(userRef, {
                uid: newUserUid,
                role: newUserRole,
                createdAt: new Date(),
                email: 'Manually Added',
                displayName: 'New User'
            });
            setMessage('User profile created successfully!');
            setNewUserUid('');
        } catch (error) {
            setMessage('Error creating profile. Please check the UID and try again.');
            console.error("Error creating profile:", error);
        }
    };

    const handleSettingChange = async (settingName, value) => {
        const newSettings = { ...appSettings, [settingName]: value };
        const settingsRef = doc(db, `artifacts/${appId}/public/data/appSettings`, 'config');
        try {
            await setDoc(settingsRef, newSettings, { merge: true });
        } catch (error) {
            console.error("Error updating settings:", error);
        }
    };

    const handleSaveLimits = async () => {
        const limitsRef = doc(db, `artifacts/${appId}/public/data/appSettings`, 'testLimits');
        try {
            await setDoc(limitsRef, testLimits, { merge: true });
            alert("Test limits saved successfully!");
        } catch (error) {
            console.error("Error saving test limits: ", error);
            alert("Failed to save test limits.");
        }
    };
    
    const handleLimitChange = (field, value) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 0) {
            setTestLimits(prev => ({...prev, [field]: numValue}));
        }
    };

    const sortedUsers = useMemo(() => {
        let sortableUsers = [...users];
        if (sortConfig !== null) {
            sortableUsers.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableUsers;
    }, [users, sortConfig]);

    const filteredUsers = useMemo(() => {
        return sortedUsers.filter(user =>
            (user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [sortedUsers, searchTerm]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    if (isLoading) return <div>Loading users...</div>;

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg space-y-12">
            <RolesManager />
             <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Feature Management</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <label htmlFor="mock-toggle" className="font-medium text-gray-700">Enable Full Length Mock Test</label>
                        <button onClick={() => handleSettingChange('isMockTestActive', !appSettings.isMockTestActive)} className={`${appSettings.isMockTestActive ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full`}>
                            <span className={`${appSettings.isMockTestActive ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}/>
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <label htmlFor="sectional-toggle" className="font-medium text-gray-700">Enable Sectional Tests</label>
                        <button onClick={() => handleSettingChange('isSectionalTestActive', !appSettings.isSectionalTestActive)} className={`${appSettings.isSectionalTestActive ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full`}>
                            <span className={`${appSettings.isSectionalTestActive ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}/>
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <label htmlFor="practice-toggle" className="font-medium text-gray-700">Enable Practice Hub</label>
                        <button onClick={() => handleSettingChange('isPracticeHubActive', !appSettings.isPracticeHubActive)} className={`${appSettings.isPracticeHubActive ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full`}>
                            <span className={`${appSettings.isPracticeHubActive ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}/>
                        </button>
                    </div>
                </div>
            </div>
             <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Test Attempt Limits</h2>
                <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Quantitative Limit</label>
                        <input type="number" value={testLimits.quantLimit} onChange={e => handleLimitChange('quantLimit', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Verbal Limit</label>
                        <input type="number" value={testLimits.verbalLimit} onChange={e => handleLimitChange('verbalLimit', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Data Insights Limit</label>
                        <input type="number" value={testLimits.diLimit} onChange={e => handleLimitChange('diLimit', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Mock Exam Limit</label>
                        <input type="number" value={testLimits.mockLimit} onChange={e => handleLimitChange('mockLimit', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div className="md:col-span-2">
                        <button onClick={handleSaveLimits} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">Save Limits</button>
                    </div>
                </div>
             </div>
            <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Create User Profile</h2>
                 <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div>
                        <h3 className="font-semibold text-lg">Step 1: Create User in Firebase Console</h3>
                        <p className="text-sm text-gray-600">Go to the Firebase Console, create a new user in the Authentication section, and copy their UID.</p>
                        <a href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/users`} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 bg-blue-500 text-white px-4 py-2 rounded-md text-sm">Go to Firebase Auth</a>
                    </div>
                    <hr/>
                    <div>
                         <h3 className="font-semibold text-lg">Step 2: Assign Role in This App</h3>
                         <form onSubmit={handleAssignRole} className="flex items-end gap-4 mt-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">New User's UID</label>
                                <input type="text" value={newUserUid} onChange={e => setNewUserUid(e.target.value)} placeholder="Paste UID from Firebase" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Role</label>
                                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md">Create Profile</button>
                         </form>
                         {message && <p className="text-sm mt-2 text-gray-600">{message}</p>}
                    </div>
                </div>
            </div>
            <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Manage Existing Users</h2>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search by name or email"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border rounded-md p-2 w-full"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm cursor-pointer" onClick={() => requestSort('displayName')}>Display Name</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm cursor-pointer" onClick={() => requestSort('email')}>Email</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm cursor-pointer" onClick={() => requestSort('role')}>Role</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="border-b">
                                    <td className="py-3 px-4">{user.displayName || '(Not set)'}</td>
                                    <td className="py-3 px-4">{user.email}</td>
                                    <td className="py-3 px-4">{user.role}</td>
                                    <td className="py-3 px-4">
                                        <select value={user.role} onChange={(e) => handleRoleChange(user.uid, e.target.value)} className="p-2 border rounded-md">
                                            {roles.map(role => (
                                                <option key={role.id} value={role.id}>{role.name}</option>
                                            ))}
                                        </select>
                                        <button onClick={() => handleDeleteUser(user.uid)} className="text-red-600 hover:text-red-800 ml-2">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
