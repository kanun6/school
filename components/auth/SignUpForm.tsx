'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import AvatarPicker from '../profile/AvatarPicker';

type Role = 'student' | 'teacher';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try { return JSON.stringify(err); } catch { return 'Unexpected error'; }
}

export default function SignUpForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // profile fields
  const [role, setRole] = useState<Role>('student');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [birthday, setBirthday] = useState(''); // 'YYYY-MM-DD'
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');

  // ui
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fieldClass =
    'w-full rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 ' +
    'shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ' +
    'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400';
  const labelClass = 'block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200';

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // 1) สมัครผู้ใช้ + เก็บ metadata ใน Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role,
            profile_image_url: profileImageUrl || null,
            bio: bio || null,
            birthday: birthday || null,
            phone: phone || null,
            address: address || null,
            student_id: role === 'student' ? studentId : null,
            department: department || null,
            position: role === 'teacher' ? position : null,
          },
          emailRedirectTo: `${location.origin}/auth/callback?role=${role}`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.user?.identities?.length === 0) {
        setError('User with this email already exists. Please try to sign in.');
        return;
      }

      // 2) อัปเดตโปรไฟล์ลงตาราง profiles ผ่าน API (Service Role) — ไม่ติด RLS
      const userId = data.user?.id;
      if (userId) {
        const res = await fetch('/api/profiles/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            first_name: firstName,
            last_name: lastName,
            role,
            profile_image_url: profileImageUrl,
            bio,
            birthday: birthday || null, // ถ้าเป็น '' จะส่ง null
            phone,
            address,
            student_id: role === 'student' ? studentId : null,
            department,
            position: role === 'teacher' ? position : null,
            // ❌ visibility_settings: {}  (ลบออก)
          }),
        });

        if (!res.ok) {
          const t = await res.json().catch(() => ({}));
          console.warn('profiles upsert failed:', t?.error || res.statusText);
          // ไม่บล็อกผู้ใช้ ให้ไปยืนยันอีเมล/เข้าระบบต่อ แล้วค่อยแก้ไขโปรไฟล์ในภายหลังได้
        }
      }

      setMessage('Sign up successful! Please check your email to verify your account.');
      router.push(`/${role}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form
        className="bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 rounded-xl px-8 pt-6 pb-8 mb-4 shadow-sm"
        onSubmit={handleSignUp}
      >
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">
          Create Account
        </h2>

        {error && <p className="text-red-600 dark:text-red-400 text-sm text-center mb-4">{error}</p>}
        {message && <p className="text-green-700 dark:text-green-400 text-sm text-center mb-4">{message}</p>}

        {/* Role */}
        <div className="mb-6">
          <label htmlFor="role" className={labelClass}>Sign up as</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className={fieldClass}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        {/* Auth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${fieldClass} pr-10`}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
              >
                {showPassword ? <FiEye size={20} /> : <FiEyeOff size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Profile basic */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="firstName" className={labelClass}>First Name</label>
            <input
              id="firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="lastName" className={labelClass}>Last Name</label>
            <input
              id="lastName"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        {/* Avatar + Bio */}
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
            />
          </div>
        </div>

        {/* More fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="birthday" className={labelClass}>Birthday</label>
            <input
              id="birthday"
              type="date"
              value={birthday}
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
            />
          </div>
          <div>
            <label htmlFor="department" className={labelClass}>Department</label>
            <input
              id="department"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="address" className={labelClass}>Address</label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={fieldClass}
          />
        </div>

        {/* Conditional */}
        {role === 'student' && (
          <div className="mb-4">
            <label htmlFor="studentId" className={labelClass}>Student ID</label>
            <input
              id="studentId"
              type="text"
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className={fieldClass}
            />
          </div>
        )}

        {role === 'teacher' && (
          <div className="mb-4">
            <label htmlFor="position" className={labelClass}>Position</label>
            <input
              id="position"
              type="text"
              placeholder="e.g., Lecturer"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className={fieldClass}
            />
          </div>
        )}

        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 text-white font-semibold py-2 px-4 shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </div>

        <p className="text-center text-xs mt-4 text-gray-600 dark:text-gray-300">
          Already have an account?{' '}
          <a className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" href="/signin">Sign In</a>
        </p>
      </form>
    </div>
  );
}
