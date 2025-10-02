"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import AuthShell from "@/components/auth/AuthShell";
import RememberedAccounts from "@/components/auth/RememberedAccounts";
import { saveAccount } from "@/lib/remembered-accounts";

type AuthUserMetadata = {
  first_name?: string;
  last_name?: string;
  profile_image_url?: string | null;
};

// ดึงค่า user_metadata อย่างปลอดภัยโดยไม่ใช้ any
function pickUserMeta(raw: unknown): AuthUserMetadata {
  if (typeof raw !== "object" || raw === null) return {};
  const obj = raw as Record<string, unknown>;
  return {
    first_name: typeof obj.first_name === "string" ? obj.first_name : undefined,
    last_name: typeof obj.last_name === "string" ? obj.last_name : undefined,
    profile_image_url:
      typeof obj.profile_image_url === "string" ? obj.profile_image_url : null,
  };
}

export default function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const fieldClass =
    "w-full rounded-md border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 " +
    "shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 " +
    "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400";
  const labelClass =
    "block text-sm font-medium mb-2 text-slate-800 dark:text-slate-200";

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email,
        password,
      }
    );

    if (signInError) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่");
      setLoading(false);
      return;
    }

    const user = data.user;
    if (user && user.email) {
      // ใช้ตัวช่วยแทน any
      const meta = pickUserMeta(user.user_metadata);
      const name =
        `${meta.first_name ?? ""} ${meta.last_name ?? ""}`.trim() || user.email;

      // บันทึกโปรไฟล์ไว้สำหรับล็อกอินครั้งถัดไป
      saveAccount({
        id: user.id,
        email: user.email,
        name,
        avatarUrl: meta.profile_image_url ?? null,
      });
    }

    router.refresh();
    setLoading(false);
  };

  return (
    <AuthShell
      title="เข้าสู่ระบบ"
      subtitle="ยินดีต้อนรับกลับสู่ school-sys"
      rightSlot={
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="ปิดและกลับหน้าหลัก"
          title="ปิด"
          className="h-9 w-9 rounded-full flex items-center justify-center
                 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500
                 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              d="M6 6l12 12M6 18L18 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      }
    >
      {error && (
        <p
          className="text-red-600 dark:text-red-400 text-sm text-center mb-4"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* 🔵 โปรไฟล์ที่จำไว้ (กดเพื่อกรอกอีเมลอัตโนมัติ) */}
      <RememberedAccounts
        onSelect={(acc) => {
          setEmail(acc.email);
          setTimeout(() => passwordRef.current?.focus(), 0);
        }}
      />

      <form onSubmit={handleSignIn} className="space-y-5">
        <div>
          <label htmlFor="email" className={labelClass}>
            อีเมล
          </label>
          <input
            id="email"
            type="email"
            placeholder="อีเมลของคุณ"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
            aria-label="อีเมล"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className={labelClass}>
              รหัสผ่าน
            </label>
            <a
              href="/forgot-password"
              className="text-xs text-indigo-600 hover:underline"
            >
              ลืมรหัสผ่าน?
            </a>
          </div>
          <div className="relative">
            <input
              ref={passwordRef}
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${fieldClass} pr-12`}
              aria-label="รหัสผ่าน"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md
                         text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500
                         dark:text-slate-300 dark:hover:text-white"
              title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            >
              {showPassword ? <FiEye size={20} /> : <FiEyeOff size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="w-full rounded-md bg-indigo-600 text-white font-semibold py-2.5 shadow-sm
                     hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60
                     dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>

        <div className="text-center text-xs text-slate-600 dark:text-slate-300">
          ยังไม่มีบัญชี?{" "}
          <a href="/signup" className="text-indigo-600 hover:underline">
            สมัครสมาชิก
          </a>
        </div>
      </form>
    </AuthShell>
  );
}
