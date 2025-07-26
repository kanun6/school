import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function isAdmin(): Promise<boolean> {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    return profile?.role === 'admin';
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) throw usersError;

    const userIds = users.map(user => user.id);
    const [profilesRes, teacherSubjectsRes, studentClassesRes] = await Promise.all([
        supabaseAdmin.from('profiles').select('*').in('id', userIds),
        supabaseAdmin.from('teacher_subjects').select('*').in('teacher_id', userIds),
        supabaseAdmin.from('student_classes').select('*').in('student_id', userIds)
    ]);

    if (profilesRes.error) throw profilesRes.error;
    if (teacherSubjectsRes.error) throw teacherSubjectsRes.error;
    if (studentClassesRes.error) throw studentClassesRes.error;

    const managedUsers = users.map(user => {
      const profile = profilesRes.data.find(p => p.id === user.id);
      const assignment = teacherSubjectsRes.data.find(ts => ts.teacher_id === user.id);
      const classAssignment = studentClassesRes.data.find(sc => sc.student_id === user.id);
      return {
        id: user.id,
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        role: profile?.role || 'student',
        email: user.email || '',
        banned_until: user.banned_until,
        subject_id: assignment?.subject_id || null,
        class_id: classAssignment?.class_id || null,
      };
    });

    return NextResponse.json(managedUsers);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: Request) {
    if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { userId, updates } = await request.json();
        if (!userId || !updates) return NextResponse.json({ error: 'User ID and updates are required.' }, { status: 400 });

        if (typeof updates.subject_id !== 'undefined') {
            if (updates.subject_id) {
                const { error } = await supabaseAdmin.from('teacher_subjects').upsert({ teacher_id: userId, subject_id: updates.subject_id });
                if (error) throw new Error(`Failed to assign subject: ${error.message}`);
            } else {
                const { error } = await supabaseAdmin.from('teacher_subjects').delete().eq('teacher_id', userId);
                 if (error) throw new Error(`Failed to unassign subject: ${error.message}`);
            }
        }

        if (typeof updates.class_id !== 'undefined') {
            if (updates.class_id) {
                const { error } = await supabaseAdmin.from('student_classes').upsert({ student_id: userId, class_id: updates.class_id });
                if (error) throw new Error(`Failed to assign class: ${error.message}`);
            } else {
                const { error } = await supabaseAdmin.from('student_classes').delete().eq('student_id', userId);
                 if (error) throw new Error(`Failed to unassign class: ${error.message}`);
            }
        }

        const profileUpdates: { [key: string]: unknown } = {};
        const authUpdates: { [key: string]: unknown } = {};
        if (updates.role) profileUpdates.role = updates.role;
        if (updates.first_name) profileUpdates.first_name = updates.first_name;
        if (updates.last_name) profileUpdates.last_name = updates.last_name;
        if (updates.ban_duration) authUpdates.ban_duration = updates.ban_duration;
        
        if (Object.keys(profileUpdates).length > 0) {
            const { error } = await supabaseAdmin.from('profiles').update(profileUpdates).eq('id', userId);
            if (error) throw error;
        }
        if (Object.keys(authUpdates).length > 0) {
            const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdates);
            if (error) throw error;
        }
        
        return NextResponse.json({ message: 'User updated successfully.' });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    try {
        const { userId } = await request.json();
        if (!userId) return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) throw error;
        return NextResponse.json({ message: 'User deleted successfully.' });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}