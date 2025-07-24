'use client';

import { useState, useEffect } from 'react';
import { Issue, IssueCategory } from '@/lib/types';
import { AlertCircle, CheckCircle, FileText, Tag, Type, Send } from 'lucide-react';

const StatusBadge = ({ status }: { status: string }) => {
    const colorClasses = {
        'ใหม่': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        'กำลังดำเนินการ': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        'แก้ไขแล้ว': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
}

export default function ReportIssue() {
    const [myIssues, setMyIssues] = useState<Issue[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<IssueCategory>('อื่นๆ');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchMyIssues = async () => {
        const res = await fetch('/api/issues');
        if (res.ok) {
            const data = await res.json();
            setMyIssues(data);
        }
    };

    useEffect(() => {
        fetchMyIssues();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const res = await fetch('/api/issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, category }),
        });

        if (res.ok) {
            setSuccess('แจ้งปัญหาสำเร็จแล้ว');
            setTitle('');
            setDescription('');
            setCategory('อื่นๆ');
            await fetchMyIssues();
        } else {
            const data = await res.json();
            setError(data.error || 'เกิดข้อผิดพลาดในการแจ้งปัญหา');
        }
        setLoading(false);
    };
    
    const inputStyles = "block w-full rounded-md border-gray-300 bg-gray-50 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500";

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">แจ้งปัญหาในโรงเรียน</h1>
                <p className="mt-2 text-gray-500 dark:text-gray-400">พบเจอปัญหา? แจ้งให้เราทราบได้ที่นี่</p>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
                <h2 className="text-xl font-semibold border-b dark:border-gray-700 pb-3">กรอกรายละเอียด</h2>
                
                {error && <div className="flex items-center p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert"><AlertCircle className="w-5 h-5 mr-2" />{error}</div>}
                {success && <div className="flex items-center p-3 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800" role="alert"><CheckCircle className="w-5 h-5 mr-2" />{success}</div>}
                
                <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-1">หัวข้อปัญหา</label>
                    <div className="relative">
                        <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required className={`${inputStyles} pl-10`} placeholder="เช่น คอมพิวเตอร์เสีย" />
                    </div>
                </div>
                <div>
                    <label htmlFor="category" className="block text-sm font-medium mb-1">หมวดหมู่</label>
                    <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <select id="category" value={category} onChange={e => setCategory(e.target.value as IssueCategory)} className={`${inputStyles} pl-10`}>
                            <option>การเรียนการสอน</option>
                            <option>อาคารสถานที่</option>
                            <option>IT/อุปกรณ์</option>
                            <option>อื่นๆ</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-1">รายละเอียด (ถ้ามี)</label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} className={`${inputStyles} pl-10`} placeholder="อธิบายปัญหาเพิ่มเติม..."></textarea>
                    </div>
                </div>
                <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
                    <Send className="w-4 h-4" />
                    {loading ? 'กำลังส่ง...' : 'ส่งเรื่อง'}
                </button>
            </form>

            <div>
                <h2 className="text-xl font-semibold mb-4">ประวัติการแจ้งปัญหาของคุณ</h2>
                <div className="space-y-4">
                    {myIssues.length > 0 ? (
                        myIssues.map(issue => (
                            <div key={issue.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-blue-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{issue.category}</p>
                                        <h3 className="font-semibold text-lg">{issue.title}</h3>
                                    </div>
                                    <StatusBadge status={issue.status} />
                                </div>
                                <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">{issue.description}</p>
                                <p className="text-xs text-gray-400 mt-3 text-right">แจ้งเมื่อ: {new Date(issue.created_at).toLocaleString()}</p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <p className="text-gray-500">คุณยังไม่เคยแจ้งปัญหา</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
