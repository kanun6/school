import { redirect } from 'next/navigation';

export default function AdminRootPage() {
  // Redirect to the default admin page
  redirect('/admin/users');
}