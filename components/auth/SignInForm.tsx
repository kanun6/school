'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fieldClass =
    'w-full rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 ' +
    'shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ' +
    'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400';

  const labelClass = 'block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200';

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError('Invalid login credentials. Please try again.');
    } else {
      router.refresh(); // ให้ middleware จัดการ redirect ตาม role
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <form
        className="bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 rounded-xl px-8 pt-6 pb-8 mb-4 shadow-sm"
        onSubmit={handleSignIn}
      >
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">
          Sign In
        </h2>

        {error && (
          <p className="text-red-600 dark:text-red-400 text-sm text-center mb-4">
            {error}
          </p>
        )}

        <div className="mb-4">
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${fieldClass} pr-12`} /* เผื่อพื้นที่ไอคอนด้านขวา */
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md
                         text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500
                         dark:text-gray-300 dark:hover:text-gray-100"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEye size={20} /> : <FiEyeOff size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 text-white font-semibold py-2 px-4 shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        <p className="text-center text-xs mt-4 text-gray-600 dark:text-gray-300">
          Do not have an account?{' '}
          <a
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            href="/signup"
          >
            Sign Up
          </a>
        </p>
      </form>
    </div>
  );
}
