import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Role } from "@/lib/types";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let roleHomePage = '/';
  if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: Role }>();
      if (profile) {
          roleHomePage = `/${profile.role}`;
      }
  }

  return (
    <div className="min-h-full flex flex-col">
      <nav className="bg-gray-800 dark:bg-gray-900 p-4 text-white shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">School-ONL</Link>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href={roleHomePage} className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-medium">
                    Dashboard
                </Link>
                <form action="/auth/signout" method="post">
                  <button type="submit" className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-medium">
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <div className="space-x-4">
                <Link href="/signin" className="hover:text-gray-300">Sign In</Link>
                <Link href="/signup" className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
      <main className="flex-grow bg-gray-100 dark:bg-gray-950">{children}</main>
    </div>
  );
}