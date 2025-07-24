'use client';

import { useState, useEffect } from 'react';
import { User, School } from 'lucide-react';

interface UserProfileData {
    name: string;
    detail: string; // Can be class name or subject name
}

export default function UserProfile({ role }: { role: 'student' | 'teacher' }) {
    const [profile, setProfile] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/user-profile');
                if (!res.ok) throw new Error('Failed to fetch profile');
                const data = await res.json();
                setProfile(data);
            } catch (error) {
                console.error("Error fetching user profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const Icon = role === 'student' ? User : School;
    const iconColor = role === 'student' ? 'text-purple-600' : 'text-green-600';
    const portalName = role === 'student' ? 'Student Portal' : 'Teacher Portal';

    return (
        <div className="flex h-16 items-center border-b px-4 dark:border-gray-800">
            <div className="flex items-center gap-3">
                <Icon className={`h-8 w-8 ${iconColor}`} />
                <div className="flex flex-col">
                    {loading ? (
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                    ) : (
                        <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {profile?.name || portalName}
                        </span>
                    )}
                    {loading ? (
                         <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-20 mt-1 animate-pulse"></div>
                    ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {profile?.detail}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
