// app/api/admin/schedules/route.ts 
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// ---------- Types ----------
type MaybeArray<T> = T | T[] | null | undefined;

type SubjectRef = { name: string };
type TeacherRef = { first_name: string; last_name: string };
type ClassRef = { id?: string; name: string };

interface ScheduleRowBase {
  day_of_week: number;
  start_time: string;
  subject: MaybeArray<SubjectRef>;
  teacher: MaybeArray<TeacherRef>;
}

interface ScheduleRowWithClass extends ScheduleRowBase {
  class: MaybeArray<ClassRef>;
}

// ---------- Helpers ----------
const pickOne = <T,>(val: MaybeArray<T>): T | null =>
  Array.isArray(val) ? (val[0] ?? null) : (val ?? null);

// ---------- Auth ----------
async function isAdmin(): Promise<boolean> {
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
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}

// ---------- Route ----------
export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId') ?? undefined;

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

  try {
    if (classId) {
      // --- ตารางของคลาสที่ระบุ ---
      const { data, error } = await supabase
        .from('schedule_slots')
        .select(`
          day_of_week,
          start_time,
          subject:subjects(name),
          teacher:profiles(first_name, last_name)
        `)
        .eq('class_id', classId)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      const rows: ScheduleRowBase[] = Array.isArray(data)
        ? data.map((r) => ({
            day_of_week: Number((r as ScheduleRowBase).day_of_week) || 0,
            start_time: String((r as ScheduleRowBase).start_time ?? ''),
            subject: (r as ScheduleRowBase).subject,
            teacher: (r as ScheduleRowBase).teacher,
          }))
        : [];

      const schedule = rows.map((slot) => {
        const subj = pickOne<SubjectRef>(slot.subject);
        const teach = pickOne<TeacherRef>(slot.teacher);
        return {
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          subject_name: subj?.name ?? '',
          teacher_name: teach ? `${teach.first_name} ${teach.last_name}` : '',
        };
      });

      return NextResponse.json({ schedule });
    }

    // --- ตารางทั้งหมด (รวมชื่อห้อง) ---
    const { data, error } = await supabase
      .from('schedule_slots')
      .select(`
        day_of_week,
        start_time,
        class:classes(name),
        subject:subjects(name),
        teacher:profiles(first_name, last_name)
      `)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;

    const rows: ScheduleRowWithClass[] = Array.isArray(data)
      ? data.map((r) => ({
          day_of_week: Number((r as ScheduleRowWithClass).day_of_week) || 0,
          start_time: String((r as ScheduleRowWithClass).start_time ?? ''),
          class: (r as ScheduleRowWithClass).class,
          subject: (r as ScheduleRowWithClass).subject,
          teacher: (r as ScheduleRowWithClass).teacher,
        }))
      : [];

    const allSchedules = rows.map((slot) => {
      const cls = pickOne<ClassRef>(slot.class);
      const subj = pickOne<SubjectRef>(slot.subject);
      const teach = pickOne<TeacherRef>(slot.teacher);
      return {
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        class_name: cls?.name ?? '',
        subject_name: subj?.name ?? '',
        teacher_name: teach ? `${teach.first_name} ${teach.last_name}` : '',
      };
    });

    return NextResponse.json({ allSchedules });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
