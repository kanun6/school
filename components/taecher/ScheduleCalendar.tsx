'use client';

import { useState, useEffect } from 'react';
import { DAYS_OF_WEEK, TIME_SLOTS } from '@/lib/constants';
import ScheduleModal from './ScheduleModal';

interface ScheduleSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  class_name: string;
  subject_name: string;
  is_own_class: boolean;
}

interface ClassData {
  id: string;
  name: string;
}

export default function ScheduleCalendar() {
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; time: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [scheduleRes, classesRes] = await Promise.all([
        fetch('/api/teacher/schedule'),
        fetch('/api/teacher/classes'),
      ]);

      if (!scheduleRes.ok || !classesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const scheduleData = await scheduleRes.json();
      const classesData = await classesRes.json();
      
      setSchedule(scheduleData.data || []);
      setClasses(classesData.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSlotClick = (day: number, time: string) => {
    setSelectedSlot({ day, time });
    setModalOpen(true);
  };

  const handleSaveSlot = async (classId: string) => {
    if (!selectedSlot) return;
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/teacher/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_of_week: selectedSlot.day,
          start_time: selectedSlot.time,
          class_id: classId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ไม่สามารถจองคาบสอนได้');
      }
      
      await fetchData(); // Refresh data after saving
      setModalOpen(false);
      setSelectedSlot(null);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคาบสอนนี้?')) return;
    
    try {
      const response = await fetch(`/api/teacher/schedule?slotId=${slotId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('ไม่สามารถยกเลิกคาบสอนได้');
      await fetchData();
    } catch (err: any) {
       alert(`Error: ${err.message}`);
    }
  };

  if (loading) return <p>Loading schedule...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <>
      {modalOpen && selectedSlot && (
        <ScheduleModal
          availableClasses={classes} // Simplified: show all classes. A real app would filter available ones.
          day={selectedSlot.day}
          timeSlot={selectedSlot.time}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveSlot}
          isSaving={isSaving}
        />
      )}
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
                  return <div key={slot.start} className="bg-gray-200 dark:bg-gray-700 col-span-1 flex items-center justify-center text-sm">พักกลางวัน</div>;
                }
                const scheduledSlot = schedule.find(s => s.day_of_week === day.id && s.start_time.startsWith(slot.start));
                return (
                  <div key={slot.start} className="border-b border-l dark:border-gray-700 p-2 text-center text-xs group relative">
                    {scheduledSlot ? (
                      <div className={`p-2 rounded-md h-full flex flex-col justify-center ${scheduledSlot.is_own_class ? 'bg-green-200 dark:bg-green-800' : 'bg-gray-200 dark:bg-gray-600'}`}>
                        <p className="font-bold">{scheduledSlot.subject_name}</p>
                        <p>{scheduledSlot.class_name}</p>
                        {scheduledSlot.is_own_class && (
                          <button onClick={() => handleDeleteSlot(scheduledSlot.id)} className="absolute top-1 right-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                            ยกเลิก
                          </button>
                        )}
                      </div>
                    ) : (
                      <button onClick={() => handleSlotClick(day.id, slot.start)} className="w-full h-full text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-md transition-colors">
                        + จอง
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
