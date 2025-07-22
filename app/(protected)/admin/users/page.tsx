import UserManagement from '@/components/admin/UserManagement';

export default function AdminUsersPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold text-white-800">User Management</h1>
            <p className="mt-2 text-white-600">Manage all users from here.</p>
            <UserManagement />
        </div>
    );
}