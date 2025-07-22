'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Invalid login credentials. Please try again.');
    } else {
      // The middleware will handle the redirect upon successful login
      router.refresh(); // Refresh the page to trigger middleware
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-xs">
      <form
        className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4"
        onSubmit={handleSignIn}
      >
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Sign In</h2>
        {error && <p className="text-red-500 text-xs italic text-center mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="email" type="email" placeholder="Email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="password" type="password" placeholder="••••••••••" required
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:bg-blue-300"
            type="submit" disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </div>
        <p className="text-center text-gray-500 text-xs mt-4">
          Do not have an account?{' '}
          <a className="text-blue-500 hover:text-blue-800" href="/signup">
            Sign Up
          </a>
        </p>
      </form>
    </div>
  );
}