import { redirect } from 'next/navigation';

export default function TeacherRootPage() {
  redirect('/student/schedule');
}