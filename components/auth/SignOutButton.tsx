// components/auth/SignOutButton.tsx
'use client';

import { useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignOutButton({
  className,
  children,
  redirectTo = '/signin', // ออกจากระบบแล้วไปหน้าล็อกอิน (แสดงโปรไฟล์ที่จำไว้)
}: {
  className?: string;
  children?: ReactNode;    // ให้ parent ส่งไอคอน/ข้อความเองได้
  redirectTo?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();     // เคลียร์เซสชัน (ไม่ลบโปรไฟล์ที่จำไว้)
      router.push(redirectTo);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      aria-busy={loading}
      className={className}
      title="ออกจากระบบ"
    >
      {children ?? (loading ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ')}
    </button>
  );
}
