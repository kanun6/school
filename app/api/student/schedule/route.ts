import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface ScheduleSlot {
  day_of_week: string;
  start_time: string;
  subject: { name: string }[];
  teacher: { first_name: string; last_name: string }[];
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: studentClassData, error: studentClassError } = await supabase
      .from('student_classes')
      .select('class:classes(id, name)')
      .eq('student_id', user.id)
      .single();

    if (studentClassError || !studentClassData || studentClassData.class.length === 0) {
      return NextResponse.json({ error: 'คุณยังไม่ถูกกำหนดห้องเรียน' }, { status: 404 });
    }

    const classInfo = studentClassData.class[0];
    const classId = classInfo.id;
    const className = classInfo.name;

    // ดึงตารางสอน แล้วกำหนดชื่อ field 'scheduleData' แทน 'schedule' เพื่อใช้งานต่อ
    const {
      data: scheduleData,
      error: scheduleError,
    } = await supabase
      .from('schedule_slots')
      .select(`
        day_of_week,
        start_time,
        subject:subjects(name),
        teacher:profiles(first_name, last_name)
      `)
      .eq('class_id', classId);

    if (scheduleError) throw scheduleError;

    // cast scheduleData เป็น array ของ ScheduleSlot; หากเป็น null ให้ใช้ array ว่าง
    const scheduleSlots: ScheduleSlot[] = (scheduleData ?? []) as ScheduleSlot[];

    // แปลงข้อมูลให้ง่ายขึ้นโดยเลือก element แรกของ subject/teacher
    const formattedSchedule = scheduleSlots.map((slot) => ({
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      subject_name: slot.subject[0]?.name ?? '',
      teacher_name: `${slot.teacher[0]?.first_name ?? ''} ${slot.teacher[0]?.last_name ?? ''}`,
    }));

    return NextResponse.json({ schedule: formattedSchedule, className });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
