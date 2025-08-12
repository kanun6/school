'use client';

import { useState } from 'react';
import GradeManagement from '@/components/teacher/GradeManagement';
import TermSelector from '@/components/shared/TermSelector';

export default function GradesPage() {
    const [selectedTermId, setSelectedTermId] = useState<string>('');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-bold">บันทึกผลการเรียน</h1>
                 </div>
                <TermSelector onTermChange={setSelectedTermId} />
            </div>
            
            {selectedTermId ? (
                <GradeManagement termId={selectedTermId} />
            ) : (
                <p>กรุณาเลือกภาคเรียน...</p>
            )}
        </div>
    );
}