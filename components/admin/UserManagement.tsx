'use client';

import { useState, useEffect } from 'react';
import { ManagedUser, Subject } from '@/lib/types';
import EditUserModal from './EditUserModal';

export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, subjectsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/subjects'),
      ]);

      if (!usersRes.ok) throw new Error('Failed to fetch users');
      if (!subjectsRes.ok) throw new Error('Failed to fetch subjects');

      const usersData = await usersRes.json();
      const subjectsData = await subjectsRes.json();
      
      setUsers(usersData);
      setSubjects(subjectsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update user.');
      }
      await fetchData(); // Refetch all users to get the latest state
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user ${userEmail}?`)) return;
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
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveProfile} />
      )}
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg mt-6">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="py-3 px-6">Name</th>
              <th scope="col" className="py-3 px-6">Email</th>
              <th scope="col" className="py-3 px-6">Role</th>
              <th scope="col" className="py-3 px-6">Assigned Subject</th>
              <th scope="col" className="py-3 px-6">Status</th>
              <th scope="col" className="py-3 px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
              return (
                <tr key={user.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="py-4 px-6 font-medium text-gray-900 dark:text-white whitespace-nowrap">{user.first_name} {user.last_name}</td>
                  <td className="py-4 px-6">{user.email}</td>
                  <td className="py-4 px-6">
                    <select value={user.role} onChange={(e) => handleUpdateUser(user.id, { role: e.target.value })} disabled={updating === user.id} className="select-field">
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                   <td className="py-4 px-6">
                    {user.role === 'teacher' ? (
                      <select value={user.subject_id || ''} onChange={(e) => handleUpdateUser(user.id, { subject_id: e.target.value })} disabled={updating === user.id} className="select-field">
                        <option value="">-- Unassigned --</option>
                        {subjects.map(subject => (
                          <option key={subject.id} value={subject.id}>{subject.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    {isBanned ? <span className="status-banned">Banned</span> : <span className="status-active">Active</span>}
                  </td>
                  <td className="py-4 px-6 space-x-2 whitespace-nowrap">
                    <button onClick={() => setEditingUser(user)} className={`${baseButtonStyles} bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`}>Edit</button>
                    {isBanned ? <button onClick={() => handleUpdateUser(user.id, { ban_duration: 'none' })} className={`${baseButtonStyles} bg-green-600 hover:bg-green-700 focus:ring-green-500`}>Unban</button> : <button onClick={() => handleUpdateUser(user.id, { ban_duration: '24h' })} className={`${baseButtonStyles} bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400`}>Ban</button>}
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
