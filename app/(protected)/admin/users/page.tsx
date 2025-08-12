import UserManagement from '@/components/admin/UserManagement';

export default function AdminUsersPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold text-white-800">จัดการผู้ใช้</h1>
            <UserManagement />
        </div>
    );
}