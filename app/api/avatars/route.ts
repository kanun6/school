import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';

// ห้ามเผยแพร่ค่า env นี้ไปยัง client
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');

    if (!file || !(file instanceof File)) {
      return new NextResponse('Missing file', { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = file.name.split('.').pop() || 'jpg';
    const key = `public/${new Date().getFullYear()}/${randomUUID()}.${ext}`;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // อัปโหลด (upsert = true เพื่อเขียนทับไฟล์เดิมได้)
    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(key, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadErr) {
      return new NextResponse(uploadErr.message, { status: 500 });
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(key);
    return NextResponse.json({ url: data.publicUrl, path: key });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return new NextResponse(msg, { status: 500 });
  }
}
