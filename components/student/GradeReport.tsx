'use client';

import { useState, useEffect } from 'react';

interface GradeData {
  subject_name: string;
  score: number | null;
  grade: string | null;
}

interface GradeReportData {
  studentName: string;
  className: string;
  grades: GradeData[];
  gpa: string;
}

export default function GradeReport() {
    const [reportData, setReportData] = useState<GradeReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGradeReport = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/student/grades');
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Failed to fetch grade report');
                }
                const data = await res.json();
                setReportData(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchGradeReport();
    }, []);

    if (loading) return <p className="text-center">กำลังโหลดข้อมูลผลการเรียน...</p>;
    if (error) return <p className="text-center text-red-500 font-semibold">{error}</p>;
    if (!reportData) return <p className="text-center">ไม่พบข้อมูลผลการเรียน</p>;

    return (
        <div>
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold">รายงานผลการเรียน</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                    {reportData.studentName} - ห้อง {reportData.className}
                </p>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden max-w-4xl mx-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รายวิชา</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">คะแนน</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">เกรด</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {reportData.grades.map((item, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium">{item.subject_name}</td>
                                <td className="px-6 py-4 text-center">{item.score ?? '-'}</td>
                                <td className="px-6 py-4 text-center font-bold text-lg">{item.grade ?? '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <td colSpan={2} className="px-6 py-4 text-right font-bold uppercase">เกรดเฉลี่ย (GPA)</td>
                            <td className="px-6 py-4 text-center font-bold text-xl text-blue-600 dark:text-blue-400">{reportData.gpa}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
