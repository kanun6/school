import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get: (name) => cookieStore.get(name)?.value } });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const [allSchedulesRes, allClassesRes, teacherSubjectRes] = await Promise.all([
            supabase.from('schedule_slots').select(`id, day_of_week, start_time, teacher_id, class_id, class:classes(name), subject:subjects(name)`),
            supabase.from('classes').select('id, name').order('name'),
            supabase.from('teacher_subjects').select('subject:subjects(name)').eq('teacher_id', user.id).single()
        ]);

        if (allSchedulesRes.error) throw allSchedulesRes.error;
        if (allClassesRes.error) throw allClassesRes.error;
        if (teacherSubjectRes.error) throw new Error('คุณยังไม่ได้รับมอบหมายให้สอนวิชาใด');

        const allSchedules = allSchedulesRes.data.map(slot => ({
            id: slot.id,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            teacher_id: slot.teacher_id,
            class_id: slot.class_id,
            class_name: slot.class.name,
            subject_name: slot.subject.name,
        }));

        const mySchedule = allSchedules.filter(slot => slot.teacher_id === user.id);

        return NextResponse.json({
            mySchedule,
            allSchedules,
            allClasses: allClassesRes.data,
            mySubjectName: teacherSubjectRes.data.subject.name
        });
    } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
