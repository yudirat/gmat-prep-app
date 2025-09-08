import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase';

const RolesManager = () => {
    const [roles, setRoles] = useState([]);
    const [newRole, setNewRole] = useState('');

    useEffect(() => {
        const rolesRef = collection(db, `artifacts/${appId}/public/data/roles`);
        const unsubscribe = onSnapshot(rolesRef, (snapshot) => {
            const rolesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRoles(rolesData);
        });
        return () => unsubscribe();
    }, []);

    const handleAddRole = async () => {
        if (newRole.trim() === '') return;
        const roleRef = doc(db, `artifacts/${appId}/public/data/roles`, newRole);
        await setDoc(roleRef, { name: newRole });
        setNewRole('');
    };

    const handleDeleteRole = async (roleId) => {
        const roleRef = doc(db, `artifacts/${appId}/public/data/roles`, roleId);
        await deleteDoc(roleRef);
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-6 mt-8">
            <h2 className="text-2xl font-bold mb-4">Roles Management</h2>
            <div className="flex mb-4">
                <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="border rounded-l-md p-2 flex-grow"
                    placeholder="New role name"
                />
                <button onClick={handleAddRole} className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700">
                    Add Role
                </button>
            </div>
            <ul>
                {roles.map(role => (
                    <li key={role.id} className="flex justify-between items-center p-2 border-b">
                        <span>{role.name}</span>
                        <button onClick={() => handleDeleteRole(role.id)} className="text-red-600 hover:text-red-800">
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RolesManager;
