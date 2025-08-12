'use client';

import { useState } from 'react';
import GradeReport from '@/components/student/GradeReport';
import TermSelector from '@/components/shared/TermSelector';

export default function StudentGradesPage() {
    const [selectedTermId, setSelectedTermId] = useState<string>('');

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <TermSelector onTermChange={setSelectedTermId} />
            </div>

            {selectedTermId ? (
                <GradeReport termId={selectedTermId} />
            ) : (
                <p className="text-center">กรุณาเลือกภาคเรียนเพื่อดูผลการเรียน</p>
            )}
        </div>
    );
}
