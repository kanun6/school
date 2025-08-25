import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get: (name) => cookieStore.get(name)?.value } });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { data: studentClass, error: studentClassError } = await supabase
            .from('student_classes')
            .select('class:classes(id, name)')
            .eq('student_id', user.id)
            .single();

        if (studentClassError || !studentClass) {
            return NextResponse.json({ error: 'คุณยังไม่ถูกกำหนดห้องเรียน' }, { status: 404 });
        }
        
        const classId = studentClass.class.id;
        const className = studentClass.class.name;

        const { data: schedule, error: scheduleError } = await supabase
            .from('schedule_slots')
            .select(`
                day_of_week,
                start_time,
                subject:subjects(name),
                teacher:profiles(first_name, last_name)
            `)
            .eq('class_id', classId);
        
        if (scheduleError) throw scheduleError;

        const formattedSchedule = schedule.map(slot => ({
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            subject_name: slot.subject.name,
            teacher_name: `${slot.teacher.first_name} ${slot.teacher.last_name}`,
        }));
        
        return NextResponse.json({ schedule: formattedSchedule, className });

    } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
