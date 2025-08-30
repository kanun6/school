'use client';

import { useState, useEffect } from 'react';

interface ComponentItem {
  id: string;
  name: string;
  max: number;
  score: number | null;
}

interface GradeData {
  subject_id: string;
  subject_name: string;
  score: number | null;
  grade: string | null;
  components: ComponentItem[];
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

  // ใช้ Set เก็บ index ของวิชาที่เปิดอยู่
  const [openSet, setOpenSet] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchGradeReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/student/grades');
        if (!res.ok) {
          let msg = 'Failed to fetch grade report';
          try {
            const j = await res.json();
            if (j?.error) msg = j.error;
          } catch {
            const t = await res.text();
            if (t) msg = t;
          }
          throw new Error(msg);
        }
        const data: GradeReportData = await res.json();
        setReportData(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchGradeReport();
  }, []);

  // toggle การเปิด/ปิดทีละวิชา
  const toggleRow = (idx: number) => {
    setOpenSet((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  };

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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                รายวิชา
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                คะแนน (≤100)
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                เกรด
              </th>
              <th className="px-6 py-3 w-24" />
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {reportData.grades.map((item, idx) => {
              const isOpen = openSet.has(idx);
              return (
                <>
                  <tr key={item.subject_id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {item.subject_name}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.score ?? '-'}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-lg">
                      {item.grade ?? '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleRow(idx)}
                        className="text-sm px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:opacity-90"
                      >
                        {isOpen ? 'ซ่อน' : 'ดูรายละเอียด'}
                      </button>
                    </td>
                  </tr>

                  {isOpen && (
                    <tr>
                      <td colSpan={4} className="bg-gray-50 dark:bg-gray-700 px-6 py-4">
                        {item.components.length === 0 ? (
                          <p className="text-gray-500">ยังไม่กำหนดช่องคะแนนสำหรับวิชานี้</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full border">
                              <thead className="bg-gray-100 dark:bg-gray-600">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ช่องคะแนน
                                  </th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                    ได้ / เต็ม
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-500">
                                {item.components.map((c) => (
                                  <tr key={c.id}>
                                    <td className="px-4 py-2">{c.name}</td>
                                    <td className="px-4 py-2 text-center">
                                      {c.score ?? 0} / {c.max}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>

          <tfoot className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <td colSpan={3} className="px-6 py-4 text-right font-bold uppercase">
                เกรดเฉลี่ย (GPA)
              </td>
              <td className="px-6 py-4 text-center font-bold text-xl text-blue-600 dark:text-blue-400">
                {reportData.gpa}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
