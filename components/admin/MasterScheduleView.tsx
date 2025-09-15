"use client";

import { useState, useEffect } from "react";
import { DAYS_OF_WEEK, TIME_SLOTS } from "@/lib/constants";

interface ScheduleSlot {
  day_of_week: number;
  start_time: string;
  class_name: string;
  subject_name: string;
  teacher_name: string;
}

export default function MasterScheduleView() {
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [teachers, setTeachers] = useState<string[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/schedules");
        if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลตารางสอนได้");
        const data = await res.json();
        setSchedule(data.allSchedules || []);

        // ✅ แก้ให้ไม่แดง (cast เป็น string[])
        const teacherNames: string[] = Array.from(
          new Set(
            data.allSchedules.map((s: ScheduleSlot) => s.teacher_name as string)
          )
        );
        setTeachers(teacherNames);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] space-y-4 animate-fade-in">
      {/* Spinner */}
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-lg font-medium text-gray-600 dark:text-gray-300 animate-pulse">
        กำลังโหลดตารางสอน...
      </p>
    </div>
  );
  if (error) return <p className="text-red-500">เกิดข้อผิดพลาด: {error}</p>;

  // ✅ ฟิลเตอร์ตามอาจารย์
  const filteredSchedule =
    selectedTeacher === "all"
      ? schedule
      : schedule.filter((s) => s.teacher_name === selectedTeacher);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">ตารางสอนรวม</h1>
      {/* Dropdown */}
      <div className="mb-4 flex items-center gap-4">
        <label
          htmlFor="teacher-select"
          className="block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          เลือกการแสดงผล:
        </label>
        <select
          id="teacher-select"
          value={selectedTeacher}
          onChange={(e) => setSelectedTeacher(e.target.value)}
          className="
            w-full max-w-xs rounded-md
            border border-slate-300 bg-white text-slate-900 shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600
            dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600
            dark:focus:ring-blue-400 dark:focus:border-blue-400
            hover:bg-slate-50 dark:hover:bg-slate-700
          "
        >
          <option value="all">ตารางสอนรวม</option>
          {teachers.map((t) => (
            <option key={t} value={t}>
              อาจารย์ {t}
            </option>
          ))}
        </select>
      </div>

      {/* ตาราง */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <div className="grid grid-cols-6">
          <div className="p-4 border-b border-r dark:border-gray-700"></div>
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
          {/* เวลา */}
          <div className="grid grid-rows-7">
            {TIME_SLOTS.map((slot) => (
              <div
                key={slot.start}
                className={`flex items-center justify-center p-2 border-r dark:border-gray-700 ${
                  !slot.isLunch ? "border-b dark:border-gray-700" : ""
                }`}
              >
                {slot.isLunch ? "" : `${slot.start} - ${slot.end}`}
              </div>
            ))}
          </div>
          {/* ตารางรายวัน */}
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
                const scheduledSlots = filteredSchedule.filter(
                  (s) =>
                    s.day_of_week === day.id &&
                    s.start_time.startsWith(slot.start)
                );
                return (
                  <div
                    key={slot.start}
                    className="border-b border-l dark:border-gray-700 p-2 text-xs space-y-1 overflow-y-auto"
                  >
                    {scheduledSlots.length > 0 ? (
                      scheduledSlots.map((s, index) => (
                        <div
                          key={`${s.class_name}-${s.subject_name}-${index}`}
                          className="p-1 rounded-md bg-gray-200 dark:bg-gray-600"
                        >
                          <p className="font-bold truncate">{s.subject_name}</p>
                          <p className="truncate">{s.class_name}</p>
                          <p className="text-gray-500 dark:text-gray-400 truncate">
                            {s.teacher_name}
                          </p>
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
    </div>
  );
}
