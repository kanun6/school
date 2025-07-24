import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get: (name) => cookieStore.get(name)?.value } });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const getClasses = searchParams.get('getClasses');
    const classId = searchParams.get('classId');

    try {
        const { data: teacherSubject, error: tsError } = await supabase.from('teacher_subjects').select('subject_id, subject:subjects(name)').eq('teacher_id', user.id).single();
        if (tsError) throw new Error('คุณยังไม่ได้รับมอบหมายให้สอนวิชาใด');

        // If the request is just to get the classes the teacher teaches
        if (getClasses) {
            const { data: taughtClasses, error: tcError } = await supabase
                .from('schedule_slots')
                .select('class:classes(id, name, grade, room)') // UPDATED: Select grade and room
                .eq('teacher_id', user.id);
            if (tcError) throw tcError;
            
            const uniqueClassesMap = new Map(taughtClasses.map(item => [item.class.id, item.class]));
            const uniqueClasses = Array.from(uniqueClassesMap.values());

            // UPDATED: Sort the classes by grade, then by room
            uniqueClasses.sort((a, b) => {
                if (a.grade !== b.grade) {
                    return a.grade - b.grade;
                }
                return a.room - b.room;
            });
            
            return NextResponse.json({ classes: uniqueClasses, subjectName: teacherSubject.subject.name });
        }

        // If the request is to get students for a specific class
        if (classId) {
            const { data: studentsInClass, error: scError } = await supabase
                .from('student_classes')
                .select('student:profiles(id, first_name, last_name)')
                .eq('class_id', classId);
            if (scError) throw scError;

            const studentIds = studentsInClass.map(sc => sc.student.id);
            if (studentIds.length === 0) {
                return NextResponse.json({ students: [] }); // Return empty if no students
            }

            const { data: grades, error: gError } = await supabase
                .from('grades')
                .select('student_id, score')
                .in('student_id', studentIds)
                .eq('subject_id', teacherSubject.subject_id);
            if (gError) throw gError;

            const studentsWithScores = studentsInClass.map(sc => {
                const grade = grades.find(g => g.student_id === sc.student.id);
                return {
                    ...sc.student,
                    score: grade?.score ?? null,
                };
            });

            return NextResponse.json({ students: studentsWithScores });
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get: (name) => cookieStore.get(name)?.value } });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { data: teacherSubject, error: tsError } = await supabase.from('teacher_subjects').select('subject_id').eq('teacher_id', user.id).single();
        if (tsError) throw new Error('คุณยังไม่ได้รับมอบหมายให้สอนวิชาใด');

        const { classId, grades } = await request.json();
        if (!classId || !grades) return NextResponse.json({ error: 'Class ID and grades are required' }, { status: 400 });

        const recordsToUpsert = grades.map((g: { studentId: string, score: number, grade: string }) => ({
            student_id: g.studentId,
            class_id: classId,
            teacher_id: user.id,
            subject_id: teacherSubject.subject_id,
            score: g.score,
            grade: g.grade,
            updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase.from('grades').upsert(recordsToUpsert, { onConflict: 'student_id, subject_id' });
        if (error) throw error;

        return NextResponse.json({ message: 'Grades saved successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
