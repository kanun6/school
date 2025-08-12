'use client';

import { useState } from 'react';
import StudentScheduleCalendar from '@/components/student/StudentScheduleCalendar';
import TermSelector from '@/components/shared/TermSelector';

export default function StudentSchedulePage() {
    const [selectedTermId, setSelectedTermId] = useState<string>('');
    
    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <TermSelector onTermChange={setSelectedTermId} />
            </div>
            
            {selectedTermId ? (
                <StudentScheduleCalendar termId={selectedTermId} />
            ) : (
                <p className="text-center">กรุณาเลือกภาคเรียนเพื่อดูตารางเรียน</p>
            )}
        </div>
    );
}
