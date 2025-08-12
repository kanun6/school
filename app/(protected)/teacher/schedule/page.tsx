'use client';

import { useState } from 'react';
import ScheduleCalendar from '@/components/teacher/ScheduleCalendar';
import TermSelector from '@/components/shared/TermSelector';

export default function SchedulePage() {
    const [selectedTermId, setSelectedTermId] = useState<string>('');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">จัดการตารางสอน</h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        เลือกภาคเรียน จากนั้นคลิกที่ช่องว่างเพื่อจองคาบสอน
                    </p>
                </div>
                <TermSelector onTermChange={setSelectedTermId} />
            </div>
            
            {selectedTermId ? (
                <ScheduleCalendar termId={selectedTermId} />
            ) : (
                <p>กรุณาเลือกภาคเรียน...</p>
            )}
        </div>
    );
}
