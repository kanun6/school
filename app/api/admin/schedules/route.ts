import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

async function isAdmin(): Promise<boolean> {
    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get: (name) => cookieStore.get(name)?.value } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    return profile?.role === 'admin';
}

export async function GET(request: Request) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get: (name) => cookies().get(name)?.value } });

    try {
        if (classId) {
            const { data, error } = await supabase.from('schedule_slots').select(`day_of_week, start_time, subject:subjects(name), teacher:profiles(first_name, last_name)`).eq('class_id', classId);
            if (error) throw error;
            const schedule = data.map(slot => ({ ...slot, subject_name: slot.subject.name, teacher_name: `${slot.teacher.first_name} ${slot.teacher.last_name}`, }));
            return NextResponse.json({ schedule });
        }

        const { data, error } = await supabase.from('schedule_slots').select(`day_of_week, start_time, class:classes(name), subject:subjects(name), teacher:profiles(first_name, last_name)`);
        if (error) throw error;
        const allSchedules = data.map(slot => ({ ...slot, class_name: slot.class.name, subject_name: slot.subject.name, teacher_name: `${slot.teacher.first_name} ${slot.teacher.last_name}`, }));
        return NextResponse.json({ allSchedules });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}