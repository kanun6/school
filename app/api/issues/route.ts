import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function getUserAndRole() {
    const cookieStore = cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get: (name) => cookieStore.get(name)?.value } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { user: null, role: null };
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    return { user, role: profile?.role };
}

export async function GET() {
    const { user, role } = await getUserAndRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get: (name) => cookies().get(name)?.value } });
    let query = supabase.from('issues').select(`*, reported_by:profiles(first_name, last_name, role)`).order('created_at', { ascending: false });
    if (role !== 'admin') { query = query.eq('reported_by', user.id); }
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const { user } = await getUserAndRole();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get: (name) => cookies().get(name)?.value } });
    try {
        const { title, description, category } = await request.json();
        if (!title || !category) return NextResponse.json({ error: 'Title and category are required' }, { status: 400 });
        const { error } = await supabase.from('issues').insert({ title, description, category, reported_by: user.id });
        if (error) throw error;
        return NextResponse.json({ message: 'Issue reported successfully' }, { status: 201 });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const { role } = await getUserAndRole();
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    try {
        const { issueId, status } = await request.json();
        if (!issueId || !status) return NextResponse.json({ error: 'Issue ID and status are required' }, { status: 400 });
        const { error } = await supabaseAdmin.from('issues').update({ status }).eq('id', issueId);
        if (error) throw error;
        return NextResponse.json({ message: 'Status updated successfully' });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { role } = await getUserAndRole();
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    try {
        const { issueId } = await request.json();
        if (!issueId) return NextResponse.json({ error: 'Issue ID is required' }, { status: 400 });
        const { error } = await supabaseAdmin.from('issues').delete().eq('id', issueId);
        if (error) throw error;
        return NextResponse.json({ message: 'Issue deleted successfully' });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
