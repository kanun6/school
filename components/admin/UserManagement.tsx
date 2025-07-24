'use client';

import { useState, useEffect, useMemo } from 'react';
import { ManagedUser, Subject, Class } from '@/lib/types';
import EditUserModal from './EditUserModal';

// Reusable table component for displaying users
const UserTable = ({
  users,
  subjects,
  classes,
  handleUpdateUser,
  handleDeleteUser,
  setEditingUser,
  updating,
  role
}: {
  users: ManagedUser[];
  subjects: Subject[];
  classes: Class[];
  handleUpdateUser: (userId: string, updates: object) => void;
  handleDeleteUser: (userId: string, userEmail: string) => void;
  setEditingUser: (user: ManagedUser) => void;
  updating: string | null;
  role: 'admin' | 'teacher' | 'student';
}) => {
  const baseButtonStyles = "px-3 py-1 text-xs font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200";

  if (users.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400 px-6 py-4">No users in this category.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="py-3 px-6">Name</th>
            <th scope="col" className="py-3 px-6">Email</th>
            {role !== 'admin' && <th scope="col" className="py-3 px-6">Assignment</th>}
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
                {role === 'teacher' && (
                  <td className="py-4 px-6">
                    <select value={user.subject_id || ''} onChange={(e) => handleUpdateUser(user.id, { subject_id: e.target.value })} disabled={updating === user.id} className="select-field">
                      <option value="">-- Unassigned --</option>
                      {subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                    </select>
                  </td>
                )}
                {role === 'student' && (
                  <td className="py-4 px-6">
                    <select value={user.class_id || ''} onChange={(e) => handleUpdateUser(user.id, { class_id: e.target.value })} disabled={updating === user.id} className="select-field">
                      <option value="">-- Unassigned --</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                )}
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
  );
};


export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, subjectsRes, classesRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/subjects'),
        fetch('/api/classes'),
      ]);

      if (!usersRes.ok) throw new Error('Failed to fetch users');
      if (!subjectsRes.ok) throw new Error('Failed to fetch subjects');
      if (!classesRes.ok) throw new Error('Failed to fetch classes');

      const usersData = await usersRes.json();
      const subjectsData = await subjectsRes.json();
      const classesData = await classesRes.json();
      
      setUsers(usersData);
      setSubjects(subjectsData);
      setClasses(classesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const { admins, teachers, students } = useMemo(() => {
    return {
      admins: users.filter(u => u.role === 'admin'),
      teachers: users.filter(u => u.role === 'teacher'),
      students: users.filter(u => u.role === 'student'),
    };
  }, [users]);

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
      await fetchData();
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

  if (loading) return <p className="text-center mt-4">Loading user data...</p>;
  if (error) return <p className="text-center mt-4 text-red-500">Error: {error}</p>;

  return (
    <>
      {editingUser && (
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveProfile} />
      )}
      <div className="space-y-8">
        {/* Admins Section */}
        <div>
          <h3 className="text-xl font-semibold mb-2">Administrators</h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <UserTable users={admins} role="admin" {...{ subjects, classes, handleUpdateUser, handleDeleteUser, setEditingUser, updating }} />
          </div>
        </div>
        
        {/* Teachers Section */}
        <div>
          <h3 className="text-xl font-semibold mb-2">Teachers</h3>
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <UserTable users={teachers} role="teacher" {...{ subjects, classes, handleUpdateUser, handleDeleteUser, setEditingUser, updating }} />
          </div>
        </div>

        {/* Students Section */}
        <div>
          <h3 className="text-xl font-semibold mb-2">Students</h3>
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <UserTable users={students} role="student" {...{ subjects, classes, handleUpdateUser, handleDeleteUser, setEditingUser, updating }} />
          </div>
        </div>
      </div>
    </>
  );
}
