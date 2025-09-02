// components/profile/MyProfile.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AvatarPicker from '@/components/profile/AvatarPicker';
import { useModal } from '@/contexts/ModalContext';

type Role = 'admin' | 'teacher' | 'student';

type UserProfileResponse = {
  id: string;
  email: string | null;
  // profile
  first_name: string | null;
  last_name: string | null;
  role: Role;
  profile_image_url: string | null;
  bio: string | null;
  birthday: string | null; // YYYY-MM-DD
  phone: string | null;
  address: string | null;
  student_id: string | null;
  department: string | null;
  position: string | null;
  // assignments (read-only)
  subject_name: string | null;
  class_name: string | null;
  // convenience
  display_name: string;
  detail: string;
};

type UpsertPayload = {
  // อนุญาตเฉพาะสองฟิลด์นี้เท่านั้น
  profile_image_url?: string | null;
  bio?: string | null;
};

export default function MyProfile() {
  const router = useRouter();
  const { showAlert } = useModal();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // แก้ได้เฉพาะสองฟิลด์นี้
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [bio, setBio] = useState<string>('');

  // สำหรับแสดงผล (ดูอย่างเดียว)
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [birthday, setBirthday] = useState<string>(''); // ro
  const [phone, setPhone] = useState<string>('');       // ro
  const [address, setAddress] = useState<string>('');   // ro
  const [department, setDepartment] = useState<string>(''); // ro
  const [position, setPosition] = useState<string>('');     // ro
  const [studentId, setStudentId] = useState<string>('');   // ro
  const [role, setRole] = useState<Role>('student');
  const [email, setEmail] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>(''); // ro
  const [className, setClassName] = useState<string>('');     // ro

  // เก็บค่าเริ่มต้นไว้เทียบว่ามีการเปลี่ยนแปลงไหม
  const [initialBio, setInitialBio] = useState<string>('');
  const [initialAvatar, setInitialAvatar] = useState<string | null>(null);

  // toggle แก้ไขเฉพาะ Bio
  const [editingBio, setEditingBio] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/user-profile', { cache: 'no-store' });
        if (res.status === 401) {
          router.push('/signin');
          return;
        }
        if (!res.ok) {
          const { error } = await res.json();
          throw new Error(error || 'โหลดโปรไฟล์ไม่สำเร็จ');
        }
        const data: UserProfileResponse = await res.json();

        setEmail(data.email ?? '');
        setRole(data.role);

        // สำหรับแสดงผล (ดูอย่างเดียว)
        setFirstName(data.first_name ?? '');
        setLastName(data.last_name ?? '');
        setBirthday(data.birthday ?? '');
        setPhone(data.phone ?? '');
        setAddress(data.address ?? '');
        setDepartment(data.department ?? '');
        setPosition(data.position ?? '');
        setStudentId(data.student_id ?? '');
        setSubjectName(data.subject_name ?? '');
        setClassName(data.class_name ?? '');

        // ฟิลด์ที่แก้ไขได้
        setProfileImageUrl(data.profile_image_url ?? null);
        setBio(data.bio ?? '');

        // เก็บค่าเริ่มต้นไว้เปรียบเทียบ
        setInitialAvatar(data.profile_image_url ?? null);
        setInitialBio(data.bio ?? '');
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [router]);

  const fieldClass =
    'w-full rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 ' +
    'shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ' +
    'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400';

  const labelClass = 'block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200';

  const roClass =
    'w-full rounded-md border border-gray-200 bg-gray-50 text-gray-600 ' +
    'dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 cursor-not-allowed';

  const saveBtn =
    'inline-flex items-center justify-center px-4 py-2 rounded-md ' +
    'bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:bg-emerald-400';

  const editBtn =
    'inline-flex items-center justify-center px-3 py-1.5 rounded-md ' +
    'bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300';

  // มีการเปลี่ยนแปลงหรือไม่ (ใช้ปิดปุ่มบันทึก)
  const hasChanges = useMemo(
    () => bio !== initialBio || profileImageUrl !== initialAvatar,
    [bio, initialBio, profileImageUrl, initialAvatar],
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!hasChanges) return;

    setSaving(true);
    setError('');

    try {
      const payload: UpsertPayload = {
        // ส่งเฉพาะฟิลด์ที่อนุญาต
        profile_image_url: profileImageUrl ?? null,
        bio: bio || null,
      };

      const res = await fetch('/api/profiles/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'บันทึกโปรไฟล์ไม่สำเร็จ');
      }

      // อัปเดตค่าเริ่มต้นใหม่หลังบันทึก
      setInitialAvatar(profileImageUrl ?? null);
      setInitialBio(bio);
      setEditingBio(false);

      await showAlert({
        title: 'บันทึกสำเร็จ',
        message: 'อัปเดตโปรไฟล์เรียบร้อยแล้ว',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
      setError(msg);
      await showAlert({ title: 'เกิดข้อผิดพลาด', message: msg, type: 'alert' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600 dark:text-slate-300">กำลังโหลดโปรไฟล์…</p>;
  }
  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">ข้อผิดพลาด: {error}</p>;
  }

  return (
    <form
      onSubmit={handleSave}
      className="bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 rounded-xl px-5 sm:px-8 py-6 shadow-sm"
    >
      {/* ส่วนหัว */}
      <div className="mb-6">
        <p className="text-sm text-slate-600 dark:text-slate-300">{email}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
            bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 capitalize">
            {role}
          </span>

          {role === 'teacher' && subjectName && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
              bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              วิชา: {subjectName}
            </span>
          )}

          {role === 'student' && className && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
              bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              ห้อง: {className}
            </span>
          )}
        </div>
      </div>

      {/* รูปโปรไฟล์ + Bio (แก้ได้) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>รูปโปรไฟล์</label>
          {/* เปลี่ยนรูปโปรไฟล์ได้ตลอด */}
          <AvatarPicker value={profileImageUrl} onChange={setProfileImageUrl} />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            อัปเดตรูปแล้วอย่าลืมกด “บันทึกการเปลี่ยนแปลง”
          </p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="bio" className={labelClass}>เกี่ยวกับฉัน (Bio)</label>
            <button
              type="button"
              onClick={() => setEditingBio((v) => !v)}
              className={editBtn}
              disabled={saving}
            >
              {editingBio ? 'หยุดแก้ไข' : 'แก้ไข'}
            </button>
          </div>
          <textarea
            id="bio"
            rows={6}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={`${editingBio ? fieldClass : roClass} min-h-[140px]`}
            placeholder="เล่าเกี่ยวกับตัวคุณสั้น ๆ"
            readOnly={!editingBio}
          />
        </div>
      </div>

      {/* ข้อมูลส่วนตัว (ดูอย่างเดียว) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>ชื่อ</label>
          <input value={firstName || '-'} className={roClass} readOnly />
        </div>
        <div>
          <label className={labelClass}>นามสกุล</label>
          <input value={lastName || '-'} className={roClass} readOnly />
        </div>
      </div>

      {/* การติดต่อ (ดูอย่างเดียว) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className={labelClass}>วันเกิด</label>
          <input value={birthday || '-'} className={roClass} readOnly />
        </div>
        <div>
          <label className={labelClass}>โทรศัพท์</label>
          <input value={phone || '-'} className={roClass} readOnly />
        </div>
        <div>
          <label className={labelClass}>ที่อยู่</label>
          <input value={address || '-'} className={roClass} readOnly />
        </div>
      </div>

      {/* ข้อมูลตามบทบาท (ดูอย่างเดียว) */}
      {role === 'teacher' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>แผนก/กลุ่มสาระ</label>
            <input value={department || '-'} className={roClass} readOnly />
          </div>
          <div>
            <label className={labelClass}>ตำแหน่ง</label>
            <input value={position || '-'} className={roClass} readOnly />
          </div>
        </div>
      )}

      {role === 'student' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>รหัสนักเรียน</label>
            <input value={studentId || '-'} className={roClass} readOnly />
          </div>
          <div>
            <label className={labelClass}>แผนก/สาขา</label>
            <input value={department || '-'} className={roClass} readOnly />
          </div>
        </div>
      )}

      {role === 'admin' && (
        <div className="mb-4">
          <label className={labelClass}>ฝ่าย/หน่วยงาน</label>
          <input value={department || '-'} className={roClass} readOnly />
        </div>
      )}

      <div className="mb-4 text-xs text-slate-600 dark:text-slate-300">
        หมายเหตุ: ฟิลด์อื่น ๆ ทั้งหมดเป็นแบบอ่านอย่างเดียวและแก้ไขได้โดยผู้ดูแลระบบเท่านั้น
      </div>

      <div className="pt-2 flex items-center gap-2">
        <button type="submit" className={saveBtn} disabled={saving || !hasChanges}>
          {saving ? 'กำลังบันทึก…' : 'บันทึกการเปลี่ยนแปลง'}
        </button>
        {!hasChanges && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            ไม่มีการเปลี่ยนแปลงสำหรับบันทึก
          </span>
        )}
      </div>
    </form>
  );
}
