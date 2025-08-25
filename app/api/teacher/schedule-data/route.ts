import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// โครงสร้างข้อมูลที่ได้จากตาราง schedule_slots
interface ScheduleSlotRaw {
  id: string;
  day_of_week: string;
  start_time: string;
  teacher_id: string;
  class_id: string;
  class: { name: string }[];          // Supabase ส่ง class เป็น array
  subject: { name: string }[];        // เช่นเดียวกันกับ subject
}

// ข้อมูลวิชาที่ครูสอน
interface TeacherSubject {
  subject: { name: string }[];        // subject เป็น array
}

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    }
  );

  // ตรวจสอบสิทธิ์ผู้ใช้
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // เรียกข้อมูลทั้งหมดพร้อมกัน
    const [allSchedulesRes, allClassesRes, teacherSubjectRes] = await Promise.all([
      supabase
        .from('schedule_slots')
        .select('id, day_of_week, start_time, teacher_id, class_id, class:classes(name), subject:subjects(name)'),
      supabase
        .from('classes')
        .select('id, name')
        .order('name'),
      supabase
        .from('teacher_subjects')
        .select('subject:subjects(name)')
        .eq('teacher_id', user.id)
        .single(),
    ]);

    // ตรวจสอบ error ของแต่ละผลลัพธ์
    if (allSchedulesRes.error) throw allSchedulesRes.error;
    if (allClassesRes.error) throw allClassesRes.error;
    if (teacherSubjectRes.error || !teacherSubjectRes.data) {
      throw new Error('คุณยังไม่ได้รับมอบหมายให้สอนวิชาใด');
    }

    // cast type ให้ Supabase เข้าใจโครงสร้าง (ไม่ใช้ any)
    const scheduleData = allSchedulesRes.data as ScheduleSlotRaw[];
    const teacherSubject = teacherSubjectRes.data as TeacherSubject;

    // map ตารางสอนและเลือก element แรกของ class/subject ก่อนเรียก name
    const allSchedules = scheduleData.map((slot) => ({
      id: slot.id,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      teacher_id: slot.teacher_id,
      class_id: slot.class_id,
      class_name: slot.class[0]?.name ?? '',      // class เป็น array => [0]?.name
      subject_name: slot.subject[0]?.name ?? '',  // subject เป็น array => [0]?.name
    }));

    // ตารางของผู้ใช้ (กรองเฉพาะที่ teacher_id ตรงกับ user)
    const mySchedule = allSchedules.filter((slot) => slot.teacher_id === user.id);

    return NextResponse.json({
      mySchedule,
      allSchedules,
      allClasses: allClassesRes.data,
      mySubjectName: teacherSubject.subject[0]?.name ?? '', // subject เป็น array => [0]?.name
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
