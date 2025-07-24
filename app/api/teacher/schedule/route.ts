import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { TIME_SLOTS } from '@/lib/constants';

export async function POST(request: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get: (name) => cookieStore.get(name)?.value } });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: teacherSubject } = await supabase.from('teacher_subjects').select('subject_id').eq('teacher_id', user.id).single();
    if (!teacherSubject) return NextResponse.json({ error: 'คุณยังไม่ได้รับมอบหมายให้สอนวิชาใด' }, { status: 400 });

    const { day_of_week, start_time, class_id } = await request.json();
    const timeSlot = TIME_SLOTS.find(ts => ts.start === start_time);
    if (!timeSlot) return NextResponse.json({ error: 'Invalid time slot' }, { status: 400 });

    const { error } = await supabase.from('schedule_slots').insert({
        day_of_week,
        start_time,
        end_time: timeSlot.end,
        class_id,
        teacher_id: user.id,
        subject_id: teacherSubject.subject_id,
    });

    if (error) {
        if (error.code === '23505') return NextResponse.json({ error: 'คาบสอนนี้ถูกจองแล้วโดยครูท่านอื่นหรือตัวท่านเอง' }, { status: 409 });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Schedule created' }, { status: 201 });
}

export async function DELETE(request: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get: (name) => cookieStore.get(name)?.value } });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get('slotId');
    if (!slotId) return NextResponse.json({ error: 'Slot ID is required' }, { status: 400 });

    const { error } = await supabase.from('schedule_slots').delete().match({ id: slotId, teacher_id: user.id });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: 'Schedule deleted' });
}
