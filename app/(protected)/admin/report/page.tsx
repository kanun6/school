'use client';

import { useState, useEffect } from "react";
import { Issue, IssueStatus } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModal } from "@/contexts/ModalContext"; // Import useModal

const StatusBadge = ({ status }: { status: string }) => {
    const colorClasses = {
        'ใหม่': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        'กำลังดำเนินการ': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        'แก้ไขแล้ว': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
}


export default function ReportPage() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { showConfirm, showAlert } = useModal(); // Use the modal

    const fetchIssues = async () => {
        try {
            const res = await fetch('/api/issues');
            if (!res.ok) throw new Error("Failed to fetch issues");
            const data = await res.json();
            setIssues(data);
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError("An unknown error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchIssues();

        const supabase = createClient();
        const channel = supabase
            .channel('public:issues:admin')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' },
                () => { fetchIssues(); }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);
    
    const handleStatusChange = async (issueId: string, status: IssueStatus) => {
        try {
            const res = await fetch('/api/issues', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ issueId, status }) });
            if (!res.ok) throw new Error("Failed to update status");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "An unknown error occurred";
            await showAlert({ title: 'เกิดข้อผิดพลาด', message, type: 'alert' });
        }
    };

    const handleDeleteIssue = async (issueId: string) => {
        const confirmed = await showConfirm({
            title: 'ยืนยันการลบ',
            message: 'คุณแน่ใจหรือไม่ว่าต้องการลบรายงานปัญหานี้อย่างถาวร?',
            confirmText: 'ลบ',
        });

        if (confirmed) {
            try {
                const res = await fetch('/api/issues', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ issueId })
                });
                if (!res.ok) throw new Error("Failed to delete issue");
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "An unknown error occurred";
                await showAlert({ title: 'เกิดข้อผิดพลาด', message, type: 'alert' });
            }
        }
    };

    if (loading) return <p>Loading reports...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    
    return (
        <div>
            <h1 className="text-3xl font-bold">ปัญหาที่ได้รับแจ้งทั้งหมด</h1>
            <div className="mt-6 bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reported By</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {issues.map(issue => (
                            <tr key={issue.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-900 dark:text-white">{issue.title}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{issue.description}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{issue.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{issue.reported_by?.first_name || 'N/A'} ({issue.reported_by?.role})</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(issue.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select 
                                        value={issue.status} 
                                        onChange={e => handleStatusChange(issue.id, e.target.value as IssueStatus)} 
                                        className={cn(
                                            'select-field font-semibold',
                                            issue.status === 'ใหม่' && 'text-blue-600',
                                            issue.status === 'กำลังดำเนินการ' && 'text-yellow-600',
                                            issue.status === 'แก้ไขแล้ว' && 'text-green-600'
                                        )}
                                    >
                                        <option>ใหม่</option>
                                        <option>กำลังดำเนินการ</option>
                                        <option>แก้ไขแล้ว</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button onClick={() => handleDeleteIssue(issue.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
