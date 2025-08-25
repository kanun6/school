'use client';

import { useState, useEffect } from 'react';
import { DAYS_OF_WEEK, TIME_SLOTS } from '@/lib/constants';
import ScheduleModal from './ScheduleModal';
import { Trash2 } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';

interface ScheduleSlot {
  id: string;
  day_of_week: number | string;
  start_time: string;
  class_id: string;
  class_name: string;
  subject_name: string;
  teacher_id: string;
}

interface ClassData {
  id: string;
  name: string;
}

interface ScheduleData {
  mySchedule: ScheduleSlot[];
  allSchedules: ScheduleSlot[];
  allClasses: ClassData[];
  mySubjectName: string;
}

export default function ScheduleCalendar() {
  // ตั้งค่าเริ่มต้นเป็นอาร์เรย์ว่าง ป้องกัน undefined ตั้งแต่แรก
  const [data, setData] = useState<ScheduleData>({
    mySchedule: [],
    allSchedules: [],
    allClasses: [],
    mySubjectName: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    day: number;
    time: string;
    availableClasses: ClassData[];
  } | null>(null);

  const { showConfirm, showAlert } = useModal();

  const fetchData = async () => {
    try {
      const res = await fetch('/api/teacher/schedule-data');
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || 'Failed to fetch schedule data');
      }
      const raw = await res.json();

      // ใส่ default ปลอดภัยทุกฟิลด์
      const safeData: ScheduleData = {
        mySchedule: Array.isArray(raw?.mySchedule) ? raw.mySchedule : [],
        allSchedules: Array.isArray(raw?.allSchedules) ? raw.allSchedules : [],
        allClasses: Array.isArray(raw?.allClasses) ? raw.allClasses : [],
        mySubjectName: typeof raw?.mySubjectName === 'string' ? raw.mySubjectName : '',
      };

      setData(safeData);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSlotClick = (day: number, time: string) => {
    // ใช้ค่า default ที่เราเซ็ตไว้แล้ว (ไม่เป็น undefined แน่นอน)
    const allSchedules = data.allSchedules;
    const allClasses = data.allClasses;

    const bookedClassIdsInSlot = allSchedules
      .filter(
        (s) =>
          Number(s.day_of_week) === day &&
          typeof s.start_time === 'string' &&
          s.start_time.startsWith(time),
      )
      .map((s) => s.class_id);

    // ใช้ Set ให้ lookup เร็วขึ้น
    const bookedSet = new Set(bookedClassIdsInSlot);
    const availableClasses = allClasses.filter((c) => !bookedSet.has(c.id));

    setSelectedSlot({ day, time, availableClasses });
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
        const errorData: { error?: string } = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'ไม่สามารถจองคาบสอนได้');
      }

      await fetchData();
      setModalOpen(false);
      setSelectedSlot(null);
    } catch (err: unknown) {
      showAlert({
        title: 'เกิดข้อผิดพลาด',
        message: err instanceof Error ? err.message : 'An unknown error occurred',
        type: 'alert',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    const confirmed = await showConfirm({
      title: 'ยืนยันการยกเลิก',
      message: 'คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคาบสอนนี้?',
      confirmText: 'ยืนยัน',
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/teacher/schedule?slotId=${slotId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('ไม่สามารถยกเลิกคาบสอนได้');
      await fetchData();
    } catch (err: unknown) {
      showAlert({
        title: 'เกิดข้อผิดพลาด',
        message: err instanceof Error ? err.message : 'An unknown error occurred',
        type: 'alert',
      });
    }
  };

  if (loading) return <p>Loading schedule...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  const mySchedule = data.mySchedule;

  return (
    <>
      {modalOpen && selectedSlot && (
        <ScheduleModal
          availableClasses={selectedSlot.availableClasses}
          day={selectedSlot.day}
          timeSlot={selectedSlot.time}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveSlot}
          isSaving={isSaving}
        />
      )}

      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <div className="grid grid-cols-6">
          <div className="p-4 border-b border-r dark:border-gray-700" />
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day.id}
              className="text-center font-bold p-4 border-b dark:border-gray-700"
            >
              {day.name}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-6 h-full">
          <div className="grid grid-rows-7">
            {TIME_SLOTS.map((slot) => (
              <div
                key={slot.start}
                className={`flex items-center justify-center p-2 border-r dark:border-gray-700 ${
                  !slot.isLunch ? 'border-b dark:border-gray-700' : ''
                }`}
              >
                {slot.isLunch ? '' : `${slot.start} - ${slot.end}`}
              </div>
            ))}
          </div>

          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day.id}
              className="grid grid-rows-7 border-l dark:border-gray-700"
            >
              {TIME_SLOTS.map((slot) => {
                if (slot.isLunch) {
                  return (
                    <div
                      key={slot.start}
                      className="bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm"
                    >
                      พักกลางวัน
                    </div>
                  );
                }

                const myScheduledSlot = mySchedule.find(
                  (s) =>
                    Number(s.day_of_week) === day.id &&
                    typeof s.start_time === 'string' &&
                    s.start_time.startsWith(slot.start),
                );

                return (
                  <div
                    key={slot.start}
                    className="border-b border-l dark:border-gray-700 p-2 text-center text-xs group relative"
                  >
                    {myScheduledSlot ? (
                      <div className="p-2 rounded-md h-full flex flex-col justify-center bg-green-200 dark:bg-green-800">
                        <p className="font-bold">{myScheduledSlot.subject_name}</p>
                        <p>{myScheduledSlot.class_name}</p>
                        <button
                          onClick={() => handleDeleteSlot(myScheduledSlot.id)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-all duration-200"
                          aria-label="Delete schedule slot"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSlotClick(day.id, slot.start)}
                        className="w-full h-full text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-md transition-colors"
                      >
                        + เพิ่มรายวิชา
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
