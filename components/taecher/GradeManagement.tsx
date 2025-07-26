'use client';

import { useState, useEffect, useCallback } from 'react';
import { calculateGrade } from '@/lib/utils';
import { useModal } from '@/contexts/ModalContext';

interface ClassData { id: string; name: string; }
interface StudentData { id: string; first_name: string; last_name: string; score: number | null; }

export default function GradeManagement() {
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [students, setStudents] = useState<StudentData[]>([]);
    const [subjectName, setSubjectName] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const { showAlert } = useModal();

    const fetchStudents = useCallback(async (classId: string) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/teacher/grades?classId=${classId}`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to fetch students');
            }
            const data = await res.json();
            setStudents(data.students);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(message);
            await showAlert({ title: 'เกิดข้อผิดพลาด', message, type: 'alert' });
            setStudents([]);
        } finally {
            setLoading(false);
        }
    }, [showAlert]);

    // Fetch classes the teacher teaches ONCE on mount
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await fetch('/api/teacher/grades?getClasses=true');
                if (!res.ok) throw new Error('Failed to fetch classes');
                const data = await res.json();
                setClasses(data.classes);
                setSubjectName(data.subjectName);
                if (data.classes.length > 0) {
                    // Set the initial class. This will only run once.
                    setSelectedClass(data.classes[0].id);
                } else {
                    setLoading(false);
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'An unknown error occurred';
                setError(message);
                await showAlert({ title: 'เกิดข้อผิดพลาด', message, type: 'alert' });
                setLoading(false);
            }
        };
        fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Use an empty dependency array to ensure this runs only once.

    // Fetch students when a class is selected
    useEffect(() => {
        if (selectedClass) {
            fetchStudents(selectedClass);
        }
    }, [selectedClass, fetchStudents]);

    const handleScoreChange = (studentId: string, score: string) => {
        const newScore = score === '' ? null : parseInt(score, 10);
        if (newScore !== null && (isNaN(newScore) || newScore < 0 || newScore > 100)) return;
        setStudents(prev =>
            prev.map(student =>
                student.id === studentId ? { ...student, score: newScore } : student
            )
        );
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        setError('');
        try {
            const gradesToSave = students.map(s => ({
                studentId: s.id,
                score: s.score,
                grade: calculateGrade(s.score)
            }));
            
            const res = await fetch('/api/teacher/grades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classId: selectedClass, grades: gradesToSave })
            });
            if (!res.ok) {
               const errorData = await res.json();
               throw new Error(errorData.error || 'Failed to save grades');
            }
            await showAlert({ title: 'สำเร็จ', message: 'บันทึกคะแนนเรียบร้อยแล้ว' });
            // After saving, just refresh the student data for the CURRENT class.
            // The dropdown selection will remain unchanged.
            await fetchStudents(selectedClass); 
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(message);
            await showAlert({ title: 'เกิดข้อผิดพลาด', message, type: 'alert' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">บันทึกผลการเรียน</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">วิชา: <span className="font-semibold">{subjectName || 'Loading...'}</span></p>
                </div>
                {classes.length > 0 && (
                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="select-field max-w-xs">
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                )}
            </div>

            {error && !loading && <p className="text-red-500 mb-4 text-center">{error}</p>}
            
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ - สกุล</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">คะแนน (0-100)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">เกรด</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {loading ? (
                            <tr><td colSpan={3} className="text-center py-4">Loading students...</td></tr>
                        ) : students.length > 0 ? (
                            students.map(student => (
                                <tr key={student.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{student.first_name} {student.last_name}</td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            value={student.score ?? ''}
                                            onChange={e => handleScoreChange(student.id, e.target.value)}
                                            className="input-field w-full"
                                            min="0"
                                            max="100"
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-bold text-lg">{calculateGrade(student.score)}</td>
                                </tr>
                            ))
                        ) : (
                             <tr><td colSpan={3} className="text-center py-4 text-gray-500">ไม่พบนักเรียนในห้องนี้ หรือยังไม่มีการสอนในห้องนี้</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {students.length > 0 && (
                 <div className="mt-6 flex justify-end">
                    <button onClick={handleSaveChanges} disabled={isSaving} className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 disabled:bg-blue-400">
                        {isSaving ? 'กำลังบันทึก...' : 'บันทึกคะแนน'}
                    </button>
                </div>
            )}
        </div>
    );
}
