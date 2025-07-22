import Link from "next/link";
import SignOutButton from "@/components/auth/SignOutButton";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <nav className="bg-gray-800 p-4 text-white shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">RoleAuth</Link>
          <div>
            {user ? (
              <SignOutButton />
            ) : (
              <div className="space-x-4">
                <Link href="/signin" className="hover:text-gray-300">Sign In</Link>
                <Link href="/signup" className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </>
  );
}
