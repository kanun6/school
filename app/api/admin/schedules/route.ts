import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// ระบุ type ให้ผลลัพธ์แบบเจาะจง
interface ScheduleSlot {
  day_of_week: string;
  start_time: string;
  subject: { name: string }[];            // Supabase คืนเป็น array
  teacher: { first_name: string; last_name: string }[];  // เช่นเดียวกัน
}

interface ScheduleSlotWithClass extends ScheduleSlot {
  class: { name: string }[];              // field class ก็เป็น array
}

// ตรวจสอบสิทธิ์ผู้ใช้งาน
async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies(); // ต้อง await เพราะ cookies() คืน Promise
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}

// API endpoint
export async function GET(request: Request) {
  // ถ้าไม่ใช่แอดมินให้ตอบ Forbidden
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // อ่านพารามิเตอร์ classId จาก URL
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');

  // ดึง cookies จาก request แล้วส่งเข้า supabase client
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
      },
    }
  );

  try {
    if (classId) {
      // ดึงตารางเรียนของคลาสนั้น ๆ
      const { data, error } = await supabase
        .from('schedule_slots')
        .select(`
          day_of_week,
          start_time,
          subject:subjects(name),
          teacher:profiles(first_name, last_name)
        `)
        .eq('class_id', classId);

      if (error) throw error;

      // cast ข้อมูลเป็น ScheduleSlot[] แล้ว map ค่า
      const scheduleData = data as ScheduleSlot[];
      const schedule = scheduleData.map((slot) => ({
        ...slot,
        subject_name: slot.subject[0]?.name ?? '',
        teacher_name: `${slot.teacher[0]?.first_name ?? ''} ${slot.teacher[0]?.last_name ?? ''}`,
      }));
      return NextResponse.json({ schedule });
    }

    // ถ้าไม่มี classId ให้ส่งตารางเรียนทั้งหมด
    const { data, error } = await supabase
      .from('schedule_slots')
      .select(`
        day_of_week,
        start_time,
        class:classes(name),
        subject:subjects(name),
        teacher:profiles(first_name, last_name)
      `);

    if (error) throw error;

    const scheduleData = data as ScheduleSlotWithClass[];
    const allSchedules = scheduleData.map((slot) => ({
      ...slot,
      class_name: slot.class[0]?.name ?? '',
      subject_name: slot.subject[0]?.name ?? '',
      teacher_name: `${slot.teacher[0]?.first_name ?? ''} ${slot.teacher[0]?.last_name ?? ''}`,
    }));
    return NextResponse.json({ allSchedules });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
