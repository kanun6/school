'use client';

import { useState, useEffect } from 'react';
import { ManagedUser, Role } from '@/lib/types';
import EditUserModal from './EditUserModal';

export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      const data: ManagedUser[] = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateUser = async (userId: string, updates: object) => {
    setUpdating(userId);
    setError('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates }),
      });
      if (!response.ok) throw new Error('Failed to update user.');
      // Refetch all users to get the latest state
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }
    setUpdating(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to delete user.');
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleSaveProfile = async (userId: string, updates: { first_name: string; last_name: string }) => {
    await handleUpdateUser(userId, updates);
  };

  const baseButtonStyles = "px-3 py-1 text-xs font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200";

  if (loading) return <p className="text-center mt-4">Loading user data...</p>;
  if (error) return <p className="text-center mt-4 text-red-500">Error: {error}</p>;

  return (
    <>
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveProfile}
        />
      )}
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg mt-6">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th scope="col" className="py-3 px-6">Name</th>
              <th scope="col" className="py-3 px-6">Email</th>
              <th scope="col" className="py-3 px-6">Role</th>
              <th scope="col" className="py-3 px-6">Status</th>
              <th scope="col" className="py-3 px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
              return (
                <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="py-4 px-6">{user.email}</td>
                  <td className="py-4 px-6">
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateUser(user.id, { role: e.target.value })}
                      disabled={updating === user.id}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-4 px-6">
                    {isBanned ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Banned</span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                    )}
                  </td>
                  <td className="py-4 px-6 space-x-2 whitespace-nowrap">
                    <button onClick={() => setEditingUser(user)} className={`${baseButtonStyles} bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`}>Edit</button>
                    {isBanned ? (
                       <button onClick={() => handleUpdateUser(user.id, { ban_duration: 'none' })} className={`${baseButtonStyles} bg-green-600 hover:bg-green-700 focus:ring-green-500`}>Unban</button>
                    ) : (
                       <button onClick={() => handleUpdateUser(user.id, { ban_duration: '24h' })} className={`${baseButtonStyles} bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400`}>Ban</button>
                    )}
                    <button onClick={() => handleDeleteUser(user.id, user.email)} className={`${baseButtonStyles} bg-red-600 hover:bg-red-700 focus:ring-red-500`}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}