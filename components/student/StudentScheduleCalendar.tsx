'use client';

import { useState, useEffect } from 'react';
import { DAYS_OF_WEEK, TIME_SLOTS } from '@/lib/constants';

interface StudentScheduleSlot {
  day_of_week: number;
  start_time: string;
  subject_name: string;
  teacher_name: string;
}

interface StudentScheduleData {
    schedule: StudentScheduleSlot[];
    className: string;
}

export default function StudentScheduleCalendar() {
  const [data, setData] = useState<StudentScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/student/schedule');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch schedule data');
        }
        const scheduleData: StudentScheduleData = await response.json();
        setData(scheduleData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p>Loading schedule...</p>;
  if (error) return <p className="text-red-500 font-semibold text-center mt-4">{error}</p>;
  if (!data) return <p>No schedule data available.</p>;

  return (
    <div>
        <h2 className="text-2xl font-bold text-center mb-4">ตารางเรียน {data.className}</h2>
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
            <div className="grid grid-cols-6">
                <div className="p-4 border-b border-r dark:border-gray-700"></div>
                {DAYS_OF_WEEK.map(day => (
                    <div key={day.id} className="text-center font-bold p-4 border-b dark:border-gray-700">{day.name}</div>
                ))}
            </div>
            <div className="grid grid-cols-6 h-full">
                <div className="grid grid-rows-7">
                    {TIME_SLOTS.map(slot => (
                    <div key={slot.start} className={`flex items-center justify-center p-2 border-r dark:border-gray-700 ${!slot.isLunch ? 'border-b dark:border-gray-700' : ''}`}>
                        {slot.isLunch ? '' : `${slot.start} - ${slot.end}`}
                    </div>
                    ))}
                </div>
                {DAYS_OF_WEEK.map(day => (
                    <div key={day.id} className="grid grid-rows-7 border-l dark:border-gray-700">
                    {TIME_SLOTS.map(slot => {
                        if (slot.isLunch) {
                            return <div key={slot.start} className="bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm">พักกลางวัน</div>;
                        }
                        const scheduledSlot = data.schedule.find(s => s.day_of_week === day.id && s.start_time.startsWith(slot.start));
                        return (
                        <div key={slot.start} className="border-b border-l dark:border-gray-700 p-2 text-center text-xs">
                            {scheduledSlot ? (
                            <div className="p-2 rounded-md h-full flex flex-col justify-center bg-blue-100 dark:bg-blue-900">
                                <p className="font-bold">{scheduledSlot.subject_name}</p>
                                <p className="text-gray-600 dark:text-gray-400">{scheduledSlot.teacher_name}</p>
                            </div>
                            ) : (
                                <div>-</div>
                            )}
                        </div>
                        );
                    })}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}
