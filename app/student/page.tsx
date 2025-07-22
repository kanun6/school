import Link from 'next/link';
export default function StudentPage() {
  return (
    <div className="container mx-auto mt-10 p-6">
      <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">Student Area</h1>
        <p className="mt-2">This page is accessible to all logged-in users (student, teacher, admin).</p>
        <Link href="/dashboard" className="inline-block mt-4 text-sm text-blue-600 hover:underline">← Back to Dashboard</Link>
      </div>
    </div>
  );
}
