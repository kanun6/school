'use client';

import { useState } from 'react';
import { DAYS_OF_WEEK } from '@/lib/constants';

interface ClassData {
  id: string;
  name: string;
}

interface ScheduleModalProps {
  availableClasses: ClassData[];
  day: number;
  timeSlot: string;
  onClose: () => void;
  onSave: (classId: string) => Promise<void>;
  isSaving: boolean;
}

export default function ScheduleModal({ availableClasses, day, timeSlot, onClose, onSave, isSaving }: ScheduleModalProps) {
  const [selectedClass, setSelectedClass] = useState<string>(availableClasses[0]?.id || '');

  const handleSave = () => {
    if (selectedClass) {
      onSave(selectedClass);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold mb-2">จองคาบสอน</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          เวลา {timeSlot} วัน{DAYS_OF_WEEK.find(d => d.id === day)?.name}
        </p>
        
        {availableClasses.length > 0 ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="classSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300">เลือกห้องเรียน</label>
              <select
                id="classSelect"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {availableClasses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <p className="text-yellow-500">ไม่มีห้องเรียนว่างสำหรับช่วงเวลานี้</p>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500" disabled={isSaving}>
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            disabled={isSaving || availableClasses.length === 0}
          >
            {isSaving ? 'กำลังบันทึก...' : 'ยืนยัน'}
          </button>
        </div>
      </div>
    </div>
  );
}
