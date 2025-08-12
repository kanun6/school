'use client';

import { useState, useEffect } from 'react';
import { DAYS_OF_WEEK, TIME_SLOTS } from '@/lib/constants';
import { Class } from '@/lib/types';

interface ScheduleSlot {
  day_of_week: number;
  start_time: string;
  subject_name: string;
  teacher_name: string;
}

export default function ClassScheduleView() {
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/classes');
        if (!res.ok) throw new Error('Failed to fetch classes');
        const data = await res.json();
        setAllClasses(data);
        if (data.length > 0) {
          setSelectedClass(data[0].id);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;

    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/schedules?classId=${selectedClass}`);
        if (!res.ok) throw new Error(`Failed to fetch schedule for class ${selectedClass}`);
        const data = await res.json();
        setSchedule(data.schedule || []);
      } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unknown error occurred");
        }
        setSchedule([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [selectedClass]);

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="class-select" className="block text-sm font-medium mb-1">เลือกห้องเรียน:</label>
        <select
          id="class-select"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="select-field max-w-xs bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
        >
          {allClasses.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading && <p>Loading schedule...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      
      {!loading && (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
            <div className="grid grid-cols-6">
                <div className="p-4 border-b border-r dark:border-gray-700"></div>
                {DAYS_OF_WEEK.map(day => (<div key={day.id} className="text-center font-bold p-4 border-b dark:border-gray-700">{day.name}</div>))}
            </div>
            <div className="grid grid-cols-6 h-full">
                <div className="grid grid-rows-7">
                    {TIME_SLOTS.map(slot => (<div key={slot.start} className={`flex items-center justify-center p-2 border-r dark:border-gray-700 ${!slot.isLunch ? 'border-b dark:border-gray-700' : ''}`}>{slot.isLunch ? '' : `${slot.start} - ${slot.end}`}</div>))}
                </div>
                {DAYS_OF_WEEK.map(day => (
                    <div key={day.id} className="grid grid-rows-7 border-l dark:border-gray-700">
                    {TIME_SLOTS.map(slot => {
                        if (slot.isLunch) { return <div key={slot.start} className="bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm">พักกลางวัน</div>; }
                        const scheduledSlot = schedule.find(s => s.day_of_week === day.id && s.start_time.startsWith(slot.start));
                        return (<div key={slot.start} className="border-b border-l dark:border-gray-700 p-2 text-center text-xs">{scheduledSlot ? (<div className="p-2 rounded-md h-full flex flex-col justify-center bg-blue-100 dark:bg-blue-900"><p className="font-bold">{scheduledSlot.subject_name}</p><p className="text-gray-600 dark:text-gray-400">{scheduledSlot.teacher_name}</p></div>) : (<div>-</div>)}</div>);
                    })}
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}
