'use client';

import { useState, useEffect } from 'react';
import { Issue, IssueCategory } from '@/lib/types';
import { FileText, Tag, Type, Send } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';

type IssueStatus = 'ใหม่' | 'กำลังดำเนินการ' | 'แก้ไขแล้ว';

const StatusBadge = ({ status }: { status: IssueStatus }) => {
  const colorClasses: Record<IssueStatus, string> = {
    ใหม่: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    กำลังดำเนินการ:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    แก้ไขแล้ว:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  };

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses[status]}`}
    >
      {status}
    </span>
  );
};

export default function ReportIssue() {
  const [activeTab, setActiveTab] = useState<'report' | 'history'>('report');

  // ✅ ข้อมูล + สถานะการโหลดหน้าและข้อผิดพลาด
  const [myIssues, setMyIssues] = useState<Issue[]>([]);
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ ฟอร์มแจ้งปัญหา + สถานะการส่ง
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('อื่นๆ');
  const [submitting, setSubmitting] = useState(false);

  const { showAlert } = useModal();

  // ✅ โหลดประวัติการแจ้งปัญหาก่อนแสดงผล
  const fetchMyIssues = async () => {
    setError(null);
    setPageLoading(true);
    try {
      const res = await fetch('/api/issues');
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || 'ไม่สามารถโหลดข้อมูลได้');
      }
      const data: Issue[] = await res.json();
      setMyIssues(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
      );
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchMyIssues();
  }, []);

  // ✅ ส่งเรื่องแจ้งปัญหา
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'ไม่สามารถส่งเรื่องได้');
      }

      await showAlert({
        title: 'สำเร็จ',
        message: 'แจ้งปัญหาของคุณเรียบร้อยแล้ว',
      });

      setTitle('');
      setDescription('');
      setCategory('อื่นๆ');

      await fetchMyIssues();
      setActiveTab('history'); // ✅ หลังส่งเสร็จ สลับไปดูประวัติอัตโนมัติ
    } catch (err: unknown) {
      await showAlert({
        title: 'เกิดข้อผิดพลาด',
        message:
          err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
        type: 'alert',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyles =
    'block w-full rounded-md border-gray-300 bg-gray-50 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500';

  // ✅ Loading State (ตามที่กำหนด)
  if (pageLoading)
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4 animate-fade-in">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-medium text-gray-600 dark:text-gray-300 animate-pulse">
          กำลังโหลดข้อมูล...
        </p>
      </div>
    );

  // ✅ Error State (ตามที่กำหนด)
  if (error) return <p className="text-red-500">เกิดข้อผิดพลาด: {error}</p>;

  return (
    <div className="space-y-8">
      {/* ส่วนหัว */}
      <div>
        <h1 className="text-3xl font-bold">ระบบแจ้งปัญหา</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          แจ้งปัญหาที่พบในโรงเรียนและติดตามประวัติการแจ้งปัญหาของคุณ
        </p>
      </div>

      {/* แท็บ */}
      <div className="flex border-b dark:border-gray-700">
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'report'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          aria-label="แท็บแบบฟอร์มแจ้งปัญหา"
        >
          แจ้งปัญหา
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`ml-4 px-4 py-2 font-medium ${
            activeTab === 'history'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          aria-label="แท็บประวัติการแจ้งปัญหา"
        >
          ประวัติการแจ้งปัญหา
        </button>
      </div>

      {/* เนื้อหา */}
      {activeTab === 'report' && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6"
        >
          <h2 className="text-xl font-semibold border-b dark:border-gray-700 pb-3">
            กรอกรายละเอียด
          </h2>

          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              หัวข้อปัญหา
            </label>
            <div className="relative">
              <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={`${inputStyles} pl-10`}
                placeholder="เช่น คอมพิวเตอร์เสีย"
                aria-label="หัวข้อปัญหา"
              />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">
              หมวดหมู่
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as IssueCategory)}
                className={`${inputStyles} pl-10`}
                aria-label="หมวดหมู่ปัญหา"
              >
                <option>การเรียนการสอน</option>
                <option>อาคารสถานที่</option>
                <option>IT/อุปกรณ์</option>
                <option>อื่นๆ</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              รายละเอียด (ถ้ามี)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={`${inputStyles} pl-10`}
                placeholder="อธิบายปัญหาเพิ่มเติม..."
                aria-label="รายละเอียดปัญหา"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            aria-busy={submitting}
          >
            <Send className="w-4 h-4" />
            {submitting ? 'กำลังส่ง...' : 'ส่งเรื่อง'}
          </button>
        </form>
      )}

      {activeTab === 'history' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">ประวัติการแจ้งปัญหา</h2>
          <div className="space-y-4">
            {myIssues.length > 0 ? (
              myIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-blue-500"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {issue.category}
                      </p>
                      <h3 className="font-semibold text-lg">{issue.title}</h3>
                    </div>
                    <StatusBadge status={issue.status as IssueStatus} />
                  </div>
                  <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">
                    {issue.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-3 text-right">
                    แจ้งเมื่อ: {new Date(issue.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <p className="text-gray-500">คุณยังไม่เคยแจ้งปัญหา</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
