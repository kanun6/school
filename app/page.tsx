import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container mx-auto mt-20 text-center">
      <div className="bg-white p-12 rounded-xl shadow-lg inline-block">
        <h1 className="text-4xl font-bold text-gray-800">Welcome to Role-Based Auth System</h1>
        <p className="mt-4 text-lg text-gray-600">
          This is a demonstration of a Next.js application with role-based access control using Supabase.
        </p>
        <div className="mt-8">
          <Link href="/signin" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}