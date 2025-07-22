'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh(); 
  };

  return (
    <button
      onClick={handleSignOut}
      className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg"
    >
      Sign Out
    </button>
  );
}