import { redirect } from 'next/navigation';

export default function TeacherRootPage() {
  redirect('/teacher/schedule');
}