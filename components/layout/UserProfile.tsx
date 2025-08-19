'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, School } from 'lucide-react';

interface UserProfileData {
  name: string;
  detail: string;
}

type Role = 'student' | 'teacher';

type UserProfileProps = {
  role: Role;
  /** ให้เป็นลิงก์กดไปหน้าโปรไฟล์หรือไม่ (default: true) */
  asLink?: boolean;
  /** override เส้นทางได้เอง ถ้าไม่ส่งจะคำนวณจาก role */
  hrefOverride?: string;
  /** className เพิ่มเติม (เช่น ใช้ในหน้าโปรไฟล์เอง) */
  className?: string;
};

export default function UserProfile({
  role,
  asLink = true,
  hrefOverride,
  className = '',
}: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user-profile');
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data: UserProfileData = await res.json();
        setProfile(data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const Icon = role === 'student' ? User : School;
  const iconColor = role === 'student' ? 'text-purple-600' : 'text-green-600';
  const portalName = role === 'student' ? 'Student Portal' : 'Teacher Portal';
  const profileHref =
    hrefOverride ?? (role === 'student' ? '/student/profile' : '/teacher/profile');

  const content = (
    <div
      className={
        'flex h-16 items-center px-4 ' +
        (asLink
          ? 'rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer transition'
          : '') +
        ' ' +
        className
      }
    >
      <div className="flex items-center gap-3">
        <Icon className={`h-8 w-8 ${iconColor}`} />
        <div className="flex flex-col">
          {loading ? (
            <>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-20 mt-1 animate-pulse" />
            </>
          ) : (
            <>
              <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                {profile?.name || portalName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {profile?.detail}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // ถ้า asLink = true → คลิกได้ไปหน้าโปรไฟล์
  return asLink ? (
    <Link
      href={profileHref}
      aria-label="ไปที่โปรไฟล์"
      className="block focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 rounded-lg"
    >
      {content}
    </Link>
  ) : (
    // ใช้เป็นบล็อกแสดงข้อมูลเฉย ๆ
    <div className="border-b dark:border-gray-800">{content}</div>
  );
}
