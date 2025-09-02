// app/account/page.tsx
import MyProfile from '@/components/profile/MyProfile';

export default function TeacherAccountPage() {
  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
        My Profile
      </h1>
      <MyProfile />
    </div>
  );
}
