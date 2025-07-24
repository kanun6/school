'use client';

import { useState, useEffect } from 'react';
import { DAYS_OF_WEEK, TIME_SLOTS } from '@/lib/constants';

interface ScheduleSlot {
  day_of_week: number;
  start_time: string;
  class_name: string;
  subject_name: string;
  teacher_name: string;
}

export default function MasterScheduleView() {
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/schedules');
        if (!res.ok) throw new Error('Failed to fetch master schedule');
        const data = await res.json();
        setSchedule(data.allSchedules || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p>Loading master schedule...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
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
              const scheduledSlots = schedule.filter(s => s.day_of_week === day.id && s.start_time.startsWith(slot.start));
              return (
                <div key={slot.start} className="border-b border-l dark:border-gray-700 p-2 text-xs space-y-1 overflow-y-auto">
                  {scheduledSlots.length > 0 ? (
                    scheduledSlots.map((s, index) => (
                      <div key={index} className="p-1 rounded-md bg-gray-200 dark:bg-gray-600">
                        <p className="font-bold truncate">{s.subject_name}</p>
                        <p className="truncate">{s.class_name}</p>
                        <p className="text-gray-500 dark:text-gray-400 truncate">{s.teacher_name}</p>
                      </div>
                    ))
                  ) : (
                    <div className="h-full w-full"></div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}