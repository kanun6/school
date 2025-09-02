// components\profile\MyProfile.tsx
'use client';

import { useEffect, useState } from 'react';
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
  first_name?: string | null;
  last_name?: string | null;
  profile_image_url?: string | null;
  bio?: string | null;
  birthday?: string | null;
  phone?: string | null;
  address?: string | null;
  department?: string | null;
  position?: string | null;
  // ❌ ไม่ส่ง: role, student_id, subject/class assignment
};

export default function MyProfile() {
  const router = useRouter();
  const { showAlert } = useModal();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // common editable
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [bio, setBio] = useState<string>('');
  const [birthday, setBirthday] = useState<string>(''); // YYYY-MM-DD
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  // role-specific editable
  const [department, setDepartment] = useState<string>(''); // teacher (และอนุญาต student ถ้าอยากเก็บแผนก)
  const [position, setPosition] = useState<string>('');     // teacher only

  // read-only / admin-only
  const [role, setRole] = useState<Role>('student');
  const [email, setEmail] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');   // student only (ro)
  const [subjectName, setSubjectName] = useState<string>(''); // teacher ro
  const [className, setClassName] = useState<string>('');     // student ro

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
          throw new Error(error || 'Failed to load profile');
        }
        const data: UserProfileResponse = await res.json();

        setEmail(data.email ?? '');
        setRole(data.role);

        // set editable fields
        setFirstName(data.first_name ?? '');
        setLastName(data.last_name ?? '');
        setProfileImageUrl(data.profile_image_url ?? null);
        setBio(data.bio ?? '');
        setBirthday(data.birthday ?? '');
        setPhone(data.phone ?? '');
        setAddress(data.address ?? '');

        // role-specific editable
        setDepartment(data.department ?? '');
        setPosition(data.position ?? '');

        // read-only
        setStudentId(data.student_id ?? '');
        setSubjectName(data.subject_name ?? '');
        setClassName(data.class_name ?? '');
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unexpected error';
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload: UpsertPayload = {
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        profile_image_url: profileImageUrl ?? null,
        bio: bio || null,
        birthday: birthday || null,
        phone: phone || null,
        address: address || null,
      };

      // แนบเฉพาะฟิลด์ที่สอดคล้องกับ role
      if (role === 'teacher') {
        payload.department = department || null;
        payload.position = position || null;
      } else if (role === 'student') {
        // นักเรียนอาจมี department (คณะ/สาขา) ถ้าคุณใช้ใน schema ก็อนุญาตแก้ได้
        payload.department = department || null;
        // ไม่ส่ง position สำหรับ student
      } else {
        // admin: อนุญาตแก้ department ได้ถ้าอยากเก็บฝ่าย; ไม่ส่ง position โดยดีฟอลต์
        payload.department = department || null;
      }

      const res = await fetch('/api/profiles/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to save profile');
      }

      await showAlert({
        title: 'บันทึกสำเร็จ',
        message: 'อัปเดตโปรไฟล์เรียบร้อยแล้ว',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unexpected error';
      setError(msg);
      await showAlert({ title: 'เกิดข้อผิดพลาด', message: msg, type: 'alert' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600 dark:text-slate-300">Loading profile…</p>;
  }
  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">Error: {error}</p>;
  }

  return (
    <form
      onSubmit={handleSave}
      className="bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 rounded-xl px-5 sm:px-8 py-6 shadow-sm"
    >
      {/* Header */}
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
              Subject: {subjectName}
            </span>
          )}

          {role === 'student' && className && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
              bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              Class: {className}
            </span>
          )}
        </div>
      </div>

      {/* Avatar + Bio (ทุก role) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>Profile Image</label>
          <AvatarPicker value={profileImageUrl} onChange={setProfileImageUrl} />
        </div>
        <div>
          <label htmlFor="bio" className={labelClass}>Bio</label>
          <textarea
            id="bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={`${fieldClass} min-h-[116px]`}
            placeholder="เล่าเกี่ยวกับตัวคุณสั้น ๆ"
          />
        </div>
      </div>

      {/* Basic (ทุก role) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="firstName" className={labelClass}>First Name</label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={fieldClass}
            required
          />
        </div>
        <div>
          <label htmlFor="lastName" className={labelClass}>Last Name</label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={fieldClass}
            required
          />
        </div>
      </div>

      {/* Contact + Birthday (ทุก role) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label htmlFor="birthday" className={labelClass}>Birthday</label>
          <input
            id="birthday"
            type="date"
            value={birthday ?? ''}
            onChange={(e) => setBirthday(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>Phone</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={fieldClass}
            placeholder="0xx-xxx-xxxx"
          />
        </div>
        <div>
          <label htmlFor="address" className={labelClass}>Address</label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={fieldClass}
            placeholder="ที่อยู่สำหรับติดต่อ"
          />
        </div>
      </div>

      {/* ===== Role-specific sections ===== */}
      {role === 'teacher' && (
        <>
          {/* Teacher editable */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="department" className={labelClass}>Department</label>
              <input
                id="department"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={fieldClass}
                placeholder="เช่น วิทยาศาสตร์ / คณิตศาสตร์"
              />
            </div>
            <div>
              <label htmlFor="position" className={labelClass}>Position</label>
              <input
                id="position"
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className={fieldClass}
                placeholder="เช่น Lecturer / Advisor"
              />
            </div>
          </div>

          {/* Teacher read-only */}
          <div className="mb-4">
            <label className={labelClass}>Subject (assigned by admin)</label>
            <input value={subjectName || 'Unassigned'} className={roClass} readOnly />
          </div>
        </>
      )}

      {role === 'student' && (
        <>
          {/* Student editable (ถ้าต้องการเก็บแผนก/สายการเรียน) */}
          <div className="mb-4">
            <label htmlFor="department" className={labelClass}>Department / Major</label>
            <input
              id="department"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={fieldClass}
              placeholder="เช่น วิทย์-คณิต / ศิลป์-ภาษา"
            />
          </div>

          {/* Student read-only */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Student ID</label>
              <input value={studentId || '-'} className={roClass} readOnly />
            </div>
            <div>
              <label className={labelClass}>Class (assigned by admin)</label>
              <input value={className || 'Unassigned'} className={roClass} readOnly />
            </div>
          </div>
        </>
      )}

      {role === 'admin' && (
        <>
          {/* Admin: ให้แก้ข้อมูลส่วนตัวทั่วไป, ซ่อน position, subject/class */}
          <div className="mb-4">
            <label htmlFor="department" className={labelClass}>Department (optional)</label>
            <input
              id="department"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={fieldClass}
              placeholder="เช่น งานธุรการ / วิชาการ"
            />
          </div>
        </>
      )}

      {/* Admin-only note */}
      <div className="mb-4 text-xs text-slate-600 dark:text-slate-300">
        หมายเหตุ: ฟิลด์ <strong>Role</strong>, การมอบหมาย <strong>Subject/Class</strong> และการจัดการแบน
        เป็นสิทธิ์ของผู้ดูแลระบบเท่านั้น
      </div>

      <div className="pt-2">
        <button type="submit" className={saveBtn} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
