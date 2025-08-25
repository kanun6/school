import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get: (name) => cookieStore.get(name)?.value } });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select(`
                first_name,
                last_name,
                role,
                teacher_subject:teacher_subjects(subject:subjects(name)),
                student_class:student_classes(class:classes(name))
            `)
            .eq('id', user.id)
            .single();

        if (error) throw error;

        const response = {
            name: `${profile.first_name} ${profile.last_name}`,
            detail: 'No assignment',
        };

        if (profile.role === 'teacher' && profile.teacher_subject) {
            response.detail = `วิชา: ${profile.teacher_subject.subject.name}`;
        } else if (profile.role === 'student' && profile.student_class) {
            response.detail = `ห้อง: ${profile.student_class.class.name}`;
        }
        
        return NextResponse.json(response);

    } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
