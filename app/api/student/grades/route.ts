import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get: (name) => cookieStore.get(name)?.value } });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // 1. Get student's profile and class
        const { data: studentInfo, error: studentInfoError } = await supabase
            .from('profiles')
            .select(`
                first_name,
                last_name,
                student_class:student_classes(
                    class:classes(name)
                )
            `)
            .eq('id', user.id)
            .single();

        if (studentInfoError) throw studentInfoError;
        if (!studentInfo.student_class) return NextResponse.json({ error: 'คุณยังไม่ถูกกำหนดห้องเรียน' }, { status: 404 });

        const studentName = `${studentInfo.first_name} ${studentInfo.last_name}`;
        const className = studentInfo.student_class.class.name;

        // 2. Get all subjects and the student's grades for them
        const { data: subjects, error: subjectsError } = await supabase
            .from('subjects')
            .select(`
                name,
                grades (
                    score,
                    grade
                )
            `)
            .eq('grades.student_id', user.id);

        if (subjectsError) throw subjectsError;

        // 3. Combine the data
        const grades = subjects.map(subject => {
            const gradeInfo = subject.grades[0]; // RLS ensures we only get one grade per subject for this student
            return {
                subject_name: subject.name,
                score: gradeInfo?.score ?? null,
                grade: gradeInfo?.grade ?? null,
            };
        });

        // 4. Calculate GPA
        const gradedSubjects = grades.filter(g => g.grade !== null);
        let gpa = 'N/A';
        if (gradedSubjects.length > 0) {
            const totalGradePoints = gradedSubjects.reduce((sum, g) => sum + parseFloat(g.grade!), 0);
            gpa = (totalGradePoints / gradedSubjects.length).toFixed(2);
        }

        return NextResponse.json({
            studentName,
            className,
            grades,
            gpa
        });

    } catch (err: unknown) {
    // ตรวจสอบชนิด error อย่างปลอดภัย
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
    }
}
