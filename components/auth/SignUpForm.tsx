'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SignUpForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role,
        },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else if (data.user?.identities?.length === 0) {
      setError('User with this email already exists. Please try to sign in.');
    } else {
      setMessage('Sign up successful! Please check your email to verify your account.');
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm">
      <form className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4" onSubmit={handleSignUp}>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Create Account</h2>
        {error && <p className="text-red-500 text-xs italic text-center mb-4">{error}</p>}
        {message && <p className="text-green-500 text-xs italic text-center mb-4">{message}</p>}
        <div className="mb-4"><label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">First Name</label><input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="firstName" type="text" placeholder="First Name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
        <div className="mb-4"><label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">Last Name</label><input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="lastName" type="text" placeholder="Last Name" required value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
        <div className="mb-4"><label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label><input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="email" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="mb-6"><label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label><input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="••••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <div className="mb-6"><label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">Sign up as a</label><select id="role" value={role} onChange={e => setRole(e.target.value as 'student' | 'teacher')} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"><option value="student">Student</option><option value="teacher">Teacher</option></select></div>
        <div className="flex items-center justify-between"><button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:bg-blue-300" type="submit" disabled={loading}>{loading ? 'Signing Up...' : 'Sign Up'}</button></div>
        <p className="text-center text-gray-500 text-xs mt-4">Already have an account?{' '}<a className="text-blue-500 hover:text-blue-800" href="/signin">Sign In</a></p>
      </form>
    </div>
  );
}