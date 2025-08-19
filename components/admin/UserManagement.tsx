'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ManagedUser, Subject, Class } from '@/lib/types';
import EditUserModal from './EditUserModal';
import { useModal } from '@/contexts/ModalContext';

/** ----- Strict Types ----- **/
type RoleUnion = 'admin' | 'teacher' | 'student';
type BanDuration = '24h' | 'none';

type UpdateUserPayload = Partial<{
  // profiles
  first_name: string;
  last_name: string;
  role: RoleUnion;
  // assignments (mapping tables)
  subject_id: string | null;
  class_id: string | null;
  // auth (admin API)
  ban_duration: BanDuration;
}>;

/** props type for handleUpdateUser */
type UpdateUserFn = (userId: string, updates: UpdateUserPayload) => void | Promise<void>;
type BanUserFn = (userId: string, userEmail?: string) => void | Promise<void>;
type UnbanUserFn = (userId: string, userEmail?: string) => void | Promise<void>;

/** ----- User Table (reusable) ----- **/
const UserTable = ({
  users,
  subjects,
  classes,
  handleUpdateUser,
  handleDeleteUser,
  handleBanUser,
  handleUnbanUser,
  setEditingUser,
  updating,
  role,
}: {
  users: ManagedUser[];
  subjects: Subject[];
  classes: Class[];
  handleUpdateUser: UpdateUserFn;
  handleDeleteUser: (userId: string, userEmail: string) => void | Promise<void>;
  handleBanUser: BanUserFn;
  handleUnbanUser: UnbanUserFn;
  setEditingUser: (user: ManagedUser) => void;
  updating: string | null;
  role: RoleUnion;
}) => {
  const baseButtonStyles =
    'px-3 py-1 text-xs font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200';

  if (users.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 px-6 py-4">
        No users in this category.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="py-3 px-6">Name</th>
            <th scope="col" className="py-3 px-6">Email</th>
            {role !== 'admin' && <th scope="col" className="py-3 px-6">Assignment</th>}
            <th scope="col" className="py-3 px-6">Role</th>
            <th scope="col" className="py-3 px-6">Status</th>
            <th scope="col" className="py-3 px-6">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isBanned =
              !!user.banned_until && new Date(user.banned_until) > new Date();

            // เปลี่ยน Role แล้วล้างฟิลด์ที่ไม่เกี่ยวข้อง
            const onChangeRole = (newRole: RoleUnion) => {
              const updates: UpdateUserPayload = { role: newRole };

              if (newRole === 'admin') {
                updates.subject_id = null;
                updates.class_id = null;
              } else if (newRole === 'teacher') {
                updates.class_id = null;
              } else if (newRole === 'student') {
                updates.subject_id = null;
              }

              handleUpdateUser(user.id, updates);
            };

            return (
              <tr
                key={user.id}
                className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <td className="py-4 px-6 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                  {user.first_name} {user.last_name}
                </td>
                <td className="py-4 px-6">{user.email}</td>

                {role === 'teacher' && (
                  <td className="py-4 px-6">
                    <select
                      value={user.subject_id ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        handleUpdateUser(user.id, {
                          subject_id: e.target.value ? e.target.value : null,
                        })
                      }
                      disabled={updating === user.id}
                      className="select-field"
                    >
                      <option value="">-- Unassigned --</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </td>
                )}

                {role === 'student' && (
                  <td className="py-4 px-6">
                    <select
                      value={user.class_id ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        handleUpdateUser(user.id, {
                          class_id: e.target.value ? e.target.value : null,
                        })
                      }
                      disabled={updating === user.id}
                      className="select-field"
                    >
                      <option value="">-- Unassigned --</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                )}

                <td className="py-4 px-6">
                  <select
                    value={user.role as RoleUnion}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      onChangeRole(e.target.value as RoleUnion)
                    }
                    disabled={updating === user.id}
                    className="select-field"
                  >
                    <option value="admin">admin</option>
                    <option value="teacher">teacher</option>
                    <option value="student">student</option>
                  </select>
                </td>

                <td className="py-4 px-6">
                  {isBanned ? (
                    <span className="status-banned">Banned</span>
                  ) : (
                    <span className="status-active">Active</span>
                  )}
                </td>

                <td className="py-4 px-6 space-x-2 whitespace-nowrap">
                  <button
                    onClick={() => setEditingUser(user)}
                    className={`${baseButtonStyles} bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`}
                  >
                    Edit
                  </button>

                  {isBanned ? (
                    <button
                      onClick={() => handleUnbanUser(user.id, user.email)}
                      className={`${baseButtonStyles} bg-green-600 hover:bg-green-700 focus:ring-green-500`}
                      disabled={updating === user.id}
                    >
                      Unban
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBanUser(user.id, user.email)}
                      className={`${baseButtonStyles} bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400`}
                      disabled={updating === user.id}
                    >
                      Ban
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteUser(user.id, user.email)}
                    className={`${baseButtonStyles} bg-red-600 hover:bg-red-700 focus:ring-red-500`}
                    disabled={updating === user.id}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/** ----- Page Component ----- **/
export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  const { showConfirm, showAlert } = useModal();

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

      const usersData: ManagedUser[] = await usersRes.json();
      const subjectsData: Subject[] = await subjectsRes.json();
      const classesData: Class[] = await classesRes.json();

      setUsers(usersData);
      setSubjects(subjectsData);
      setClasses(classesData);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const { admins, teachers, students } = useMemo(() => {
    return {
      admins: users.filter((u) => u.role === 'admin'),
      teachers: users.filter((u) => u.role === 'teacher'),
      students: users.filter((u) => u.role === 'student'),
    };
  }, [users]);

  /** ใช้กับการอัปเดตทั่วไป (role/assignment) */
  const handleUpdateUser: UpdateUserFn = async (userId, updates) => {
    setUpdating(userId);
    setError('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates }),
      });
      if (!response.ok) {
        const errorData: { error?: string } = await response.json();
        throw new Error(errorData.error || 'Failed to update user.');
      }
      await fetchData();

      // ✅ SUCCESS: อย่าส่ง type: 'success' เพราะ type รองรับแค่ 'alert' | 'confirm'
      await showAlert({
        title: 'อัปเดตสำเร็จ',
        message: 'บันทึกข้อมูลผู้ใช้เรียบร้อยแล้ว',
        // type: undefined  (ละไว้)
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unknown error occurred';
      await showAlert({
        title: 'เกิดข้อผิดพลาด',
        message: msg,
        type: 'alert',
      });
    } finally {
      setUpdating(null);
    }
  };

  /** ✅ Ban (มี confirm + alert) */
  const handleBanUser: BanUserFn = async (userId, userEmail) => {
    const confirmed = await showConfirm({
      title: 'ยืนยันการแบน',
      message: `คุณแน่ใจหรือไม่ว่าต้องการแบนผู้ใช้ ${userEmail ?? ''} เป็นเวลา 24 ชั่วโมง?`,
      confirmText: 'แบน',
    });
    if (!confirmed) return;

    setUpdating(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates: { ban_duration: '24h' as BanDuration } }),
      });
      if (!response.ok) throw new Error('Failed to ban user.');
      await fetchData();
      await showAlert({
        title: 'สำเร็จ',
        message: `${userEmail ?? 'ผู้ใช้'} ถูกแบนเรียบร้อยแล้ว (24 ชั่วโมง)`,
        // ไม่ส่ง type
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unknown error occurred';
      await showAlert({
        title: 'เกิดข้อผิดพลาด',
        message: msg,
        type: 'alert',
      });
    } finally {
      setUpdating(null);
    }
  };

  /** ✅ Unban (มี confirm + alert) */
  const handleUnbanUser: UnbanUserFn = async (userId, userEmail) => {
    const confirmed = await showConfirm({
      title: 'ยืนยันการยกเลิกแบน',
      message: `คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการแบนผู้ใช้ ${userEmail ?? ''}?`,
      confirmText: 'ยกเลิกแบน',
    });
    if (!confirmed) return;

    setUpdating(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates: { ban_duration: 'none' as BanDuration } }),
      });
      if (!response.ok) throw new Error('Failed to unban user.');
      await fetchData();
      await showAlert({
        title: 'สำเร็จ',
        message: `${userEmail ?? 'ผู้ใช้'} ถูกยกเลิกการแบนแล้ว`,
        // ไม่ส่ง type
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unknown error occurred';
      await showAlert({
        title: 'เกิดข้อผิดพลาด',
        message: msg,
        type: 'alert',
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    const confirmed = await showConfirm({
      title: 'ยืนยันการลบ',
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ ${userEmail} แบบถาวร?`,
      confirmText: 'ลบ',
    });

    if (!confirmed) return;

    setUpdating(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to delete user.');
      setUsers((prev) => prev.filter((u) => u.id !== userId));

      await showAlert({
        title: 'สำเร็จ',
        message: `ลบผู้ใช้ ${userEmail} เรียบร้อยแล้ว`,
        // ไม่ส่ง type
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      await showAlert({
        title: 'เกิดข้อผิดพลาด',
        message,
        type: 'alert',
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleSaveProfile = async (
    userId: string,
    updates: { first_name: string; last_name: string }
  ) => {
    await handleUpdateUser(userId, updates);
  };

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

      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold mb-2">Administrators</h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <UserTable
              users={admins}
              role="admin"
              {...{
                subjects,
                classes,
                handleUpdateUser,
                handleDeleteUser,
                handleBanUser,
                handleUnbanUser,
                setEditingUser,
                updating,
              }}
            />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Teachers</h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <UserTable
              users={teachers}
              role="teacher"
              {...{
                subjects,
                classes,
                handleUpdateUser,
                handleDeleteUser,
                handleBanUser,
                handleUnbanUser,
                setEditingUser,
                updating,
              }}
            />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Students</h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <UserTable
              users={students}
              role="student"
              {...{
                subjects,
                classes,
                handleUpdateUser,
                handleDeleteUser,
                handleBanUser,
                handleUnbanUser,
                setEditingUser,
                updating,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
